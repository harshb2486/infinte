import { useEffect } from 'react'
import { useSaveStore } from '@/stores/useSaveStore'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { usePortalAIStore } from '@/stores/usePortalAIStore'

export interface Achievement {
  id: string
  name: string
  description: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-steps', name: 'First Steps', description: 'Enter your first world.' },
  { id: 'deep-diver', name: 'Deep Diver', description: 'Explore the Underwater Kingdom.' },
  { id: 'star-gazer', name: 'Star Gazer', description: 'Visit Deep Space.' },
  { id: 'cyber-punk', name: 'Cyber Punk', description: 'Enter the Cyber City.' },
  { id: 'explorer', name: 'Explorer', description: 'Visit all 9 spoke worlds.' },
  { id: 'transcendent', name: 'Transcendent', description: 'Reach the Edge of the Universe.' },
]

export function AchievementTracker() {
  const currentWorld = useNavigationStore((s) => s.currentWorld)
  const visitedWorlds = useNavigationStore((s) => s.visitedWorlds)
  const unlockAchievement = useSaveStore((s) => s.unlockAchievement)

  useEffect(() => {
    if (currentWorld === 'underwater') {
      unlockAchievement('deep-diver')
    } else if (currentWorld === 'space') {
      unlockAchievement('star-gazer')
    } else if (currentWorld === 'cybercity') {
      unlockAchievement('cyber-punk')
    } else if (currentWorld !== 'hub' && currentWorld !== 'intro') {
      unlockAchievement('first-steps')
    }

    if (visitedWorlds.length >= 10) {
      unlockAchievement('explorer')
    }

    if (currentWorld === 'edge') {
      unlockAchievement('transcendent')
    }
  }, [currentWorld, visitedWorlds, unlockAchievement])

  return null
}

export function checkSecret(secretId: string, message?: string) {
  const { discoverSecret, discoveredSecrets } = useNavigationStore.getState()
  if (!discoveredSecrets.includes(secretId)) {
    discoverSecret(secretId)
    if (message) {
      usePortalAIStore.getState().interject(message, 'playful')
    }
  }
}

export function HiddenSecrets() {
  // This component can trigger secret checks based on time or conditions
  return null
}
