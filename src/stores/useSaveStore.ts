import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorldId } from '@/utils/constants'

export interface SaveData {
  version: number
  timestamp: number
  playTime: number
  currentWorld: WorldId
  visitedWorlds: WorldId[]
  worldsCompleted: WorldId[]
  collectedArtifacts: string[]
  achievements: string[]
  discoveredSecrets: string[]
}

interface SaveState {
  collectedArtifacts: string[]
  achievements: string[]
  playTime: number
  lastSaveTime: number

  collectArtifact: (id: string) => void
  unlockAchievement: (id: string) => void
  addPlayTime: (delta: number) => void
  hasArtifact: (id: string) => boolean
  hasAchievement: (id: string) => boolean
}

export const useSaveStore = create<SaveState>()(
  persist(
    (set, get) => ({
      collectedArtifacts: [],
      achievements: [],
      playTime: 0,
      lastSaveTime: Date.now(),

      collectArtifact: (id: string) => {
        set((state) => ({
          collectedArtifacts: Array.from(
            new Set([...state.collectedArtifacts, id]),
          ),
        }))
      },

      unlockAchievement: (id: string) => {
        set((state) => ({
          achievements: Array.from(new Set([...state.achievements, id])),
        }))
      },

      addPlayTime: (delta: number) => {
        set((state) => ({ playTime: state.playTime + delta }))
      },

      hasArtifact: (id: string) => {
        return get().collectedArtifacts.includes(id)
      },

      hasAchievement: (id: string) => {
        return get().achievements.includes(id)
      },
    }),
    {
      name: 'infinite-portal-save',
    },
  ),
)
