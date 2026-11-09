import { useState } from 'react'
import type { Session } from '../../lib/db'
import { ConfirmButton } from '../ui/ConfirmButton'
import { EventPicker } from './EventPicker'

interface Props {
  sessions: Session[]
  active: Session
  onSelect: (id: string) => void
  onCreate: () => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onEventChange: (id: string, event: string) => void
}

/** Pick, create, rename and delete sessions, and set the session's event. */
export function SessionBar({
  sessions,
  active,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onEventChange,
}: Props) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState('')

  const startRename = () => {
    setDraft(active.name)
    setRenaming(true)
  }
  const commitRename = () => {
    const name = draft.trim()
    if (name && name !== active.name) onRename(active.id, name)
    setRenaming(false)
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      {/* row 1: the session picker (or the rename field) */}
      <div className="flex items-center gap-3">
        {renaming ? (
          <form
            className="flex min-w-0 flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              commitRename()
            }}
          >
            <input
              className="min-w-0 flex-1 border px-1"
              value={draft}
              autoFocus
              maxLength={40}
              aria-label="session name"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setRenaming(false)}
            />
            <button type="submit" className="underline">
              save
            </button>
            <button type="button" className="underline" onClick={() => setRenaming(false)}>
              cancel
            </button>
          </form>
        ) : (
          <select
            className="min-w-0 flex-1 border px-1"
            value={active.id}
            aria-label="active session"
            onChange={(e) => {
              onSelect(e.target.value)
              e.currentTarget.blur() // hand space back to the timer
            }}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* row 2: event and session actions */}
      <div className="flex flex-wrap items-center gap-3">
        <EventPicker value={active.event} onChange={(ev) => onEventChange(active.id, ev)} />
        <button type="button" className="underline" onClick={onCreate}>
          new
        </button>
        <button type="button" className="underline" onClick={startRename} disabled={renaming}>
          rename
        </button>
        {sessions.length > 1 && (
          <ConfirmButton
            key={active.id}
            className="text-red-600 underline dark:text-red-400"
            confirmLabel="yes, delete session and its solves"
            onConfirm={() => onDelete(active.id)}
          >
            delete
          </ConfirmButton>
        )}
      </div>
    </div>
  )
}
