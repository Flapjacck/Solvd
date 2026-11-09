import { useCallback, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { localStore, type Solve } from './lib/db'
import { formatMs, formatSolve } from './lib/time'
import { SolveList } from './components/SolveList'
import { SolveDetail } from './components/SolveDetail'
import { SolveActions } from './components/SolveActions'
import { SessionBar } from './components/SessionBar'
import { StatsBar } from './components/StatsBar'
import { useSessions } from './hooks/useSessions'
import { useScramble } from './hooks/useScramble'
import { useTimer } from './hooks/useTimer'

const EVENT = '333'

export default function App() {
  const sessions = useSessions()
  const sessionId = sessions.active?.id

  // Re-renders automatically whenever the solves table changes
  const liveSolves = useLiveQuery(async () => (sessionId ? localStore.list(sessionId) : []), [sessionId])
  const solves: Solve[] = useMemo(() => liveSolves ?? [], [liveSolves])
  const { scramble, loading, next } = useScramble(EVENT)

  const onStop = useCallback(
    async (ms: number) => {
      if (!sessionId) return
      await localStore.add({ timeMs: ms, penalty: 'none', scramble, event: EVENT, session: sessionId })
      next()
    },
    [scramble, next, sessionId],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedIndex = selectedId ? solves.findIndex((s) => s.id === selectedId) : -1
  const selected = selectedIndex >= 0 ? solves[selectedIndex] : undefined

  const { state, elapsed, press, release } = useTimer(onStop, { disabled: !!selected })

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

      {sessions.active && (
        <SessionBar
          sessions={sessions.sessions}
          active={sessions.active}
          onSelect={sessions.select}
          onCreate={() => void sessions.create()}
          onRename={(id, name) => void sessions.rename(id, name)}
          onDelete={(id) => void sessions.remove(id)}
        />
      )}

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

      <StatsBar solves={solves} />

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
