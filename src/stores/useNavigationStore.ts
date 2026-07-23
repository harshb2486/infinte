import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorldId } from '@/utils/constants'
import { getVisiblePortals, getWorldNode } from '@/utils/worldGraph'

interface NavigationState {
  currentWorld: WorldId
  previousWorld: WorldId | null
  visitedWorlds: WorldId[]
  worldsCompleted: WorldId[]
  isTransitioning: boolean
  transitionProgress: number
  transitionTarget: WorldId | null
  discoveredSecrets: string[]

  navigateTo: (worldId: WorldId) => void
  completeWorld: (worldId: WorldId) => void
  startTransition: (target: WorldId) => void
  endTransition: () => void
  setTransitionProgress: (p: number) => void
  discoverSecret: (secretId: string) => void
  getVisiblePortals: () => ReturnType<typeof getVisiblePortals>
  getWorldNode: (id: WorldId) => ReturnType<typeof getWorldNode>
  isWorldDiscovered: (id: WorldId) => boolean
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      currentWorld: 'intro',
      previousWorld: null,
      visitedWorlds: ['hub'],
      worldsCompleted: [],
      isTransitioning: false,
      transitionProgress: 0,
      transitionTarget: null,
      discoveredSecrets: [],

      navigateTo: (worldId: WorldId) => {
        const state = get()
        if (state.isTransitioning) return
        set({
          previousWorld: state.currentWorld,
          currentWorld: worldId,
          visitedWorlds: Array.from(new Set([...state.visitedWorlds, worldId])),
        })
      },

      completeWorld: (worldId: WorldId) => {
        set((state) => ({
          worldsCompleted: Array.from(
            new Set([...state.worldsCompleted, worldId]),
          ),
        }))
      },

      startTransition: (target: WorldId) => {
        set({ isTransitioning: true, transitionTarget: target, transitionProgress: 0 })
      },

      endTransition: () => {
        const target = get().transitionTarget
        if (target) {
          set((state) => ({
            currentWorld: target,
            previousWorld: state.currentWorld,
            visitedWorlds: Array.from(new Set([...state.visitedWorlds, target])),
            isTransitioning: false,
            transitionTarget: null,
            transitionProgress: 0,
          }))
        }
      },

      setTransitionProgress: (p: number) => {
        set({ transitionProgress: p })
      },

      discoverSecret: (secretId: string) => {
        set((state) => ({
          discoveredSecrets: Array.from(
            new Set([...state.discoveredSecrets, secretId]),
          ),
        }))
      },

      getVisiblePortals: () => {
        return getVisiblePortals(get().visitedWorlds)
      },

      getWorldNode: (id: WorldId) => {
        return getWorldNode(id)
      },

      isWorldDiscovered: (id: WorldId) => {
        return get().visitedWorlds.includes(id)
      },
    }),
    {
      name: 'infinite-portal-navigation',
      partialize: (state) => ({
        visitedWorlds: state.visitedWorlds,
        worldsCompleted: state.worldsCompleted,
        discoveredSecrets: state.discoveredSecrets,
      }),
    },
  ),
)
