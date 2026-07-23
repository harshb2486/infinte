import * as THREE from 'three'

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomVec3InSphere(radius: number): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = Math.cbrt(Math.random()) * radius
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  )
}

export function randomVec3InBox(
  width: number,
  height: number,
  depth: number,
): THREE.Vector3 {
  return new THREE.Vector3(
    (Math.random() - 0.5) * width,
    (Math.random() - 0.5) * height,
    (Math.random() - 0.5) * depth,
  )
}

export function simplex2D(x: number, y: number): number {
  const dot = x * 12.9898 + y * 78.233
  const s = Math.sin(dot) * 43758.5453
  return s - Math.floor(s)
}

export function fbm(x: number, y: number, octaves: number = 4): number {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  for (let i = 0; i < octaves; i++) {
    value += amplitude * simplex2D(x * frequency, y * frequency)
    amplitude *= 0.5
    frequency *= 2
  }
  return value
}

export function colorFromHex(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

export function lerpColor(
  a: THREE.Color,
  b: THREE.Color,
  t: number,
): THREE.Color {
  return new THREE.Color(
    lerp(a.r, b.r, t),
    lerp(a.g, b.g, t),
    lerp(a.b, b.b, t),
  )
}

export const math = {
  lerp,
  clamp,
  smoothstep,
  easeInOutCubic,
  easeOutExpo,
  easeInExpo,
  randomRange,
  randomVec3InSphere,
  randomVec3InBox,
  simplex2D,
  fbm,
  colorFromHex,
  lerpColor,
}
