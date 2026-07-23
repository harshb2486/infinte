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

const NEURON_COUNT = 220
const CONNECTION_COUNT = 180
const TOKEN_COUNT = 300
const LAYER_COUNT = 8

export default function AICoreWorld() {
  const tick = useWorldEvolutionStore((s) => s.tick)
  const time = useRef(0)
  const neuronRef = useRef<THREE.InstancedMesh>(null)
  const tokenRef = useRef<THREE.Points>(null)
  const brainRef = useRef<THREE.Mesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const neurons = useMemo(() => {
    const rng = createRng(84)
    return Array.from({ length: NEURON_COUNT }, () => ({
      x: (rng() - 0.5) * 20,
      y: (rng() - 0.5) * 12,
      z: 5 - rng() * 68,
      s: 0.12 + rng() * 0.28,
    }))
  }, [])

  const connections = useMemo(() => {
    const rng = createRng(85)
    return Array.from({ length: CONNECTION_COUNT }, () => {
      const a = neurons[Math.floor(rng() * NEURON_COUNT)]
      const b = neurons[Math.floor(rng() * NEURON_COUNT)]
      return {
        a: [a.x, a.y, a.z] as [number, number, number],
        b: [b.x, b.y, b.z] as [number, number, number],
      }
    })
  }, [neurons])

  const tokens = useMemo(() => {
    const rng = createRng(86)
    const p = new Float32Array(TOKEN_COUNT * 3)
    for (let i = 0; i < TOKEN_COUNT; i++) {
      p[i * 3] = (rng() - 0.5) * 16
      p[i * 3 + 1] = (rng() - 0.5) * 10
      p[i * 3 + 2] = 6 - rng() * 70
    }
    return p
  }, [])

  const layers = useMemo(() => {
    return Array.from({ length: LAYER_COUNT }, (_, i) => ({
      z: -6 - i * 7,
      r: 4 + i * 0.3,
    }))
  }, [])

  useFrame((_, delta) => {
    time.current += delta
    tick(delta)

    if (neuronRef.current) {
      neurons.forEach((n, i) => {
        const pulse = Math.sin(time.current * 2.2 + i * 0.4) * 0.25 + 0.85
        dummy.position.set(
          n.x + Math.sin(time.current + i) * 0.08,
          n.y + Math.cos(time.current * 0.8 + i) * 0.06,
          n.z,
        )
        dummy.scale.setScalar(n.s * pulse)
        dummy.updateMatrix()
        neuronRef.current!.setMatrixAt(i, dummy.matrix)
      })
      neuronRef.current.instanceMatrix.needsUpdate = true
    }

    if (tokenRef.current) {
      const arr = tokenRef.current.geometry.getAttribute('position').array as Float32Array
      for (let i = 0; i < TOKEN_COUNT; i++) {
        // Stream toward brain at z=-22 then continue
        arr[i * 3 + 2] += delta * 6
        arr[i * 3] += Math.sin(time.current + i) * 0.01
        if (arr[i * 3 + 2] > 8) {
          arr[i * 3 + 2] = -68
          arr[i * 3] = (Math.random() - 0.5) * 16
          arr[i * 3 + 1] = (Math.random() - 0.5) * 10
        }
      }
      tokenRef.current.geometry.getAttribute('position').needsUpdate = true
    }

    if (brainRef.current) {
      brainRef.current.rotation.y += delta * 0.15
      brainRef.current.rotation.x = Math.sin(time.current * 0.3) * 0.1
    }
  })

  return (
    <group>
      <fog attach="fog" args={[PALETTES.aicore.fog, 8, 42]} />
      <color attach="background" args={[PALETTES.aicore.bg]} />

      {/* Neural lattice layers */}
      {layers.map((layer, i) => (
        <group key={i} position={[0, 0, layer.z]}>
          <mesh>
            <torusGeometry args={[layer.r, 0.04, 8, 48]} />
            <meshBasicMaterial color={PALETTES.aicore.neural} transparent opacity={0.25} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[layer.r * 0.7, 0.03, 8, 40]} />
            <meshBasicMaterial color={PALETTES.aicore.token} transparent opacity={0.2} />
          </mesh>
          {Array.from({ length: 12 }).map((_, j) => {
            const a = (j / 12) * Math.PI * 2
            return (
              <mesh key={j} position={[Math.cos(a) * layer.r, Math.sin(a) * layer.r, 0]}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshBasicMaterial color={PALETTES.aicore.primary} />
              </mesh>
            )
          })}
        </group>
      ))}

      <instancedMesh ref={neuronRef} args={[undefined, undefined, NEURON_COUNT]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshPhysicalMaterial
          color={PALETTES.aicore.primary}
          emissive={PALETTES.aicore.primary}
          emissiveIntensity={0.55}
          roughness={0.25}
          transmission={0.15}
        />
      </instancedMesh>

      {/* Connections */}
      {connections.map((c, i) => {
        const mid: [number, number, number] = [
          (c.a[0] + c.b[0]) / 2,
          (c.a[1] + c.b[1]) / 2,
          (c.a[2] + c.b[2]) / 2,
        ]
        const len = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2])
        if (len > 10 || len < 0.5) return null
        const pulse = Math.sin(time.current * 3 + i) * 0.5 + 0.5
        // orient cylinder - simplified axis-aligned approximation via lookAt-like scale
        return (
          <mesh key={i} position={mid}>
            <cylinderGeometry args={[0.008, 0.008, len, 3]} />
            <meshBasicMaterial
              color={PALETTES.aicore.neural}
              transparent
              opacity={0.15 + pulse * 0.35}
            />
          </mesh>
        )
      })}

      {/* Central brain */}
      <group position={[0, 0, -22]}>
        <mesh ref={brainRef}>
          <icosahedronGeometry args={[3, 3]} />
          <MeshDistortMaterial
            color={PALETTES.aicore.primary}
            emissive={PALETTES.aicore.primary}
            emissiveIntensity={0.35}
            speed={0.55}
            distort={0.28}
            roughness={0.18}
            metalness={0.35}
            transparent
            opacity={0.92}
          />
        </mesh>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 5, Math.sin(a) * 5, 0]} rotation={[0, 0, a + Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 4, 4]} />
              <meshBasicMaterial color={PALETTES.aicore.token} transparent opacity={0.3} />
            </mesh>
          )
        })}
        <Text position={[0, 5.5, 0]} fontSize={0.4} color={PALETTES.aicore.primary} anchorX="center" font={FONTS.SPACE_GROTESK} letterSpacing={0.05}>
          NEURAL CRADLE
        </Text>
        <pointLight color={PALETTES.aicore.primary} intensity={2.5} distance={28} />
      </group>

      <points ref={tokenRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[tokens, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color={PALETTES.aicore.token} transparent opacity={0.8} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <InstancedScatter
        count={180}
        seed={92}
        color={PALETTES.aicore.secondary}
        emissive={PALETTES.aicore.neural}
        emissiveIntensity={0.2}
        geo="octahedron"
        scaleMin={0.08}
        scaleMax={0.45}
        zStart={5}
        zEnd={-68}
        radius={13}
        yMin={-5}
        yMax={6}
        spin={0.4}
        keepClearRadius={2}
      />

      <InstancedScatter
        count={100}
        seed={93}
        color={PALETTES.aicore.warm}
        geo="box"
        scaleMin={0.15}
        scaleMax={0.8}
        zStart={4}
        zEnd={-65}
        radius={12}
        yMin={-4}
        yMax={5}
        metalness={0.5}
        roughness={0.35}
        keepClearRadius={2.5}
      />

      <InteractivePanel
        position={[-5, 1, -10]}
        color={PALETTES.aicore.secondary}
        accent={PALETTES.aicore.primary}
        item={{ title: 'AI Product · Muse', tag: 'LLM UX', body: 'Conversation UI that visualizes attention as a living spatial graph.' }}
      />
      <InteractivePanel
        position={[5, 0.8, -30]}
        color={PALETTES.aicore.secondary}
        accent={PALETTES.aicore.token}
        item={{ title: 'Eval Harness', tag: 'Systems', body: 'Human-in-the-loop evaluation suite for generative creative tools.' }}
      />
      <InteractivePanel
        position={[0, 1.2, -44]}
        color={PALETTES.aicore.secondary}
        accent={PALETTES.aicore.warm}
        item={{ title: 'Ethics Notes', tag: 'Practice', body: 'Guidelines for consent, memory, and refusal in agentic interfaces.' }}
      />

      <ExitPortal position={[0, 1.4, -58]} color={PALETTES.aicore.primary} previewColor={PALETTES.hub.accent} />
      <PathLights color={PALETTES.aicore.primary} count={12} intensity={0.85} zEnd={-55} seed={60} />
      <ambientLight intensity={0.12} color={PALETTES.aicore.primary} />
      <pointLight position={[0, 2, -8]} color={PALETTES.aicore.primary} intensity={1.3} distance={22} />
      <pointLight position={[5, 4, -22]} color={PALETTES.aicore.warm} intensity={0.7} distance={18} />
    </group>
  )
}
