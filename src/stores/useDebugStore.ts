import { create } from 'zustand'

interface DebugState {
  consoleOpen: boolean
  levaHidden: boolean
  showWireframe: boolean
  showHelpers: boolean
  showFPS: boolean
  cameraSpeed: number
  particleDensity: number
  postProcessing: boolean
  motionIntensity: number
  highContrast: boolean
  qualityLevel: 'low' | 'medium' | 'high'
  reducedMotion: boolean

  toggleConsole: () => void
  toggleLeva: () => void
  toggleWireframe: () => void
  toggleHelpers: () => void
  toggleFPS: () => void
  setCameraSpeed: (speed: number) => void
  setParticleDensity: (density: number) => void
  togglePostProcessing: () => void
  setMotionIntensity: (intensity: number) => void
  toggleHighContrast: () => void
  setQualityLevel: (level: 'low' | 'medium' | 'high') => void
  toggleReducedMotion: () => void
}

export const useDebugStore = create<DebugState>((set) => ({
  consoleOpen: false,
  levaHidden: true,
  showWireframe: false,
  showHelpers: false,
  showFPS: false,
  cameraSpeed: 1.0,
  particleDensity: 1.0,
  postProcessing: true,
  motionIntensity: 1.0,
  highContrast: false,
  qualityLevel: 'high',
  reducedMotion: false,

  toggleConsole: () => set((s) => ({ consoleOpen: !s.consoleOpen })),
  toggleLeva: () => set((s) => ({ levaHidden: !s.levaHidden })),
  toggleWireframe: () => set((s) => ({ showWireframe: !s.showWireframe })),
  toggleHelpers: () => set((s) => ({ showHelpers: !s.showHelpers })),
  toggleFPS: () => set((s) => ({ showFPS: !s.showFPS })),
  setCameraSpeed: (speed) => set({ cameraSpeed: speed }),
  setParticleDensity: (density) => set({ particleDensity: density }),
  togglePostProcessing: () => set((s) => ({ postProcessing: !s.postProcessing })),
  setMotionIntensity: (intensity) => set({ motionIntensity: intensity }),
  toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
  setQualityLevel: (level) => set({ qualityLevel: level }),
  toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
}))
