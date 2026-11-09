import { useMemo } from 'react'
import type { Solve } from '../lib/db'
import { averageOf, effectiveMs, formatStat } from '../lib/time'
import { useSettings } from '../hooks/useSettings'

/** Count, best, ao5 and ao12 for a newest-first list of solves. */
export function StatsBar({ solves }: { solves: Solve[] }) {
  const { precision } = useSettings()
  const stats = useMemo(() => {
    const times = solves.map((s) => effectiveMs(s.timeMs, s.penalty))
    const valid = times.filter((t): t is number => t !== null)
    return [
      { label: 'solves', value: String(solves.length) },
      { label: 'best', value: formatStat(valid.length ? Math.min(...valid) : undefined, precision) },
      { label: 'ao5', value: formatStat(averageOf(times, 5), precision) },
      { label: 'ao12', value: formatStat(averageOf(times, 12), precision) },
    ]
  }, [solves, precision])

  return (
    <section className="grid grid-cols-4 gap-2 text-center">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
          <div>{s.value}</div>
        </div>
      ))}
    </section>
  )
}
