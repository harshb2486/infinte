import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { usePortalAIStore } from '@/stores/usePortalAIStore'
import { FONTS } from '@/utils/constants'
import { InstancedScatter } from '@/worlds/shared/InstancedScatter'
import { createRng } from '@/worlds/shared/seededRandom'

const PARTICLE_COUNT = 3500

export default function IntroSequence() {
  const { camera } = useThree()
  const navigateTo = useNavigationStore((s) => s.navigateTo)
  const startTransition = useNavigationStore((s) => s.startTransition)
  const interject = usePortalAIStore((s) => s.interject)
  const [phase, setPhase] = useState<'dark' | 'particles' | 'stars' | 'portal' | 'enter'>('dark')
  const timer = useRef(0)
  const pointsRef = useRef<THREE.Points>(null)
  const portalRef = useRef<THREE.Mesh>(null)
  const tunnelRef = useRef<THREE.Group>(null)
  const positions = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3))
  const velocities = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3))
  const sizes = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT))

  const rings = useMemo(() => {
    const rng = createRng(3)
    return Array.from({ length: 18 }, (_, i) => ({
      z: -4 - i * 3.5,
      r: 2.5 + rng() * 1.5 + i * 0.08,
      speed: 0.2 + rng() * 0.3,
    }))
  }, [])

  useEffect(() => {
    const rng = createRng(99)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      positions.current[i3] = (rng() - 0.5) * 80
      positions.current[i3 + 1] = (rng() - 0.5) * 80
      positions.current[i3 + 2] = (rng() - 0.5) * 100 - 40
      velocities.current[i3] = (rng() - 0.5) * 0.012
      velocities.current[i3 + 1] = (rng() - 0.5) * 0.012
      velocities.current[i3 + 2] = (rng() - 0.5) * 0.012
      sizes.current[i] = rng() * 2 + 0.5
    }
  }, [])

  useFrame((_, delta) => {
    timer.current += delta

    if (timer.current > 0.8 && phase === 'dark') setPhase('particles')
    else if (timer.current > 3.5 && phase === 'particles') setPhase('stars')
    else if (timer.current > 7 && phase === 'stars') {
      setPhase('portal')
      interject('Welcome, traveler. I am the Portal. I exist between realities.', 'welcoming')
    } else if (timer.current > 11 && phase === 'portal') setPhase('enter')
    else if (timer.current > 14 && phase === 'enter') {
      startTransition('hub')
      setTimeout(() => navigateTo('hub'), 1500)
    }

    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.getAttribute('position')
      const sizeAttr = pointsRef.current.geometry.getAttribute('size')
      const posArray = posAttr.array as Float32Array
      const sizeArray = sizeAttr.array as Float32Array
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3
        if (phase === 'stars' || phase === 'portal' || phase === 'enter') {
          posArray[i3] += (0 - posArray[i3]) * 0.003
          posArray[i3 + 1] += (0 - posArray[i3 + 1]) * 0.003
          posArray[i3 + 2] += (-8 - posArray[i3 + 2]) * 0.003
        } else {
          posArray[i3] += velocities.current[i3]
          posArray[i3 + 1] += velocities.current[i3 + 1]
          posArray[i3 + 2] += velocities.current[i3 + 2]
        }
        const targetSize =
          phase === 'dark' ? 0 : phase === 'particles' ? sizes.current[i] * 0.35 : sizes.current[i]
        sizeArray[i] += (targetSize - sizeArray[i]) * 0.03
      }
      posAttr.needsUpdate = true
      sizeAttr.needsUpdate = true
    }

    if (portalRef.current && (phase === 'portal' || phase === 'enter')) {
      portalRef.current.rotation.z += delta * 0.55
      const scale = Math.min((timer.current - 7) * 0.55, 1.15)
      portalRef.current.scale.setScalar(scale)
    }

    if (tunnelRef.current) {
      tunnelRef.current.children.forEach((child, i) => {
        child.rotation.z += delta * (0.15 + (i % 3) * 0.05)
      })
    }

    if (phase === 'enter') camera.position.z -= delta * 2.2
  })

  const showTunnel = phase !== 'dark'

  return (
    <group>
      <color attach="background" args={['#030308']} />
      <fog attach="fog" args={['#030308', 8, 60]} />

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions.current, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes.current, 1]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#e8e8f0"
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {showTunnel && (
        <group ref={tunnelRef}>
          {rings.map((ring, i) => (
            <mesh key={i} position={[0, 0, ring.z]}>
              <torusGeometry args={[ring.r, 0.04, 8, 48]} />
              <meshBasicMaterial
                color={i % 2 === 0 ? '#818cf8' : '#c8b8d8'}
                transparent
                opacity={0.15 + (i % 4) * 0.04}
              />
            </mesh>
          ))}
        </group>
      )}

      {showTunnel && (
        <InstancedScatter
          count={280}
          seed={5}
          color="#4a4a70"
          emissive="#818cf8"
          emissiveIntensity={0.2}
          geo="box"
          scaleMin={0.1}
          scaleMax={0.7}
          zStart={2}
          zEnd={-55}
          radius={10}
          yMin={-5}
          yMax={5}
          spin={0.4}
          keepClearRadius={2.5}
        />
      )}

      {(phase === 'portal' || phase === 'enter' || phase === 'stars') && (
        <group position={[0, 0, -12]}>
          <mesh ref={portalRef}>
            <torusGeometry args={[3.2, 0.14, 20, 100]} />
            <meshBasicMaterial color="#818cf8" transparent opacity={0.9} />
          </mesh>
          <mesh>
            <circleGeometry args={[3.0, 64]} />
            <meshBasicMaterial
              color="#1a1040"
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <ringGeometry args={[1.2, 2.4, 48]} />
            <meshBasicMaterial color="#c8b8d8" transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color="#818cf8" intensity={3} distance={20} />
          <Text
            position={[0, 4.2, 0]}
            fontSize={0.35}
            color="#e8e8f0"
            anchorX="center"
            font={FONTS.SPACE_GROTESK}
            letterSpacing={0.1}
          >
            INFINITE PORTAL
          </Text>
        </group>
      )}

      <ambientLight intensity={0.15} />
      <pointLight position={[0, 2, 0]} intensity={0.8} color="#a8b0ff" distance={30} />
    </group>
  )
}
