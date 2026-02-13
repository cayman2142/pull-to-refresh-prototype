import { useState, useRef, useCallback, useEffect } from 'react';

const THRESHOLD_PX = 80;
const MAX_PULL_PX = 120;

export function usePullToRefresh(containerRef, options = {}) {
  const { threshold = THRESHOLD_PX, maxPull = MAX_PULL_PX, onTriggerRefresh } = options;
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [triggerRefresh, setTriggerRefresh] = useState(false);
  const startY = useRef(0);
  const scrollTopRef = useRef(0);
  const isDraggingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  isDraggingRef.current = isDragging;
  pullDistanceRef.current = pullDistance;

  const reset = useCallback(() => {
    setPullDistance(0);
    setIsDragging(false);
    setTriggerRefresh(false);
  }, []);

  const getClientY = (e) => {
    if (e.touches && e.touches.length) return e.touches[0].clientY;
    return e.clientY;
  };

  const handleEnd = useCallback(
    (e) => {
      if (!isDraggingRef.current) return;
      document.removeEventListener('pointerup', handleEnd, { capture: true });
      document.removeEventListener('pointercancel', handleEnd, { capture: true });
      const el = containerRef?.current;
      if (el && e?.pointerId != null && el.releasePointerCapture) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
      const currentDistance = pullDistanceRef.current;
      const shouldTrigger = currentDistance >= threshold;
      isDraggingRef.current = false;
      setIsDragging(false);
      if (shouldTrigger) {
        setTriggerRefresh(true);
        const distance = currentDistance;
        requestAnimationFrame(() => {
          onTriggerRefresh?.(distance);
        });
      } else {
        setPullDistance(0);
      }
    },
    [threshold, onTriggerRefresh, containerRef]
  );

  const handleStart = useCallback(
    (e) => {
      const el = containerRef?.current;
      if (!el) return;
      scrollTopRef.current = el.scrollTop ?? 0;
      if (scrollTopRef.current > 0) return;
      startY.current = getClientY(e);
      isDraggingRef.current = true;
      setIsDragging(true);
      const hasPointerId = e.pointerId != null;
      if (hasPointerId) {
        if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
        document.addEventListener('pointerup', handleEnd, { capture: true });
        document.addEventListener('pointercancel', handleEnd, { capture: true });
      }
    },
    [containerRef, handleEnd]
  );

  const handleMove = useCallback(
    (e) => {
      if (!isDraggingRef.current) return;
      const el = containerRef?.current;
      if (!el || (el.scrollTop ?? 0) > 0) return;
      const y = getClientY(e);
      const delta = Math.max(0, y - startY.current);
      if (delta > 0 && e.cancelable) e.preventDefault();
      const distance = Math.min(delta, maxPull);
      setPullDistance(distance);
    },
    [containerRef, maxPull]
  );

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    const opts = { passive: true };
    const optsPassiveFalse = { passive: false };

    el.addEventListener('touchstart', handleStart, optsPassiveFalse);
    el.addEventListener('touchmove', handleMove, optsPassiveFalse);
    el.addEventListener('touchend', handleEnd, opts);
    el.addEventListener('pointerdown', handleStart, optsPassiveFalse);
    el.addEventListener('pointermove', handleMove, optsPassiveFalse);
    // pointerup/pointercancel only on document (capture) so mouse release is handled when cursor leaves element

    return () => {
      el.removeEventListener('touchstart', handleStart);
      el.removeEventListener('touchmove', handleMove);
      el.removeEventListener('touchend', handleEnd);
      el.removeEventListener('pointerdown', handleStart);
      el.removeEventListener('pointermove', handleMove);
    };
  }, [containerRef, handleStart, handleMove, handleEnd]);

  return {
    pullDistance,
    isDragging,
    triggerRefresh,
    reset,
    progress: Math.min(1, pullDistance / maxPull),
    threshold,
    maxPull,
  };
}
