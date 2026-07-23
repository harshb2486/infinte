import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Float, Sparkles } from '@react-three/drei'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'
import { PALETTES } from '@/utils/colorPalettes'
import { FONTS } from '@/utils/constants'
import { InstancedScatter } from '@/worlds/shared/InstancedScatter'
import { InteractivePanel } from '@/worlds/shared/InteractivePanel'
import { ExitPortal } from '@/worlds/shared/ExitPortal'
import { PathLights } from '@/worlds/shared/PathLights'
import { GroundRibbon } from '@/worlds/shared/GroundRibbon'
import { createRng } from '@/worlds/shared/seededRandom'

const BOOK_COUNT = 280
const SHELF_ROWS = 10
const CANDLE_COUNT = 28
const SCROLL_COUNT = 40

export default function LibraryWorld() {
  const tick = useWorldEvolutionStore((s) => s.tick)
  const time = useRef(0)
  const bookRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const books = useMemo(() => {
    const rng = createRng(52)
    const colors = [PALETTES.library.leather, '#3a2010', '#1a3020', '#2a2035', '#4a2818', '#1a1a28']
    return Array.from({ length: BOOK_COUNT }, (_, i) => {
      const side = i % 2 === 0 ? -1 : 1
      return {
        x: side * (5.5 + rng() * 2) + (rng() - 0.5) * 0.8,
        y: -2 + rng() * 9,
        z: 5 - rng() * 70,
        sx: 0.35 + rng() * 0.35,
        sy: 0.06 + rng() * 0.05,
        sz: 0.55 + rng() * 0.35,
        ry: rng() * 0.2,
        color: colors[i % colors.length],
      }
    })
  }, [])

  const shelves = useMemo(() => {
    return Array.from({ length: SHELF_ROWS }, (_, i) => ({
      z: 3 - i * 7,
      side: i % 2 === 0 ? -1 : 1,
    }))
  }, [])

  useFrame((_, delta) => {
    time.current += delta
    tick(delta)

    if (bookRef.current) {
      books.forEach((b, i) => {
        const float = Math.sin(time.current * 0.35 + i * 0.2) * 0.08
        dummy.position.set(b.x, b.y + float, b.z)
        dummy.rotation.set(0.05, b.ry + time.current * 0.02, 0.02)
        dummy.scale.set(b.sx, b.sy, b.sz)
        dummy.updateMatrix()
        bookRef.current!.setMatrixAt(i, dummy.matrix)
      })
      bookRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <fog attach="fog" args={[PALETTES.library.fog, 5, 32]} />
      <color attach="background" args={[PALETTES.library.bg]} />

      <GroundRibbon
        color={PALETTES.library.wood}
        y={-4}
        width={22}
        length={90}
        zCenter={-30}
        roughness={0.9}
        metalness={0.05}
      />

      {/* Massive bookshelf walls */}
      {shelves.map((s, i) => (
        <group key={i} position={[s.side * 7.5, 1, s.z]}>
          <mesh>
            <boxGeometry args={[2.5, 12, 5]} />
            <meshPhysicalMaterial color={PALETTES.library.wood} roughness={0.88} metalness={0.02} />
          </mesh>
          {Array.from({ length: 8 }).map((_, j) => (
            <mesh key={j} position={[s.side * -0.9, j * 1.35 - 4.5, 0]}>
              <boxGeometry args={[0.8, 0.1, 4.6]} />
              <meshPhysicalMaterial color={PALETTES.library.wood} roughness={0.85} />
            </mesh>
          ))}
          {/* Shelf books as packed boxes */}
          {Array.from({ length: 40 }).map((_, j) => {
            const row = j % 8
            const col = Math.floor(j / 8)
            return (
              <mesh
                key={j}
                position={[s.side * -1.1, row * 1.35 - 4.1, -1.8 + col * 0.9]}
              >
                <boxGeometry args={[0.25, 0.7 + (j % 3) * 0.1, 0.45]} />
                <meshPhysicalMaterial
                  color={j % 3 === 0 ? PALETTES.library.leather : j % 3 === 1 ? '#2a1810' : '#1a2820'}
                  roughness={0.8}
                />
              </mesh>
            )
          })}
        </group>
      ))}

      {/* Floating books mid-air */}
      <instancedMesh ref={bookRef} args={[undefined, undefined, BOOK_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial color={PALETTES.library.leather} roughness={0.75} metalness={0.05} clearcoat={0.15} />
      </instancedMesh>

      {/* Reading tables */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={i} position={[(i % 2 === 0 ? -2 : 2) + (i % 3) * 0.3, -3.2, 2 - i * 8]}>
          <mesh>
            <boxGeometry args={[3, 0.15, 1.6]} />
            <meshPhysicalMaterial color={PALETTES.library.wood} roughness={0.8} />
          </mesh>
          {[-1.2, 1.2].map((x, j) => (
            <mesh key={j} position={[x, -0.6, 0.5]}>
              <cylinderGeometry args={[0.08, 0.1, 1.2, 8]} />
              <meshPhysicalMaterial color={PALETTES.library.wood} roughness={0.85} />
            </mesh>
          ))}
          {[-1.2, 1.2].map((x, j) => (
            <mesh key={`b${j}`} position={[x, -0.6, -0.5]}>
              <cylinderGeometry args={[0.08, 0.1, 1.2, 8]} />
              <meshPhysicalMaterial color={PALETTES.library.wood} roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Candles */}
      {Array.from({ length: CANDLE_COUNT }).map((_, i) => {
        const rng = createRng(200 + i)
        const x = (rng() - 0.5) * 14
        const z = 4 - rng() * 65
        return (
          <Float key={i} speed={1 + (i % 3) * 0.2} floatIntensity={0.15}>
            <group position={[x, -2.5 + rng() * 4, z]}>
              <mesh>
                <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
                <meshPhysicalMaterial color={PALETTES.library.parchment} roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.2, 0]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial color={PALETTES.library.candle} />
              </mesh>
              <pointLight color={PALETTES.library.candle} intensity={0.7} distance={5} decay={2} position={[0, 0.25, 0]} />
            </group>
          </Float>
        )
      })}

      {/* Scrolls / props */}
      <InstancedScatter
        count={SCROLL_COUNT}
        seed={58}
        color={PALETTES.library.parchment}
        geo="cylinder"
        scaleMin={0.15}
        scaleMax={0.5}
        zStart={4}
        zEnd={-65}
        radius={8}
        yMin={-3}
        yMax={4}
        metalness={0.05}
        roughness={0.9}
        spin={0.1}
        keepClearRadius={2}
      />

      <InstancedScatter
        count={100}
        seed={59}
        color={PALETTES.library.wood}
        geo="box"
        scaleMin={0.2}
        scaleMax={1}
        zStart={5}
        zEnd={-68}
        radius={10}
        yMin={-3.5}
        yMax={6}
        roughness={0.85}
        keepClearRadius={2.5}
      />

      {/* Central pedestal + resume tome */}
      <group position={[0, -2, -18]}>
        <mesh>
          <cylinderGeometry args={[1.5, 2, 1.2, 24]} />
          <meshPhysicalMaterial color={PALETTES.library.wood} roughness={0.8} />
        </mesh>
        <Float speed={0.8} floatIntensity={0.25}>
          <group position={[0, 1.4, 0]}>
            <mesh>
              <boxGeometry args={[1.4, 0.18, 2]} />
              <meshPhysicalMaterial
                color={PALETTES.library.leather}
                roughness={0.65}
                emissive={PALETTES.library.candle}
                emissiveIntensity={0.15}
                clearcoat={0.35}
              />
            </mesh>
            <Text position={[0, 0.12, 0]} fontSize={0.2} color={PALETTES.library.parchment} anchorX="center" font={FONTS.SPACE_GROTESK} rotation={[-Math.PI / 2, 0, 0]}>
              CODEX VITAE
            </Text>
          </group>
        </Float>
        <Text position={[0, 3.2, 0]} fontSize={0.35} color={PALETTES.library.accent} anchorX="center" font={FONTS.SPACE_GROTESK}>
          LIBRARY OF KNOWLEDGE
        </Text>
      </group>

      <Sparkles count={90} scale={[24, 16, 70]} size={1.1} speed={0.1} color={PALETTES.library.candle} opacity={0.4} />

      <InteractivePanel
        position={[-3.5, 0.5, -10]}
        color={PALETTES.library.wood}
        accent={PALETTES.library.candle}
        item={{ title: 'Resume', tag: 'Experience', body: 'Lead creative technologist. 8+ years shipping immersive products for global brands.' }}
      />
      <InteractivePanel
        position={[3.5, 0.8, -24]}
        color={PALETTES.library.wood}
        accent={PALETTES.library.accent}
        item={{ title: 'Writing', tag: 'Essays', body: 'Published notes on spatial UI, motion systems, and the ethics of delightful friction.' }}
      />
      <InteractivePanel
        position={[0, 0.6, -38]}
        color={PALETTES.library.wood}
        accent={PALETTES.library.parchment}
        item={{ title: 'Talks', tag: 'Speaking', body: 'Conference sessions on WebGL performance and narrative interaction design.' }}
      />
      <InteractivePanel
        position={[-2, 0.4, -48]}
        color={PALETTES.library.wood}
        accent={PALETTES.library.leather}
        item={{ title: 'Open Source', tag: 'Tools', body: 'Libraries for shader authoring and accessible 3D controls used by 2k+ devs.' }}
      />

      <ExitPortal position={[0, 1.3, -58]} color={PALETTES.library.accent} previewColor={PALETTES.hub.accent} />
      <PathLights color={PALETTES.library.candle} count={14} intensity={0.75} zEnd={-55} y={2} seed={41} />
      <ambientLight intensity={0.1} color={PALETTES.library.primary} />
      <spotLight position={[0, 14, -10]} angle={0.55} penumbra={0.9} intensity={3.5} color={PALETTES.library.candle} distance={45} decay={2} />
    </group>
  )
}
