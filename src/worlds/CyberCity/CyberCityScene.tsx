import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshReflectorMaterial, Text } from '@react-three/drei'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'
import { PALETTES } from '@/utils/colorPalettes'
import { FONTS } from '@/utils/constants'
import { InstancedScatter } from '@/worlds/shared/InstancedScatter'
import { InteractivePanel } from '@/worlds/shared/InteractivePanel'
import { ExitPortal } from '@/worlds/shared/ExitPortal'
import { PathLights } from '@/worlds/shared/PathLights'
import { createRng } from '@/worlds/shared/seededRandom'

const BUILDING_COUNT = 160
const RAIN_COUNT = 8000
const CAR_COUNT = 36
const DRONE_COUNT = 24
const SIGN_COUNT = 40

export default function CyberCityScene() {
  const tick = useWorldEvolutionStore((s) => s.tick)
  const time = useRef(0)
  const buildingRef = useRef<THREE.InstancedMesh>(null)
  const rainRef = useRef<THREE.Points>(null)
  const carRef = useRef<THREE.InstancedMesh>(null)
  const droneRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const buildings = useMemo(() => {
    const rng = createRng(77)
    const data: { x: number; z: number; h: number; w: number; d: number }[] = []
    for (let i = 0; i < BUILDING_COUNT; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const lane = 6 + rng() * 14
      data.push({
        x: side * lane + (rng() - 0.5) * 3,
        z: 8 - (i * 0.55) - rng() * 2,
        h: 6 + rng() * 28,
        w: 1.2 + rng() * 2.5,
        d: 1.2 + rng() * 2.5,
      })
    }
    return data
  }, [])

  const rain = useMemo(() => {
    const rng = createRng(2)
    const pos = new Float32Array(RAIN_COUNT * 3)
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3] = (rng() - 0.5) * 50
      pos[i * 3 + 1] = rng() * 40
      pos[i * 3 + 2] = 10 - rng() * 90
    }
    return pos
  }, [])

  const signs = useMemo(() => {
    const labels = ['NOVA', 'AXIOM', 'SYNAPSE', 'QUANTA', 'NEXUS', 'PULSE', 'GRID', 'VOID']
    const rng = createRng(19)
    return Array.from({ length: SIGN_COUNT }, (_, i) => ({
      x: (i % 2 === 0 ? -1 : 1) * (5 + rng() * 4),
      y: 4 + rng() * 10,
      z: 4 - i * 2.1,
      label: labels[i % labels.length],
      warm: rng() > 0.5,
    }))
  }, [])

  useFrame((_, delta) => {
    time.current += delta
    tick(delta)

    if (buildingRef.current) {
      buildings.forEach((b, i) => {
        dummy.position.set(b.x, b.h * 0.5 - 4.5, b.z)
        dummy.scale.set(b.w, b.h, b.d)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        buildingRef.current!.setMatrixAt(i, dummy.matrix)
      })
      buildingRef.current.instanceMatrix.needsUpdate = true
    }

    if (rainRef.current) {
      const arr = rainRef.current.geometry.getAttribute('position').array as Float32Array
      for (let i = 0; i < RAIN_COUNT; i++) {
        arr[i * 3 + 1] -= delta * 32
        if (arr[i * 3 + 1] < -5) {
          arr[i * 3 + 1] = 35
          arr[i * 3] = (Math.random() - 0.5) * 50
        }
      }
      rainRef.current.geometry.getAttribute('position').needsUpdate = true
    }

    if (carRef.current) {
      for (let i = 0; i < CAR_COUNT; i++) {
        const lane = i % 2 === 0 ? -3.5 : 3.5
        const z = ((time.current * (6 + (i % 5)) * (i % 2 ? 1 : -1) + i * 8) % 90) - 10
        dummy.position.set(lane + Math.sin(time.current + i) * 0.2, -2.8 + (i % 4) * 3.2, z)
        dummy.scale.set(1.6, 0.3, 0.65)
        dummy.rotation.set(0, i % 2 ? 0 : Math.PI, 0)
        dummy.updateMatrix()
        carRef.current.setMatrixAt(i, dummy.matrix)
      }
      carRef.current.instanceMatrix.needsUpdate = true
    }

    if (droneRef.current) {
      for (let i = 0; i < DRONE_COUNT; i++) {
        dummy.position.set(
          Math.sin(time.current * 0.35 + i) * 12,
          6 + Math.sin(time.current + i) * 2.5,
          Math.cos(time.current * 0.25 + i * 0.8) * 10 - 20 - (i % 6) * 5,
        )
        dummy.rotation.y = time.current + i
        dummy.scale.setScalar(0.28)
        dummy.updateMatrix()
        droneRef.current.setMatrixAt(i, dummy.matrix)
      }
      droneRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <fog attach="fog" args={[PALETTES.cybercity.fog, 8, 48]} />
      <color attach="background" args={[PALETTES.cybercity.bg]} />

      {/* Wet reflective street */}
      <mesh position={[0, -5, -35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 100]} />
        <MeshReflectorMaterial
          blur={[280, 80]}
          resolution={512}
          mixBlur={0.85}
          mixStrength={0.55}
          roughness={0.3}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color={PALETTES.cybercity.wet}
          metalness={0.55}
        />
      </mesh>

      {/* Road median strips */}
      {[-1.2, 1.2].map((x, i) => (
        <mesh key={i} position={[x, -4.85, -35]}>
          <boxGeometry args={[0.15, 0.08, 100]} />
          <meshBasicMaterial color={PALETTES.cybercity.warm} transparent opacity={0.5} />
        </mesh>
      ))}

      <instancedMesh ref={buildingRef} args={[undefined, undefined, BUILDING_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial color={PALETTES.cybercity.secondary} roughness={0.3} metalness={0.7} clearcoat={0.4} />
      </instancedMesh>

      {/* Window lights on nearby buildings */}
      {buildings.slice(0, 50).map((b, i) =>
        Array.from({ length: 8 }).map((_, j) => {
          if ((i + j) % 3 === 0) return null
          const y = -4.5 + (j / 8) * b.h + 0.5
          return (
            <mesh key={`${i}-${j}`} position={[b.x + (b.x > 0 ? -b.w * 0.51 : b.w * 0.51), y, b.z]}>
              <planeGeometry args={[b.w * 0.55, 0.18]} />
              <meshBasicMaterial
                color={j % 2 ? PALETTES.cybercity.warm : PALETTES.cybercity.accent}
                transparent
                opacity={0.45}
              />
            </mesh>
          )
        }),
      )}

      {/* Neon signs */}
      {signs.map((s, i) => (
        <group key={i} position={[s.x, s.y, s.z]} rotation={[0, s.x > 0 ? -0.4 : 0.4, 0]}>
          <mesh>
            <planeGeometry args={[2.4, 1.1]} />
            <meshBasicMaterial
              color={s.warm ? PALETTES.cybercity.magenta : PALETTES.cybercity.accent}
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text position={[0, 0, 0.05]} fontSize={0.28} color={PALETTES.cybercity.primary} anchorX="center" font={FONTS.SPACE_GROTESK}>
            {s.label}
          </Text>
        </group>
      ))}

      <points ref={rainRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rain, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} color={PALETTES.cybercity.rain} transparent opacity={0.4} sizeAttenuation depthWrite={false} />
      </points>

      <instancedMesh ref={carRef} args={[undefined, undefined, CAR_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial color="#222230" metalness={0.85} roughness={0.2} emissive={PALETTES.cybercity.accent} emissiveIntensity={0.08} />
      </instancedMesh>

      <instancedMesh ref={droneRef} args={[undefined, undefined, DRONE_COUNT]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshPhysicalMaterial color="#2a2a35" emissive={PALETTES.cybercity.accent} emissiveIntensity={0.5} metalness={0.7} roughness={0.3} />
      </instancedMesh>

      <InstancedScatter
        count={180}
        seed={33}
        color="#1a1a28"
        geo="box"
        scaleMin={0.2}
        scaleMax={1.5}
        zStart={6}
        zEnd={-75}
        radius={18}
        yMin={-4}
        yMax={12}
        metalness={0.6}
        roughness={0.4}
        keepClearRadius={3}
      />

      {/* Elevated tracks */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 8 + i * 2.5, -25 - i * 10]} rotation={[0, 0.05 * (i - 1), 0]}>
          <boxGeometry args={[80, 0.3, 1.6]} />
          <meshPhysicalMaterial color="#151520" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}

      <InteractivePanel
        position={[-4, 0, -14]}
        color="#12121c"
        accent={PALETTES.cybercity.accent}
        item={{ title: 'Case Study · Transit OS', tag: 'Product Design', body: 'End-to-end redesign of a city mobility dashboard used by 40 agencies.' }}
      />
      <InteractivePanel
        position={[4.5, 0.5, -28]}
        color="#12121c"
        accent={PALETTES.cybercity.magenta}
        item={{ title: 'Neon Commerce', tag: 'E-commerce 3D', body: 'WebGL storefront that cut bounce rate 28% with spatial product browse.' }}
      />
      <InteractivePanel
        position={[0, 1, -44]}
        color="#12121c"
        accent={PALETTES.cybercity.warm}
        item={{ title: 'Night Market Live', tag: 'Realtime', body: 'Multi-user bazaar with live vendor avatars and spatial audio stalls.' }}
      />

      <ExitPortal position={[0, 1.5, -62]} color={PALETTES.cybercity.accent} previewColor={PALETTES.hub.accent} />
      <PathLights color={PALETTES.cybercity.warm} count={16} intensity={1} zEnd={-60} y={2} radius={5} seed={14} />
      <ambientLight intensity={0.1} color={PALETTES.cybercity.primary} />
      <spotLight position={[0, 28, -10]} angle={0.7} penumbra={0.9} intensity={5} color={PALETTES.cybercity.primary} distance={90} decay={2} />
      <pointLight position={[0, 2, -20]} color={PALETTES.cybercity.accent} intensity={1.5} distance={30} />
    </group>
  )
}
