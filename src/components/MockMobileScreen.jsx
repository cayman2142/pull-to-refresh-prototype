import { useState, useEffect } from 'react';
import { folder, useControls } from 'leva';
import { PullToRefresh } from './PullToRefresh';

const SKELETON_BG = '#e0e0e0';

// Пресеты пружины: один набор { stiffness, damping, mass } на стиль; default = значения из Leva
const PRESET_VALUES = {
  default: null,
  smooth: { stiffness: 400, damping: 35, mass: 1 },
  veryBouncy: { stiffness: 800, damping: 12, mass: 0.8 },
  calm: { stiffness: 280, damping: 42, mass: 1 },
};

const PRESET_OPTIONS = {
  'По умолчанию': 'default',
  'Плавный': 'smooth',
  'Очень пружинистый': 'veryBouncy',
  'Спокойный': 'calm',
};

const FAKE_CARDS = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
  { id: 7 },
];

function FakeCard() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: SKELETON_BG,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: '60%', borderRadius: 4, background: SKELETON_BG, marginBottom: 6 }} />
          <div style={{ height: 12, width: '40%', borderRadius: 4, background: SKELETON_BG }} />
        </div>
      </div>
      <div style={{ height: 12, width: '100%', borderRadius: 4, background: SKELETON_BG, marginBottom: 8 }} />
      <div style={{ height: 12, width: '90%', borderRadius: 4, background: SKELETON_BG }} />
    </div>
  );
}

export function MockMobileScreen() {
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffContent, setHandoffContent] = useState('');
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [handoffError, setHandoffError] = useState(null);

  useEffect(() => {
    if (!handoffOpen) return;
    setHandoffLoading(true);
    setHandoffError(null);
    fetch('/HANDOFF-REACT-NATIVE.md')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.statusText))))
      .then(setHandoffContent)
      .catch((e) => setHandoffError(e.message))
      .finally(() => setHandoffLoading(false));
  }, [handoffOpen]);

  const {
    pullThreshold,
    pullMaxPull,
    logoGrowMax,
    completePopBump,
    completePopDelayMs,
    logoPreset,
    completePopStiffness,
    completePopDamping,
    completePopMass,
    bouncePreset,
    bounceStiffness,
    bounceDamping,
    bounceMass,
    landingPopScale,
    landingPopUpMs,
    landingPreset,
    landingStiffness,
    landingDamping,
    landingMass,
    loadingDurationMs,
    headerHeight,
  } = useControls({
    Pull: folder({
      pullThreshold: { value: 80, min: 20, max: 200 },
      pullMaxPull: { value: 120, min: 60, max: 250 },
    }),
    Logo: folder({
      logoPreset: { value: 'veryBouncy', options: PRESET_OPTIONS },
      logoGrowMax: { value: 0.25, min: 0.05, max: 0.6 },
      completePopBump: { value: 1.15, min: 1, max: 1.4 },
      completePopDelayMs: { value: 50, min: 0, max: 300 },
      completePopStiffness: { value: 600, min: 100, max: 1000 },
      completePopDamping: { value: 15, min: 5, max: 50 },
      completePopMass: { value: 1, min: 0.5, max: 3, step: 0.1 },
    }),
    Bounce: folder({
      bouncePreset: { value: 'calm', options: PRESET_OPTIONS },
      bounceStiffness: { value: 600, min: 100, max: 1000 },
      bounceDamping: { value: 15, min: 5, max: 50 },
      bounceMass: { value: 1, min: 0.5, max: 3, step: 0.1 },
    }),
    Landing: folder({
      landingPreset: { value: 'calm', options: PRESET_OPTIONS },
      landingPopScale: { value: 1.08, min: 1, max: 1.3 },
      landingPopUpMs: { value: 80, min: 0, max: 300 },
      landingStiffness: { value: 400, min: 100, max: 1000 },
      landingDamping: { value: 30, min: 5, max: 50 },
      landingMass: { value: 1, min: 0.5, max: 3, step: 0.1 },
    }),
    Loading: folder({
      loadingDurationMs: { value: 6000, min: 500, max: 10000 },
    }),
    Layout: folder({
      headerHeight: { value: 80, min: 40, max: 160 },
    }),
  });

  const p = (key) => (PRESET_VALUES[key] ? PRESET_VALUES[key] : null);
  const bouncePresetVal = p(bouncePreset);
  const logoPresetVal = p(logoPreset);
  const landingPresetVal = p(landingPreset);

  const bounceStiffnessFinal = bouncePresetVal ? bouncePresetVal.stiffness : bounceStiffness;
  const bounceDampingFinal = bouncePresetVal ? bouncePresetVal.damping : bounceDamping;
  const bounceMassFinal = bouncePresetVal ? bouncePresetVal.mass : bounceMass;
  const completePopStiffnessFinal = logoPresetVal ? logoPresetVal.stiffness : completePopStiffness;
  const completePopDampingFinal = logoPresetVal ? logoPresetVal.damping : completePopDamping;
  const completePopMassFinal = logoPresetVal ? logoPresetVal.mass : completePopMass;
  const landingStiffnessFinal = landingPresetVal ? landingPresetVal.stiffness : landingStiffness;
  const landingDampingFinal = landingPresetVal ? landingPresetVal.damping : landingDamping;
  const landingMassFinal = landingPresetVal ? landingPresetVal.mass : landingMass;

  return (
    <>
      <button
        type="button"
        onClick={() => setHandoffOpen(true)}
        style={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '8px 12px',
          fontSize: 12,
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: 8,
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}
      >
        Для разработчика
      </button>

      {handoffOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Handoff для React Native"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1001,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setHandoffOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              maxWidth: 560,
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Handoff: React Native</strong>
              <button
                type="button"
                onClick={() => setHandoffOpen(false)}
                style={{ padding: '4px 12px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: 6, background: '#fff' }}
              >
                Закрыть
              </button>
            </div>
            <div style={{ overflow: 'auto', flex: 1, padding: 16 }}>
              {handoffLoading && <p style={{ margin: 0 }}>Загрузка…</p>}
              {handoffError && <p style={{ margin: 0, color: '#c00' }}>Ошибка: {handoffError}</p>}
              {!handoffLoading && !handoffError && handoffContent && (
                <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', margin: 0, fontSize: 12, fontFamily: 'inherit' }}>
                  {handoffContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          maxWidth: 375,
          minHeight: '100vh',
          margin: '0 auto',
          background: '#fafafa',
          boxShadow: '0 0 0 1px #ddd, 0 20px 40px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <PullToRefresh
        pullThreshold={pullThreshold}
        pullMaxPull={pullMaxPull}
        logoGrowMax={logoGrowMax}
        completePopBump={completePopBump}
        completePopDelayMs={completePopDelayMs}
        completePopStiffness={completePopStiffnessFinal}
        completePopDamping={completePopDampingFinal}
        completePopMass={completePopMassFinal}
        bounceStiffness={bounceStiffnessFinal}
        bounceDamping={bounceDampingFinal}
        bounceMass={bounceMassFinal}
        landingPopScale={landingPopScale}
        landingPopUpMs={landingPopUpMs}
        landingStiffness={landingStiffnessFinal}
        landingDamping={landingDampingFinal}
        landingMass={landingMassFinal}
        loadingDurationMs={loadingDurationMs}
        headerHeight={headerHeight}
      >
        <div style={{ padding: 16 }}>
          {FAKE_CARDS.map((card) => (
            <FakeCard key={card.id} />
          ))}
        </div>
      </PullToRefresh>
      </div>
    </>
  );
}
