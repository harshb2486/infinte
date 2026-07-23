import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Sparkles, MeshDistortMaterial, Float } from '@react-three/drei'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'
import { PALETTES } from '@/utils/colorPalettes'
import { FONTS } from '@/utils/constants'
import { InstancedScatter } from '@/worlds/shared/InstancedScatter'
import { InteractivePanel } from '@/worlds/shared/InteractivePanel'
import { ExitPortal } from '@/worlds/shared/ExitPortal'
import { PathLights } from '@/worlds/shared/PathLights'
import { createRng } from '@/worlds/shared/seededRandom'

const ISLAND_COUNT = 48
const FIREFLY_COUNT = 280
const TREE_COUNT = 90
const CRYSTAL_COUNT = 120
const CLOUD_COUNT = 30

export default function DreamWorld() {
  const tick = useWorldEvolutionStore((s) => s.tick)
  const time = useRef(0)
  const islandRef = useRef<THREE.InstancedMesh>(null)
  const fireflyRef = useRef<THREE.Points>(null)
  const treeRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const islands = useMemo(() => {
    const rng = createRng(66)
    return Array.from({ length: ISLAND_COUNT }, (_, i) => ({
      x: (rng() - 0.5) * 24,
      y: -2 + rng() * 6 + Math.sin(i) * 1.5,
      z: 5 - rng() * 70,
      sx: 1.2 + rng() * 2.5,
      sy: 0.4 + rng() * 0.8,
      sz: 1.2 + rng() * 2.5,
    }))
  }, [])

  const fireflies = useMemo(() => {
    const rng = createRng(67)
    const p = new Float32Array(FIREFLY_COUNT * 3)
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      p[i * 3] = (rng() - 0.5) * 28
      p[i * 3 + 1] = rng() * 12
      p[i * 3 + 2] = 6 - rng() * 72
    }
    return p
  }, [])

  useFrame((_, delta) => {
    time.current += delta
    tick(delta)

    if (islandRef.current) {
      islands.forEach((isl, i) => {
        dummy.position.set(
          isl.x + Math.sin(time.current * 0.12 + i) * 0.4,
          isl.y + Math.sin(time.current * 0.2 + i * 0.4) * 0.35,
          isl.z,
        )
        dummy.rotation.set(0, time.current * 0.04 + i * 0.1, 0)
        dummy.scale.set(isl.sx, isl.sy, isl.sz)
        dummy.updateMatrix()
        islandRef.current!.setMatrixAt(i, dummy.matrix)
      })
      islandRef.current.instanceMatrix.needsUpdate = true
    }

    if (fireflyRef.current) {
      const arr = fireflyRef.current.geometry.getAttribute('position').array as Float32Array
      for (let i = 0; i < FIREFLY_COUNT; i++) {
        arr[i * 3] += Math.sin(time.current + i) * 0.008
        arr[i * 3 + 1] += Math.cos(time.current * 1.3 + i) * 0.01
      }
      fireflyRef.current.geometry.getAttribute('position').needsUpdate = true
    }

    if (treeRef.current) {
      for (let i = 0; i < TREE_COUNT; i++) {
        const isl = islands[i % ISLAND_COUNT]
        dummy.position.set(
          isl.x + Math.sin(i * 2.1) * isl.sx * 0.3,
          isl.y + isl.sy + 0.5,
          isl.z + Math.cos(i * 1.7) * isl.sz * 0.3,
        )
        dummy.scale.set(0.15, 0.8 + (i % 4) * 0.3, 0.15)
        dummy.rotation.set(Math.sin(time.current + i) * 0.05, 0, Math.cos(time.current + i) * 0.05)
        dummy.updateMatrix()
        treeRef.current.setMatrixAt(i, dummy.matrix)
      }
      treeRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <fog attach="fog" args={[PALETTES.dream.fog, 8, 48]} />
      <color attach="background" args={[PALETTES.dream.bg]} />

      {/* Floating islands */}
      <instancedMesh ref={islandRef} args={[undefined, undefined, ISLAND_COUNT]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshPhysicalMaterial
          color={PALETTES.dream.cloud}
          roughness={0.85}
          metalness={0.02}
          emissive={PALETTES.dream.accent}
          emissiveIntensity={0.06}
        />
      </instancedMesh>

      <instancedMesh ref={treeRef} args={[undefined, undefined, TREE_COUNT]}>
        <coneGeometry args={[1, 2, 6]} />
        <meshPhysicalMaterial color="#3a5a48" roughness={0.8} emissive="#2a4a38" emissiveIntensity={0.08} />
      </instancedMesh>

      {/* Soft cloud banks */}
      {Array.from({ length: CLOUD_COUNT }).map((_, i) => {
        const rng = createRng(300 + i)
        return (
          <mesh
            key={i}
            position={[(rng() - 0.5) * 30, -1 + rng() * 8, 4 - rng() * 70]}
          >
            <sphereGeometry args={[2 + rng() * 3, 12, 12]} />
            <MeshDistortMaterial
              color={PALETTES.dream.cloud}
              speed={0.25}
              distort={0.25}
              roughness={0.95}
              transparent
              opacity={0.12 + rng() * 0.08}
            />
          </mesh>
        )
      })}

      {/* Moon landmark */}
      <Float speed={0.3} floatIntensity={0.2}>
        <mesh position={[10, 10, -28]}>
          <sphereGeometry args={[3.5, 32, 32]} />
          <meshPhysicalMaterial color={PALETTES.dream.moon} roughness={0.9} emissive={PALETTES.dream.moon} emissiveIntensity={0.15} />
        </mesh>
      </Float>
      <pointLight position={[10, 10, -28]} color={PALETTES.dream.moon} intensity={1.2} distance={45} />

      {/* Water mirror plane under path */}
      <mesh position={[0, -5, -30]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 90]} />
        <meshPhysicalMaterial
          color={PALETTES.dream.water}
          metalness={0.6}
          roughness={0.15}
          transparent
          opacity={0.35}
        />
      </mesh>

      <points ref={fireflyRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fireflies, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.12} color={PALETTES.dream.firefly} transparent opacity={0.85} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <InstancedScatter
        count={CRYSTAL_COUNT}
        seed={74}
        color={PALETTES.dream.primary}
        emissive={PALETTES.dream.firefly}
        emissiveIntensity={0.35}
        geo="octahedron"
        scaleMin={0.1}
        scaleMax={0.55}
        zStart={5}
        zEnd={-68}
        radius={14}
        yMin={-2}
        yMax={8}
        spin={0.3}
        keepClearRadius={2}
      />

      <InstancedScatter
        count={160}
        seed={75}
        color="#5a6a58"
        geo="sphere"
        scaleMin={0.2}
        scaleMax={1.1}
        zStart={4}
        zEnd={-65}
        radius={16}
        yMin={-4}
        yMax={5}
        roughness={0.9}
        keepClearRadius={2.5}
      />

      <Sparkles count={100} scale={[36, 20, 70]} size={1.6} speed={0.18} color={PALETTES.dream.firefly} opacity={0.4} />

      <Text position={[0, 7, -12]} fontSize={0.5} color={PALETTES.dream.primary} anchorX="center" font={FONTS.SPACE_GROTESK} letterSpacing={0.06}>
        DREAMSCAPE
      </Text>

      <InteractivePanel
        position={[-5, 1.5, -14]}
        color={PALETTES.dream.secondary}
        accent={PALETTES.dream.firefly}
        item={{ title: 'Side Project · Lumen', tag: 'Personal', body: 'A generative night-sky toy. 12k plays. Built for the joy of soft light.' }}
      />
      <InteractivePanel
        position={[5, 2, -26]}
        color={PALETTES.dream.secondary}
        accent={PALETTES.dream.accent}
        item={{ title: 'Moodboard Engine', tag: 'Tooling', body: 'Spatial moodboards that export design tokens straight into code.' }}
      />
      <InteractivePanel
        position={[0, 1.8, -40]}
        color={PALETTES.dream.secondary}
        accent={PALETTES.dream.moon}
        item={{ title: 'Sleep Studies', tag: 'R&D', body: 'Experiments in reduced-motion modes and gentle attention design.' }}
      />

      <ExitPortal position={[0, 2, -58]} color={PALETTES.dream.accent} previewColor={PALETTES.hub.accent} />
      <PathLights color={PALETTES.dream.firefly} count={12} intensity={0.7} zEnd={-55} y={3} seed={50} />
      <ambientLight intensity={0.14} color={PALETTES.dream.primary} />
      <pointLight position={[0, 5, -15]} color={PALETTES.dream.firefly} intensity={0.6} distance={25} />
    </group>
  )
}
