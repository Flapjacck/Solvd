/**
 * What the stats view shows, remembered per device in localStorage (solvd.stats).
 * Sessions are stored as the ones you turned off, so every session, including new
 * ones, is in the charts by default.
 */
import type { Solve } from './db'
import { dayStart } from './search'

export type SeriesId = 'single' | 'ao5' | 'ao12' | 'ao50' | 'ao100' | 'pb'
export const SERIES: readonly { id: SeriesId; label: string }[] = [
  { id: 'single', label: 'single' },
  { id: 'ao5', label: 'ao5' },
  { id: 'ao12', label: 'ao12' },
  { id: 'ao50', label: 'ao50' },
  { id: 'ao100', label: 'ao100' },
  { id: 'pb', label: 'PBs' },
]

export type RangeKind = 'all' | 'last' | 'dates'
export type ChartKind = 'trend' | 'histogram'

export interface StatsPrefs {
  excludedSessions: string[]
  event: string // '' = every event
  range: RangeKind
  lastN: number
  from: string // yyyy-mm-dd, local, inclusive
  to: string
  series: Record<SeriesId, boolean>
  chart: ChartKind
}

export const DEFAULT_STATS_PREFS: StatsPrefs = {
  excludedSessions: [],
  event: '',
  range: 'all',
  lastN: 100,
  from: '',
  to: '',
  series: { single: true, ao5: true, ao12: true, ao50: false, ao100: false, pb: true },
  chart: 'trend',
}

const KEY = 'solvd.stats'

export function loadStatsPrefs(): StatsPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_STATS_PREFS
    const p = JSON.parse(raw) as Partial<StatsPrefs>
    return {
      ...DEFAULT_STATS_PREFS,
      ...p,
      excludedSessions: Array.isArray(p.excludedSessions) ? p.excludedSessions : [],
      series: { ...DEFAULT_STATS_PREFS.series, ...p.series },
    }
  } catch {
    return DEFAULT_STATS_PREFS
  }
}

export function saveStatsPrefs(prefs: StatsPrefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}

/** The solves the stats view covers, oldest first: sessions, then event, then the range. */
export function selectSolves(solves: Solve[], p: StatsPrefs): Solve[] {
  const excluded = new Set(p.excludedSessions)
  const from = p.range === 'dates' ? dayStart(p.from) : undefined
  const toStart = p.range === 'dates' ? dayStart(p.to) : undefined
  const to = toStart === undefined ? undefined : toStart + 86_400_000 // through the end of that day
  const out = solves
    .filter(
      (s) =>
        !excluded.has(s.session) &&
        (!p.event || s.event === p.event) &&
        (from === undefined || s.createdAt >= from) &&
        (to === undefined || s.createdAt < to),
    )
    .sort((a, b) => a.createdAt - b.createdAt)
  return p.range === 'last' && p.lastN > 0 ? out.slice(-p.lastN) : out
}
