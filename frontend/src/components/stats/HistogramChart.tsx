import type { Histogram } from '../../lib/stats'
import { useElementWidth } from '../../hooks/useElementWidth'
import { CHART_HEIGHT, MARGIN, formatTick, niceTicks } from './chart'

/** Bar chart of how many solves fell in each time bin */
export function HistogramChart({ hist }: { hist: Histogram | undefined }) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right)
  const plotH = CHART_HEIGHT - MARGIN.top - MARGIN.bottom
  const top = hist ? Math.max(...hist.counts) : 0
  const bins = hist?.counts.length ?? 0
  const barW = bins ? plotW / bins : 0
  const y = (c: number) => MARGIN.top + (1 - c / top) * plotH
  // label every k-th bin edge so they don't overlap
  const every = Math.max(1, Math.ceil(bins / Math.max(1, Math.floor(plotW / 48))))

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={CHART_HEIGHT} className="block" data-chart="histogram" role="img" aria-label="time distribution">
          {!hist ? (
            <text x={width / 2} y={CHART_HEIGHT / 2} textAnchor="middle" className="fill-gray-500 text-sm dark:fill-gray-400">
              no times to chart
            </text>
          ) : (
            <>
              {niceTicks(0, top, 4)
                .filter((t) => Number.isInteger(t))
                .map((t) => (
                  <g key={t}>
                    <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} className="stroke-gray-200 dark:stroke-neutral-800" />
                    <text x={MARGIN.left - 4} y={y(t)} dy="0.32em" textAnchor="end" className="fill-gray-500 text-[10px] tabular-nums dark:fill-gray-400">
                      {t}
                    </text>
                  </g>
                ))}
              {hist.counts.map((c, i) => (
                <rect
                  key={i}
                  x={MARGIN.left + i * barW + 1}
                  y={y(c)}
                  width={Math.max(0, barW - 2)}
                  height={MARGIN.top + plotH - y(c)}
                  className="fill-blue-500"
                  data-bin={c}
                >
                  <title>
                    {formatTick(hist.start + i * hist.width)}–{formatTick(hist.start + (i + 1) * hist.width)}: {c}
                  </title>
                </rect>
              ))}
              {hist.counts.map((_, i) =>
                i % every === 0 ? (
                  <text
                    key={i}
                    x={MARGIN.left + i * barW}
                    y={CHART_HEIGHT - 6}
                    textAnchor="middle"
                    className="fill-gray-500 text-[10px] tabular-nums dark:fill-gray-400"
                  >
                    {formatTick(hist.start + i * hist.width)}
                  </text>
                ) : null,
              )}
            </>
          )}
        </svg>
      )}
    </div>
  )
}
