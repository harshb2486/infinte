import { useEffect } from 'react'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { usePortalAIStore } from '@/stores/usePortalAIStore'
import { useWorldEvolutionStore } from '@/stores/useWorldEvolutionStore'
import { useSaveStore } from '@/stores/useSaveStore'
import { SAVE } from '@/utils/constants'

export function AutoSave() {
  const currentWorld = useNavigationStore((s) => s.currentWorld)
  const addPlayTime = useSaveStore((s) => s.addPlayTime)

  useEffect(() => {
    const interval = setInterval(() => {
      addPlayTime(SAVE.AUTO_SAVE_DELAY)
      saveAll()
    }, SAVE.AUTO_SAVE_DELAY)
    return () => clearInterval(interval)
  }, [addPlayTime])

  useEffect(() => {
    saveAll()
  }, [currentWorld])

  return null
}

export function saveAll() {
  const navigation = useNavigationStore.getState()
  const ai = usePortalAIStore.getState()
  const evolution = useWorldEvolutionStore.getState()
  const save = useSaveStore.getState()

  const data = {
    version: SAVE.VERSION,
    timestamp: Date.now(),
    currentWorld: navigation.currentWorld,
    visitedWorlds: navigation.visitedWorlds,
    worldsCompleted: navigation.worldsCompleted,
    collectedArtifacts: save.collectedArtifacts,
    achievements: save.achievements,
    playTime: save.playTime,
    worldEvolution: evolution.worlds,
    discoveredSecrets: navigation.discoveredSecrets,
    portalAI: {
      mood: ai.mood,
      discoveredClues: ai.discoveredClues,
      history: ai.conversationHistory.slice(-100),
    },
  }

  localStorage.setItem(SAVE.STORAGE_KEY, JSON.stringify(data))
}

export function loadAll() {
  const raw = localStorage.getItem(SAVE.STORAGE_KEY)
  if (!raw) return false

  try {
    const data = JSON.parse(raw)
    if (data.version !== SAVE.VERSION) return false

    useNavigationStore.setState({
      visitedWorlds: data.visitedWorlds ?? ['hub'],
      worldsCompleted: data.worldsCompleted ?? [],
      discoveredSecrets: data.discoveredSecrets ?? [],
    })

    useSaveStore.setState({
      collectedArtifacts: data.collectedArtifacts ?? [],
      achievements: data.achievements ?? [],
      playTime: data.playTime ?? 0,
    })

    useWorldEvolutionStore.setState({
      worlds: data.worldEvolution ?? {},
    })

    usePortalAIStore.setState({
      mood: data.portalAI?.mood ?? 'neutral',
      discoveredClues: data.portalAI?.discoveredClues ?? [],
      conversationHistory: data.portalAI?.history ?? [],
    })

    return true
  } catch {
    return false
  }
}

export function resetAll() {
  localStorage.removeItem(SAVE.STORAGE_KEY)
  useNavigationStore.setState({
    currentWorld: 'hub',
    visitedWorlds: ['hub'],
    worldsCompleted: [],
    discoveredSecrets: [],
  })
  useSaveStore.setState({
    collectedArtifacts: [],
    achievements: [],
    playTime: 0,
  })
  useWorldEvolutionStore.setState({ worlds: {} })
  usePortalAIStore.setState({
    mood: 'neutral',
    discoveredClues: [],
    conversationHistory: [],
  })
}
