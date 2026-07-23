import { useRef, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Float } from '@react-three/drei'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { FONTS } from '@/utils/constants'
import { setCursor } from '@/ui/CursorOverlay'

interface ExitPortalProps {
  position?: [number, number, number]
  color?: string
  label?: string
  previewColor?: string
}

/** Return portal placed ahead on the path so the traveler always has a way back. */
export function ExitPortal({
  position = [0, 1.2, -55],
  color = '#c8c8d0',
  label = 'Return to Nexus',
  previewColor,
}: ExitPortalProps) {
  const ringRef = useRef<THREE.Mesh>(null)
  const discRef = useRef<THREE.Mesh>(null)
  const startTransition = useNavigationStore((s) => s.startTransition)
  const navigateTo = useNavigationStore((s) => s.navigateTo)
  const isTransitioning = useNavigationStore((s) => s.isTransitioning)
  const accent = useMemo(() => new THREE.Color(color), [color])
  const preview = useMemo(
    () => new THREE.Color(previewColor ?? color).multiplyScalar(0.35),
    [previewColor, color],
  )

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.35
    if (discRef.current) {
      discRef.current.rotation.z -= delta * 0.15
      const mat = discRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.12 + Math.sin(performance.now() * 0.002) * 0.04
    }
  })

  const onClick = useCallback(() => {
    if (isTransitioning) return
    startTransition('hub')
    setTimeout(() => navigateTo('hub'), 1500)
  }, [isTransitioning, startTransition, navigateTo])

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
      <group
        position={position}
        onClick={onClick}
        onPointerOver={() => setCursor('portal', label)}
        onPointerOut={() => setCursor('default')}
      >
        <mesh ref={ringRef}>
          <torusGeometry args={[2.2, 0.1, 16, 64]} />
          <meshBasicMaterial color={accent} transparent opacity={0.9} />
        </mesh>
        {/* Preview disc — suggests the hub beyond */}
        <mesh ref={discRef} position={[0, 0, -0.05]}>
          <circleGeometry args={[2.0, 48]} />
          <meshBasicMaterial
            color={preview}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh position={[0, 0, -0.2]}>
          <ringGeometry args={[0.6, 1.4, 32]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <Text
          position={[0, 3.0, 0]}
          fontSize={0.28}
          color={accent}
          anchorX="center"
          anchorY="middle"
          font={FONTS.SPACE_GROTESK}
          letterSpacing={0.04}
        >
          {label}
        </Text>
        <pointLight color={accent} intensity={2} distance={14} decay={2} />
      </group>
    </Float>
  )
}
