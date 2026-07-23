import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { usePortalAIStore } from '@/stores/usePortalAIStore'
import { TRANSITION } from '@/utils/constants'

export function TransitionSystem() {
  const isTransitioning = useNavigationStore((s) => s.isTransitioning)
  const setTransitionProgress = useNavigationStore((s) => s.setTransitionProgress)
  const endTransition = useNavigationStore((s) => s.endTransition)
  const timer = useRef(0)

  useFrame((_, delta) => {
    if (!isTransitioning) {
      timer.current = 0
      return
    }

    timer.current += delta
    const progress = Math.min(timer.current / TRANSITION.TOTAL_DURATION, 1)
    setTransitionProgress(progress)

    // At midpoint, swap the world
    if (progress >= 0.5 && timer.current - delta < TRANSITION.TOTAL_DURATION * 0.5) {
      endTransition()
      usePortalAIStore.getState().dismiss()
    }
  })

  return null
}

export function TransitionFade() {
  const isTransitioning = useNavigationStore((s) => s.isTransitioning)
  const transitionProgress = useNavigationStore((s) => s.transitionProgress)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    if (!isTransitioning) {
      mat.opacity = 0
      return
    }
    // Fade in then out
    const half = 0.5
    if (transitionProgress < half) {
      mat.opacity = transitionProgress / half
    } else {
      mat.opacity = 1 - (transitionProgress - half) / half
    }
  })

  return (
    <mesh ref={meshRef} renderOrder={999}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        color="#000000"
        transparent
        opacity={0}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
