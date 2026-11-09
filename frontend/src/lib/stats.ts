/**
 * Pure stats over solves: summaries, rolling averages, PB history, breakdowns
 * and histogram bins. No React or Dexie here, so it's easy to test and reuse.
 *
 * Times are effective ms (with +2), null for DNF. Lists are oldest first unless noted.
 */
import type { Solve } from './db'
import { averageTrim, effectiveMs } from './time'

export const AVERAGE_SIZES = [5, 12, 50, 100] as const
export type AverageSize = (typeof AVERAGE_SIZES)[number]

/** Effective time, null for DNF */
export type Time = number | null
/** An average: a time, null for DNF, undefined when there aren't enough solves */
export type Average = number | null | undefined

export function toTimes(solves: Solve[]): Time[] {
  return solves.map((s) => effectiveMs(s.timeMs, s.penalty))
}

/** Fastest non-DNF time. A loop, not Math.min(...), so huge lists can't overflow the stack. */
export function bestSingle(times: Time[]): number | undefined {
  let best: number | undefined
  for (const t of times) if (t !== null && (best === undefined || t < best)) best = t
  return best
}

/** First index in a sorted array whose value is >= v */
function lowerBound(arr: number[], v: number): number {
  let lo = 0
  let hi = arr.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] < v) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * Rolling average of n at every solve (oldest first): out[i] averages times[i-n+1..i]
 * with the same rules as averageOf (trim averageTrim(n) from each end, too many DNFs = DNF).
 *
 * The window is kept sorted (binary search insert and remove) with a running sum, so each
 * step costs a search plus a small array shift and O(trim) for the trimmed ends, not a sort.
 */
export function rollingAverages(times: Time[], n: number): Average[] {
  const trim = averageTrim(n)
  const out: Average[] = new Array<Average>(times.length)
  const win: number[] = [] // sorted, DNF as Infinity
  let finiteSum = 0
  let dnfs = 0
  for (let i = 0; i < times.length; i++) {
    const t = times[i]
    win.splice(lowerBound(win, t ?? Infinity), 0, t ?? Infinity)
    if (t === null) dnfs++
    else finiteSum += t
    if (i >= n) {
      const old = times[i - n]
      win.splice(lowerBound(win, old ?? Infinity), 1)
      if (old === null) dnfs--
      else finiteSum -= old
    }
    if (i < n - 1) {
      out[i] = undefined
      continue
    }
    if (dnfs > trim) {
      out[i] = null
      continue
    }
    // every DNF sits in the top `trim`, so only finite values are left in the middle
    let dropped = 0
    for (let k = 0; k < trim; k++) {
      dropped += win[k]
      const hi = win[n - 1 - k]
      if (hi !== Infinity) dropped += hi
    }
    out[i] = (finiteSum - dropped) / (n - 2 * trim)
  }
  return out
}

/** Smallest non-DNF average in a rolling list */
export function bestAverage(rolling: Average[]): Average {
  let best: Average
  for (const a of rolling) {
    if (a === undefined) continue
    if (a === null) {
      if (best === undefined) best = null // only DNF averages so far
    } else if (best === undefined || best === null || a < best) best = a
  }
  return best
}

export interface Summary {
  count: number
  dnfs: number
  /** Mean of the non-DNF solves */
  mean: number | undefined
  best: number | undefined
  /** Slowest non-DNF solve */
  worst: number | undefined
  /** Average of the latest n solves */
  current: Record<AverageSize, Average>
  /** Best average of n anywhere in the list */
  bestAvg: Record<AverageSize, Average>
}

export type PbKind = 'single' | 'ao5' | 'ao12'
export const PB_KINDS: readonly PbKind[] = ['single', 'ao5', 'ao12']

export interface PbEntry {
  kind: PbKind
  /** Index in the (oldest-first) list the PB was set at */
  index: number
  at: number // createdAt of that solve
  value: number
  /** The PB it beat; undefined for the first one */
  prev: number | undefined
}

export interface Stats {
  times: Time[]
  rolling: Record<AverageSize, Average[]>
  summary: Summary
  /** Every time the single, ao5 or ao12 PB improved, oldest first */
  pbs: PbEntry[]
}

/** Everything the stats view needs for a list of solves, oldest first. */
export function computeStats(solves: Solve[]): Stats {
  const times = toTimes(solves)
  const rolling = {} as Record<AverageSize, Average[]>
  const current = {} as Record<AverageSize, Average>
  const bestAvg = {} as Record<AverageSize, Average>
  for (const n of AVERAGE_SIZES) {
    rolling[n] = rollingAverages(times, n)
    current[n] = rolling[n][times.length - 1]
    bestAvg[n] = bestAverage(rolling[n])
  }

  let sum = 0
  let valid = 0
  let worst: number | undefined
  for (const t of times) {
    if (t === null) continue
    sum += t
    valid++
    if (worst === undefined || t > worst) worst = t
  }

  return {
    times,
    rolling,
    summary: {
      count: times.length,
      dnfs: times.length - valid,
      mean: valid ? sum / valid : undefined,
      best: bestSingle(times),
      worst,
      current,
      bestAvg,
    },
    pbs: pbHistory(solves, { single: times, ao5: rolling[5], ao12: rolling[12] }),
  }
}

/** When each kind's best improved (strictly faster). DNF and too-short averages never count. */
export function pbHistory(solves: Solve[], series: Record<PbKind, Average[]>): PbEntry[] {
  const out: PbEntry[] = []
  for (const kind of PB_KINDS) {
    let best: number | undefined
    series[kind].forEach((v, index) => {
      if (v === null || v === undefined) return
      if (best === undefined || v < best) {
        out.push({ kind, index, at: solves[index].createdAt, value: v, prev: best })
        best = v
      }
    })
  }
  return out.sort((a, b) => a.index - b.index || PB_KINDS.indexOf(a.kind) - PB_KINDS.indexOf(b.kind))
}

export interface BreakdownRow {
  key: string
  count: number
  best: number | undefined
  mean: number | undefined
  bestAo5: Average
  bestAo12: Average
}

/** One row per group (e.g. per session or event), in first-seen order. Solves oldest first. */
export function breakdown(solves: Solve[], keyOf: (s: Solve) => string): BreakdownRow[] {
  const groups = new Map<string, Solve[]>()
  for (const s of solves) {
    const k = keyOf(s)
    const g = groups.get(k)
    if (g) g.push(s)
    else groups.set(k, [s])
  }
  return [...groups].map(([key, group]) => {
    const times = toTimes(group)
    const valid = times.filter((t): t is number => t !== null)
    return {
      key,
      count: group.length,
      best: bestSingle(times),
      mean: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : undefined,
      bestAo5: bestAverage(rollingAverages(times, 5)),
      bestAo12: bestAverage(rollingAverages(times, 12)),
    }
  })
}

export interface Histogram {
  start: number // ms at the left edge of the first bin
  width: number // ms per bin
  counts: number[]
}

const BIN_WIDTHS = [10, 20, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10_000, 15_000, 30_000, 60_000, 120_000, 300_000]

/** Non-DNF times in at most maxBins bins of a round width (0.5s, 1s, 2s…). */
export function histogram(times: Time[], maxBins = 24): Histogram | undefined {
  let min = Infinity
  let max = -Infinity
  for (const t of times) {
    if (t === null) continue
    if (t < min) min = t
    if (t > max) max = t
  }
  if (min === Infinity) return undefined
  const width =
    BIN_WIDTHS.find((w) => Math.floor(max / w) - Math.floor(min / w) + 1 <= maxBins) ??
    Math.ceil((max - min + 1) / maxBins)
  const start = Math.floor(min / width) * width
  const counts = new Array<number>(Math.floor((max - start) / width) + 1).fill(0)
  for (const t of times) if (t !== null) counts[Math.floor((t - start) / width)]++
  return { start, width, counts }
}
