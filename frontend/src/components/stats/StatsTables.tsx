import { useState, type ReactNode } from 'react'
import { AVERAGE_SIZES, type BreakdownRow, type PbEntry, type Summary } from '../../lib/stats'
import { formatDateShort, formatStat, type Precision } from '../../lib/time'
import { SectionTitle } from '../sidebar/Sidebar'

const th = 'px-2 py-1 text-left text-xs font-normal text-gray-500 dark:text-gray-400'
const td = 'px-2 py-1 tabular-nums'

function Table({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" aria-label={label}>
        {children}
      </table>
    </div>
  )
}

/** Count, mean, best, worst, then each average now and at its best */
export function SummaryTable({ summary, precision }: { summary: Summary; precision: Precision }) {
  const f = (v: number | null | undefined) => formatStat(v, precision)
  const singles = [
    { id: 'count', label: 'solves', value: String(summary.count) },
    { id: 'dnfs', label: 'DNFs', value: String(summary.dnfs) },
    { id: 'mean', label: 'mean', value: f(summary.mean) },
    { id: 'best', label: 'best', value: f(summary.best) },
    { id: 'worst', label: 'worst', value: f(summary.worst) },
  ]
  return (
    <section className="flex flex-col gap-2" data-stats-table>
      <div className="grid grid-cols-5 gap-2 text-center">
        {singles.map((s) => (
          <div key={s.id}>
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            <div className="tabular-nums" data-stat={s.id}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
      <Table label="averages">
        <thead>
          <tr className="border-b">
            <th className={th}>average</th>
            <th className={th}>current</th>
            <th className={th}>best</th>
          </tr>
        </thead>
        <tbody>
          {AVERAGE_SIZES.map((n) => (
            <tr key={n} className="border-b">
              <td className={td}>ao{n}</td>
              <td className={td} data-stat={`ao${n}-current`}>
                {f(summary.current[n])}
              </td>
              <td className={td} data-stat={`ao${n}-best`}>
                {f(summary.bestAvg[n])}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </section>
  )
}

const PB_PREVIEW = 10

/** Every PB improvement, newest first */
export function PbHistory({ pbs, precision }: { pbs: PbEntry[]; precision: Precision }) {
  const [all, setAll] = useState(false)
  const newest = [...pbs].reverse()
  const shown = all ? newest : newest.slice(0, PB_PREVIEW)
  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>PB history</SectionTitle>
      {!pbs.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">no PBs yet</p>
      ) : (
        <>
          <Table label="PB history">
            <thead>
              <tr className="border-b">
                <th className={th}>date</th>
                <th className={th}>PB</th>
                <th className={th}>time</th>
                <th className={th}>previous</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={`${p.kind}-${p.index}`} className="border-b" data-pb={p.kind}>
                  <td className={td}>{formatDateShort(p.at)}</td>
                  <td className={td}>{p.kind}</td>
                  <td className={td}>{formatStat(p.value, precision)}</td>
                  <td className={`${td} text-gray-500 dark:text-gray-400`}>
                    {p.prev === undefined ? 'first' : `${formatStat(p.prev, precision)} (−${formatStat(p.prev - p.value, precision)})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {pbs.length > PB_PREVIEW && (
            <button type="button" className="self-start text-sm underline" onClick={() => setAll(!all)}>
              {all ? 'show fewer' : `show all ${pbs.length}`}
            </button>
          )}
        </>
      )}
    </section>
  )
}

/** One row per session or event */
export function BreakdownTable({
  title,
  rows,
  name,
  precision,
  id,
}: {
  title: string
  rows: BreakdownRow[]
  name: (key: string) => string
  precision: Precision
  id: string
}) {
  const f = (v: number | null | undefined) => formatStat(v, precision)
  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>{title}</SectionTitle>
      <Table label={title}>
        <thead>
          <tr className="border-b">
            <th className={th}>{id}</th>
            <th className={th}>solves</th>
            <th className={th}>best</th>
            <th className={th}>mean</th>
            <th className={th}>best ao5</th>
            <th className={th}>best ao12</th>
          </tr>
        </thead>
        <tbody data-breakdown={id}>
          {rows.map((r) => (
            <tr key={r.key} className="border-b" data-key={r.key}>
              <td className="px-2 py-1">{name(r.key)}</td>
              <td className={td}>{r.count}</td>
              <td className={td}>{f(r.best)}</td>
              <td className={td}>{f(r.mean)}</td>
              <td className={td}>{f(r.bestAo5)}</td>
              <td className={td}>{f(r.bestAo12)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </section>
  )
}
