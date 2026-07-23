/** Deterministic PRNG so world layouts stay stable across renders. */
export function createRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

export function scatterAlongPath(
  count: number,
  opts: {
    seed: number
    zStart?: number
    zEnd?: number
    radius?: number
    yMin?: number
    yMax?: number
    keepClearRadius?: number
  },
): Float32Array {
  const {
    seed,
    zStart = 8,
    zEnd = -90,
    radius = 14,
    yMin = -4,
    yMax = 8,
    keepClearRadius = 1.2,
  } = opts
  const rng = createRng(seed)
  const positions = new Float32Array(count * 3)
  let i = 0
  let attempts = 0
  while (i < count && attempts < count * 20) {
    attempts++
    const t = rng()
    const z = zStart + (zEnd - zStart) * t
    const angle = rng() * Math.PI * 2
    const r = keepClearRadius + rng() * (radius - keepClearRadius)
    const x = Math.cos(angle) * r * (0.4 + rng() * 0.6)
    const y = yMin + rng() * (yMax - yMin)
    // Prefer denser packing near the camera corridor
    if (Math.abs(x) > radius * 0.85 && rng() > 0.35) continue
    const i3 = i * 3
    positions[i3] = x
    positions[i3 + 1] = y
    positions[i3 + 2] = z
    i++
  }
  return positions
}
