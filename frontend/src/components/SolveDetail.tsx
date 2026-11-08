import { useEffect, useRef, useState } from 'react'
import { localStore, type Solve } from '../lib/db'
import { formatDateLong, formatSolve } from '../lib/time'
import { SolveActions } from './SolveActions'

interface Props {
  solve: Solve
  number: number
  onClose: () => void
}

/** Modal with a solve's time, date, scramble, penalty and an editable note. */
export function SolveDetail({ solve, number, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [notes, setNotes] = useState(solve.notes)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const saveNotes = async () => {
    const trimmed = notes.trim()
    if (trimmed !== solve.notes) await localStore.update(solve.id, { notes: trimmed })
  }

  const close = async () => {
    await saveNotes()
    onClose()
  }

  return (
    <dialog
      ref={ref}
      className="m-auto w-full max-w-lg p-4 font-mono backdrop:bg-black/40"
      onCancel={(e) => {
        // Esc: save the note before closing
        e.preventDefault()
        void close()
      }}
    >
      <div className="flex flex-col gap-3">
        <header className="flex items-baseline justify-between">
          <h2 className="font-bold">Solve {number}</h2>
          <button className="underline" onClick={() => void close()}>
            close
          </button>
        </header>

        <p className="text-4xl tabular-nums">{formatSolve(solve.timeMs, solve.penalty)}</p>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-gray-500">date</dt>
          <dd>
            <time dateTime={new Date(solve.createdAt).toISOString()}>{formatDateLong(solve.createdAt)}</time>
          </dd>
          <dt className="text-gray-500">event</dt>
          <dd>{solve.event}</dd>
          <dt className="text-gray-500">scramble</dt>
          <dd className="break-words">{solve.scramble}</dd>
        </dl>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">notes</span>
          <textarea
            className="min-h-20 border p-1"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => void saveNotes()}
            placeholder="e.g. lucky PLL skip"
          />
        </label>

        <SolveActions solve={solve} onDeleted={onClose} />
      </div>
    </dialog>
  )
}
