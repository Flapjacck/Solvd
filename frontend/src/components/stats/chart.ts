/** Shared bits for the hand-drawn SVG charts (no chart library: they're small and lazy-loaded). */
import { formatMs } from '../../lib/time'
import type { SeriesId } from '../../lib/statsPrefs'

export const CHART_HEIGHT = 220
export const MARGIN = { top: 8, right: 8, bottom: 22, left: 44 }

/** Stroke colour per series; the toggles use the matching bg- class as a swatch */
export const SERIES_STYLE: Record<SeriesId, { stroke: string; fill: string; swatch: string }> = {
  single: { stroke: 'stroke-gray-400 dark:stroke-neutral-500', fill: 'fill-gray-400 dark:fill-neutral-500', swatch: 'bg-gray-400 dark:bg-neutral-500' },
  ao5: { stroke: 'stroke-blue-500', fill: 'fill-blue-500', swatch: 'bg-blue-500' },
  ao12: { stroke: 'stroke-emerald-500', fill: 'fill-emerald-500', swatch: 'bg-emerald-500' },
  ao50: { stroke: 'stroke-amber-500', fill: 'fill-amber-500', swatch: 'bg-amber-500' },
  ao100: { stroke: 'stroke-rose-500', fill: 'fill-rose-500', swatch: 'bg-rose-500' },
  pb: { stroke: 'stroke-yellow-400', fill: 'fill-yellow-400', swatch: 'bg-yellow-400' },
}

/** About `count` round tick values covering [min, max] */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (max <= min) return [min]
  const raw = (max - min) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(v)
  return ticks
}

/** Axis label for a time: "12", "12.5", "1:05" (whole seconds lose the .00) */
export function formatTick(ms: number): string {
  return formatMs(ms, 2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}
