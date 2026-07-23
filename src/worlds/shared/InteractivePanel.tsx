import { useState, useCallback } from 'react'
import { Text, Float } from '@react-three/drei'
import { FONTS } from '@/utils/constants'
import { setCursor } from '@/ui/CursorOverlay'

export interface PortfolioItem {
  title: string
  body: string
  tag?: string
}

interface InteractivePanelProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  color: string
  accent: string
  item: PortfolioItem
  width?: number
  height?: number
}

export function InteractivePanel({
  position,
  rotation = [0, 0, 0],
  color,
  accent,
  item,
  width = 3.2,
  height = 2.0,
}: InteractivePanelProps) {
  const [open, setOpen] = useState(false)

  const onClick = useCallback(() => {
    setOpen((v) => !v)
  }, [])

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.15}>
      <group
        position={position}
        rotation={rotation}
        onClick={onClick}
        onPointerOver={() => setCursor('pointer', item.title)}
        onPointerOut={() => setCursor('default')}
      >
        <mesh>
          <boxGeometry args={[width, height, 0.12]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.45}
            roughness={0.35}
            emissive={accent}
            emissiveIntensity={open ? 0.35 : 0.12}
            clearcoat={0.4}
          />
        </mesh>
        <mesh position={[0, 0, 0.07]}>
          <planeGeometry args={[width * 0.92, height * 0.88]} />
          <meshBasicMaterial color={accent} transparent opacity={open ? 0.18 : 0.08} />
        </mesh>
        <Text
          position={[0, open ? 0.45 : 0.1, 0.1]}
          fontSize={0.18}
          color="#f0f0ec"
          anchorX="center"
          anchorY="middle"
          font={FONTS.SPACE_GROTESK}
          maxWidth={width * 0.85}
          textAlign="center"
        >
          {item.title}
        </Text>
        {item.tag && (
          <Text
            position={[0, open ? 0.15 : -0.25, 0.1]}
            fontSize={0.1}
            color={accent}
            anchorX="center"
            anchorY="middle"
            font={FONTS.INTER}
          >
            {item.tag}
          </Text>
        )}
        {open && (
          <Text
            position={[0, -0.35, 0.1]}
            fontSize={0.1}
            color="rgba(240,240,236,0.85)"
            anchorX="center"
            anchorY="middle"
            font={FONTS.INTER}
            maxWidth={width * 0.85}
            textAlign="center"
            lineHeight={1.35}
          >
            {item.body}
          </Text>
        )}
        <pointLight color={accent} intensity={open ? 1.2 : 0.35} distance={8} decay={2} position={[0, 0, 1]} />
      </group>
    </Float>
  )
}
