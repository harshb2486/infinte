import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePortalAIStore, type AIMood } from '@/stores/usePortalAIStore'
import { getCssVar } from '@/utils/colorPalettes'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { setCursor } from '@/ui/CursorOverlay'

interface TypewriterTextProps {
  text: string
  speed?: number
  onComplete?: () => void
}

function TypewriterText({ text, speed = 28, onComplete }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const index = useRef(0)

  useEffect(() => {
    index.current = 0
    setDisplayed('')
    const interval = setInterval(() => {
      if (index.current < text.length) {
        setDisplayed(text.slice(0, index.current + 1))
        index.current++
      } else {
        clearInterval(interval)
        onComplete?.()
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed, onComplete])

  return <span>{displayed}<span className="animate-pulse">|</span></span>
}

const MOOD_LABELS: Record<AIMood, string> = {
  neutral: 'Observing',
  welcoming: 'Welcoming',
  cryptic: 'Cryptic',
  warning: 'Warning',
  playful: 'Playful',
  wise: 'Wise',
}

export function DialogueRenderer() {
  const isActive = usePortalAIStore((s) => s.isActive)
  const isTyping = usePortalAIStore((s) => s.isTyping)
  const mood = usePortalAIStore((s) => s.mood)
  const conversationHistory = usePortalAIStore((s) => s.conversationHistory)
  const setTyping = usePortalAIStore((s) => s.setTyping)
  const dismiss = usePortalAIStore((s) => s.dismiss)
  const currentNode = usePortalAIStore((s) => s.currentNode)
  const respond = usePortalAIStore((s) => s.respond)
  const currentWorld = useNavigationStore((s) => s.currentWorld)

  const lastMessage = conversationHistory[conversationHistory.length - 1]
  const isPortalMessage = lastMessage?.speaker === 'portal'

  const handleTypingComplete = useCallback(() => {
    setTyping(false)
  }, [setTyping])

  const handleResponse = useCallback((responseText: string, nextState: string) => {
    respond(responseText, nextState)
  }, [respond])

  if (!isActive || !isPortalMessage) return null

  const accentColor = getCssVar(currentWorld === 'intro' ? 'hub' : currentWorld)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '36px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '640px',
        width: '92%',
        zIndex: 1000,
        pointerEvents: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderTop: `1px solid ${accentColor}30`,
          borderRadius: '16px',
          padding: '22px 26px',
          boxShadow: '0 0 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <motion.div
            animate={{ scale: isTyping ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 1.2, repeat: isTyping ? Infinity : 0 }}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: accentColor,
              boxShadow: `0 0 10px ${accentColor}80`,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accentColor,
            }}
          >
            Portal — {MOOD_LABELS[mood]}
          </span>
        </div>

        {/* Message */}
        <div
          style={{
            color: 'rgba(240, 240, 236, 0.95)',
            fontSize: '15px',
            lineHeight: '1.65',
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
          }}
        >
          {isTyping ? (
            <TypewriterText text={lastMessage.text} onComplete={handleTypingComplete} />
          ) : (
            lastMessage.text
          )}
        </div>

        {/* Response buttons */}
        {!isTyping && currentNode?.responses && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ marginTop: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}
          >
            {currentNode.responses.map((resp, i) => (
              <button
                key={i}
                onClick={() => handleResponse(resp.text, resp.nextState)}
                onMouseEnter={() => setCursor('pointer')}
                onMouseLeave={() => setCursor('default')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.65)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'none',
                  fontSize: '13px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = `${accentColor}50`
                  e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                }}
              >
                {resp.text}
              </button>
            ))}
          </motion.div>
        )}

        {/* Dismiss */}
        {!isTyping && (
          <button
            onClick={dismiss}
            onMouseEnter={() => setCursor('pointer')}
            onMouseLeave={() => setCursor('default')}
            style={{
              position: 'absolute',
              top: '14px',
              right: '18px',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.25)',
              cursor: 'none',
              fontSize: '18px',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </motion.div>
    </div>
  )
}
