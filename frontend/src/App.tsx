import { useCallback, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { localStore, type Solve } from './lib/db'
import type { Penalty } from './lib/time'
import { SolveList } from './components/SolveList'
import { SolveDetail } from './components/SolveDetail'
import { LastSolve } from './components/LastSolve'
import { Sidebar, SidebarSection } from './components/Sidebar'
import { SessionBar } from './components/SessionBar'
import { StatsBar } from './components/StatsBar'
import { useSessions } from './hooks/useSessions'
import { useScramble } from './hooks/useScramble'
import { useTimer } from './hooks/useTimer'
import { useSettings } from './hooks/useSettings'
import { useShortcuts } from './hooks/useShortcuts'
import { useTheme } from './hooks/useTheme'
import { SettingsDialog } from './components/SettingsDialog'
import { TimerDisplay } from './components/TimerDisplay'
import { Scramble } from './components/Scramble'
import { ScramblePreview } from './components/ScramblePreview'
import { DEFAULT_EVENT, getEvent } from './lib/events'

export default function App() {
  const settings = useSettings()
  useTheme()
  const sessions = useSessions()
  const sessionId = sessions.active?.id
  const event = getEvent(sessions.active?.event ?? DEFAULT_EVENT)

  // This session's solves for the picked event. Re-renders whenever the solves table changes.
  const liveSolves = useLiveQuery(
    async () => (sessionId ? localStore.list(sessionId, event.id) : []),
    [sessionId, event.id],
  )
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

  // While inspecting or solving, only the timer is shown
  const focus = timer.state === 'running' || timer.inspecting

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar hidden={focus}>
        <header className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold">Solvd</h1>
          <nav className="flex gap-4 text-sm">
            <button className="underline" onClick={next}>
              new scramble
            </button>
            <button className="underline" onClick={() => setSettingsOpen(true)}>
              settings
            </button>
          </nav>
        </header>

        {sessions.active && (
          <SidebarSection title="Session">
            <SessionBar
              sessions={sessions.sessions}
              active={sessions.active}
              onSelect={sessions.select}
              onCreate={() => void sessions.create()}
              onRename={(id, name) => void sessions.rename(id, name)}
              onDelete={(id) => void sessions.remove(id)}
              onEventChange={(id, ev) => void sessions.setEvent(id, ev)}
            />
          </SidebarSection>
        )}

        <SidebarSection title="Stats">
          <StatsBar solves={solves} />
        </SidebarSection>

        {last && (
          <SidebarSection title="Last solve">
            <LastSolve
              solve={last}
              precision={settings.precision}
              confirmingDelete={confirmingDelete}
              onConfirmingDeleteChange={setConfirmingDelete}
            />
          </SidebarSection>
        )}

        {/* the only part of the page that scrolls */}
        <SidebarSection title="Solves" className="min-h-0 flex-1">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SolveList solves={solves} onSelect={setSelectedId} />
          </div>
        </SidebarSection>

        {settings.scramblePreview !== 'off' && (
          <SidebarSection title="Preview">
            <ScramblePreview puzzle={event.puzzle} scramble={scramble} visualization={settings.scramblePreview} />
          </SidebarSection>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {settings.inspection && !event.blind
            ? 'Tap space to inspect, then hold until green and release to start. Any key stops.'
            : 'Hold space until green, release to start. Any key stops.'}
        </p>
      </Sidebar>

      {/* Scramble at the top, timer centred in the space below it (the whole screen in focus).
          Also the touch area for phones: touch and hold, release to start, tap to stop. */}
      <main
        className="flex min-w-0 flex-1 select-none flex-col overflow-hidden"
        onTouchStart={(e) => {
          e.preventDefault()
          timer.press()
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          timer.release()
        }}
      >
        {!focus && (
          <div className="shrink-0 p-8" data-scramble>
            <Scramble scramble={scramble} loading={loading} />
          </div>
        )}
        <div className="flex min-h-0 flex-1 items-center justify-center">
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
      </main>

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
