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
import { GroundRibbon } from '@/worlds/shared/GroundRibbon'
import { createRng } from '@/worlds/shared/seededRandom'

const CHIP_COUNT = 120
const TRACE_COUNT = 200
const DATA_COUNT = 400
const CAP_COUNT = 80
const VIA_COUNT = 150

export default function CPUWorld() {
  const tick = useWorldEvolutionStore((s) => s.tick)
  const time = useRef(0)
  const chipRef = useRef<THREE.InstancedMesh>(null)
  const dataRef = useRef<THREE.Points>(null)
  const viaRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const chips = useMemo(() => {
    const rng = createRng(25)
    return Array.from({ length: CHIP_COUNT }, () => ({
      x: (rng() - 0.5) * 20,
      y: -3.5 + rng() * 0.3,
      z: 6 - rng() * 70,
      sx: 0.8 + rng() * 2.2,
      sz: 0.8 + rng() * 2.2,
      sy: 0.12 + rng() * 0.2,
    }))
  }, [])

  const traces = useMemo(() => {
    const rng = createRng(36)
    return Array.from({ length: TRACE_COUNT }, (_, i) => {
      const z = 5 - (i / TRACE_COUNT) * 72
      const x0 = (rng() - 0.5) * 16
      const x1 = x0 + (rng() - 0.5) * 8
      return { x0, x1, z, y: -3.6 + rng() * 0.15, copper: i % 2 === 0 }
    })
  }, [])

  const dataPos = useMemo(() => {
    const rng = createRng(48)
    const p = new Float32Array(DATA_COUNT * 3)
    for (let i = 0; i < DATA_COUNT; i++) {
      p[i * 3] = (rng() - 0.5) * 18
      p[i * 3 + 1] = -2 + rng() * 6
      p[i * 3 + 2] = 5 - rng() * 70
    }
    return p
  }, [])

  const skills = [
    { title: 'TypeScript', tag: 'Language', body: 'Strict systems, expressive types, production-grade apps.', pos: [-6, 0.5, -12] as [number, number, number] },
    { title: 'React / R3F', tag: 'Frontend', body: 'Component architecture for both DOM and WebGL worlds.', pos: [5, 0.8, -20] as [number, number, number] },
    { title: 'WebGL / Three', tag: 'Graphics', body: 'Shaders, instancing, and performance budgets under 16ms.', pos: [-4, 0.3, -30] as [number, number, number] },
    { title: 'Node / Edge', tag: 'Backend', body: 'APIs, realtime sockets, and edge-deployed workers.', pos: [6, 0.6, -40] as [number, number, number] },
    { title: 'Design Systems', tag: 'Craft', body: 'Tokens, accessibility, and motion language at scale.', pos: [0, 1, -50] as [number, number, number] },
  ]

  useFrame((_, delta) => {
    time.current += delta
    tick(delta)

    if (chipRef.current) {
      chips.forEach((c, i) => {
        dummy.position.set(c.x, c.y + Math.sin(time.current + i) * 0.02, c.z)
        dummy.scale.set(c.sx, c.sy, c.sz)
        dummy.updateMatrix()
        chipRef.current!.setMatrixAt(i, dummy.matrix)
      })
      chipRef.current.instanceMatrix.needsUpdate = true
    }

    if (dataRef.current) {
      const arr = dataRef.current.geometry.getAttribute('position').array as Float32Array
      for (let i = 0; i < DATA_COUNT; i++) {
        arr[i * 3 + 2] += delta * 10
        if (arr[i * 3 + 2] > 10) {
          arr[i * 3 + 2] = -70
          arr[i * 3] = (Math.random() - 0.5) * 18
        }
      }
      dataRef.current.geometry.getAttribute('position').needsUpdate = true
    }

    if (viaRef.current) {
      for (let i = 0; i < VIA_COUNT; i++) {
        const x = ((i * 13) % 22) - 11
        const z = 5 - ((i * 7) % 70)
        dummy.position.set(x, -3.2, z)
        dummy.scale.set(0.12, 0.5 + Math.sin(time.current * 3 + i) * 0.1, 0.12)
        dummy.updateMatrix()
        viaRef.current.setMatrixAt(i, dummy.matrix)
      }
      viaRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <fog attach="fog" args={[PALETTES.cpu.fog, 6, 40]} />
      <color attach="background" args={[PALETTES.cpu.bg]} />

      <GroundRibbon
        color={PALETTES.cpu.board}
        y={-4}
        width={26}
        length={95}
        zCenter={-32}
        metalness={0.15}
        roughness={0.55}
        emissive={PALETTES.cpu.circuit}
        emissiveIntensity={0.04}
      />

      {/* Grid etch lines */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={`gx${i}`} position={[0, -3.95, 5 - i * 2.8]}>
          <boxGeometry args={[24, 0.01, 0.03]} />
          <meshBasicMaterial color={PALETTES.cpu.copper} transparent opacity={0.25} />
        </mesh>
      ))}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={`gz${i}`} position={[(i - 8) * 1.5, -3.95, -32]}>
          <boxGeometry args={[0.03, 0.01, 90]} />
          <meshBasicMaterial color={PALETTES.cpu.copper} transparent opacity={0.2} />
        </mesh>
      ))}

      {/* Copper traces */}
      {traces.map((t, i) => {
        const midX = (t.x0 + t.x1) / 2
        const len = Math.abs(t.x1 - t.x0) + 0.2
        const pulse = Math.sin(time.current * 4 + i) * 0.5 + 0.5
        return (
          <mesh key={i} position={[midX, t.y, t.z]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.04, len, 0.04]} />
            <meshPhysicalMaterial
              color={t.copper ? PALETTES.cpu.copper : PALETTES.cpu.data}
              emissive={t.copper ? PALETTES.cpu.copper : PALETTES.cpu.data}
              emissiveIntensity={0.15 + pulse * 0.35}
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
        )
      })}

      <instancedMesh ref={chipRef} args={[undefined, undefined, CHIP_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial color={PALETTES.cpu.silicon} metalness={0.65} roughness={0.35} clearcoat={0.3} />
      </instancedMesh>

      {/* Capacitors */}
      {Array.from({ length: CAP_COUNT }).map((_, i) => {
        const rng = createRng(100 + i)
        return (
          <group key={i} position={[(rng() - 0.5) * 18, -3.5, 4 - rng() * 68]}>
            <mesh>
              <cylinderGeometry args={[0.15, 0.15, 0.55, 10]} />
              <meshPhysicalMaterial color="#2a2824" roughness={0.3} metalness={0.35} />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.08, 10]} />
              <meshPhysicalMaterial color={PALETTES.cpu.copper} metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        )
      })}

      <instancedMesh ref={viaRef} args={[undefined, undefined, VIA_COUNT]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshPhysicalMaterial color={PALETTES.cpu.copper} metalness={0.9} roughness={0.2} emissive={PALETTES.cpu.copper} emissiveIntensity={0.2} />
      </instancedMesh>

      <points ref={dataRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dataPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.07} color={PALETTES.cpu.data} transparent opacity={0.75} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <InstancedScatter
        count={160}
        seed={90}
        color={PALETTES.cpu.silicon}
        geo="box"
        scaleMin={0.1}
        scaleMax={0.6}
        zStart={5}
        zEnd={-68}
        radius={12}
        yMin={-2}
        yMax={5}
        metalness={0.7}
        roughness={0.3}
        keepClearRadius={2}
      />

      {/* Central die landmark */}
      <group position={[0, -2, -25]}>
        <mesh>
          <boxGeometry args={[6, 0.4, 6]} />
          <meshPhysicalMaterial color={PALETTES.cpu.silicon} metalness={0.7} roughness={0.3} emissive={PALETTES.cpu.circuit} emissiveIntensity={0.15} />
        </mesh>
        <Text position={[0, 0.5, 0]} fontSize={0.35} color={PALETTES.cpu.data} anchorX="center" font={FONTS.SPACE_GROTESK} rotation={[-Math.PI / 2, 0, 0]}>
          SILICON CORE
        </Text>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 3.5, 0.1, Math.sin(a) * 3.5]}>
              <boxGeometry args={[0.8, 0.08, 0.12]} />
              <meshPhysicalMaterial color={PALETTES.cpu.copper} metalness={0.9} roughness={0.2} />
            </mesh>
          )
        })}
      </group>

      {skills.map((s, i) => (
        <InteractivePanel key={i} position={s.pos} color={PALETTES.cpu.board} accent={PALETTES.cpu.copper} item={s} />
      ))}

      <ExitPortal position={[0, 1.2, -60]} color={PALETTES.cpu.accent} previewColor={PALETTES.hub.accent} />
      <PathLights color={PALETTES.cpu.copper} count={14} intensity={0.85} zEnd={-58} y={1.5} seed={21} />
      <ambientLight intensity={0.14} color={PALETTES.cpu.primary} />
      <directionalLight position={[8, 16, 4]} intensity={0.55} color={PALETTES.cpu.accent} />
      <pointLight position={[0, 3, -25]} color={PALETTES.cpu.copper} intensity={1.8} distance={28} />
    </group>
  )
}
