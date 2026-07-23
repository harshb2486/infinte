import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Float, Environment, Sparkles } from '@react-three/drei'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { usePortalAIStore } from '@/stores/usePortalAIStore'
import { PALETTES } from '@/utils/colorPalettes'
import { FONTS } from '@/utils/constants'
import { InstancedScatter } from '@/worlds/shared/InstancedScatter'
import { InteractivePanel } from '@/worlds/shared/InteractivePanel'
import { ExitPortal } from '@/worlds/shared/ExitPortal'
import { createRng } from '@/worlds/shared/seededRandom'

const DISSOLVE_COUNT = 500
const MONOLITH_COUNT = 36
const STAR_COUNT = 2000

export default function EdgeWorld() {
  const tick = useWorldEvolutionStore((s) => s.tick)
  const navigateTo = useNavigationStore((s) => s.navigateTo)
  const startTransition = useNavigationStore((s) => s.startTransition)
  const interject = usePortalAIStore((s) => s.interject)
  const time = useRef(0)
  const beaconRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const monolithRef = useRef<THREE.InstancedMesh>(null)
  const hasSpoken = useRef(false)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particlePositions = useRef(new Float32Array(DISSOLVE_COUNT * 3))
  const particleVelocities = useRef(new Float32Array(DISSOLVE_COUNT * 3))

  const stars = useMemo(() => {
    const rng = createRng(1)
    const p = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      p[i * 3] = (rng() - 0.5) * 80
      p[i * 3 + 1] = (rng() - 0.5) * 50
      p[i * 3 + 2] = (rng() - 0.5) * 80 - 10
    }
    return p
  }, [])

  const monoliths = useMemo(() => {
    const rng = createRng(2)
    return Array.from({ length: MONOLITH_COUNT }, (_, i) => {
      const a = (i / MONOLITH_COUNT) * Math.PI * 2
      const r = 6 + rng() * 14
      return {
        x: Math.cos(a) * r,
        z: Math.sin(a) * r - 8,
        h: 3 + rng() * 10,
        w: 0.4 + rng() * 0.6,
      }
    })
  }, [])

  useEffect(() => {
    const rng = createRng(3)
    for (let i = 0; i < DISSOLVE_COUNT; i++) {
      const i3 = i * 3
      particlePositions.current[i3] = (rng() - 0.5) * 4
      particlePositions.current[i3 + 1] = (rng() - 0.5) * 4
      particlePositions.current[i3 + 2] = (rng() - 0.5) * 4
      particleVelocities.current[i3] = (rng() - 0.5) * 0.02
      particleVelocities.current[i3 + 1] = (rng() - 0.5) * 0.02
      particleVelocities.current[i3 + 2] = (rng() - 0.5) * 0.02
    }
  }, [])

  useFrame((_, delta) => {
    time.current += delta
    tick(delta)

    if (beaconRef.current) {
      beaconRef.current.rotation.y += delta * 0.15
      const s = 1 + Math.sin(time.current * 0.5) * 0.03
      beaconRef.current.scale.setScalar(s)
    }

    if (time.current > 4 && !hasSpoken.current) {
      hasSpoken.current = true
      interject('Thank you for visiting. The journey never truly ends.', 'wise')
    }

    if (time.current > 18) {
      startTransition('hub')
      setTimeout(() => navigateTo('hub'), 1500)
    }

    if (particlesRef.current) {
      const arr = particlesRef.current.geometry.getAttribute('position').array as Float32Array
      const dispersion = Math.min(time.current / 10, 1.5)
      for (let i = 0; i < DISSOLVE_COUNT; i++) {
        const i3 = i * 3
        arr[i3] += particleVelocities.current[i3] * dispersion * 8
        arr[i3 + 1] += particleVelocities.current[i3 + 1] * dispersion * 8
        arr[i3 + 2] += particleVelocities.current[i3 + 2] * dispersion * 8
      }
      particlesRef.current.geometry.getAttribute('position').needsUpdate = true
    }

    if (monolithRef.current) {
      monoliths.forEach((m, i) => {
        dummy.position.set(m.x, m.h * 0.5 - 2, m.z)
        dummy.scale.set(m.w, m.h, m.w)
        dummy.rotation.set(0, time.current * 0.05 + i, 0)
        dummy.updateMatrix()
        monolithRef.current!.setMatrixAt(i, dummy.matrix)
      })
      monolithRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <Environment preset="dawn" background={false} />
      <fog attach="fog" args={[PALETTES.edge.fog, 10, 55]} />
      <color attach="background" args={[PALETTES.edge.bg]} />

      {/* Pale ground plane */}
      <mesh position={[0, -3.5, -10]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshPhysicalMaterial color={PALETTES.edge.secondary} roughness={0.7} metalness={0.15} />
      </mesh>

      {/* Concentric rings */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[0, -3.4, -8]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3 + i * 2.5, 0.03, 8, 64]} />
          <meshBasicMaterial color={PALETTES.edge.accent} transparent opacity={0.2 - i * 0.012} />
        </mesh>
      ))}

      <instancedMesh ref={monolithRef} args={[undefined, undefined, MONOLITH_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          color={PALETTES.edge.primary}
          metalness={0.85}
          roughness={0.15}
          clearcoat={0.8}
          emissive={PALETTES.edge.accent}
          emissiveIntensity={0.08}
        />
      </instancedMesh>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color={PALETTES.edge.accent} transparent opacity={0.5} sizeAttenuation depthWrite={false} />
      </points>

      <InstancedScatter
        count={200}
        seed={4}
        color={PALETTES.edge.secondary}
        geo="box"
        scaleMin={0.15}
        scaleMax={1.2}
        zStart={8}
        zEnd={-40}
        radius={22}
        yMin={-3}
        yMax={8}
        metalness={0.7}
        roughness={0.25}
        keepClearRadius={3}
      />

      <InstancedScatter
        count={150}
        seed={5}
        color={PALETTES.edge.accent}
        emissive={PALETTES.edge.accent}
        emissiveIntensity={0.2}
        geo="octahedron"
        scaleMin={0.08}
        scaleMax={0.4}
        zStart={6}
        zEnd={-35}
        radius={18}
        yMin={-2}
        yMax={10}
        spin={0.2}
        keepClearRadius={2.5}
      />

      {/* Central contact beacon */}
      <Float speed={0.45} rotationIntensity={0.08} floatIntensity={0.25}>
        <group ref={beaconRef} position={[0, 0.5, -8]}>
          <mesh>
            <boxGeometry args={[1.6, 1.6, 1.6]} />
            <meshPhysicalMaterial
              color={PALETTES.edge.primary}
              roughness={0.08}
              metalness={0.92}
              clearcoat={1}
              clearcoatRoughness={0.04}
              emissive={PALETTES.edge.accent}
              emissiveIntensity={0.25}
            />
          </mesh>
          <mesh scale={[1.08, 1.08, 1.08]}>
            <boxGeometry args={[1.6, 1.6, 1.6]} />
            <meshBasicMaterial color={PALETTES.edge.accent} wireframe transparent opacity={0.12} />
          </mesh>
          {[
            { pos: [0, 0, 0.82] as [number, number, number], rot: [0, 0, 0] as [number, number, number], text: 'hello@infinite.studio' },
            { pos: [0.82, 0, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], text: 'github.com/portfolio' },
            { pos: [-0.82, 0, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], text: 'Let\'s build worlds' },
          ].map((f, i) => (
            <Text
              key={i}
              position={f.pos}
              rotation={f.rot}
              fontSize={0.11}
              color={PALETTES.edge.accent}
              anchorX="center"
              anchorY="middle"
              font={FONTS.INTER}
            >
              {f.text}
            </Text>
          ))}
          <pointLight color={PALETTES.edge.accent} intensity={1.5} distance={18} />
        </group>
      </Float>

      <points ref={particlesRef} position={[0, 0.5, -8]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions.current, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color={PALETTES.edge.accent} transparent opacity={0.65} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <Sparkles count={80} scale={[40, 20, 40]} size={1.2} speed={0.08} color={PALETTES.edge.accent} opacity={0.35} />

      <Text position={[0, 5, -8]} fontSize={0.4} color={PALETTES.edge.accent} anchorX="center" font={FONTS.SPACE_GROTESK} letterSpacing={0.08}>
        THE FINAL MERIDIAN
      </Text>

      <InteractivePanel
        position={[-5, 1, -16]}
        color={PALETTES.edge.secondary}
        accent={PALETTES.edge.accent}
        item={{ title: 'Contact', tag: 'Next', body: 'Open to collaborations, residencies, and ambitious spatial products.' }}
      />
      <InteractivePanel
        position={[5, 1, -16]}
        color={PALETTES.edge.secondary}
        accent={PALETTES.edge.light}
        item={{ title: 'Availability', tag: '2026', body: 'Booking select projects. Prefer work that respects craft and curiosity.' }}
      />

      <ExitPortal position={[0, 1.5, -28]} color={PALETTES.edge.accent} label="Begin Again" previewColor={PALETTES.hub.accent} />

      <ambientLight intensity={0.55} color={PALETTES.edge.primary} />
      <directionalLight position={[5, 12, 5]} intensity={0.8} color={PALETTES.edge.light} />
      <pointLight position={[0, 6, -8]} color={PALETTES.edge.accent} intensity={1.4} distance={25} />
    </group>
  )
}
