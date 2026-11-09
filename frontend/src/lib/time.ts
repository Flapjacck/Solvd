export type Penalty = 'none' | '+2' | 'DNF'

/** Decimal places shown: 2 (0.01s) or 3 (0.001s). Times are truncated, never rounded up. */
export type Precision = 2 | 3

/** Format milliseconds as m:ss.cc / s.cc (or .ccc with precision 3) */
export function formatMs(ms: number, precision: Precision = 2): string {
  const unit = precision === 3 ? 1 : 10
  const perSec = 1000 / unit
  const total = Math.floor(ms / unit)
  const frac = total % perSec
  const totalSec = Math.floor(total / perSec)
  const sec = totalSec % 60
  const min = Math.floor(totalSec / 60)
  const fracStr = frac.toString().padStart(precision, '0')
  if (min > 0) return `${min}:${sec.toString().padStart(2, '0')}.${fracStr}`
  return `${sec}.${fracStr}`
}

/** Effective time after penalty, or null for DNF */
export function effectiveMs(ms: number, penalty: Penalty): number | null {
  if (penalty === 'DNF') return null
  return penalty === '+2' ? ms + 2000 : ms
}

export function formatSolve(ms: number, penalty: Penalty, precision: Precision = 2): string {
  if (penalty === 'DNF') return 'DNF'
  const t = formatMs(effectiveMs(ms, penalty)!, precision)
  return penalty === '+2' ? `${t}+` : t
}

/**
 * WCA-style average of the last n solves: drop best and worst, mean the rest.
 * More than one DNF in the window makes the average DNF. Returns undefined if not enough solves.
 */
export function averageOf(times: (number | null)[], n: number): number | null | undefined {
  if (times.length < n) return undefined
  const window = times.slice(0, n)
  const dnfs = window.filter((t) => t === null).length
  if (dnfs > 1) return null
  const sorted = window
    .map((t) => (t === null ? Infinity : t))
    .sort((a, b) => a - b)
    .slice(1, -1)
  return sorted.reduce((a, b) => a + b, 0) / sorted.length
}

export function formatStat(v: number | null | undefined, precision: Precision = 2): string {
  if (v === undefined) return '-'
  if (v === null) return 'DNF'
  return formatMs(v, precision)
}

const shortDate = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const longDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'medium' })

/** Solve timestamp for lists, e.g. "Nov 8, 4:58 PM" (user's locale and time zone) */
export function formatDateShort(epochMs: number): string {
  return shortDate.format(epochMs)
}

/** Full solve timestamp, e.g. "Sunday, November 8, 2026 at 4:58:05 PM" */
export function formatDateLong(epochMs: number): string {
  return longDate.format(epochMs)
}

export const INSPECTION_MS = 15000
export const INSPECTION_DNF_MS = 17000

/** WCA inspection penalty for how long inspection lasted before the solve started */
export function inspectionPenalty(inspectMs: number): Penalty {
  if (inspectMs > INSPECTION_DNF_MS) return 'DNF'
  if (inspectMs > INSPECTION_MS) return '+2'
  return 'none'
}
