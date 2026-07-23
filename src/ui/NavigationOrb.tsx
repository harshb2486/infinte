import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { getVisiblePortals } from '@/utils/worldGraph'
import type { WorldId } from '@/utils/constants'
import { getCssVar } from '@/utils/colorPalettes'
import { setCursor } from '@/ui/CursorOverlay'

export function NavigationOrb() {
  const [expanded, setExpanded] = useState(false)
  const [hoveredWorld, setHoveredWorld] = useState<WorldId | null>(null)
  const [scrollTriggered, setScrollTriggered] = useState(false)
  const currentWorld = useNavigationStore((s) => s.currentWorld)
  const visitedWorlds = useNavigationStore((s) => s.visitedWorlds)
  const navigateTo = useNavigationStore((s) => s.navigateTo)
  const startTransition = useNavigationStore((s) => s.startTransition)
  const isTransitioning = useNavigationStore((s) => s.isTransitioning)
  const containerRef = useRef<HTMLDivElement>(null)

  const portals = useMemo(() => {
    return getVisiblePortals(visitedWorlds as WorldId[])
  }, [visitedWorlds])

  const progress = Math.max(0, visitedWorlds.length - 1) / 9

  useEffect(() => {
    if (!scrollTriggered || isTransitioning) return
    
    const index = portals.findIndex(p => p.id !== currentWorld)
    const nextPortal = portals[index]
    if (nextPortal) {
      startTransition(nextPortal.id)
      setTimeout(() => navigateTo(nextPortal.id), 1500)
      setScrollTriggered(false)
    }
  }, [scrollTriggered, portals, currentWorld, startTransition, navigateTo, isTransitioning])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      e.preventDefault()
      if (isTransitioning) return
      
      if (e.deltaY > 0) {
        setScrollTriggered(true)
      }
    }
    
    document.addEventListener('wheel', handleScroll, { passive: false })
    return () => document.removeEventListener('wheel', handleScroll)
  }, [isTransitioning])

  const handleWorldClick = (worldId: WorldId) => {
    if (worldId === currentWorld) {
      setExpanded(false)
      return
    }
    setExpanded(false)
    startTransition(worldId)
    setTimeout(() => navigateTo(worldId), 1500)
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 200,
        pointerEvents: 'auto',
      }}
      onMouseEnter={() => setCursor('interactive', 'Navigation')}
      onMouseLeave={() => setCursor('default')}
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '320px',
              padding: '20px',
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '24px',
              boxShadow: '0 0 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
              marginBottom: '70px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: '16px',
              }}
            >
              Realities — {Math.round(progress * 100)}% discovered
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {portals.map((portal) => {
                const visited = visitedWorlds.includes(portal.id)
                const isHovered = hoveredWorld === portal.id
                const accent = getCssVar(portal.id)
                return (
                  <motion.button
                    key={portal.id}
                    onClick={() => handleWorldClick(portal.id)}
                    onMouseEnter={() => {
                      setHoveredWorld(portal.id)
                      setCursor('pointer')
                    }}
                    onMouseLeave={() => {
                      setHoveredWorld(null)
                      setCursor('interactive')
                    }}
                    whileHover={{ x: 4 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: isHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
                      border: '1px solid transparent',
                      cursor: 'none',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: visited ? accent : 'rgba(255,255,255,0.15)',
                        boxShadow: visited ? `0 0 8px ${accent}` : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '14px',
                          color: 'rgba(255,255,255,0.9)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {portal.label}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.4)',
                          marginTop: '2px',
                        }}
                      >
                        {portal.description}
                      </div>
                    </div>
                    {visited && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: accent }}>VISITED</div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setExpanded(!expanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 0 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'none',
          position: 'relative',
        }}
      >
        {/* Progress ring */}
        <svg width="56" height="56" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle
            cx="28"
            cy="28"
            r="26"
            fill="none"
            stroke={getCssVar(currentWorld === 'intro' ? 'hub' : currentWorld)}
            strokeWidth="1"
            strokeDasharray={`${progress * 163.36} 163.36`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>

        <motion.div
          animate={{ rotate: expanded ? 45 : 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '18px',
              height: '2px',
              background: 'rgba(255,255,255,0.7)',
              position: 'absolute',
            }}
          />
          <div
            style={{
              width: '18px',
              height: '2px',
              background: 'rgba(255,255,255,0.7)',
              position: 'absolute',
              transform: 'rotate(90deg)',
            }}
          />
        </motion.div>
      </motion.button>
    </div>
  )
}
