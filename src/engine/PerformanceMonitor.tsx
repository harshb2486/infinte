import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useDebugStore } from '@/stores/useDebugStore'
import { PERFORMANCE } from '@/utils/constants'

export function PerformanceMonitor() {
  const frameCount = useRef(0)
  const lastCheck = useRef(performance.now())
  const fpsHistory = useRef<number[]>([])

  useFrame(() => {
    frameCount.current++
    const now = performance.now()
    if (now - lastCheck.current >= PERFORMANCE.QUALITY_CHECK_INTERVAL) {
      const fps = (frameCount.current / (now - lastCheck.current)) * 1000
      fpsHistory.current.push(fps)
      if (fpsHistory.current.length > 5) fpsHistory.current.shift()

      const avgFps =
        fpsHistory.current.reduce((a, b) => a + b, 0) /
        fpsHistory.current.length

      const debug = useDebugStore.getState()
      if (avgFps < PERFORMANCE.LOW_FPS_THRESHOLD && debug.qualityLevel !== 'low') {
        debug.setQualityLevel('low')
      } else if (
        avgFps > 50 &&
        debug.qualityLevel === 'low'
      ) {
        debug.setQualityLevel('medium')
      }

      frameCount.current = 0
      lastCheck.current = now
    }
  })

  return null
}

export function FPSDisplay() {
  const showFPS = useDebugStore((s) => s.showFPS)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const fps = useRef(0)

  useFrame(() => {
    frameCount.current++
    const now = performance.now()
    if (now - lastTime.current >= 1000) {
      fps.current = frameCount.current
      frameCount.current = 0
      lastTime.current = now
    }
  })

  if (!showFPS) return null

  return null // FPS display is handled by Leva or DOM overlay
}
