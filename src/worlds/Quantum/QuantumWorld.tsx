import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, MeshDistortMaterial } from '@react-three/drei'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'
import { PALETTES } from '@/utils/colorPalettes'
import { FONTS } from '@/utils/constants'
import { InstancedScatter } from '@/worlds/shared/InstancedScatter'
import { InteractivePanel } from '@/worlds/shared/InteractivePanel'
import { ExitPortal } from '@/worlds/shared/ExitPortal'
import { PathLights } from '@/worlds/shared/PathLights'
import { createRng } from '@/worlds/shared/seededRandom'

const CLOUD_COUNT = 48
const PAIR_COUNT = 28
const PARTICLE_COUNT = 600
const ORBIT_COUNT = 120

export default function QuantumWorld() {
  const tick = useWorldEvolutionStore((s) => s.tick)
  const time = useRef(0)
  const cloudRef = useRef<THREE.InstancedMesh>(null)
  const particleRef = useRef<THREE.Points>(null)
  const orbitRef = useRef<THREE.InstancedMesh>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const pairs = useMemo(() => {
    const rng = createRng(63)
    return Array.from({ length: PAIR_COUNT }, () => {
      const z = 4 - rng() * 65
      const ax = (rng() - 0.5) * 14
      const ay = (rng() - 0.5) * 8
      return {
        a: [ax, ay, z] as [number, number, number],
        b: [ax + (rng() - 0.5) * 6, ay + (rng() - 0.5) * 4, z + (rng() - 0.5) * 4] as [number, number, number],
      }
    })
  }, [])

  const particles = useMemo(() => {
    const rng = createRng(71)
    const p = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      p[i * 3] = (rng() - 0.5) * 22
      p[i * 3 + 1] = (rng() - 0.5) * 14
      p[i * 3 + 2] = 6 - rng() * 70
    }
    return p
  }, [])

  useFrame((_, delta) => {
    time.current += delta
    tick(delta)

    if (cloudRef.current) {
      for (let i = 0; i < CLOUD_COUNT; i++) {
        const t = time.current * 0.18 + i * 0.4
        const z = 5 - ((i * 1.6 + time.current * 0.5) % 70)
        dummy.position.set(Math.sin(t) * 7, Math.cos(t * 0.7) * 4, z)
        dummy.scale.setScalar(1.2 + Math.sin(t + i) * 0.6)
        dummy.rotation.set(t * 0.1, t * 0.15, 0)
        dummy.updateMatrix()
        cloudRef.current.setMatrixAt(i, dummy.matrix)
      }
      cloudRef.current.instanceMatrix.needsUpdate = true
    }

    if (particleRef.current) {
      particleRef.current.rotation.y += delta * 0.05
      particleRef.current.rotation.x = Math.sin(time.current * 0.2) * 0.05
    }

    if (orbitRef.current) {
      for (let i = 0; i < ORBIT_COUNT; i++) {
        const a = (i / ORBIT_COUNT) * Math.PI * 2 + time.current * 0.4
        const r = 3 + (i % 5) * 1.2
        const z = -18 - (i % 8) * 5
        dummy.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.6, z)
        dummy.scale.setScalar(0.12)
        dummy.updateMatrix()
        orbitRef.current.setMatrixAt(i, dummy.matrix)
      }
      orbitRef.current.instanceMatrix.needsUpdate = true
    }

    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.2
      coreRef.current.rotation.y += delta * 0.35
    }
  })

  return (
    <group>
      <fog attach="fog" args={[PALETTES.quantum.fog, 8, 42]} />
      <color attach="background" args={[PALETTES.quantum.bg]} />

      {/* Probability clouds */}
      <instancedMesh ref={cloudRef} args={[undefined, undefined, CLOUD_COUNT]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshPhysicalMaterial
          color={PALETTES.quantum.primary}
          transmission={0.55}
          thickness={1}
          roughness={0.08}
          transparent
          opacity={0.3}
          iridescence={0.9}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[100, 400]}
        />
      </instancedMesh>

      {/* Entangled pairs */}
      {pairs.map((pair, i) => {
        const mid: [number, number, number] = [
          (pair.a[0] + pair.b[0]) / 2,
          (pair.a[1] + pair.b[1]) / 2,
          (pair.a[2] + pair.b[2]) / 2,
        ]
        const len = Math.hypot(pair.b[0] - pair.a[0], pair.b[1] - pair.a[1], pair.b[2] - pair.a[2])
        const pulse = Math.sin(time.current * 3.5 + i) * 0.5 + 0.5
        return (
          <group key={i}>
            <mesh position={mid}>
              <cylinderGeometry args={[0.012, 0.012, Math.max(len, 0.1), 4]} />
              <meshBasicMaterial color={PALETTES.quantum.accent} transparent opacity={0.25 + pulse * 0.35} />
            </mesh>
            <mesh position={pair.a}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshPhysicalMaterial color={PALETTES.quantum.primary} emissive={PALETTES.quantum.accent} emissiveIntensity={0.4} iridescence={1} roughness={0.1} />
            </mesh>
            <mesh position={pair.b}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshPhysicalMaterial color={PALETTES.quantum.primary} emissive={PALETTES.quantum.accent} emissiveIntensity={0.4} iridescence={1} roughness={0.1} />
            </mesh>
          </group>
        )
      })}

      {/* Superposition core landmark */}
      <group position={[0, 0, -20]}>
        <mesh ref={coreRef}>
          <torusKnotGeometry args={[2.8, 0.18, 160, 20]} />
          <MeshDistortMaterial color={PALETTES.quantum.accent} speed={0.9} distort={0.45} roughness={0.1} metalness={0.35} transparent opacity={0.55} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.4, 1]} />
          <meshPhysicalMaterial color={PALETTES.quantum.primary} transmission={0.6} roughness={0.05} transparent opacity={0.4} iridescence={1} />
        </mesh>
        <Text position={[0, 5, 0]} fontSize={0.4} color={PALETTES.quantum.primary} anchorX="center" font={FONTS.SPACE_GROTESK} letterSpacing={0.06}>
          SUPERPOSITION
        </Text>
        <pointLight color={PALETTES.quantum.accent} intensity={2.5} distance={22} />
      </group>

      <instancedMesh ref={orbitRef} args={[undefined, undefined, ORBIT_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={PALETTES.quantum.dispersion} transparent opacity={0.7} />
      </instancedMesh>

      <points ref={particleRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color={PALETTES.quantum.primary} transparent opacity={0.55} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <InstancedScatter
        count={220}
        seed={81}
        color={PALETTES.quantum.secondary}
        emissive={PALETTES.quantum.accent}
        emissiveIntensity={0.25}
        geo="octahedron"
        scaleMin={0.08}
        scaleMax={0.5}
        zStart={5}
        zEnd={-68}
        radius={14}
        yMin={-5}
        yMax={6}
        opacity={0.8}
        spin={0.5}
        keepClearRadius={2}
      />

      <InstancedScatter
        count={100}
        seed={82}
        color={PALETTES.quantum.void}
        geo="torus"
        scaleMin={0.3}
        scaleMax={1.2}
        zStart={4}
        zEnd={-65}
        radius={12}
        yMin={-3}
        yMax={4}
        metalness={0.4}
        roughness={0.2}
        keepClearRadius={2.5}
      />

      <InteractivePanel
        position={[-5, 1, -10]}
        color={PALETTES.quantum.secondary}
        accent={PALETTES.quantum.accent}
        item={{ title: 'Uncertainty', tag: 'Process', body: 'I prototype many futures in parallel, then collapse to the one that feels inevitable.' }}
      />
      <InteractivePanel
        position={[5, 0.5, -28]}
        color={PALETTES.quantum.secondary}
        accent={PALETTES.quantum.dispersion}
        item={{ title: 'Entanglement', tag: 'Collaboration', body: 'Design and engineering stay linked — change one state, the other responds.' }}
      />
      <InteractivePanel
        position={[0, 1.2, -42]}
        color={PALETTES.quantum.secondary}
        accent={PALETTES.quantum.primary}
        item={{ title: 'Observation', tag: 'Research', body: 'User testing as measurement: the act of watching shapes the product.' }}
      />

      <ExitPortal position={[0, 1.4, -58]} color={PALETTES.quantum.accent} previewColor={PALETTES.hub.accent} />
      <PathLights color={PALETTES.quantum.accent} count={12} intensity={0.9} zEnd={-55} seed={27} />
      <ambientLight intensity={0.16} color={PALETTES.quantum.primary} />
      <pointLight position={[0, 4, -8]} color={PALETTES.quantum.accent} intensity={1.4} distance={25} />
      <pointLight position={[-6, -2, -30]} color={PALETTES.quantum.dispersion} intensity={0.8} distance={18} />
    </group>
  )
}
