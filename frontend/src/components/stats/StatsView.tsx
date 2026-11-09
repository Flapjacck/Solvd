import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Session } from '../../lib/db'
import { EVENTS, getEvent } from '../../lib/events'
import { breakdown, computeStats, histogram } from '../../lib/stats'
import {
  DEFAULT_STATS_PREFS,
  SERIES,
  loadStatsPrefs,
  saveStatsPrefs,
  selectSolves,
  type RangeKind,
  type StatsPrefs,
} from '../../lib/statsPrefs'
import { useSettings } from '../../hooks/useSettings'
import { Modal } from '../ui/Modal'
import { SegmentButton } from '../ui/SegmentButton'
import { SectionTitle } from '../sidebar/Sidebar'
import { SERIES_STYLE } from './chart'
import { TrendChart } from './TrendChart'
import { HistogramChart } from './HistogramChart'
import { BreakdownTable, PbHistory, SummaryTable } from './StatsTables'

interface Props {
  sessions: Session[]
  onClose: () => void
}

/**
 * Stats across any mix of sessions and events: a trend or distribution chart,
 * averages, PB history and per session / per event breakdowns.
 * Lazy-loaded from App so the chart code stays out of the main bundle.
 */
export function StatsView({ sessions, onClose }: Props) {
  const { precision } = useSettings()
  const live = useLiveQuery(() => db.solves.toArray(), [])
  const [prefs, setPrefs] = useState<StatsPrefs>(loadStatsPrefs)
  useEffect(() => saveStatsPrefs(prefs), [prefs])
  const set = <K extends keyof StatsPrefs>(key: K, value: StatsPrefs[K]) => setPrefs((p) => ({ ...p, [key]: value }))

  const selected = useMemo(() => selectSolves(live ?? [], prefs), [live, prefs])
  const stats = useMemo(() => computeStats(selected), [selected])
  const hist = useMemo(() => (prefs.chart === 'histogram' ? histogram(stats.times) : undefined), [prefs.chart, stats])
  const bySession = useMemo(() => breakdown(selected, (s) => s.session), [selected])
  const byEvent = useMemo(() => breakdown(selected, (s) => s.event), [selected])

  const excluded = new Set(prefs.excludedSessions)
  const included = sessions.filter((s) => !excluded.has(s.id)).length
  const toggleSession = (id: string) =>
    set('excludedSessions', excluded.has(id) ? prefs.excludedSessions.filter((x) => x !== id) : [...prefs.excludedSessions, id])
  const sessionName = (id: string) => sessions.find((s) => s.id === id)?.name ?? 'deleted session'

  return (
    <Modal title="Stats" width="max-w-4xl" onClose={onClose}>
      <div className="flex flex-col gap-2 text-sm" data-controls>
        <Row label={`sessions (${included} of ${sessions.length})`}>
          <div className="flex flex-wrap gap-1" role="group" aria-label="sessions" data-sessions>
            {sessions.map((s) => (
              <SegmentButton key={s.id} active={!excluded.has(s.id)} onClick={() => toggleSession(s.id)}>
                {s.name}
              </SegmentButton>
            ))}
          </div>
          <span className="flex gap-2">
            <button type="button" className="underline" onClick={() => set('excludedSessions', [])}>
              all
            </button>
            <button type="button" className="underline" onClick={() => set('excludedSessions', sessions.map((s) => s.id))}>
              none
            </button>
          </span>
        </Row>
        <Row label="event">
          <select className="border px-1" aria-label="event" value={prefs.event} onChange={(e) => set('event', e.target.value)}>
            <option value="">all events</option>
            {EVENTS.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="range">
          <div className="flex flex-wrap gap-1" role="group" aria-label="range">
            {(
              [
                ['all', 'all solves'],
                ['last', 'last N'],
                ['dates', 'dates'],
              ] as [RangeKind, string][]
            ).map(([v, l]) => (
              <SegmentButton key={v} active={prefs.range === v} onClick={() => set('range', v)}>
                {l}
              </SegmentButton>
            ))}
          </div>
          {prefs.range === 'last' && <LastNInput value={prefs.lastN} onChange={(n) => set('lastN', n)} />}
          {prefs.range === 'dates' && (
            <span className="flex flex-wrap items-center gap-1">
              <input type="date" className="border px-1" aria-label="from date" value={prefs.from} onChange={(e) => set('from', e.target.value)} />
              <span>to</span>
              <input type="date" className="border px-1" aria-label="to date" value={prefs.to} onChange={(e) => set('to', e.target.value)} />
            </span>
          )}
        </Row>
        <Row label="chart">
          <div className="flex flex-wrap gap-1" role="group" aria-label="chart">
            <SegmentButton active={prefs.chart === 'trend'} onClick={() => set('chart', 'trend')}>
              trend
            </SegmentButton>
            <SegmentButton active={prefs.chart === 'histogram'} onClick={() => set('chart', 'histogram')}>
              distribution
            </SegmentButton>
          </div>
        </Row>
        {prefs.chart === 'trend' && (
          <Row label="show">
            <div className="flex flex-wrap gap-1" role="group" aria-label="series">
              {SERIES.map((s) => (
                <SegmentButton
                  key={s.id}
                  active={prefs.series[s.id]}
                  onClick={() => set('series', { ...prefs.series, [s.id]: !prefs.series[s.id] })}
                >
                  <span className="inline-flex items-center gap-1">
                    <span className={`inline-block size-2 rounded-full ${SERIES_STYLE[s.id].swatch}`} aria-hidden />
                    {s.label}
                  </span>
                </SegmentButton>
              ))}
            </div>
          </Row>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-gray-500 dark:text-gray-400" data-selected-count>
            {live === undefined ? 'loading…' : `${selected.length} of ${live.length} solves`}
          </span>
          <button type="button" className="underline" onClick={() => setPrefs(DEFAULT_STATS_PREFS)}>
            reset
          </button>
        </div>
      </div>

      {prefs.chart === 'trend' ? (
        <TrendChart solves={selected} stats={stats} series={prefs.series} precision={precision} />
      ) : (
        <HistogramChart hist={hist} />
      )}

      <SummaryTable summary={stats.summary} precision={precision} />
      <PbHistory key={selected.length} pbs={stats.pbs} precision={precision} />
      {selected.length > 0 && (
        <>
          <BreakdownTable title="By session" id="session" rows={bySession} name={sessionName} precision={precision} />
          <BreakdownTable title="By event" id="event" rows={byEvent} name={(id) => getEvent(id).label} precision={precision} />
        </>
      )}
    </Modal>
  )
}

/** Typed as text so it can be cleared while editing; only whole numbers of 1 or more are saved */
function LastNInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  return (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      step={1}
      className="w-20 border px-1"
      aria-label="last N solves"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value)
        const n = Math.floor(Number(e.target.value))
        if (n >= 1) onChange(n)
      }}
      onBlur={() => setDraft(String(value))}
    />
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
      <span className="sm:w-40">
        <SectionTitle>{label}</SectionTitle>
      </span>
      {children}
    </div>
  )
}
