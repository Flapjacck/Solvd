import { useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Session, type Solve } from '../../lib/db'
import { EVENTS, getEvent } from '../../lib/events'
import { EMPTY_FILTERS, filterSolves, type SolveFilters } from '../../lib/search'
import { formatDateLong, formatDateShort, formatSolve } from '../../lib/time'
import { useSettings } from '../../hooks/useSettings'
import { Modal } from '../ui/Modal'
import { SolveDetail } from './SolveDetail'

const PAGE_SIZE = 50

interface Props {
  sessions: Session[]
  onClose: () => void
}

/** Every saved solve across sessions and events: search, filter, sort, 50 per page. */
export function AllSolves({ sessions, onClose }: Props) {
  const { precision } = useSettings()
  // Filtering happens in memory; even tens of thousands of solves are quick, and no new index is needed
  const live = useLiveQuery(() => db.solves.toArray(), [])
  const [filters, setFilters] = useState<SolveFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const results = useMemo(() => filterSolves(live ?? [], filters), [live, filters])
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1) // e.g. after deleting the last solve on the last page
  const shown = results.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const sessionName = (id: string) => sessions.find((s) => s.id === id)?.name ?? 'deleted session'
  const selected = selectedId ? live?.find((s) => s.id === selectedId) : undefined

  // any filter change goes back to the first page
  const set = <K extends keyof SolveFilters>(key: K, value: SolveFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(0)
  }
  const filtered = Object.entries(filters).some(([k, v]) => k !== 'sort' && v !== '')

  return (
    <>
      <Modal title="All solves" width="max-w-3xl" onClose={onClose}>
        <div className="flex flex-col gap-2 text-sm" data-filters>
          <input
            type="search"
            className="border px-1 py-0.5"
            placeholder="search scrambles and notes"
            aria-label="search"
            value={filters.text}
            onChange={(e) => set('text', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="event">
              <select className="border px-1" value={filters.event} onChange={(e) => set('event', e.target.value)}>
                <option value="">all</option>
                {EVENTS.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="session">
              <select className="border px-1" value={filters.session} onChange={(e) => set('session', e.target.value)}>
                <option value="">all</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="penalty">
              <select
                className="border px-1"
                value={filters.penalty}
                onChange={(e) => set('penalty', e.target.value as SolveFilters['penalty'])}
              >
                <option value="">any</option>
                <option value="none">none</option>
                <option value="+2">+2</option>
                <option value="DNF">DNF</option>
              </select>
            </Field>
            <Field label="notes">
              <select
                className="border px-1"
                value={filters.notes}
                onChange={(e) => set('notes', e.target.value as SolveFilters['notes'])}
              >
                <option value="">any</option>
                <option value="with">has notes</option>
                <option value="without">no notes</option>
              </select>
            </Field>
            <Field label="from date">
              <input type="date" className="border px-1" value={filters.from} onChange={(e) => set('from', e.target.value)} />
            </Field>
            <Field label="to date">
              <input type="date" className="border px-1" value={filters.to} onChange={(e) => set('to', e.target.value)} />
            </Field>
            <Field label="min time (s)">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                className="border px-1"
                value={filters.minSec}
                onChange={(e) => set('minSec', e.target.value)}
              />
            </Field>
            <Field label="max time (s)">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                className="border px-1"
                value={filters.maxSec}
                onChange={(e) => set('maxSec', e.target.value)}
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Field label="sort" inline>
              <select
                className="border px-1"
                value={filters.sort}
                onChange={(e) => set('sort', e.target.value as SolveFilters['sort'])}
              >
                <option value="date-desc">newest first</option>
                <option value="date-asc">oldest first</option>
                <option value="time-asc">fastest first</option>
                <option value="time-desc">slowest first</option>
              </select>
            </Field>
            <span className="text-gray-500 dark:text-gray-400" data-count>
              {live === undefined ? 'loading…' : `${results.length} of ${live.length} solves`}
            </span>
            {filtered && (
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setFilters((f) => ({ ...EMPTY_FILTERS, sort: f.sort }))
                  setPage(0)
                }}
              >
                clear filters
              </button>
            )}
          </div>
        </div>

        {live !== undefined && !results.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{live.length ? 'no solves match' : 'no solves yet'}</p>
        ) : (
          <ol className="flex flex-col text-sm" data-results>
            {shown.map((s) => (
              <ResultRow
                key={s.id}
                solve={s}
                session={sessionName(s.session)}
                time={formatSolve(s.timeMs, s.penalty, precision)}
                onSelect={() => setSelectedId(s.id)}
              />
            ))}
          </ol>
        )}

        {pages > 1 && (
          <nav className="flex items-center justify-center gap-4 text-sm" aria-label="pages">
            <button type="button" className="underline disabled:opacity-40" disabled={current === 0} onClick={() => setPage(current - 1)}>
              prev
            </button>
            <span data-page>
              page {current + 1} of {pages}
            </span>
            <button
              type="button"
              className="underline disabled:opacity-40"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            >
              next
            </button>
          </nav>
        )}
      </Modal>

      {/* a sibling, not a child, so Esc in the detail doesn't also close this list */}
      {selected && (
        <SolveDetail
          key={selected.id}
          solve={selected}
          sessionName={sessionName(selected.session)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  )
}

function Field({ label, inline, children }: { label: string; inline?: boolean; children: ReactNode }) {
  return (
    <label className={`flex min-w-0 gap-1 ${inline ? 'items-center' : 'flex-col'} [&>*:last-child]:min-w-0`}>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      {children}
    </label>
  )
}

function ResultRow({ solve, session, time, onSelect }: { solve: Solve; session: string; time: string; onSelect: () => void }) {
  return (
    <li className="border-b">
      <button
        type="button"
        className="flex w-full flex-col gap-0.5 py-1 text-left hover:bg-gray-100 dark:hover:bg-neutral-800"
        onClick={onSelect}
        data-solve-id={solve.id}
      >
        <span className="flex items-baseline gap-3">
          <span className="w-20 tabular-nums">{time}</span>
          <span className="w-16 shrink-0 text-xs">{getEvent(solve.event).label}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400">{session}</span>
          <time
            className="shrink-0 text-xs text-gray-500 dark:text-gray-400"
            dateTime={new Date(solve.createdAt).toISOString()}
            title={formatDateLong(solve.createdAt)}
          >
            {formatDateShort(solve.createdAt)}
          </time>
        </span>
        <span className="truncate text-xs text-gray-500 dark:text-gray-400">
          {solve.scramble}
          {solve.notes && <span className="text-gray-900 dark:text-gray-100"> · {solve.notes}</span>}
        </span>
      </button>
    </li>
  )
}
