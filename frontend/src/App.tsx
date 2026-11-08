import { useCallback, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { localStore, type Solve } from './lib/db'
import { averageOf, effectiveMs, formatMs, formatSolve, formatStat } from './lib/time'
import { SolveList } from './components/SolveList'
import { SolveDetail } from './components/SolveDetail'
import { SolveActions } from './components/SolveActions'
import { useScramble } from './hooks/useScramble'
import { useTimer } from './hooks/useTimer'

const EVENT = '333'
const SESSION = 'default'

export default function App() {
  // Re-renders automatically whenever the solves table changes
  const liveSolves = useLiveQuery(() => localStore.list(SESSION), [])
  const solves: Solve[] = useMemo(() => liveSolves ?? [], [liveSolves])
  const { scramble, loading, next } = useScramble(EVENT)

  const onStop = useCallback(
    async (ms: number) => {
      await localStore.add({ timeMs: ms, penalty: 'none', scramble, event: EVENT, session: SESSION })
      next()
    },
    [scramble, next],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedIndex = selectedId ? solves.findIndex((s) => s.id === selectedId) : -1
  const selected = selectedIndex >= 0 ? solves[selectedIndex] : undefined

  const { state, elapsed, press, release } = useTimer(onStop, { disabled: !!selected })

  const times = useMemo(() => solves.map((s) => effectiveMs(s.timeMs, s.penalty)), [solves])
  const best = useMemo(() => {
    const valid = times.filter((t): t is number => t !== null)
    return valid.length ? Math.min(...valid) : undefined
  }, [times])

  const last = solves[0]

  const timerColor =
    state === 'holding' ? 'text-red-600' : state === 'ready' ? 'text-green-600' : ''

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6 font-mono">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">Solvd</h1>
        <button className="underline" onClick={next}>
          new scramble
        </button>
      </header>

      <p className="text-center text-lg">{loading ? 'generating scramble...' : scramble}</p>

      {/* Touch area for phones: touch and hold, release to start, tap to stop */}
      <div
        className="flex flex-1 select-none items-center justify-center py-16"
        onTouchStart={(e) => {
          e.preventDefault()
          press()
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          release()
        }}
      >
        <span className={`text-7xl tabular-nums ${timerColor}`}>{formatMs(elapsed)}</span>
      </div>

      <p className="text-center text-sm text-gray-500">
        hold space until green, release to start, any key to stop
      </p>

      {last && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="text-gray-500">last: {formatSolve(last.timeMs, last.penalty)}</span>
          <SolveActions key={last.id} solve={last} />
        </div>
      )}

      <section className="grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">solves</div>
          <div>{solves.length}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">best</div>
          <div>{formatStat(best)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">ao5</div>
          <div>{formatStat(averageOf(times, 5))}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">ao12</div>
          <div>{formatStat(averageOf(times, 12))}</div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-bold">Solves</h2>
        <SolveList solves={solves} onSelect={setSelectedId} />
      </section>

      {selected && (
        <SolveDetail
          key={selected.id}
          solve={selected}
          number={solves.length - selectedIndex}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
