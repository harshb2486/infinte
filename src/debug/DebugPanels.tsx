import { Leva, useControls } from 'leva'
import { useDebugStore } from '@/stores/useDebugStore'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'
import { usePortalAIStore } from '@/stores/usePortalAIStore'

export function DebugPanels() {
  const debug = useDebugStore()

  useControls(
    'World',
    () => ({
      timeScale: {
        value: 1,
        min: 0,
        max: 10,
        step: 0.1,
        onChange: (v) => useWorldEvolutionStore.getState().setTimeScale(v),
      },
      gotoHub: {
        value: false,
        onChange: () => {
          useNavigationStore.getState().startTransition('hub')
          setTimeout(() => useNavigationStore.getState().navigateTo('hub'), 1500)
        },
      },
    }),
    { collapsed: true },
  )

  useControls(
    'Portal AI',
    () => ({
      mood: {
        options: ['neutral', 'welcoming', 'cryptic', 'warning', 'playful', 'wise'],
        value: 'neutral',
        onChange: (v) => usePortalAIStore.getState().setMood(v as any),
      },
      message: { value: 'Hello, traveler.' },
      speak: {
        value: false,
        onChange: () => {
          const text = 'Hello, traveler.'
          usePortalAIStore.getState().interject(text, 'cryptic')
        },
      },
    }),
    { collapsed: true },
  )

  useControls(
    'Render',
    {
      wireframe: { value: false, onChange: () => debug.toggleWireframe() },
      showFPS: { value: false, onChange: () => debug.toggleFPS() },
      cameraSpeed: {
        value: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        onChange: (v) => debug.setCameraSpeed(v),
      },
      particleDensity: {
        value: 1,
        min: 0.1,
        max: 2,
        step: 0.1,
        onChange: (v) => debug.setParticleDensity(v),
      },
      quality: {
        options: ['low', 'medium', 'high'],
        value: 'high',
        onChange: (v) => debug.setQualityLevel(v as 'low' | 'medium' | 'high'),
      },
    },
    { collapsed: true },
  )

  return <Leva hidden={debug.levaHidden} collapsed />
}
