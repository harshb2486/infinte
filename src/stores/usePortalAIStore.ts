import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AIMood = 'neutral' | 'welcoming' | 'cryptic' | 'warning' | 'playful' | 'wise'

export interface AIMessage {
  id: string
  timestamp: number
  speaker: 'portal' | 'user'
  text: string
  mood?: AIMood
}

export interface DialogueResponse {
  text: string
  nextState: string
}

export interface DialogueNode {
  id: string
  text: string
  mood?: AIMood
  responses?: DialogueResponse[]
}

interface PortalAIState {
  mood: AIMood
  conversationHistory: AIMessage[]
  discoveredClues: string[]
  isTyping: boolean
  currentDialogue: string | null
  currentNode: DialogueNode | null
  isActive: boolean
  lastInterjectionTime: number
  interjectionCount: number

  interject: (text: string, mood?: AIMood) => void
  startDialogue: (dialogueId: string, node: DialogueNode) => void
  playNode: (node: DialogueNode) => void
  respond: (responseText: string, nextState: string) => void
  setTyping: (typing: boolean) => void
  dismiss: () => void
  discoverClue: (clue: string) => void
  setMood: (mood: AIMood) => void
}

export const usePortalAIStore = create<PortalAIState>()(
  persist(
    (set, get) => ({
      mood: 'neutral',
      conversationHistory: [],
      discoveredClues: [],
      isTyping: false,
      currentDialogue: null,
      currentNode: null,
      isActive: false,
      lastInterjectionTime: 0,
      interjectionCount: 0,

      interject: (text: string, mood?: AIMood) => {
        const msg: AIMessage = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          speaker: 'portal',
          text,
          mood,
        }
        set((state) => ({
          mood: mood ?? state.mood,
          conversationHistory: [...state.conversationHistory, msg],
          isTyping: true,
          isActive: true,
          lastInterjectionTime: Date.now(),
          interjectionCount: state.interjectionCount + 1,
        }))
      },

      startDialogue: (dialogueId: string, node: DialogueNode) => {
        set({
          currentDialogue: dialogueId,
          currentNode: node,
          isActive: true,
          isTyping: true,
          mood: node.mood ?? get().mood,
        })
        const msg: AIMessage = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          speaker: 'portal',
          text: node.text,
          mood: node.mood,
        }
        set((state) => ({
          conversationHistory: [...state.conversationHistory, msg],
        }))
      },

      playNode: (node: DialogueNode) => {
        set({
          currentNode: node,
          isTyping: true,
          mood: node.mood ?? get().mood,
        })
        const msg: AIMessage = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          speaker: 'portal',
          text: node.text,
          mood: node.mood,
        }
        set((state) => ({
          conversationHistory: [...state.conversationHistory, msg],
        }))
      },

      respond: (responseText: string, _nextState: string) => {
        const msg: AIMessage = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          speaker: 'user',
          text: responseText,
        }
        set((state) => ({
          conversationHistory: [...state.conversationHistory, msg],
        }))
        // The next node needs to be provided externally
        set({ currentNode: null, isTyping: false })
      },

      setTyping: (typing: boolean) => {
        set({ isTyping: typing })
      },

      dismiss: () => {
        set({
          isActive: false,
          isTyping: false,
          currentDialogue: null,
          currentNode: null,
        })
      },

      discoverClue: (clue: string) => {
        set((state) => ({
          discoveredClues: Array.from(new Set([...state.discoveredClues, clue])),
        }))
      },

      setMood: (mood: AIMood) => {
        set({ mood })
      },
    }),
    {
      name: 'infinite-portal-ai',
      partialize: (state) => ({
        discoveredClues: state.discoveredClues,
        mood: state.mood,
        conversationHistory: state.conversationHistory.slice(-100),
      }),
    },
  ),
)
