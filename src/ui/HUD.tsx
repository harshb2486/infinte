import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { useDebugStore } from '@/stores/useDebugStore'
import { useSaveStore } from '@/stores/useSaveStore'
import { getCssVar } from '@/utils/colorPalettes'
import { setCursor } from '@/ui/CursorOverlay'

const WORLD_NAMES: Record<string, string> = {
  intro: 'Initiation',
  hub: 'The Nexus',
  underwater: 'Abyssal Archive',
  space: 'Celestial Cartography',
  cybercity: 'Synthetic Metropolis',
  cpu: 'Silicon Interior',
  quantum: 'Probability Fields',
  library: 'Codex Eternum',
  dream: 'Somnus Expanse',
  aicore: 'Neural Cradle',
  edge: 'The Final Meridian',
}

export function HUD() {
  const currentWorld = useNavigationStore((s) => s.currentWorld)
  const visitedWorlds = useNavigationStore((s) => s.visitedWorlds)
  const highContrast = useDebugStore((s) => s.highContrast)
  const achievements = useSaveStore((s) => s.achievements)
  const [fps, setFps] = useState(0)
  const showFPS = useDebugStore((s) => s.showFPS)

  useEffect(() => {
    if (!showFPS) return
    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number

    const loop = () => {
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        setFps(frameCount)
        frameCount = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [showFPS])

  const worldName = WORLD_NAMES[currentWorld] || currentWorld
  const visitedCount = Math.max(0, visitedWorlds.length - 1)
  const progress = Math.min(visitedCount / 9, 1)
  const accentColor = getCssVar(currentWorld)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        zIndex: 100,
        color: highContrast ? '#ffffff' : '#e5e5e0',
      }}
    >
      {/* Top-left: world identity */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWorld}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ alignSelf: 'flex-start' }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: highContrast ? '#ffffff' : 'rgba(255,255,255,0.35)',
              marginBottom: '6px',
            }}
          >
            Current Reality
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: highContrast ? '#ffffff' : '#f0f0ec',
            }}
          >
            {worldName}
          </div>

          {/* World progress line */}
          <div
            style={{
              width: '120px',
              height: '2px',
              background: 'rgba(255,255,255,0.08)',
              marginTop: '12px',
              borderRadius: '1px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: '100%',
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}60`,
              }}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom-left: status */}
      <div style={{ alignSelf: 'flex-start' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            background: 'var(--color-surface)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            {visitedCount} / 9 worlds
          </div>
          {achievements.length > 0 && (
            <>
              <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {achievements.length} sigils
              </div>
            </>
          )}
          {showFPS && (
            <>
              <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {fps} FPS
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function SkipIntro() {
  const currentWorld = useNavigationStore((s) => s.currentWorld)
  const [visible, setVisible] = useState(false)
  const navigateTo = useNavigationStore((s) => s.navigateTo)
  const startTransition = useNavigationStore((s) => s.startTransition)

  useEffect(() => {
    if (currentWorld !== 'intro') return
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [currentWorld])

  if (!visible || currentWorld !== 'intro') return null

  const handleSkip = () => {
    startTransition('hub')
    setTimeout(() => navigateTo('hub'), 1500)
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleSkip}
      onMouseEnter={() => setCursor('pointer')}
      onMouseLeave={() => setCursor('default')}
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '32px',
        background: 'transparent',
        border: '1px solid var(--color-border)',
        color: 'rgba(255,255,255,0.5)',
        padding: '10px 18px',
        borderRadius: '8px',
        cursor: 'none',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        zIndex: 200,
        pointerEvents: 'auto',
        transition: 'all 0.2s ease',
      }}
      whileHover={{
        borderColor: 'rgba(255,255,255,0.2)',
        color: 'rgba(255,255,255,0.8)',
      }}
    >
      Skip Intro →
    </motion.button>
  )
}
