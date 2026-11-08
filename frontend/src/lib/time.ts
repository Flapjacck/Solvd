export type Penalty = 'none' | '+2' | 'DNF'

/** Format milliseconds as m:ss.cc or s.cc */
export function formatMs(ms: number): string {
  const totalCs = Math.floor(ms / 10)
  const cs = totalCs % 100
  const totalSec = Math.floor(totalCs / 100)
  const sec = totalSec % 60
  const min = Math.floor(totalSec / 60)
  const csStr = cs.toString().padStart(2, '0')
  if (min > 0) return `${min}:${sec.toString().padStart(2, '0')}.${csStr}`
  return `${sec}.${csStr}`
}

/** Effective time after penalty, or null for DNF */
export function effectiveMs(ms: number, penalty: Penalty): number | null {
  if (penalty === 'DNF') return null
  return penalty === '+2' ? ms + 2000 : ms
}

export function formatSolve(ms: number, penalty: Penalty): string {
  if (penalty === 'DNF') return 'DNF'
  const t = formatMs(effectiveMs(ms, penalty)!)
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

export function formatStat(v: number | null | undefined): string {
  if (v === undefined) return '-'
  if (v === null) return 'DNF'
  return formatMs(v)
}
