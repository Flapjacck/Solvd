import { useCallback, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DEFAULT_SESSION, localSessions, type Session } from '../lib/db'
import { DEFAULT_EVENT } from '../lib/events'

const ACTIVE_KEY = 'solvd.activeSession'

/** All sessions plus the active one, remembered across reloads in localStorage. */
export function useSessions() {
  const live = useLiveQuery(() => localSessions.list(), [])
  const sessions: Session[] = useMemo(() => live ?? [], [live])
  const [activeId, setActiveId] = useState(() => localStorage.getItem(ACTIVE_KEY) ?? DEFAULT_SESSION.id)

  // Fall back to the first session if the saved one was deleted
  const active = sessions.find((s) => s.id === activeId) ?? sessions[0]

  const select = useCallback((id: string) => {
    localStorage.setItem(ACTIVE_KEY, id)
    setActiveId(id)
  }, [])

  // New sessions start on the same event as the current one
  const create = useCallback(async () => {
    const session = await localSessions.add(nextName(sessions), active?.event ?? DEFAULT_EVENT)
    select(session.id)
    return session
  }, [sessions, active, select])

  const rename = useCallback((id: string, name: string) => localSessions.rename(id, name), [])
  const setEvent = useCallback((id: string, event: string) => localSessions.setEvent(id, event), [])

  const remove = useCallback(
    async (id: string) => {
      await localSessions.remove(id)
      if (id === active?.id) {
        const fallback = sessions.find((s) => s.id !== id)
        if (fallback) select(fallback.id)
      }
    },
    [active, sessions, select],
  )

  return { sessions, active, loading: live === undefined, select, create, rename, setEvent, remove }
}

/** "Session N" with N one past the highest existing number */
function nextName(sessions: Session[]) {
  const nums = sessions.map((s) => Number(/^Session (\d+)$/.exec(s.name)?.[1] ?? 0))
  return `Session ${Math.max(0, ...nums) + 1}`
}
