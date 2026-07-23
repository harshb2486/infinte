import type { WorldId } from './constants'

export interface WorldNode {
  id: WorldId
  label: string
  type: 'hub' | 'spoke' | 'hidden'
  requiredDiscovery?: WorldId[]
  portalPosition: [number, number, number]
  portalColor: string
  description: string
}

/** Portals arranged in a ring around the traveler so all stay in view. */
export const WORLD_GRAPH: WorldNode[] = [
  {
    id: 'hub',
    label: 'The Nexus',
    type: 'hub',
    portalPosition: [0, 0, 0],
    portalColor: '#ffffff',
    description: 'The center of all realities.',
  },
  {
    id: 'underwater',
    label: 'Abyssal Archive',
    type: 'spoke',
    portalPosition: [0, 0.3, -11],
    portalColor: '#7ab8b0',
    description: 'Ancient ruins beneath endless water.',
  },
  {
    id: 'space',
    label: 'Celestial Cartography',
    type: 'spoke',
    portalPosition: [9.5, 0.3, -5.5],
    portalColor: '#c8a848',
    description: 'Projects orbit a living cosmos.',
  },
  {
    id: 'cybercity',
    label: 'Synthetic Metropolis',
    type: 'spoke',
    portalPosition: [-9.5, 0.3, -5.5],
    portalColor: '#4a7aa8',
    description: 'Rain-slick streets and neon arteries.',
  },
  {
    id: 'cpu',
    label: 'Silicon Interior',
    type: 'spoke',
    portalPosition: [9.5, 0.3, 5.5],
    portalColor: '#c89050',
    description: 'Skills etched into living circuitry.',
  },
  {
    id: 'quantum',
    label: 'Probability Fields',
    type: 'spoke',
    portalPosition: [-9.5, 0.3, 5.5],
    portalColor: '#c8b8d8',
    description: 'Where many futures coexist.',
  },
  {
    id: 'library',
    label: 'Codex Eternum',
    type: 'spoke',
    portalPosition: [0, 0.3, 11],
    portalColor: '#d8a840',
    description: 'Shelves of memory and craft.',
  },
  {
    id: 'dream',
    label: 'Somnus Expanse',
    type: 'spoke',
    portalPosition: [7, 1.2, -9],
    portalColor: '#c8b898',
    description: 'Islands that drift on soft light.',
  },
  {
    id: 'aicore',
    label: 'Neural Cradle',
    type: 'spoke',
    portalPosition: [-7, 1.2, -9],
    portalColor: '#a8c0d0',
    description: 'Attention made visible.',
  },
  {
    id: 'edge',
    label: 'Final Meridian',
    type: 'hidden',
    requiredDiscovery: ['underwater', 'space', 'cybercity', 'cpu', 'quantum', 'library', 'dream', 'aicore'],
    portalPosition: [0, 2.2, 0],
    portalColor: '#e8e4dc',
    description: 'Where the journey folds back on itself.',
  },
]

export function getWorldNode(id: WorldId): WorldNode {
  return WORLD_GRAPH.find((n) => n.id === id)!
}

export function getVisiblePortals(visitedWorlds: WorldId[]): WorldNode[] {
  return WORLD_GRAPH.filter((node) => {
    if (node.id === 'hub') return false
    if (node.type === 'hidden') {
      return (
        node.requiredDiscovery?.every((req) => visitedWorlds.includes(req)) ?? false
      )
    }
    return true
  })
}
