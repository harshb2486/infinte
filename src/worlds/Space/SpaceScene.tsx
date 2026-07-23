import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'
import { PALETTES } from '@/utils/colorPalettes'
import { FONTS } from '@/utils/constants'
import { InstancedScatter } from '@/worlds/shared/InstancedScatter'
import { InteractivePanel } from '@/worlds/shared/InteractivePanel'
import { ExitPortal } from '@/worlds/shared/ExitPortal'
import { PathLights } from '@/worlds/shared/PathLights'
import { createRng } from '@/worlds/shared/seededRandom'

const STAR_COUNT = 12000
const ASTEROID_COUNT = 280
const DEBRIS_COUNT = 160
const SAT_COUNT = 18

export default function SpaceScene() {
  const tick = useWorldEvolutionStore((s) => s.tick)
  const time = useRef(0)
  const asteroidRef = useRef<THREE.InstancedMesh>(null)
  const debrisRef = useRef<THREE.InstancedMesh>(null)
  const blackHoleRef = useRef<THREE.Group>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const stars = useMemo(() => {
    const rng = createRng(88)
    const pos = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 30 + rng() * 140
      const theta = rng() * Math.PI * 2
      const phi = Math.acos(2 * rng() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi) - 20
    }
    return pos
  }, [])

  const asteroids = useMemo(() => {
    const rng = createRng(55)
    return Array.from({ length: ASTEROID_COUNT }, () => ({
      x: (rng() - 0.5) * 28,
      y: (rng() - 0.5) * 16,
      z: 6 - rng() * 80,
      s: 0.25 + rng() * 1.4,
      spin: rng(),
    }))
  }, [])

  const projects = useMemo(
    () => [
      { pos: [-7, 2, -16] as [number, number, number], color: '#a84a5a', size: 1.5, name: 'Project Alpha', tech: 'React · Three.js', body: 'Immersive product story told in real-time 3D. Shipped to 200k users.' },
      { pos: [8, -1, -24] as [number, number, number], color: '#4a5a8a', size: 1.3, name: 'Project Beta', tech: 'WebGL · GLSL', body: 'Custom shader pipeline for cinematic brand experiences.' },
      { pos: [-3, 3.5, -34] as [number, number, number], color: '#5a7a5a', size: 1.7, name: 'Project Gamma', tech: 'AI · Python', body: 'Generative systems that compose environments on the fly.' },
      { pos: [6, -2.5, -42] as [number, number, number], color: '#8a7a4a', size: 1.4, name: 'Project Delta', tech: 'Node · Cloud', body: 'Realtime multiplayer backbone for spatial experiences.' },
      { pos: [-9, 1, -50] as [number, number, number], color: '#6a4a8a', size: 1.2, name: 'Project Epsilon', tech: 'AR · WebXR', body: 'Browser-native AR installation for museum visitors.' },
    ],
    [],
  )

  const stations = useMemo(() => {
    const rng = createRng(12)
    return Array.from({ length: 8 }, (_, i) => ({
      x: (rng() - 0.5) * 20,
      y: (rng() - 0.5) * 10,
      z: -8 - i * 8 - rng() * 4,
      scale: 0.8 + rng() * 1.2,
    }))
  }, [])

  useFrame((_, delta) => {
    time.current += delta
    tick(delta)
    if (blackHoleRef.current) blackHoleRef.current.rotation.z += delta * 0.25

    if (asteroidRef.current) {
      asteroids.forEach((a, i) => {
        dummy.position.set(
          a.x + Math.sin(time.current * 0.15 + a.spin) * 0.4,
          a.y + Math.cos(time.current * 0.12 + a.spin) * 0.3,
          a.z,
        )
        dummy.rotation.set(time.current * 0.1 + a.spin, time.current * 0.15, 0)
        dummy.scale.setScalar(a.s)
        dummy.updateMatrix()
        asteroidRef.current!.setMatrixAt(i, dummy.matrix)
      })
      asteroidRef.current.instanceMatrix.needsUpdate = true
    }

    if (debrisRef.current) {
      for (let i = 0; i < DEBRIS_COUNT; i++) {
        const z = ((-time.current * 4 + i * 3) % 80) - 5
        dummy.position.set(
          Math.sin(i * 1.7) * 10,
          Math.cos(i * 1.3) * 6,
          z,
        )
        dummy.rotation.set(time.current + i, time.current * 0.5, 0)
        dummy.scale.setScalar(0.08 + (i % 5) * 0.04)
        dummy.updateMatrix()
        debrisRef.current.setMatrixAt(i, dummy.matrix)
      }
      debrisRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <fog attach="fog" args={[PALETTES.space.fog, 20, 120]} />
      <color attach="background" args={[PALETTES.space.bg]} />

      {/* Starfield */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.14} color={PALETTES.space.star} transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Nebula volumes along path */}
      {[
        [-12, 6, -20, 14],
        [10, -4, -35, 18],
        [-6, 8, -50, 12],
        [0, 0, -65, 20],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[s, 16, 16]} />
          <meshBasicMaterial color={i % 2 ? PALETTES.space.nebula : '#1a1028'} transparent opacity={0.06} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}

      {/* Asteroid belt */}
      <instancedMesh ref={asteroidRef} args={[undefined, undefined, ASTEROID_COUNT]}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshPhysicalMaterial color="#3a3a48" roughness={0.85} metalness={0.25} />
      </instancedMesh>

      <instancedMesh ref={debrisRef} args={[undefined, undefined, DEBRIS_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial color="#5a5a68" metalness={0.7} roughness={0.35} />
      </instancedMesh>

      <InstancedScatter
        count={200}
        seed={40}
        color="#2a2a38"
        geo="icosahedron"
        scaleMin={0.15}
        scaleMax={0.9}
        zStart={5}
        zEnd={-75}
        radius={16}
        yMin={-8}
        yMax={8}
        metalness={0.4}
        roughness={0.7}
        keepClearRadius={2.5}
      />

      {/* Space stations / landmarks */}
      {stations.map((s, i) => (
        <group key={i} position={[s.x, s.y, s.z]} scale={s.scale}>
          <mesh>
            <cylinderGeometry args={[0.8, 0.8, 0.3, 12]} />
            <meshPhysicalMaterial color="#6a6a78" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[1.2, 0.06, 8, 32]} />
            <meshPhysicalMaterial color={PALETTES.space.accent} emissive={PALETTES.space.accent} emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[1.4, 0, 0]}>
            <boxGeometry args={[1.2, 0.05, 0.5]} />
            <meshPhysicalMaterial color="#1a1a2e" metalness={0.9} roughness={0.15} />
          </mesh>
          <mesh position={[-1.4, 0, 0]}>
            <boxGeometry args={[1.2, 0.05, 0.5]} />
            <meshPhysicalMaterial color="#1a1a2e" metalness={0.9} roughness={0.15} />
          </mesh>
          <pointLight color={PALETTES.space.accent} intensity={0.5} distance={6} />
        </group>
      ))}

      {/* Black hole landmark */}
      <group ref={blackHoleRef} position={[0, 0, -48]}>
        <mesh>
          <sphereGeometry args={[2.6, 32, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0.2, 0]}>
          <ringGeometry args={[3.2, 7.5, 64]} />
          <meshBasicMaterial color={PALETTES.space.blackhole} transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[Math.PI / 2 + 0.15, 0, 0]}>
          <ringGeometry args={[3.5, 5.5, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        <pointLight color={PALETTES.space.blackhole} intensity={2} distance={30} />
        <Text position={[0, 5, 0]} fontSize={0.3} color={PALETTES.space.primary} anchorX="center" font={FONTS.SPACE_GROTESK}>
          EVENT HORIZON
        </Text>
      </group>

      {/* Project planets — interactive portfolio */}
      {projects.map((p, i) => (
        <group key={i} position={p.pos}>
          <mesh>
            <sphereGeometry args={[p.size, 32, 32]} />
            <meshPhysicalMaterial color={p.color} roughness={0.65} metalness={0.15} clearcoat={0.35} />
          </mesh>
          {i % 2 === 0 && (
            <mesh rotation={[Math.PI / 2 + 0.25, 0, 0]}>
              <ringGeometry args={[p.size * 1.35, p.size * 1.85, 48]} />
              <meshBasicMaterial color={p.color} transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
          )}
          <pointLight color={p.color} intensity={0.6} distance={10} />
          <InteractivePanel
            position={[0, p.size + 1.4, 0]}
            color="#12121a"
            accent={p.color}
            width={2.8}
            height={1.6}
            item={{ title: p.name, tag: p.tech, body: p.body }}
          />
        </group>
      ))}

      {/* Satellites orbiting path */}
      {Array.from({ length: SAT_COUNT }).map((_, i) => {
        const a = (i / SAT_COUNT) * Math.PI * 2
        return (
          <group key={i} position={[Math.cos(a + time.current * 0.1) * 14, Math.sin(a * 2) * 4, -10 - i * 3.5]}>
            <mesh>
              <boxGeometry args={[0.5, 0.28, 0.28]} />
              <meshPhysicalMaterial color="#7a7a88" metalness={0.75} roughness={0.3} />
            </mesh>
            <mesh position={[0.7, 0, 0]}><boxGeometry args={[0.7, 0.02, 0.4]} /><meshPhysicalMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} /></mesh>
            <mesh position={[-0.7, 0, 0]}><boxGeometry args={[0.7, 0.02, 0.4]} /><meshPhysicalMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} /></mesh>
          </group>
        )
      })}

      <ExitPortal position={[0, 1.5, -68]} color={PALETTES.space.accent} previewColor={PALETTES.hub.accent} />
      <PathLights color={PALETTES.space.accent} count={10} intensity={0.6} zEnd={-65} radius={10} seed={3} />
      <ambientLight intensity={0.08} color={PALETTES.space.secondary} />
      <directionalLight position={[12, 10, 5]} intensity={0.5} color={PALETTES.space.primary} />
      <spotLight position={[-8, 4, -20]} angle={0.5} penumbra={0.8} intensity={2.5} color={PALETTES.space.accent} distance={70} decay={2} />
    </group>
  )
}
