import { Suspense, lazy, useMemo } from 'react'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'
import type { WorldId } from '@/utils/constants'

const IntroSequence = lazy(() => import('@/worlds/IntroSequence'))
const HubWorld = lazy(() => import('@/worlds/HubScene'))
const UnderwaterWorld = lazy(() => import('@/worlds/Underwater/UnderwaterScene'))
const SpaceWorld = lazy(() => import('@/worlds/Space/SpaceScene'))
const CyberCityWorld = lazy(() => import('@/worlds/CyberCity/CyberCityScene'))
const CPUWorld = lazy(() => import('@/worlds/CPU/CPUWorld'))
const QuantumWorld = lazy(() => import('@/worlds/Quantum/QuantumWorld'))
const LibraryWorld = lazy(() => import('@/worlds/Library/LibraryWorld'))
const DreamWorld = lazy(() => import('@/worlds/DreamWorld/DreamWorld'))
const AICoreWorld = lazy(() => import('@/worlds/AICore/AICoreWorld'))
const EdgeWorld = lazy(() => import('@/worlds/EdgeOfUniverse/EdgeWorld'))

const WORLD_COMPONENTS: Record<WorldId, React.LazyExoticComponent<React.FC>> = {
  intro: IntroSequence,
  hub: HubWorld,
  underwater: UnderwaterWorld,
  space: SpaceWorld,
  cybercity: CyberCityWorld,
  cpu: CPUWorld,
  quantum: QuantumWorld,
  library: LibraryWorld,
  dream: DreamWorld,
  aicore: AICoreWorld,
  edge: EdgeWorld,
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color="#333" wireframe />
    </mesh>
  )
}

export function WorldManager() {
  const currentWorld = useNavigationStore((s) => s.currentWorld)
  const initWorld = useWorldEvolutionStore((s) => s.initWorld)

  const WorldComponent = useMemo(
    () => WORLD_COMPONENTS[currentWorld] ?? HubWorld,
    [currentWorld],
  )

  // Initialize evolution for this world
  useMemo(() => {
    initWorld(currentWorld)
  }, [currentWorld, initWorld])

  return (
    <Suspense fallback={<LoadingFallback />}>
      <WorldComponent key={currentWorld} />
    </Suspense>
  )
}
