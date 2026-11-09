import { useCallback, useEffect, useRef, useState } from 'react'
import { inspectionPenalty, type Penalty } from '../lib/time'

export type TimerState = 'idle' | 'inspecting' | 'holding' | 'ready' | 'running' | 'stopped'

export interface TimerOptions {
  disabled?: boolean // ignore keys (e.g. a dialog is open)
  inspection?: boolean // WCA 15s inspection before each solve
  holdMs?: number // how long space/touch must be held before the timer arms
}

/**
 * Stackmat-style timer.
 * - No inspection: hold until ready (green), release to start, any key / touch stops.
 * - Inspection: tap to start inspection, then hold and release as above. Esc cancels inspection.
 * The display counts up live while running and inspection counts live too.
 */
export function useTimer(onStop: (ms: number, penalty: Penalty) => void, opts: TimerOptions = {}) {
  const [state, setState] = useState<TimerState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [inspectElapsed, setInspectElapsed] = useState(0)
  const [inspectActive, setInspectActive] = useState(false)

  const stateRef = useRef<TimerState>('idle')
  const elapsedRef = useRef(0)
  const startRef = useRef(0)
  const inspectStartRef = useRef(0) // 0 = not inspecting
  const pendingInspectRef = useRef(false) // pressed from idle, inspection starts on release
  const penaltyRef = useRef<Penalty>('none')
  const rafRef = useRef(0)
  const holdTimeout = useRef<number | undefined>(undefined)

  const onStopRef = useRef(onStop)
  const optsRef = useRef(opts)
  useEffect(() => {
    onStopRef.current = onStop
    optsRef.current = opts
  })

  const set = (s: TimerState) => {
    stateRef.current = s
    setState(s)
  }
  const show = (ms: number) => {
    elapsedRef.current = ms
    setElapsed(ms)
  }

  // One animation loop drives both the solve clock and the inspection countdown
  const loop = useCallback(function frame() {
    const now = performance.now()
    if (stateRef.current === 'running') show(now - startRef.current)
    else if (inspectStartRef.current) setInspectElapsed(now - inspectStartRef.current)
    rafRef.current = requestAnimationFrame(frame)
  }, [])
  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(loop)
  }, [loop])

  const startInspection = useCallback(() => {
    inspectStartRef.current = performance.now()
    setInspectElapsed(0)
    setInspectActive(true)
    set('inspecting')
    startLoop()
  }, [startLoop])

  const cancel = useCallback(() => {
    if (stateRef.current === 'running') return
    cancelAnimationFrame(rafRef.current)
    window.clearTimeout(holdTimeout.current)
    inspectStartRef.current = 0
    setInspectActive(false)
    pendingInspectRef.current = false
    set(elapsedRef.current > 0 ? 'stopped' : 'idle')
  }, [])

  const press = useCallback(() => {
    const s = stateRef.current
    if (s === 'running') {
      cancelAnimationFrame(rafRef.current)
      const ms = Math.round(performance.now() - startRef.current)
      show(ms)
      set('stopped')
      onStopRef.current(ms, penaltyRef.current)
      return
    }
    if ((s === 'idle' || s === 'stopped') && optsRef.current.inspection) {
      pendingInspectRef.current = true // inspection starts on release
      return
    }
    if (s === 'idle' || s === 'stopped' || s === 'inspecting') {
      set('holding')
      holdTimeout.current = window.setTimeout(() => {
        if (stateRef.current === 'holding') set('ready')
      }, optsRef.current.holdMs ?? 300)
    }
  }, [])

  const release = useCallback(() => {
    const s = stateRef.current
    window.clearTimeout(holdTimeout.current)
    if (pendingInspectRef.current) {
      pendingInspectRef.current = false
      startInspection()
    } else if (s === 'ready') {
      penaltyRef.current = inspectStartRef.current
        ? inspectionPenalty(performance.now() - inspectStartRef.current)
        : 'none'
      inspectStartRef.current = 0
      setInspectActive(false)
      startRef.current = performance.now()
      show(0)
      set('running')
      startLoop()
    } else if (s === 'holding') {
      // let go too early: back to inspection if it was running, else back to rest
      if (inspectStartRef.current) set('inspecting')
      else set(elapsedRef.current > 0 ? 'stopped' : 'idle')
    }
  }, [startInspection, startLoop])

  // Keyboard. press/release/cancel are stable, so this only binds once.
  useEffect(() => {
    // Ignore keys while typing or while a dialog is open (unless a solve is running)
    const ignore = (e: KeyboardEvent) => {
      if (stateRef.current === 'running') return false
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))
      return !!optsRef.current.disabled || typing
    }
    const down = (e: KeyboardEvent) => {
      if (e.repeat || ignore(e)) return
      if (e.code === 'Escape' && stateRef.current !== 'running') return cancel()
      if (stateRef.current === 'running' || e.code === 'Space') {
        e.preventDefault()
        press()
      }
    }
    const up = (e: KeyboardEvent) => {
      const armed = stateRef.current === 'holding' || stateRef.current === 'ready' || pendingInspectRef.current
      if (e.code !== 'Space' || (!armed && ignore(e))) return
      e.preventDefault()
      release()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [press, release, cancel])

  // Stop the animation frame and hold timer only on unmount
  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      window.clearTimeout(holdTimeout.current)
    },
    [],
  )

  // inspectActive stays true while holding/ready during inspection (the countdown keeps going)
  return { state, elapsed, inspecting: inspectActive, inspectElapsed, press, release, cancel }
}
