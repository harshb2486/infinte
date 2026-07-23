import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls, Loader } from '@react-three/drei'
import { CameraRig } from '@/engine/CameraRig'
import { WorldManager } from '@/engine/WorldManager'
import { TransitionSystem, TransitionFade } from '@/engine/TransitionSystem'
import { PostProcessing } from '@/engine/PostProcessing'
import { ErrorBoundary } from '@/engine/ErrorBoundary'
import { AudioManager } from '@/engine/AudioManager'
import { PerformanceMonitor } from '@/engine/PerformanceMonitor'
import { InputManager } from '@/engine/InputManager'
import { WorldEvolutionTicker } from '@/engine/WorldEvolutionTicker'
import { HUD, SkipIntro } from '@/ui/HUD'
import { DialogueRenderer } from '@/portalAI/DialogueRenderer'
import { DevConsole } from '@/console/DevConsole'
import { DebugPanels } from '@/debug/DebugPanels'
import { AccessibilityPanel } from '@/ui/AccessibilityPanel'
import { CursorOverlay } from '@/ui/CursorOverlay'
import { NavigationOrb } from '@/ui/NavigationOrb'
import { AutoSave, loadAll } from '@/save/autoSave'
import { AchievementTracker, HiddenSecrets } from '@/secrets/AchievementSystem'
import { usePortalAIStore } from '@/stores/usePortalAIStore'

export default function App() {
  useEffect(() => {
    loadAll()
    const save = localStorage.getItem('infinite-portal-save')
    if (save) {
      const parsed = JSON.parse(save)
      if (parsed?.visitedWorlds && parsed.visitedWorlds.length > 1) {
        setTimeout(() => {
          usePortalAIStore.getState().interject('Welcome back, traveler.', 'welcoming')
        }, 2000)
      }
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ErrorBoundary>
        <KeyboardControls
          map={[
            { name: 'escape', keys: ['Escape'] },
            { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
            { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
          ]}
        >
          <Canvas
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
          camera={{
            position: [0, 1.6, 0],
            fov: 60,
            near: 0.1,
            far: 500,
          }}
          style={{ background: '#050508' }}
        >
          <Suspense fallback={null}>
            <CameraRig />
            <InputManager />
            <PerformanceMonitor />
            <WorldEvolutionTicker />
            <TransitionSystem />
            <AudioManager />
            <PostProcessing />
            <WorldManager />
            <TransitionFade />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </ErrorBoundary>

    <HUD />
      <SkipIntro />
      <DialogueRenderer />
      <DevConsole />
      <DebugPanels />
      <AccessibilityPanel />
      <CursorOverlay />
      <NavigationOrb />
      <AutoSave />
      <AchievementTracker />
      <HiddenSecrets />

      <Loader
        containerStyles={{
          background: '#050508',
        }}
        dataStyles={{
          color: '#c8c8d0',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          letterSpacing: '0.1em',
        }}
        initialState={(active) => active}
      />
    </div>
  )
}
