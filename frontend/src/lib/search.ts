import type { Solve } from './db'
import { effectiveMs, type Penalty } from './time'

export type SortKey = 'date-desc' | 'date-asc' | 'time-asc' | 'time-desc'

/** Filters for the all-solves browser. Empty strings mean "any". */
export interface SolveFilters {
  text: string // matched against scramble and notes, case-insensitive
  event: string
  session: string
  from: string // yyyy-mm-dd (local), inclusive
  to: string // yyyy-mm-dd (local), inclusive
  minSec: string // effective time (with +2), seconds
  maxSec: string
  penalty: '' | Penalty
  notes: '' | 'with' | 'without'
  sort: SortKey
}

export const EMPTY_FILTERS: SolveFilters = {
  text: '',
  event: '',
  session: '',
  from: '',
  to: '',
  minSec: '',
  maxSec: '',
  penalty: '',
  notes: '',
  sort: 'date-desc',
}

/** Local midnight of a yyyy-mm-dd date, or undefined if blank/invalid */
export function dayStart(value: string): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return undefined
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime()
}

function seconds(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n * 1000 : undefined
}

/**
 * Apply every filter, then sort. A time range only keeps solves with a time,
 * so DNFs drop out once a min or max is set. Sorting by time puts DNFs last
 * (fastest first) or first (slowest first), like an infinite time.
 */
export function filterSolves(solves: Solve[], f: SolveFilters): Solve[] {
  const text = f.text.trim().toLowerCase()
  const from = dayStart(f.from)
  const toStart = dayStart(f.to)
  const to = toStart === undefined ? undefined : toStart + 86_400_000 // through the end of that day
  const min = seconds(f.minSec)
  const max = seconds(f.maxSec)

  const out = solves.filter((s) => {
    if (f.event && s.event !== f.event) return false
    if (f.session && s.session !== f.session) return false
    if (f.penalty && s.penalty !== f.penalty) return false
    if (f.notes === 'with' && !s.notes) return false
    if (f.notes === 'without' && s.notes) return false
    if (from !== undefined && s.createdAt < from) return false
    if (to !== undefined && s.createdAt >= to) return false
    if (min !== undefined || max !== undefined) {
      const t = effectiveMs(s.timeMs, s.penalty)
      if (t === null) return false
      if (min !== undefined && t < min) return false
      if (max !== undefined && t > max) return false
    }
    if (text && !s.scramble.toLowerCase().includes(text) && !s.notes.toLowerCase().includes(text)) return false
    return true
  })

  const time = (s: Solve) => effectiveMs(s.timeMs, s.penalty) ?? Infinity
  const cmp: Record<SortKey, (a: Solve, b: Solve) => number> = {
    'date-desc': (a, b) => b.createdAt - a.createdAt,
    'date-asc': (a, b) => a.createdAt - b.createdAt,
    'time-asc': (a, b) => time(a) - time(b) || b.createdAt - a.createdAt,
    'time-desc': (a, b) => time(b) - time(a) || b.createdAt - a.createdAt,
  }
  // two DNFs give Infinity - Infinity = NaN, which is falsy, so they fall back to newest first
  return out.sort(cmp[f.sort])
}
