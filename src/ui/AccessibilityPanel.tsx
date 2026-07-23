import { useEffect, useState } from 'react'
import { useDebugStore } from '@/stores/useDebugStore'

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false)
  const {
    motionIntensity,
    setMotionIntensity,
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
  } = useDebugStore()

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) {
      toggleReducedMotion()
    }
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) toggleReducedMotion()
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [toggleReducedMotion])

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#e5e5e5',
          padding: '10px',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 200,
          pointerEvents: 'auto',
        }}
        aria-label="Accessibility settings"
      >
        ♿
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '70px',
            left: '24px',
            width: '260px',
            background: 'rgba(10,10,20,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '16px',
            zIndex: 200,
            color: '#e5e5e5',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            Accessibility
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
              Motion Intensity: {Math.round(motionIntensity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={motionIntensity}
              onChange={(e) => setMotionIntensity(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              marginBottom: '8px',
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} />
            High Contrast UI
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" checked={reducedMotion} onChange={toggleReducedMotion} />
            Reduced Motion
          </label>
        </div>
      )}
    </>
  )
}
