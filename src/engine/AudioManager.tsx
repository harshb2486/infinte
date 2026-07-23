import { useEffect, useRef, useCallback } from 'react'
import { useNavigationStore } from '@/stores/useNavigationStore'
import type { WorldId } from '@/utils/constants'

interface AudioNode {
  oscillator?: OscillatorNode
  gain?: GainNode
  filter?: BiquadFilterNode
  noise?: AudioBufferSourceNode
}

class AudioSynthEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private currentWorldNodes: AudioNode[] = []
  private crossfadeNodes: AudioNode[] = []

  init() {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.3
    this.masterGain.connect(this.ctx.destination)
  }

  private createNoise(duration: number = 2): AudioBuffer {
    if (!this.ctx) throw new Error('No context')
    const sampleRate = this.ctx.sampleRate
    const length = sampleRate * duration
    const buffer = this.ctx.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1
    }
    return buffer
  }

  private createOsc(freq: number, type: OscillatorType = 'sine'): AudioNode {
    if (!this.ctx || !this.masterGain) return {}
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = 0
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    return { oscillator: osc, gain }
  }

  private createFilteredNoise(
    freq: number,
    q: number = 1,
  ): AudioNode {
    if (!this.ctx || !this.masterGain) return {}
    const noiseBuffer = this.createNoise(4)
    const noise = this.ctx.createBufferSource()
    noise.buffer = noiseBuffer
    noise.loop = true
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = freq
    filter.Q.value = q
    const gain = this.ctx.createGain()
    gain.gain.value = 0
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    noise.start()
    return { noise, filter, gain }
  }

  playWorldAmbience(worldId: WorldId) {
    this.fadeOut(() => {
      this.currentWorldNodes = []
      switch (worldId) {
        case 'underwater':
          this.playUnderwater()
          break
        case 'space':
          this.playSpace()
          break
        case 'cybercity':
          this.playCyberCity()
          break
        case 'cpu':
          this.playCPU()
          break
        case 'quantum':
          this.playQuantum()
          break
        case 'library':
          this.playLibrary()
          break
        case 'dream':
          this.playDream()
          break
        case 'aicore':
          this.playAICore()
          break
        case 'hub':
          this.playHub()
          break
        default:
          this.playHub()
      }
      this.fadeIn()
    })
  }

  private playUnderwater() {
    // Deep ocean drone
    const drone = this.createOsc(55, 'sine')
    const drone2 = this.createOsc(82.5, 'sine')
    // Bubble sounds (high frequency blips)
    const bubbles = this.createFilteredNoise(2000, 5)
    // Whale song approximation
    const whale = this.createOsc(120, 'sine')
    this.currentWorldNodes = [drone, drone2, bubbles, whale]
  }

  private playSpace() {
    // Deep sub-bass
    const bass = this.createOsc(40, 'sine')
    // Cosmic wind
    const wind = this.createFilteredNoise(200, 0.5)
    // Radio static
    const static_ = this.createFilteredNoise(3000, 10)
    this.currentWorldNodes = [bass, wind, static_]
  }

  private playCyberCity() {
    // Rain
    const rain = this.createFilteredNoise(4000, 0.3)
    // Electric hum
    const hum = this.createOsc(60, 'sawtooth')
    // Traffic drone
    const traffic = this.createFilteredNoise(150, 2)
    this.currentWorldNodes = [rain, hum, traffic]
  }

  private playCPU() {
    // Digital hum
    const hum = this.createOsc(200, 'square')
    // Data streams
    const data = this.createFilteredNoise(1500, 8)
    this.currentWorldNodes = [hum, data]
  }

  private playQuantum() {
    // Warbling tones
    const warble = this.createOsc(300, 'sine')
    const warble2 = this.createOsc(303, 'sine')
    // Ethereal pad
    const pad = this.createFilteredNoise(500, 1)
    this.currentWorldNodes = [warble, warble2, pad]
  }

  private playLibrary() {
    // Warm drone
    const drone = this.createOsc(110, 'triangle')
    // Page rustling
    const rustle = this.createFilteredNoise(6000, 3)
    this.currentWorldNodes = [drone, rustle]
  }

  private playDream() {
    // Ethereal pad
    const pad = this.createOsc(220, 'sine')
    const pad2 = this.createOsc(330, 'sine')
    // Wind chimes approximation
    const chimes = this.createFilteredNoise(4000, 15)
    this.currentWorldNodes = [pad, pad2, chimes]
  }

  private playAICore() {
    // Neural hum
    const hum = this.createOsc(150, 'sine')
    // Processing
    const proc = this.createFilteredNoise(800, 5)
    this.currentWorldNodes = [hum, proc]
  }

  private playHub() {
    // Ambient void
    const void_ = this.createOsc(80, 'sine')
    const void2 = this.createOsc(120, 'triangle')
    this.currentWorldNodes = [void_, void2]
  }

  private fadeOut(callback: () => void) {
    if (!this.ctx) { callback(); return }
    const now = this.ctx.currentTime
    this.currentWorldNodes.forEach((node) => {
      if (node.gain) {
        node.gain.gain.linearRampToValueAtTime(0, now + 1.5)
      }
    })
    setTimeout(() => {
      this.currentWorldNodes.forEach((node) => {
        try {
          node.oscillator?.stop()
          node.noise?.stop()
        } catch {}
      })
      callback()
    }, 1600)
  }

  private fadeIn() {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    this.currentWorldNodes.forEach((node) => {
      if (node.gain) {
        node.gain.gain.linearRampToValueAtTime(0.15, now + 2)
      }
    })
  }

  setVolume(vol: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = vol
    }
  }

  dispose() {
    this.currentWorldNodes.forEach((node) => {
      try {
        node.oscillator?.stop()
        node.noise?.stop()
      } catch {}
    })
    this.ctx?.close()
    this.ctx = null
  }
}

const engine = new AudioSynthEngine()

export function AudioManager() {
  const currentWorld = useNavigationStore((s) => s.currentWorld)
  const initialized = useRef(false)

  const initAudio = useCallback(() => {
    if (!initialized.current) {
      engine.init()
      initialized.current = true
    }
    engine.playWorldAmbience(currentWorld)
  }, [currentWorld])

  useEffect(() => {
    const handler = () => initAudio()
    window.addEventListener('click', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [initAudio])

  useEffect(() => {
    if (initialized.current) {
      engine.playWorldAmbience(currentWorld)
    }
  }, [currentWorld])

  useEffect(() => {
    return () => engine.dispose()
  }, [])

  return null
}
