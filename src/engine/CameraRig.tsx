import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA } from '@/utils/constants'
import { useDebugStore } from '@/stores/useDebugStore'
import { useNavigationStore } from '@/stores/useNavigationStore'

const _euler = new THREE.Euler()
const _vector = new THREE.Vector3()

interface CameraProfile {
  speed: number
  bobAmp: number
  bobFreq: number
  fov: number
  bankAmount: number
}

const CAMERA_PROFILES: Record<string, CameraProfile> = {
  intro: { speed: 0.35, bobAmp: 0.004, bobFreq: 0.2, fov: 58, bankAmount: 0.04 },
  hub: { speed: 0.0, bobAmp: 0.008, bobFreq: 0.35, fov: 52, bankAmount: 0.06 },
  underwater: { speed: 0.45, bobAmp: 0.025, bobFreq: 0.2, fov: 62, bankAmount: 0.15 },
  space: { speed: 0.4, bobAmp: 0.004, bobFreq: 0.15, fov: 52, bankAmount: 0.04 },
  cybercity: { speed: 0.5, bobAmp: 0.006, bobFreq: 0.4, fov: 55, bankAmount: 0.06 },
  cpu: { speed: 0.55, bobAmp: 0.003, bobFreq: 0.6, fov: 48, bankAmount: 0.02 },
  quantum: { speed: 0.35, bobAmp: 0.015, bobFreq: 0.25, fov: 58, bankAmount: 0.12 },
  library: { speed: 0.3, bobAmp: 0.004, bobFreq: 0.25, fov: 50, bankAmount: 0.03 },
  dream: { speed: 0.28, bobAmp: 0.03, bobFreq: 0.15, fov: 65, bankAmount: 0.18 },
  aicore: { speed: 0.4, bobAmp: 0.004, bobFreq: 0.45, fov: 52, bankAmount: 0.04 },
  edge: { speed: 0.08, bobAmp: 0.002, bobFreq: 0.1, fov: 42, bankAmount: 0.01 },
}

export function CameraRig() {
  const { camera, gl } = useThree()
  const perspectiveCamera = camera as THREE.PerspectiveCamera
  const currentWorld = useNavigationStore((s) => s.currentWorld)
  const time = useRef(0)
  const mouseX = useRef(0)
  const mouseY = useRef(0)
  const targetFov = useRef<number>(60)
  const currentFov = useRef<number>(60)
  const idleTimer = useRef(0)
  const lastMouseActivity = useRef(Date.now())

  const profile = CAMERA_PROFILES[currentWorld] || CAMERA_PROFILES.hub

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseX.current = (e.clientX / gl.domElement.clientWidth) * 2 - 1
      mouseY.current = (e.clientY / gl.domElement.clientHeight) * 2 - 1
      lastMouseActivity.current = Date.now()
      idleTimer.current = 0
    }
    const onWheel = () => {
      lastMouseActivity.current = Date.now()
    }
    gl.domElement.addEventListener('mousemove', onMouseMove)
    gl.domElement.addEventListener('wheel', onWheel)
    return () => {
      gl.domElement.removeEventListener('mousemove', onMouseMove)
      gl.domElement.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  // Reset camera on world transition
  useEffect(() => {
    camera.position.set(0, 1.6, 0)
    camera.rotation.set(0, 0, 0)
    targetFov.current = profile.fov
    currentFov.current = profile.fov
    Object.assign(perspectiveCamera, { fov: profile.fov })
    perspectiveCamera.updateProjectionMatrix()
  }, [currentWorld, camera, perspectiveCamera, profile])

  useFrame((_, delta) => {
    const debug = useDebugStore.getState()
    if (debug.reducedMotion) return

    const speed = profile.speed * CAMERA.BASE_SPEED * debug.cameraSpeed * debug.motionIntensity
    const motionScale = debug.motionIntensity

    time.current += delta
    idleTimer.current += delta

    // Forward motion — never stops
    camera.position.z -= speed * delta

    // Cinematic breathing with tiny handheld sway
    const bobX = Math.sin(time.current * profile.bobFreq * Math.PI * 2) * profile.bobAmp * motionScale
    const bobY = Math.cos(time.current * profile.bobFreq * Math.PI * 1.3) * profile.bobAmp * 0.7 * motionScale
    const swayX = Math.sin(time.current * 0.7) * 0.002 * motionScale
    const swayY = Math.cos(time.current * 0.53) * 0.002 * motionScale

    camera.position.x += (bobX + swayX - camera.position.x) * 0.02
    camera.position.y += (bobY + swayY + 1.6 - camera.position.y) * 0.02

    // Mouse parallax
    const parallaxX = mouseX.current * CAMERA.MOUSE_PARALLAX * motionScale * (profile.fov / 60)
    const parallaxY = mouseY.current * CAMERA.MOUSE_PARALLAX * 0.5 * motionScale * (profile.fov / 60)
    camera.position.x += (parallaxX - camera.position.x) * 0.01
    camera.position.y += (parallaxY + 1.6 - camera.position.y) * 0.01

    // Gentle auto-banking
    const bankAngle = -mouseX.current * profile.bankAmount * motionScale
    _euler.set(0, 0, bankAngle * 0.1)
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, _euler.z, 0.02)

    // Look slightly ahead
    _vector.set(0, 1.6, camera.position.z - 10)
    camera.lookAt(_vector)

    // Lens breathing / dynamic FOV
    targetFov.current = profile.fov
    const lensBreath = Math.sin(time.current * 0.4) * 0.5
    currentFov.current = THREE.MathUtils.lerp(currentFov.current, targetFov.current + lensBreath, 0.02)
    Object.assign(perspectiveCamera, { fov: currentFov.current })
    perspectiveCamera.updateProjectionMatrix()
  })

  return null
}
