import { useCallback, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { localStore, type Solve } from './lib/db'
import { formatSolve, type Penalty } from './lib/time'
import { SolveList } from './components/SolveList'
import { SolveDetail } from './components/SolveDetail'
import { SolveActions } from './components/SolveActions'
import { SessionBar } from './components/SessionBar'
import { StatsBar } from './components/StatsBar'
import { useSessions } from './hooks/useSessions'
import { useScramble } from './hooks/useScramble'
import { useTimer } from './hooks/useTimer'
import { useSettings } from './hooks/useSettings'
import { useShortcuts } from './hooks/useShortcuts'
import { SettingsDialog } from './components/SettingsDialog'
import { TimerDisplay } from './components/TimerDisplay'
import { Scramble } from './components/Scramble'
import { DEFAULT_EVENT, getEvent } from './lib/events'

export default function App() {
  const settings = useSettings()
  const sessions = useSessions()
  const sessionId = sessions.active?.id
  const event = getEvent(sessions.active?.event ?? DEFAULT_EVENT)

  // Re-renders automatically whenever the solves table changes
  const liveSolves = useLiveQuery(async () => (sessionId ? localStore.list(sessionId) : []), [sessionId])
  const solves: Solve[] = useMemo(() => liveSolves ?? [], [liveSolves])
  const { scramble, loading, next } = useScramble(event.id)

  const onStop = useCallback(
    async (ms: number, penalty: Penalty) => {
      if (!sessionId) return
      await localStore.add({ timeMs: ms, penalty, scramble, event: event.id, session: sessionId })
      next()
    },
    [scramble, next, sessionId, event.id],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedIndex = selectedId ? solves.findIndex((s) => s.id === selectedId) : -1
  const selected = selectedIndex >= 0 ? solves[selectedIndex] : undefined

  const [settingsOpen, setSettingsOpen] = useState(false)
  const dialogOpen = !!selected || settingsOpen

  const timer = useTimer(onStop, {
    disabled: dialogOpen,
    // WCA blindfolded events have no inspection
    inspection: settings.inspection && !event.blind,
    holdMs: settings.holdMs,
  })

  const last = solves[0]
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const atRest = timer.state === 'idle' || timer.state === 'stopped'
  useShortcuts(settings.shortcuts && atRest && !dialogOpen, {
    newScramble: next,
    togglePlus2: () => last && void localStore.update(last.id, { penalty: last.penalty === '+2' ? 'none' : '+2' }),
    toggleDnf: () => last && void localStore.update(last.id, { penalty: last.penalty === 'DNF' ? 'none' : 'DNF' }),
    deleteLast: () => last && setConfirmingDelete(true),
    openSettings: () => setSettingsOpen(true),
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">Solvd</h1>
        <nav className="flex gap-4">
          <button className="underline" onClick={next}>
            new scramble
          </button>
          <button className="underline" onClick={() => setSettingsOpen(true)}>
            settings
          </button>
        </nav>
      </header>

      {sessions.active && (
        <SessionBar
          sessions={sessions.sessions}
          active={sessions.active}
          solveCount={solves.length}
          onSelect={sessions.select}
          onCreate={() => void sessions.create()}
          onRename={(id, name) => void sessions.rename(id, name)}
          onDelete={(id) => void sessions.remove(id)}
          onEventChange={(id, ev) => void sessions.setEvent(id, ev)}
        />
      )}

      <Scramble scramble={scramble} loading={loading} />

      {/* Touch area for phones: touch and hold, release to start, tap to stop */}
      <div
        className="flex flex-1 select-none items-center justify-center py-16"
        onTouchStart={(e) => {
          e.preventDefault()
          timer.press()
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          timer.release()
        }}
      >
        <TimerDisplay
          state={timer.state}
          elapsed={timer.elapsed}
          inspecting={timer.inspecting}
          inspectElapsed={timer.inspectElapsed}
          hideWhileSolving={settings.hideTimerWhileSolving}
          precision={settings.precision}
          fontId={settings.timerFont}
        />
      </div>

      <p className="text-center text-sm text-gray-500">
        {settings.inspection && !event.blind
          ? 'tap space to inspect, then hold until green and release to start, any key to stop'
          : 'hold space until green, release to start, any key to stop'}
      </p>

      {last && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="text-gray-500">last: {formatSolve(last.timeMs, last.penalty, settings.precision)}</span>
          <SolveActions
            key={last.id}
            solve={last}
            confirmingDelete={confirmingDelete}
            onConfirmingDeleteChange={setConfirmingDelete}
            onDeleted={() => setConfirmingDelete(false)}
          />
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

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
