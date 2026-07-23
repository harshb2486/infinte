import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Sparkles, Text } from '@react-three/drei'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'
import { PALETTES } from '@/utils/colorPalettes'
import { FONTS } from '@/utils/constants'
import { InstancedScatter } from '@/worlds/shared/InstancedScatter'
import { InteractivePanel } from '@/worlds/shared/InteractivePanel'
import { ExitPortal } from '@/worlds/shared/ExitPortal'
import { PathLights } from '@/worlds/shared/PathLights'
import { GroundRibbon } from '@/worlds/shared/GroundRibbon'
import { createRng } from '@/worlds/shared/seededRandom'

const FISH_COUNT = 160
const JELLY_COUNT = 24
const BUBBLE_COUNT = 280
const CORAL_COUNT = 120
const KELP_COUNT = 90
const RUIN_BLOCKS = 80

export default function UnderwaterScene() {
  const tick = useWorldEvolutionStore((s) => s.tick)
  const time = useRef(0)
  const fishRef = useRef<THREE.InstancedMesh>(null)
  const jellyRef = useRef<THREE.InstancedMesh>(null)
  const bubbleRef = useRef<THREE.InstancedMesh>(null)
  const kelpRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const fishData = useMemo(() => {
    const rng = createRng(17)
    const pos = new Float32Array(FISH_COUNT * 3)
    const vel = new Float32Array(FISH_COUNT * 3)
    for (let i = 0; i < FISH_COUNT; i++) {
      pos[i * 3] = (rng() - 0.5) * 22
      pos[i * 3 + 1] = -2 + rng() * 8
      pos[i * 3 + 2] = 5 - rng() * 70
      vel[i * 3] = (rng() - 0.5) * 0.02
      vel[i * 3 + 1] = (rng() - 0.5) * 0.01
      vel[i * 3 + 2] = -0.01 - rng() * 0.03
    }
    return { pos, vel }
  }, [])

  const jellyPos = useMemo(() => {
    const rng = createRng(31)
    return Array.from({ length: JELLY_COUNT }, () => [
      (rng() - 0.5) * 18,
      -1 + rng() * 7,
      2 - rng() * 65,
    ] as [number, number, number])
  }, [])

  const coral = useMemo(() => {
    const rng = createRng(44)
    return Array.from({ length: CORAL_COUNT }, () => ({
      x: (rng() - 0.5) * 24,
      z: 4 - rng() * 75,
      h: 0.6 + rng() * 2.2,
      c: rng() > 0.5 ? PALETTES.underwater.coral : PALETTES.underwater.bio,
    }))
  }, [])

  useFrame((_, delta) => {
    time.current += delta
    tick(delta)

    if (fishRef.current) {
      for (let i = 0; i < FISH_COUNT; i++) {
        const i3 = i * 3
        fishData.pos[i3] += fishData.vel[i3]
        fishData.pos[i3 + 1] += Math.sin(time.current + i) * 0.004
        fishData.pos[i3 + 2] += fishData.vel[i3 + 2]
        if (fishData.pos[i3 + 2] < -75) {
          fishData.pos[i3 + 2] = 8
          fishData.pos[i3] = (Math.random() - 0.5) * 22
        }
        dummy.position.set(fishData.pos[i3], fishData.pos[i3 + 1], fishData.pos[i3 + 2])
        dummy.rotation.y = Math.atan2(fishData.vel[i3], fishData.vel[i3 + 2])
        dummy.scale.set(0.45, 0.25, 0.2)
        dummy.updateMatrix()
        fishRef.current.setMatrixAt(i, dummy.matrix)
      }
      fishRef.current.instanceMatrix.needsUpdate = true
    }

    if (jellyRef.current) {
      jellyPos.forEach((p, i) => {
        const pulse = Math.sin(time.current * 1.8 + i) * 0.5 + 0.5
        dummy.position.set(
          p[0] + Math.sin(time.current * 0.25 + i) * 1.2,
          p[1] + Math.sin(time.current * 0.6 + i) * 0.4,
          p[2],
        )
        dummy.scale.setScalar(0.7 + pulse * 0.25)
        dummy.updateMatrix()
        jellyRef.current!.setMatrixAt(i, dummy.matrix)
      })
      jellyRef.current.instanceMatrix.needsUpdate = true
    }

    if (bubbleRef.current) {
      for (let i = 0; i < BUBBLE_COUNT; i++) {
        const t = (time.current * 0.7 + i * 0.35) % 18
        dummy.position.set(
          Math.sin(i * 0.6 + time.current * 0.15) * 10,
          t - 8,
          5 - ((i * 7) % 70),
        )
        dummy.scale.setScalar(0.04 + 0.04 * Math.sin(i + time.current))
        dummy.updateMatrix()
        bubbleRef.current.setMatrixAt(i, dummy.matrix)
      }
      bubbleRef.current.instanceMatrix.needsUpdate = true
    }

    if (kelpRef.current) {
      for (let i = 0; i < KELP_COUNT; i++) {
        const x = ((i * 17) % 26) - 13
        const z = 3 - ((i * 11) % 72)
        dummy.position.set(x, -3.2, z)
        dummy.rotation.set(Math.sin(time.current + i) * 0.15, 0, Math.cos(time.current * 0.7 + i) * 0.2)
        dummy.scale.set(0.15, 2 + (i % 5) * 0.4, 0.15)
        dummy.updateMatrix()
        kelpRef.current.setMatrixAt(i, dummy.matrix)
      }
      kelpRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <fog attach="fog" args={[PALETTES.underwater.fog, 6, 42]} />
      <color attach="background" args={[PALETTES.underwater.bg]} />

      <GroundRibbon
        color={PALETTES.underwater.sand}
        y={-5}
        width={32}
        length={100}
        zCenter={-35}
        roughness={0.95}
        metalness={0.05}
      />

      {/* Temple landmark */}
      <group position={[0, -2, -22]}>
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[14, 6, 1.2]} />
          <meshPhysicalMaterial color={PALETTES.underwater.sand} roughness={0.9} />
        </mesh>
        <mesh position={[0, 5.5, 0.4]}>
          <torusGeometry args={[2.8, 0.35, 12, 40, Math.PI]} />
          <meshPhysicalMaterial color={PALETTES.underwater.sand} roughness={0.85} />
        </mesh>
        {[-5, -2.5, 2.5, 5].map((x, i) => (
          <mesh key={i} position={[x, 1, 2]} rotation={[0.1, 0, 0.05 * (i % 2 ? 1 : -1)]}>
            <cylinderGeometry args={[0.45, 0.55, 5.5, 12]} />
            <meshPhysicalMaterial color={PALETTES.underwater.sand} roughness={0.92} />
          </mesh>
        ))}
        <mesh position={[0, 3, 0.7]}>
          <planeGeometry args={[6, 2]} />
          <meshBasicMaterial color={PALETTES.underwater.bio} transparent opacity={0.35} />
        </mesh>
        <Text position={[0, 3.2, 0.8]} fontSize={0.28} color={PALETTES.underwater.pearl} anchorX="center" font={FONTS.SPACE_GROTESK}>
          ABYSSAL ARCHIVE
        </Text>
      </group>

      {/* Ruin debris field */}
      <InstancedScatter
        count={RUIN_BLOCKS}
        seed={61}
        color={PALETTES.underwater.sand}
        geo="box"
        scaleMin={0.3}
        scaleMax={1.8}
        zStart={6}
        zEnd={-70}
        radius={14}
        yMin={-4.5}
        yMax={-2.5}
        metalness={0.05}
        roughness={0.95}
        spin={0.02}
        drift={0.02}
        keepClearRadius={2}
      />

      <InstancedScatter
        count={200}
        seed={72}
        color={PALETTES.underwater.bio}
        emissive={PALETTES.underwater.bio}
        emissiveIntensity={0.35}
        geo="sphere"
        scaleMin={0.05}
        scaleMax={0.25}
        zStart={5}
        zEnd={-68}
        radius={12}
        yMin={-3}
        yMax={5}
        opacity={0.7}
        keepClearRadius={1.5}
      />

      {/* Coral clusters */}
      {coral.map((c, i) => (
        <group key={i} position={[c.x, -4.6, c.z]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.2, c.h, 6]} />
            <meshPhysicalMaterial color={c.c} roughness={0.8} emissive={PALETTES.underwater.bio} emissiveIntensity={0.08} />
          </mesh>
          {[0, 1, 2].map((j) => (
            <mesh
              key={j}
              position={[Math.cos(j * 2.1) * 0.2, c.h * 0.4, Math.sin(j * 2.1) * 0.2]}
              rotation={[0.4, j, 0.2]}
            >
              <cylinderGeometry args={[0.04, 0.1, c.h * 0.5, 5]} />
              <meshPhysicalMaterial color={PALETTES.underwater.bio} emissive={PALETTES.underwater.bio} emissiveIntensity={0.12} />
            </mesh>
          ))}
        </group>
      ))}

      <instancedMesh ref={kelpRef} args={[undefined, undefined, KELP_COUNT]}>
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshPhysicalMaterial color="#1a4a3a" roughness={0.7} emissive={PALETTES.underwater.bio} emissiveIntensity={0.05} />
      </instancedMesh>

      <instancedMesh ref={fishRef} args={[undefined, undefined, FISH_COUNT]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshPhysicalMaterial color={PALETTES.underwater.pearl} roughness={0.35} metalness={0.15} sheen={0.4} sheenColor={PALETTES.underwater.accent} />
      </instancedMesh>

      <instancedMesh ref={jellyRef} args={[undefined, undefined, JELLY_COUNT]}>
        <sphereGeometry args={[0.5, 12, 8]} />
        <meshPhysicalMaterial
          color={PALETTES.underwater.bio}
          emissive={PALETTES.underwater.bio}
          emissiveIntensity={0.45}
          transparent
          opacity={0.65}
          transmission={0.35}
        />
      </instancedMesh>

      <instancedMesh ref={bubbleRef} args={[undefined, undefined, BUBBLE_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshPhysicalMaterial color={PALETTES.underwater.pearl} transparent opacity={0.35} roughness={0.1} metalness={0.05} />
      </instancedMesh>

      {/* God rays */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[(i - 2.5) * 4, 10, -8 - i * 5]} rotation={[0.15, 0, (i - 2.5) * 0.08]}>
          <coneGeometry args={[3 + i * 0.3, 20, 8, 1, true]} />
          <meshBasicMaterial color={PALETTES.underwater.accent} transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}

      <Sparkles count={80} scale={[30, 16, 70]} size={1.2} speed={0.12} color={PALETTES.underwater.bio} opacity={0.4} />

      <InteractivePanel
        position={[-5, 0.5, -12]}
        color={PALETTES.underwater.sand}
        accent={PALETTES.underwater.bio}
        item={{
          title: 'About Me',
          tag: 'Identity',
          body: 'Explorer of digital oceans. I craft immersive experiences where light, motion, and story meet.',
        }}
      />
      <InteractivePanel
        position={[5.5, 0.2, -18]}
        color={PALETTES.underwater.sand}
        accent={PALETTES.underwater.accent}
        item={{
          title: 'Philosophy',
          tag: 'Craft',
          body: 'Every interface is a habitat. Design should feel discovered, not delivered.',
        }}
      />
      <InteractivePanel
        position={[0, 1, -32]}
        color={PALETTES.underwater.sand}
        accent={PALETTES.underwater.coral}
        item={{
          title: 'Origins',
          tag: 'Story',
          body: 'Started building worlds in code before I had a name for it. Still chasing that first sense of wonder.',
        }}
      />

      <ExitPortal position={[0, 1.5, -58]} color={PALETTES.underwater.accent} previewColor={PALETTES.hub.accent} />

      <PathLights color={PALETTES.underwater.bio} count={14} intensity={0.9} zEnd={-60} y={2} seed={9} />
      <ambientLight intensity={0.14} color={PALETTES.underwater.water} />
      <directionalLight position={[0, 18, 0]} intensity={0.7} color={PALETTES.underwater.primary} />
      <pointLight position={[0, 4, -22]} color={PALETTES.underwater.bio} intensity={2} distance={25} />
    </group>
  )
}
