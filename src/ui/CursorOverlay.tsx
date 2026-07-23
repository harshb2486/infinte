import { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'
import { useDebugStore } from '@/stores/useDebugStore'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { getCssVar } from '@/utils/colorPalettes'

export type CursorMode = 'default' | 'pointer' | 'portal' | 'interactive' | 'hidden'

export function CursorOverlay() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [cursorMode, setCursorMode] = useState<CursorMode>('default')
  const [label, setLabel] = useState<string | null>(null)
  const currentWorld = useNavigationStore((s) => s.currentWorld)
  const reducedMotion = useDebugStore((s) => s.reducedMotion)

  const springConfig = reducedMotion
    ? { damping: 100, stiffness: 1000, mass: 0.1 }
    : { damping: 25, stiffness: 400, mass: 0.5 }

  const x = useSpring(0, springConfig)
  const y = useSpring(0, springConfig)
  const scale = useSpring(1, springConfig)
  const ringScale = useSpring(1, springConfig)

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      x.set(e.clientX)
      y.set(e.clientY)
    }

    const onCursorChange = (e: CustomEvent<{ mode: CursorMode; label?: string }>) => {
      setCursorMode(e.detail.mode)
      setLabel(e.detail.label ?? null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('cursor-change' as any, onCursorChange)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('cursor-change' as any, onCursorChange)
    }
  }, [x, y])

  useEffect(() => {
    const targetScale =
      cursorMode === 'portal' ? 1.8 :
      cursorMode === 'interactive' ? 1.4 :
      cursorMode === 'pointer' ? 1.3 : 1
    const ringTarget =
      cursorMode === 'portal' ? 1.6 :
      cursorMode === 'interactive' ? 1.3 :
      cursorMode === 'pointer' ? 1.2 : 1

    scale.set(targetScale)
    ringScale.set(ringTarget)
  }, [cursorMode, scale, ringScale])

  if (reducedMotion || typeof window === 'undefined') return null

  const accentColor = getCssVar(currentWorld === 'intro' ? 'hub' : currentWorld)

  return (
    <>
      {/* Outer energy ring */}
      <motion.div
        style={{
          position: 'fixed',
          left: mousePos.x,
          top: mousePos.y,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: `1px solid ${accentColor}40`,
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: 99999,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: ringScale.get(),
          opacity: cursorMode === 'hidden' ? 0 : 0.6,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 400, mass: 0.5 }}
      />

      {/* Inner core */}
      <motion.div
        style={{
          position: 'fixed',
          left: mousePos.x,
          top: mousePos.y,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: cursorMode === 'default' ? 'rgba(255,255,255,0.8)' : accentColor,
          boxShadow: `0 0 12px ${accentColor}60`,
          pointerEvents: 'none',
          zIndex: 99999,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: scale.get(),
          opacity: cursorMode === 'hidden' ? 0 : 1,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 400, mass: 0.5 }}
      />

      {/* Label */}
      {label && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          style={{
            position: 'fixed',
            left: mousePos.x + 20,
            top: mousePos.y + 20,
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
            pointerEvents: 'none',
            zIndex: 99999,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </motion.div>
      )}
    </>
  )
}

export function setCursor(mode: CursorMode, label?: string) {
  window.dispatchEvent(new CustomEvent('cursor-change', { detail: { mode, label } }))
}
