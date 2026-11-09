import { useEffect, useRef } from 'react'
import { SHORTCUTS, type ShortcutAction } from '../lib/shortcuts'

/**
 * Global single-key shortcuts. Skipped while typing, with modifier keys held,
 * or whenever `enabled` is false (e.g. timer running, dialog open, setting off).
 */
export function useShortcuts(enabled: boolean, handlers: Record<ShortcutAction, () => void>) {
  const ref = useRef({ enabled, handlers })
  useEffect(() => {
    ref.current = { enabled, handlers }
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!ref.current.enabled || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      const match = SHORTCUTS.find((s) => s.key.toLowerCase() === e.key.toLowerCase())
      if (!match) return
      e.preventDefault()
      ref.current.handlers[match.action]()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
