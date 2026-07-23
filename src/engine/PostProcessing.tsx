import { useRef, type ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  ToneMapping,
  DepthOfField,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { useDebugStore } from '@/stores/useDebugStore'
import { useNavigationStore } from '@/stores/useNavigationStore'

interface PostProfile {
  bloom: number
  bloomThreshold: number
  vignette: number
  chromatic: number
  dof: boolean
  dofFocus: number
  dofLength: number
  grain: number
}

const POST_PROFILES: Record<string, PostProfile> = {
  intro: { bloom: 0.8, bloomThreshold: 0.6, vignette: 0.3, chromatic: 0, dof: false, dofFocus: 0.02, dofLength: 0.05, grain: 0 },
  hub: { bloom: 0.8, bloomThreshold: 0.6, vignette: 0.3, chromatic: 0, dof: false, dofFocus: 0.02, dofLength: 0.05, grain: 0 },
  underwater: { bloom: 1.0, bloomThreshold: 0.5, vignette: 0.4, chromatic: 0.002, dof: true, dofFocus: 0.03, dofLength: 0.04, grain: 0.02 },
  space: { bloom: 1.5, bloomThreshold: 0.5, vignette: 0.2, chromatic: 0, dof: false, dofFocus: 0.02, dofLength: 0.05, grain: 0.03 },
  cybercity: { bloom: 0.6, bloomThreshold: 0.65, vignette: 0.3, chromatic: 0, dof: true, dofFocus: 0.02, dofLength: 0.035, grain: 0.04 },
  cpu: { bloom: 0.4, bloomThreshold: 0.7, vignette: 0.2, chromatic: 0, dof: false, dofFocus: 0.02, dofLength: 0.05, grain: 0.01 },
  quantum: { bloom: 1.2, bloomThreshold: 0.5, vignette: 0.3, chromatic: 0.003, dof: true, dofFocus: 0.025, dofLength: 0.04, grain: 0 },
  library: { bloom: 0.8, bloomThreshold: 0.55, vignette: 0.5, chromatic: 0, dof: true, dofFocus: 0.03, dofLength: 0.04, grain: 0.02 },
  dream: { bloom: 1.0, bloomThreshold: 0.55, vignette: 0.4, chromatic: 0.001, dof: true, dofFocus: 0.02, dofLength: 0.04, grain: 0 },
  aicore: { bloom: 0.6, bloomThreshold: 0.65, vignette: 0.2, chromatic: 0, dof: false, dofFocus: 0.02, dofLength: 0.05, grain: 0.02 },
  edge: { bloom: 0.3, bloomThreshold: 0.75, vignette: 0.1, chromatic: 0, dof: false, dofFocus: 0.02, dofLength: 0.05, grain: 0 },
}

export function PostProcessing() {
  const debug = useDebugStore()
  const currentWorld = useNavigationStore((s) => s.currentWorld)
  const isTransitioning = useNavigationStore((s) => s.isTransitioning)
  const aberrationOffset = useRef(new THREE.Vector2(0, 0))

  const profile = POST_PROFILES[currentWorld] || POST_PROFILES.hub

  useFrame(() => {
    if (isTransitioning) {
      aberrationOffset.current.lerp(new THREE.Vector2(0.004, 0.004), 0.1)
    } else {
      aberrationOffset.current.lerp(new THREE.Vector2(profile.chromatic, profile.chromatic), 0.05)
    }
  })

  if (!debug.postProcessing) return null

  const effects = [
    <Bloom
      key="bloom"
      intensity={profile.bloom}
      luminanceThreshold={profile.bloomThreshold}
      luminanceSmoothing={0.9}
      mipmapBlur
    />,
    <ChromaticAberration
      key="ca"
      blendFunction={BlendFunction.NORMAL}
      offset={aberrationOffset.current}
    />,
    profile.dof ? (
      <DepthOfField
        key="dof"
        focusDistance={profile.dofFocus}
        focalLength={profile.dofLength}
        bokehScale={3}
      />
    ) : null,
    <Vignette
      key="vignette"
      offset={0.3}
      darkness={profile.vignette}
      blendFunction={BlendFunction.NORMAL}
    />,
    <ToneMapping key="tm" mode={ToneMappingMode.ACES_FILMIC} />,
  ].filter((e): e is ReactElement => e !== null)

  return (
    <EffectComposer multisampling={4}>
      {effects}
    </EffectComposer>
  )
}
