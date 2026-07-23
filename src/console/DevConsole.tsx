import { useEffect, useRef, useState, useCallback } from 'react'
import { useDebugStore } from '@/stores/useDebugStore'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { usePortalAIStore } from '@/stores/usePortalAIStore'
import { useSaveStore } from '@/stores/useSaveStore'
import { WORLD_IDS, type WorldId } from '@/utils/constants'

interface ConsoleCommand {
  name: string
  description: string
  fn: (args: string[]) => string | Promise<string>
}

const COMMANDS: ConsoleCommand[] = [
  {
    name: 'goto',
    description: 'Navigate to a world: goto underwater',
    fn: (args) => {
      const id = args[0] as WorldId
      if (!WORLD_IDS.includes(id)) return `Unknown world: ${id}`
      useNavigationStore.getState().startTransition(id)
      setTimeout(() => useNavigationStore.getState().navigateTo(id), 1500)
      return `Navigating to ${id}...`
    },
  },
  {
    name: 'list',
    description: 'List all worlds and their status',
    fn: () => {
      const visited = useNavigationStore.getState().visitedWorlds
      return WORLD_IDS.map((id) => {
        return `${id.padEnd(14)} ${visited.includes(id) ? '[visited]' : '[locked]'}`
      }).join('\n')
    },
  },
  {
    name: 'unlock',
    description: 'Unlock all worlds',
    fn: () => {
      WORLD_IDS.forEach((id) => {
        if (id !== 'hub') useNavigationStore.getState().navigateTo(id)
      })
      return 'All worlds unlocked.'
    },
  },
  {
    name: 'quality',
    description: 'Set quality level: quality low|medium|high',
    fn: (args) => {
      const level = args[0] as 'low' | 'medium' | 'high'
      if (!['low', 'medium', 'high'].includes(level)) return 'Invalid quality level.'
      useDebugStore.getState().setQualityLevel(level)
      return `Quality set to ${level}.`
    },
  },
  {
    name: 'ai',
    description: 'Make the Portal AI say something: ai hello',
    fn: (args) => {
      usePortalAIStore.getState().interject(args.join(' '), 'cryptic')
      return 'Portal AI interjected.'
    },
  },
  {
    name: 'evolution',
    description: 'Set world phase override',
    fn: () => {
      return 'Use the Leva debug panel for world evolution controls.'
    },
  },
  {
    name: 'artifact',
    description: 'Collect an artifact: artifact duck',
    fn: (args) => {
      const id = args[0]
      if (!id) return 'Provide an artifact id.'
      useSaveStore.getState().collectArtifact(id)
      return `Collected artifact: ${id}`
    },
  },
  {
    name: 'achievement',
    description: 'Unlock an achievement',
    fn: (args) => {
      const id = args[0]
      if (!id) return 'Provide an achievement id.'
      useSaveStore.getState().unlockAchievement(id)
      return `Achievement unlocked: ${id}`
    },
  },
  {
    name: 'clear',
    description: 'Clear console',
    fn: () => '',
  },
  {
    name: 'help',
    description: 'List all commands',
    fn: () => COMMANDS.map((c) => `${c.name.padEnd(16)} ${c.description}`).join('\n'),
  },
]

export function DevConsole() {
  const isOpen = useDebugStore((s) => s.consoleOpen)
  const toggleConsole = useDebugStore((s) => s.toggleConsole)
  const [history, setHistory] = useState<Array<{ type: 'output' | 'error' | 'input'; text: string }>>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '`' || (e.ctrlKey && e.key === '`')) {
        e.preventDefault()
        toggleConsole()
      }
      if (e.key === 'Escape' && isOpen) {
        toggleConsole()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleConsole, isOpen])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const executeCommand = useCallback(async (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    setHistory((h) => [...h, { type: 'input', text: `$ ${trimmed}` }])

    const [cmdName, ...args] = trimmed.split(/\s+/)
    if (cmdName === 'clear') {
      setHistory([])
      return
    }

    const command = COMMANDS.find((c) => c.name === cmdName)
    if (!command) {
      setHistory((h) => [...h, { type: 'error', text: `Unknown command: ${cmdName}. Type 'help' for commands.` }])
    } else {
      try {
        const result = await command.fn(args)
        if (result) setHistory((h) => [...h, { type: 'output', text: result }])
      } catch (err) {
        setHistory((h) => [...h, { type: 'error', text: String(err) }])
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '280px',
        background: 'rgba(5, 5, 10, 0.95)',
        borderTop: '2px solid #38bdf8',
        color: '#38bdf8',
        fontFamily: '"Fira Code", "Cascadia Code", monospace',
        fontSize: '13px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {history.map((entry, i) => (
          <div
            key={i}
            style={{
              color: entry.type === 'error' ? '#ef4444' : entry.type === 'input' ? '#666' : '#38bdf8',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
            }}
          >
            {entry.text}
          </div>
        ))}
        <div ref={historyEndRef} />
      </div>

      <div style={{ display: 'flex', borderTop: '1px solid #333', padding: '8px 12px' }}>
        <span style={{ color: '#38bdf8', marginRight: '10px' }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { executeCommand(input); setInput('') }
          }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#38bdf8',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            outline: 'none',
          }}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
