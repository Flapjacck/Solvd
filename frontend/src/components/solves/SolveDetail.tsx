import { useState } from 'react'
import { localStore, type Solve } from '../../lib/db'
import { formatDateLong, formatSolve } from '../../lib/time'
import { Modal } from '../ui/Modal'
import { SolveActions } from './SolveActions'
import { useSettings } from '../../hooks/useSettings'
import { getEvent } from '../../lib/events'

interface Props {
  solve: Solve
  /** Position in its list, shown in the title ("Solve 12"). Left out in the all-solves browser. */
  number?: number
  /** Session name, shown when the solve isn't from the current session's list */
  sessionName?: string
  onClose: () => void
}

/** Modal with a solve's time, date, scramble, penalty and an editable note. */
export function SolveDetail({ solve, number, sessionName, onClose }: Props) {
  const [notes, setNotes] = useState(solve.notes)
  const { precision } = useSettings()

  const saveNotes = async () => {
    const trimmed = notes.trim()
    if (trimmed !== solve.notes) await localStore.update(solve.id, { notes: trimmed })
  }

  const close = async () => {
    await saveNotes()
    onClose()
  }

  return (
    <Modal title={number === undefined ? 'Solve' : `Solve ${number}`} onClose={() => void close()}>
        <p className="text-4xl tabular-nums">{formatSolve(solve.timeMs, solve.penalty, precision)}</p>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-gray-500 dark:text-gray-400">date</dt>
          <dd>
            <time dateTime={new Date(solve.createdAt).toISOString()}>{formatDateLong(solve.createdAt)}</time>
          </dd>
          <dt className="text-gray-500 dark:text-gray-400">event</dt>
          <dd>{getEvent(solve.event).label}</dd>
          {sessionName !== undefined && (
            <>
              <dt className="text-gray-500 dark:text-gray-400">session</dt>
              <dd>{sessionName}</dd>
            </>
          )}
          <dt className="text-gray-500 dark:text-gray-400">scramble</dt>
          <dd className="break-words">{solve.scramble}</dd>
        </dl>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500 dark:text-gray-400">notes</span>
          <textarea
            className="min-h-20 border p-1"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => void saveNotes()}
            placeholder="e.g. lucky PLL skip"
          />
        </label>

        <SolveActions solve={solve} onDeleted={onClose} />
    </Modal>
  )
}
