import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Environment, ContactShadows, Float, Sparkles, Text } from '@react-three/drei'
import { PortalHub } from '@/portal/PortalHub'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'
import { PALETTES } from '@/utils/colorPalettes'
import { FONTS } from '@/utils/constants'
import { InstancedScatter } from '@/worlds/shared/InstancedScatter'
import { createRng } from '@/worlds/shared/seededRandom'

const PILLAR_COUNT = 24
const ORB_COUNT = 180
const RING_COUNT = 8

export default function HubScene() {
  const tick = useWorldEvolutionStore((s) => s.tick)
  const time = useRef(0)
  const pillarsRef = useRef<THREE.InstancedMesh>(null)
  const orbsRef = useRef<THREE.Points>(null)
  const ringsRef = useRef<THREE.Group>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const pillars = useMemo(() => {
    const rng = createRng(42)
    return Array.from({ length: PILLAR_COUNT }, (_, i) => {
      const angle = (i / PILLAR_COUNT) * Math.PI * 2
      const r = 16 + rng() * 10
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r - 4,
        h: 6 + rng() * 14,
        w: 0.4 + rng() * 0.5,
      }
    })
  }, [])

  const orbPositions = useMemo(() => {
    const rng = createRng(7)
    const pos = new Float32Array(ORB_COUNT * 3)
    for (let i = 0; i < ORB_COUNT; i++) {
      const a = rng() * Math.PI * 2
      const r = 4 + rng() * 32
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = -1 + rng() * 14
      pos[i * 3 + 2] = Math.sin(a) * r - 6
    }
    return pos
  }, [])

  const archways = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2
      return {
        x: Math.cos(angle) * 11,
        z: Math.sin(angle) * 11 - 2,
        rot: -angle + Math.PI / 2,
      }
    })
  }, [])

  useFrame((_, delta) => {
    time.current += delta
    tick(delta)

    if (pillarsRef.current) {
      pillars.forEach((p, i) => {
        dummy.position.set(p.x, p.h * 0.5 - 2.2, p.z)
        dummy.scale.set(p.w, p.h, p.w)
        dummy.rotation.set(0, time.current * 0.02 + i, 0)
        dummy.updateMatrix()
        pillarsRef.current!.setMatrixAt(i, dummy.matrix)
      })
      pillarsRef.current.instanceMatrix.needsUpdate = true
    }

    if (orbsRef.current) {
      orbsRef.current.rotation.y += delta * 0.04
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.08
    }
  })

  return (
    <group>
      <fog attach="fog" args={[PALETTES.hub.fog, 12, 70]} />
      <color attach="background" args={[PALETTES.hub.bg]} />
      <Environment preset="night" background={false} />

      {/* Multi-tier platforms */}
      {[0, 1, 2].map((tier) => (
        <mesh key={tier} position={[0, -2.5 - tier * 1.2, -2]} receiveShadow>
          <cylinderGeometry args={[14 - tier * 3, 16 - tier * 2.5, 0.45, 64]} />
          <meshPhysicalMaterial
            color={PALETTES.hub.secondary}
            metalness={0.65}
            roughness={0.3}
            clearcoat={0.5}
          />
        </mesh>
      ))}

      {/* Concentric glowing rings */}
      <group position={[0, -2.2, -2]} ref={ringsRef}>
        {Array.from({ length: RING_COUNT }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[5 + i * 2.2, 0.04, 8, 64]} />
            <meshBasicMaterial
              color={PALETTES.hub.accent}
              transparent
              opacity={0.15 + (i % 3) * 0.05}
            />
          </mesh>
        ))}
      </group>

      <ContactShadows position={[0, -2.5, -2]} opacity={0.4} scale={55} blur={2.5} far={5} />

      {/* Perimeter pillars */}
      <instancedMesh ref={pillarsRef} args={[undefined, undefined, PILLAR_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          color={PALETTES.hub.secondary}
          metalness={0.7}
          roughness={0.25}
          emissive={PALETTES.hub.primary}
          emissiveIntensity={0.08}
        />
      </instancedMesh>

      {/* Archways framing portals */}
      {archways.map((a, i) => (
        <group key={i} position={[a.x, 1.5, a.z]} rotation={[0, a.rot, 0]}>
          <mesh position={[-2.2, 0, 0]}>
            <boxGeometry args={[0.35, 5, 0.5]} />
            <meshPhysicalMaterial color={PALETTES.hub.secondary} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[2.2, 0, 0]}>
            <boxGeometry args={[0.35, 5, 0.5]} />
            <meshPhysicalMaterial color={PALETTES.hub.secondary} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.6, 0]}>
            <boxGeometry args={[4.8, 0.35, 0.5]} />
            <meshPhysicalMaterial
              color={PALETTES.hub.primary}
              metalness={0.8}
              roughness={0.2}
              emissive={PALETTES.hub.accent}
              emissiveIntensity={0.15}
            />
          </mesh>
        </group>
      ))}

      {/* Floating debris / crystals */}
      <InstancedScatter
        count={220}
        seed={11}
        color={PALETTES.hub.primary}
        emissive={PALETTES.hub.accent}
        emissiveIntensity={0.15}
        geo="octahedron"
        scaleMin={0.08}
        scaleMax={0.45}
        zStart={12}
        zEnd={-35}
        radius={28}
        yMin={-1}
        yMax={12}
        metalness={0.8}
        roughness={0.2}
        spin={0.25}
        keepClearRadius={3}
      />

      <InstancedScatter
        count={140}
        seed={22}
        color={PALETTES.hub.secondary}
        geo="box"
        scaleMin={0.15}
        scaleMax={0.9}
        zStart={10}
        zEnd={-40}
        radius={32}
        yMin={-2}
        yMax={10}
        metalness={0.5}
        roughness={0.4}
        keepClearRadius={4}
      />

      {/* Ambient orbs */}
      <points ref={orbsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[orbPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color={PALETTES.hub.accent}
          transparent
          opacity={0.45}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <Sparkles count={120} scale={[50, 30, 50]} size={1.4} speed={0.15} color={PALETTES.hub.accent} opacity={0.45} />

      {/* Central beacon */}
      <Float speed={0.6} floatIntensity={0.25}>
        <mesh position={[0, 4, -2]}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshPhysicalMaterial
            color={PALETTES.hub.accent}
            emissive={PALETTES.hub.accent}
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </Float>
      <mesh position={[0, 3, -2]}>
        <cylinderGeometry args={[0.06, 0.8, 14, 16, 1, true]} />
        <meshBasicMaterial
          color={PALETTES.hub.accent}
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <Text
        position={[0, 7.5, -2]}
        fontSize={0.45}
        color={PALETTES.hub.primary}
        anchorX="center"
        font={FONTS.SPACE_GROTESK}
        letterSpacing={0.08}
      >
        THE NEXUS
      </Text>
      <Text
        position={[0, 6.8, -2]}
        fontSize={0.16}
        color="rgba(200,200,208,0.55)"
        anchorX="center"
        font={FONTS.INTER}
      >
        Choose a reality · Click a portal
      </Text>

      <PortalHub />

      <ambientLight intensity={0.12} color={PALETTES.hub.rim} />
      <spotLight position={[0, 22, -2]} angle={0.55} penumbra={0.85} intensity={10} color={PALETTES.hub.accent} distance={60} decay={2} />
      <spotLight position={[-14, 8, 4]} angle={0.4} penumbra={1} intensity={3.5} color={PALETTES.hub.rim} distance={45} decay={2} />
      <spotLight position={[14, 6, -12]} angle={0.35} penumbra={1} intensity={2.5} color={PALETTES.hub.primary} distance={40} decay={2} />
      <pointLight position={[0, 2, -2]} color={PALETTES.hub.accent} intensity={1.5} distance={20} decay={2} />
    </group>
  )
}
