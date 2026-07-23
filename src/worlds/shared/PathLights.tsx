import { useMemo } from 'react'
import { createRng } from './seededRandom'

interface PathLightsProps {
  count?: number
  color: string
  intensity?: number
  distance?: number
  zStart?: number
  zEnd?: number
  radius?: number
  y?: number
  seed?: number
}

export function PathLights({
  count = 12,
  color,
  intensity = 0.8,
  distance = 16,
  zStart = 5,
  zEnd = -70,
  radius = 8,
  y = 3,
  seed = 1,
}: PathLightsProps) {
  const lights = useMemo(() => {
    const rng = createRng(seed)
    return Array.from({ length: count }, (_, i) => {
      const t = i / Math.max(count - 1, 1)
      const z = zStart + (zEnd - zStart) * t
      const side = i % 2 === 0 ? 1 : -1
      return {
        pos: [side * (radius * 0.6 + rng() * 2), y + rng() * 2, z] as [number, number, number],
      }
    })
  }, [count, zStart, zEnd, radius, y, seed])

  return (
    <>
      {lights.map((l, i) => (
        <pointLight
          key={i}
          position={l.pos}
          color={color}
          intensity={intensity}
          distance={distance}
          decay={2}
        />
      ))}
    </>
  )
}
