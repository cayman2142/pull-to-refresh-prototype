import { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const DRAG_FRAMES = 100;

// Схематичная шапка в стиле Figma: меню | visam® | поиск
function HeaderBar() {
  return (
    <div
      style={{
        flexShrink: 0,
        height: 48,
        paddingLeft: 16,
        paddingRight: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee',
        background: '#fff',
      }}
    >
      <button type="button" aria-label="Меню" style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer' }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      <span style={{ fontWeight: 700, fontSize: 20, color: '#E30613', letterSpacing: '-0.02em' }}>
        visam<sup style={{ fontSize: 10, top: '-0.4em' }}>®</sup>
      </span>
      <button type="button" aria-label="Поиск" style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer' }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx={11} cy={11} r={7} />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>
    </div>
  );
}

export function PullToRefresh({
  children,
  pullThreshold = 80,
  pullMaxPull = 120,
  logoGrowMax = 0.25,
  completePopBump = 1.15,
  completePopDelayMs = 50,
  bounceStiffness = 600,
  bounceDamping = 15,
  bounceMass = 1,
  completePopStiffness = 600,
  completePopDamping = 15,
  completePopMass = 1,
  landingPopScale = 1.08,
  landingPopUpMs = 80,
  landingStiffness = 400,
  landingDamping = 30,
  landingMass = 1,
  loadingDurationMs = 6000,
  headerHeight: headerHeightProp = 80,
}) {
  const scrollRef = useRef(null);
  const dragLottieRef = useRef(null);
  const hasPlayedCompletePopRef = useRef(false);
  const landingExpectScaleOneRef = useRef(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'dragging' | 'bouncing' | 'landing' | 'loading' | 'closing'
  const [bounceFromHeight, setBounceFromHeight] = useState(0);
  const [bounceTarget, setBounceTarget] = useState(null);
  const [landingScale, setLandingScale] = useState(1);
  const [completePopScale, setCompletePopScale] = useState(1);
  const [dragData, setDragData] = useState(null);
  const [loadingData, setLoadingData] = useState(null);

  const onTriggerRefresh = useCallback((releaseDistance) => {
    flushSync(() => {
      setBounceFromHeight(releaseDistance);
      setBounceTarget(null);
      setStatus('bouncing');
    });
  }, []);

  const {
    pullDistance,
    isDragging,
    triggerRefresh,
    reset,
    progress,
  } = usePullToRefresh(scrollRef, {
    threshold: pullThreshold,
    maxPull: pullMaxPull,
    onTriggerRefresh,
  });

  // Load Lottie JSON
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/drag-animation.json').then((r) => r.json()),
      fetch('/loading-animation.json').then((r) => r.json()),
    ]).then(([drag, loading]) => {
      if (!cancelled) {
        setDragData(drag);
        setLoadingData(loading);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Sync status with isDragging (do not override loading, bouncing, landing or closing)
  useEffect(() => {
    if (isDragging && status !== 'loading' && status !== 'bouncing' && status !== 'landing' && status !== 'closing') setStatus('dragging');
  }, [isDragging, status]);

  // Reset "complete pop" flag when idle so next gesture can play it again
  useEffect(() => {
    if (status === 'idle') hasPlayedCompletePopRef.current = false;
  }, [status]);

  // When progress reaches 1, play one-time "complete pop" (scale bump then spring back to 1)
  useEffect(() => {
    if (status !== 'dragging' || progress < 1 || hasPlayedCompletePopRef.current) return;
    hasPlayedCompletePopRef.current = true;
    setCompletePopScale(completePopBump);
    const t = setTimeout(() => setCompletePopScale(1), completePopDelayMs);
    return () => clearTimeout(t);
  }, [status, progress, completePopBump, completePopDelayMs]);

  // After first paint in bouncing, set target height so spring runs
  useEffect(() => {
    if (status !== 'bouncing') return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setBounceTarget(headerHeightProp);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [status, headerHeightProp]);

  // When loading ends, go to closing so header animates away with spring, then idle
  useEffect(() => {
    if (status !== 'loading') return;
    const t = setTimeout(() => setStatus('closing'), loadingDurationMs);
    return () => clearTimeout(t);
  }, [status, loadingDurationMs]);

  // Drive drag Lottie by progress (and keep at 100% during bouncing/landing)
  useEffect(() => {
    if ((status !== 'dragging' && status !== 'bouncing' && status !== 'landing') || !dragLottieRef.current) return;
    const frame = (status === 'bouncing' || status === 'landing') ? DRAG_FRAMES - 1 : Math.floor(progress * DRAG_FRAMES);
    dragLottieRef.current.goToAndStop(frame, true);
  }, [status, progress]);

  // Logo grows with progress; push-back (progress decrease) shrinks and fades via opacity
  const logoScale = (1 + progress * logoGrowMax) * completePopScale;

  // Header height: dragging = pull distance; bouncing = animate from bounceFrom to headerHeightProp; landing/loading = headerHeightProp; closing = 0 (animate away)
  const headerHeight =
    status === 'loading' || status === 'landing'
      ? headerHeightProp
      : status === 'bouncing'
        ? bounceTarget ?? bounceFromHeight
          : status === 'dragging'
          ? Math.min(headerHeightProp, pullDistance)
          : 0;
  const showLottie = headerHeight > 0 || status === 'closing';

  const handleHeaderAnimationComplete = useCallback(() => {
    if (status === 'bouncing') {
      setStatus('landing');
      setBounceFromHeight(0);
      setBounceTarget(null);
      setLandingScale(landingPopScale);
    } else if (status === 'closing') {
      setStatus('idle');
      reset();
    }
  }, [status, landingPopScale, reset]);

  // After landing pop up, wait then spring scale back to 1
  useEffect(() => {
    if (status !== 'landing' || landingScale !== landingPopScale) return;
    landingExpectScaleOneRef.current = false;
    const t = setTimeout(() => {
      landingExpectScaleOneRef.current = true;
      setLandingScale(1);
    }, landingPopUpMs);
    return () => clearTimeout(t);
  }, [status, landingScale, landingPopScale, landingPopUpMs]);

  const handleLogoAnimationComplete = useCallback(() => {
    if (status === 'landing' && landingExpectScaleOneRef.current) {
      landingExpectScaleOneRef.current = false;
      setStatus('loading');
    }
  }, [status]);

  const bounceSpring = { type: 'spring', stiffness: bounceStiffness, damping: bounceDamping, mass: bounceMass };
  const completePopSpring = { type: 'spring', stiffness: completePopStiffness, damping: completePopDamping, mass: completePopMass };
  const landingSpring = { type: 'spring', stiffness: landingStiffness, damping: landingDamping, mass: landingMass };

  const headerTransition =
    status === 'bouncing' || status === 'closing'
      ? { height: bounceSpring }
      : { height: { duration: 0 } };

  const logoScaleTransition =
    status === 'landing' && landingScale === 1
      ? landingSpring
      : status === 'landing'
        ? { duration: 0 }
        : completePopScale === 1 && status === 'dragging'
          ? completePopSpring
          : { duration: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <HeaderBar />
      <motion.div
        style={{
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
        }}
        animate={{ height: headerHeight }}
        transition={headerTransition}
        onAnimationComplete={handleHeaderAnimationComplete}
      >
        {(status === 'loading' || status === 'closing') && loadingData && showLottie && (
          <Lottie
            animationData={loadingData}
            loop
            style={{ width: 24, height: 24 }}
          />
        )}
        {(status === 'dragging' || status === 'bouncing' || status === 'landing') && dragData && showLottie && (
          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            animate={{
              scale: status === 'landing' ? landingScale : logoScale,
              opacity: status === 'landing' ? 1 : progress,
            }}
            transition={{ scale: logoScaleTransition, opacity: { duration: 0 } }}
            onAnimationComplete={handleLogoAnimationComplete}
          >
            <Lottie
              lottieRef={dragLottieRef}
              animationData={dragData}
              loop={false}
              autoplay={false}
              style={{ width: 24, height: 24 }}
            />
          </motion.div>
        )}
      </motion.div>
      <div
        ref={scrollRef}
        style={{ overflow: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  );
}
