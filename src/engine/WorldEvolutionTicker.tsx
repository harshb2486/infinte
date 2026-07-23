import { useFrame } from '@react-three/fiber'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'

export function WorldEvolutionTicker() {
  const tick = useWorldEvolutionStore((s) => s.tick)

  useFrame((_, delta) => {
    tick(delta)
  })

  return null
}
