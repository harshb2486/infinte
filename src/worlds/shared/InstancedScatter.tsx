import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scatterAlongPath } from './seededRandom'

type GeoKind = 'box' | 'sphere' | 'cylinder' | 'octahedron' | 'icosahedron' | 'torus'

interface InstancedScatterProps {
  count: number
  seed: number
  color: string
  emissive?: string
  emissiveIntensity?: number
  geo?: GeoKind
  scaleMin?: number
  scaleMax?: number
  zStart?: number
  zEnd?: number
  radius?: number
  yMin?: number
  yMax?: number
  metalness?: number
  roughness?: number
  spin?: number
  drift?: number
  opacity?: number
  keepClearRadius?: number
}

function makeGeometry(kind: GeoKind) {
  switch (kind) {
    case 'sphere':
      return <sphereGeometry args={[0.5, 10, 10]} />
    case 'cylinder':
      return <cylinderGeometry args={[0.25, 0.35, 1, 8]} />
    case 'octahedron':
      return <octahedronGeometry args={[0.5, 0]} />
    case 'icosahedron':
      return <icosahedronGeometry args={[0.5, 0]} />
    case 'torus':
      return <torusGeometry args={[0.35, 0.12, 8, 16]} />
    default:
      return <boxGeometry args={[1, 1, 1]} />
  }
}

export function InstancedScatter({
  count,
  seed,
  color,
  emissive,
  emissiveIntensity = 0,
  geo = 'box',
  scaleMin = 0.2,
  scaleMax = 1.2,
  zStart,
  zEnd,
  radius,
  yMin,
  yMax,
  metalness = 0.3,
  roughness = 0.55,
  spin = 0.15,
  drift = 0.08,
  opacity = 1,
  keepClearRadius,
}: InstancedScatterProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const layout = useMemo(() => {
    const positions = scatterAlongPath(count, {
      seed,
      zStart,
      zEnd,
      radius,
      yMin,
      yMax,
      keepClearRadius,
    })
    const scales = new Float32Array(count)
    const phases = new Float32Array(count)
    const rng = (() => {
      let s = (seed + 99) >>> 0
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0
        return s / 0xffffffff
      }
    })()
    for (let i = 0; i < count; i++) {
      scales[i] = scaleMin + rng() * (scaleMax - scaleMin)
      phases[i] = rng() * Math.PI * 2
    }
    return { positions, scales, phases }
  }, [count, seed, zStart, zEnd, radius, yMin, yMax, scaleMin, scaleMax, keepClearRadius])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const phase = layout.phases[i]
      dummy.position.set(
        layout.positions[i3] + Math.sin(t * 0.3 + phase) * drift,
        layout.positions[i3 + 1] + Math.cos(t * 0.4 + phase) * drift * 0.6,
        layout.positions[i3 + 2],
      )
      dummy.rotation.set(t * spin * 0.4 + phase, t * spin + phase, t * spin * 0.2)
      const s = layout.scales[i]
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {makeGeometry(geo)}
      <meshPhysicalMaterial
        color={color}
        emissive={emissive ?? color}
        emissiveIntensity={emissiveIntensity}
        metalness={metalness}
        roughness={roughness}
        transparent={opacity < 1}
        opacity={opacity}
        clearcoat={0.25}
      />
    </instancedMesh>
  )
}
