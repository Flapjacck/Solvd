import { useState } from 'react'
import type { Solve } from '../../lib/db'
import { type Average, type PbKind, type Stats } from '../../lib/stats'
import type { SeriesId } from '../../lib/statsPrefs'
import { formatDateShort, formatStat, type Precision } from '../../lib/time'
import { useElementWidth } from '../../hooks/useElementWidth'
import { CHART_HEIGHT, MARGIN, SERIES_STYLE, formatTick, niceTicks } from './chart'

type LineId = Exclude<SeriesId, 'pb'>
const LINES: readonly LineId[] = ['single', 'ao5', 'ao12', 'ao50', 'ao100']

interface Props {
  solves: Solve[] // oldest first, same order as stats
  stats: Stats
  series: Record<SeriesId, boolean>
  precision: Precision
}

function values(stats: Stats, id: LineId): Average[] {
  switch (id) {
    case 'single':
      return stats.times
    case 'ao5':
      return stats.rolling[5]
    case 'ao12':
      return stats.rolling[12]
    case 'ao50':
      return stats.rolling[50]
    case 'ao100':
      return stats.rolling[100]
  }
}

/** Times and rolling averages by solve number, with optional PB markers. Hover or touch for values. */
export function TrendChart({ solves, stats, series, precision }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const n = solves.length

  const lines = LINES.filter((id) => series[id]).map((id) => ({ id, data: values(stats, id) }))
  const pbs = series.pb ? stats.pbs : []

  let min = Infinity
  let max = -Infinity
  for (const { data } of lines)
    for (const v of data)
      if (v !== null && v !== undefined) {
        if (v < min) min = v
        if (v > max) max = v
      }
  for (const p of pbs) {
    if (p.value < min) min = p.value
    if (p.value > max) max = p.value
  }

  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right)
  const plotH = CHART_HEIGHT - MARGIN.top - MARGIN.bottom
  const empty = min === Infinity
  if (!empty && min === max) {
    min -= 500
    max += 500
  }
  const pad = (max - min) * 0.05
  const lo = min - pad
  const hi = max + pad
  const x = (i: number) => MARGIN.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const y = (v: number) => MARGIN.top + (1 - (v - lo) / (hi - lo)) * plotH

  // DNFs and not-enough-solves leave gaps in the line
  const path = (data: Average[]) => {
    let d = ''
    let pen = false
    data.forEach((v, i) => {
      if (v === null || v === undefined) {
        pen = false
        return
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`
      pen = true
    })
    return d
  }

  const shown = hover ?? n - 1
  const pbStyle: Record<PbKind, string> = { single: SERIES_STYLE.single.fill, ao5: SERIES_STYLE.ao5.fill, ao12: SERIES_STYLE.ao12.fill }

  return (
    <div className="flex flex-col gap-1">
      <div ref={ref} className="w-full">
        {width > 0 && (
          <svg
            width={width}
            height={CHART_HEIGHT}
            className="block touch-pan-y select-none"
            data-chart="trend"
            role="img"
            aria-label="time trend"
            onPointerMove={(e) => {
              if (n === 0) return
              const px = e.clientX - e.currentTarget.getBoundingClientRect().left
              const i = n <= 1 ? 0 : Math.round(((px - MARGIN.left) / plotW) * (n - 1))
              setHover(Math.min(n - 1, Math.max(0, i)))
            }}
            onPointerLeave={() => setHover(null)}
          >
            {empty ? (
              <text x={width / 2} y={CHART_HEIGHT / 2} textAnchor="middle" className="fill-gray-500 text-sm dark:fill-gray-400">
                {n ? 'no times to chart (all DNF, or not enough solves for these averages)' : 'no solves selected'}
              </text>
            ) : (
              <>
                {niceTicks(lo, hi).map((t) => (
                  <g key={t}>
                    <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} className="stroke-gray-200 dark:stroke-neutral-800" />
                    <text x={MARGIN.left - 4} y={y(t)} dy="0.32em" textAnchor="end" className="fill-gray-500 text-[10px] tabular-nums dark:fill-gray-400">
                      {formatTick(t)}
                    </text>
                  </g>
                ))}
                <text x={MARGIN.left} y={CHART_HEIGHT - 6} className="fill-gray-500 text-[10px] dark:fill-gray-400">
                  #1
                </text>
                <text x={width - MARGIN.right} y={CHART_HEIGHT - 6} textAnchor="end" className="fill-gray-500 text-[10px] dark:fill-gray-400">
                  #{n}
                </text>
                {lines.map(({ id, data }) => (
                  <path
                    key={id}
                    d={path(data)}
                    fill="none"
                    strokeWidth={id === 'single' ? 1 : 1.75}
                    strokeLinejoin="round"
                    className={SERIES_STYLE[id].stroke}
                    data-series={id}
                    data-points={data.filter((v) => v !== null && v !== undefined).length}
                  />
                ))}
                {pbs.map((p) => (
                  <circle
                    key={`${p.kind}-${p.index}`}
                    cx={x(p.index)}
                    cy={y(p.value)}
                    r={3.5}
                    strokeWidth={1}
                    className={`${pbStyle[p.kind]} stroke-black dark:stroke-white`}
                    data-pb-marker={p.kind}
                  />
                ))}
                {hover !== null && (
                  <line
                    x1={x(hover)}
                    x2={x(hover)}
                    y1={MARGIN.top}
                    y2={MARGIN.top + plotH}
                    className="stroke-gray-400 dark:stroke-neutral-500"
                    strokeDasharray="3 3"
                  />
                )}
              </>
            )}
          </svg>
        )}
      </div>
      {n > 0 && (
        <p className="flex flex-wrap gap-x-3 text-xs text-gray-500 tabular-nums dark:text-gray-400" data-readout>
          <span>
            #{shown + 1} · {formatDateShort(solves[shown].createdAt)}
          </span>
          {lines.map(({ id, data }) => (
            <span key={id}>
              {id} {formatStat(data[shown], precision)}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
