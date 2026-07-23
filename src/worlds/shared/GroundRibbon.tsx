interface GroundRibbonProps {
  color: string
  y?: number
  width?: number
  length?: number
  zCenter?: number
  metalness?: number
  roughness?: number
  emissive?: string
  emissiveIntensity?: number
}

/** Continuous ground strip under the camera path so the traveler never floats in void. */
export function GroundRibbon({
  color,
  y = -4.5,
  width = 28,
  length = 120,
  zCenter = -40,
  metalness = 0.2,
  roughness = 0.85,
  emissive,
  emissiveIntensity = 0,
}: GroundRibbonProps) {
  return (
    <group>
      <mesh position={[0, y, zCenter]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length, 1, 1]} />
        <meshPhysicalMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
          emissive={emissive ?? color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Side rails so edges read as architecture */}
      <mesh position={[-width * 0.48, y + 0.4, zCenter]}>
        <boxGeometry args={[0.35, 0.8, length]} />
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[width * 0.48, y + 0.4, zCenter]}>
        <boxGeometry args={[0.35, 0.8, length]} />
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}
