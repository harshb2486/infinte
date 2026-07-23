import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorldId } from '@/utils/constants'

export type EvolutionPhase = 'dormant' | 'awakening' | 'thriving' | 'decaying' | 'transformed'

export interface WorldEvolutionState {
  worldId: WorldId
  age: number
  phase: EvolutionPhase
  modifiers: WorldModifier[]
  lastTickTimestamp: number
}

export interface WorldModifier {
  source: string
  effect: string
  duration: number | null
  startTime: number
}

interface WorldEvolutionStore {
  worlds: Record<string, WorldEvolutionState>
  timeScale: number
  tick: (delta: number) => void
  initWorld: (worldId: WorldId) => void
  applyModifier: (worldId: string, modifier: WorldModifier) => void
  setTimeScale: (scale: number) => void
  getPhase: (worldId: WorldId) => EvolutionPhase
  getAge: (worldId: WorldId) => number
}

function getPhaseFromAge(age: number): EvolutionPhase {
  if (age < 100) return 'dormant'
  if (age < 300) return 'awakening'
  if (age < 600) return 'thriving'
  if (age < 900) return 'decaying'
  return 'transformed'
}

function evolveWorld(world: WorldEvolutionState, delta: number): WorldEvolutionState {
  const newAge = world.age + delta
  const activeModifiers = world.modifiers.filter(
    (m) => m.duration === null || Date.now() - m.startTime < m.duration,
  )
  return {
    ...world,
    age: newAge,
    phase: getPhaseFromAge(newAge),
    modifiers: activeModifiers,
    lastTickTimestamp: Date.now(),
  }
}

export const useWorldEvolutionStore = create<WorldEvolutionStore>()(
  persist(
    (set, get) => ({
      worlds: {},
      timeScale: 1,

      tick: (delta: number) => {
        const now = Date.now()
        const scaledDelta = delta * get().timeScale
        set((state) => {
          const updatedWorlds = { ...state.worlds }
          for (const [id, world] of Object.entries(updatedWorlds)) {
            if (now - world.lastTickTimestamp < 500) continue
            updatedWorlds[id] = evolveWorld(world, scaledDelta)
          }
          return { worlds: updatedWorlds }
        })
      },

      initWorld: (worldId: WorldId) => {
        set((state) => {
          if (state.worlds[worldId]) return state
          return {
            worlds: {
              ...state.worlds,
              [worldId]: {
                worldId,
                age: 0,
                phase: 'dormant',
                modifiers: [],
                lastTickTimestamp: Date.now(),
              },
            },
          }
        })
      },

      applyModifier: (worldId: string, modifier: WorldModifier) => {
        set((state) => {
          const world = state.worlds[worldId]
          if (!world) return state
          return {
            worlds: {
              ...state.worlds,
              [worldId]: {
                ...world,
                modifiers: [...world.modifiers, modifier],
              },
            },
          }
        })
      },

      setTimeScale: (scale: number) => {
        set({ timeScale: scale })
      },

      getPhase: (worldId: WorldId) => {
        return get().worlds[worldId]?.phase ?? 'dormant'
      },

      getAge: (worldId: WorldId) => {
        return get().worlds[worldId]?.age ?? 0
      },
    }),
    {
      name: 'infinite-portal-evolution',
      partialize: (state) => ({
        worlds: state.worlds,
      }),
    },
  ),
)
