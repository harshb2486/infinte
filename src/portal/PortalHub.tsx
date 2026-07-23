import { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Float } from '@react-three/drei'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { getVisiblePortals } from '@/utils/worldGraph'
import { getCssVar } from '@/utils/colorPalettes'
import { FONTS, type WorldId } from '@/utils/constants'
import { setCursor } from '@/ui/CursorOverlay'

import underwaterFrag from './shaders/underwater.glsl?raw'
import spaceFrag from './shaders/space.glsl?raw'
import cyberFrag from './shaders/cyber.glsl?raw'
import cpuFrag from './shaders/cpu.glsl?raw'
import quantumFrag from './shaders/quantum.glsl?raw'
import libraryFrag from './shaders/library.glsl?raw'
import dreamFrag from './shaders/dream.glsl?raw'
import aicoreFrag from './shaders/aicore.glsl?raw'
import edgeFrag from './shaders/edge.glsl?raw'

const SHADER_MAP: Record<WorldId, string> = {
  intro: '',
  hub: '',
  underwater: underwaterFrag,
  space: spaceFrag,
  cybercity: cyberFrag,
  cpu: cpuFrag,
  quantum: quantumFrag,
  library: libraryFrag,
  dream: dreamFrag,
  aicore: aicoreFrag,
  edge: edgeFrag,
}

const VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

interface PortalMeshProps {
  worldId: WorldId
  position: [number, number, number]
  label: string
  visited: boolean
  description: string
}

function PortalMesh({ worldId, position, label, visited, description }: PortalMeshProps) {
  const glowRef = useRef<THREE.PointLight>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const previewRef = useRef<THREE.Mesh>(null)
  const time = useRef(Math.random() * 100)
  const navigateTo = useNavigationStore((s) => s.navigateTo)
  const startTransition = useNavigationStore((s) => s.startTransition)
  const isTransitioning = useNavigationStore((s) => s.isTransitioning)

  const accentColor = useMemo(() => new THREE.Color(getCssVar(worldId)), [worldId])
  const shaderSource = SHADER_MAP[worldId] || SHADER_MAP.underwater

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: accentColor },
        uColor2: { value: accentColor.clone().multiplyScalar(0.4) },
        uIntensity: { value: visited ? 1.0 : 0.75 },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: shaderSource,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [accentColor, shaderSource, visited])

  useFrame((_, delta) => {
    time.current += delta
    shaderMaterial.uniforms.uTime.value = time.current

    if (ringRef.current) ringRef.current.rotation.z += delta * 0.25
    if (previewRef.current) {
      previewRef.current.rotation.z -= delta * 0.12
      const mat = previewRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.14 + Math.sin(time.current * 1.8) * 0.05
    }
    if (glowRef.current) {
      glowRef.current.intensity = 1.8 + Math.sin(time.current * 1.5) * 0.4
    }
  })

  const handleClick = useCallback(() => {
    if (isTransitioning || worldId === 'hub') return
    startTransition(worldId)
    setTimeout(() => navigateTo(worldId), 1500)
  }, [worldId, navigateTo, startTransition, isTransitioning])

  return (
    <group position={position}>
      {/* Pedestal so portals read as landmarks */}
      <mesh position={[0, -2.1, 0]}>
        <cylinderGeometry args={[1.4, 1.8, 0.35, 24]} />
        <meshPhysicalMaterial color="#1a1a24" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, -1.85, 0]}>
        <torusGeometry args={[1.5, 0.06, 8, 32]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.45} />
      </mesh>

      <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.35}>
        <mesh
          onClick={handleClick}
          onPointerOver={() => {
            setCursor('portal', label)
            document.body.style.cursor = 'none'
          }}
          onPointerOut={() => {
            setCursor('default')
            document.body.style.cursor = 'none'
          }}
        >
          <torusGeometry args={[2.4, 0.14, 24, 100]} />
          <primitive object={shaderMaterial} attach="material" />
        </mesh>

        {/* Animated world preview inside the portal */}
        <mesh ref={previewRef} position={[0, 0, -0.04]}>
          <circleGeometry args={[2.15, 64]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh ref={ringRef} position={[0, 0, -0.08]}>
          <ringGeometry args={[0.5, 1.6, 48]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Depth cue — darker core suggests a space beyond */}
        <mesh position={[0, 0, -0.12]}>
          <circleGeometry args={[0.55, 32]} />
          <meshBasicMaterial color="#050508" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>

        <pointLight ref={glowRef} color={accentColor} intensity={1.8} distance={14} decay={2} />

        <Text
          position={[0, 3.1, 0]}
          fontSize={0.28}
          color={accentColor}
          anchorX="center"
          anchorY="middle"
          font={FONTS.SPACE_GROTESK}
          letterSpacing={0.04}
        >
          {label}
        </Text>
        <Text
          position={[0, 2.65, 0]}
          fontSize={0.12}
          color="rgba(220,220,230,0.55)"
          anchorX="center"
          anchorY="middle"
          font={FONTS.INTER}
          maxWidth={4}
          textAlign="center"
        >
          {description}
        </Text>

        {visited && (
          <mesh position={[0, -2.85, 0]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>
        )}
      </Float>
    </group>
  )
}

export function PortalHub() {
  const visitedWorlds = useNavigationStore((s) => s.visitedWorlds)
  const portals = useMemo(() => {
    return getVisiblePortals(visitedWorlds as WorldId[])
  }, [visitedWorlds])

  return (
    <group>
      {portals.map((portal) => (
        <PortalMesh
          key={portal.id}
          worldId={portal.id}
          position={portal.portalPosition}
          label={portal.label}
          visited={visitedWorlds.includes(portal.id)}
          description={portal.description}
        />
      ))}
    </group>
  )
}
