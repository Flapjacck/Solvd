import type { Solve } from '../lib/db'
import { formatDateLong, formatDateShort, formatSolve } from '../lib/time'
import { useSettings } from '../hooks/useSettings'

interface Props {
  solves: Solve[]
  onSelect: (id: string) => void
}

/** Newest-first list of solves. Click a row to open its details. */
export function SolveList({ solves, onSelect }: Props) {
  const { precision } = useSettings()
  if (!solves.length) return <p className="text-sm text-gray-500 dark:text-gray-400">no solves yet</p>

  return (
    <ol className="flex flex-col">
      {solves.map((s, i) => (
        <li key={s.id} className="border-b">
          <button
            className="flex w-full items-center gap-3 py-1 text-left hover:bg-gray-100 dark:hover:bg-neutral-800"
            onClick={() => onSelect(s.id)}
          >
            <span className="w-8 text-gray-500 dark:text-gray-400">{solves.length - i}.</span>
            <span className="flex-1 tabular-nums">{formatSolve(s.timeMs, s.penalty, precision)}</span>
            <time
              className="text-xs text-gray-500 dark:text-gray-400"
              dateTime={new Date(s.createdAt).toISOString()}
              title={formatDateLong(s.createdAt)}
            >
              {formatDateShort(s.createdAt)}
            </time>
            {s.notes && (
              <span className="text-xs" title={s.notes} aria-label="has note">
                [note]
              </span>
            )}
          </button>
        </li>
      ))}
    </ol>
  )
}
