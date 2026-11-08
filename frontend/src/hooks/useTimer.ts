import { useCallback, useEffect, useRef, useState } from 'react'

export type TimerState = 'idle' | 'holding' | 'ready' | 'running' | 'stopped'

const HOLD_MS = 300 // how long space/touch must be held before the timer arms

/**
 * Stackmat-style timer: hold space (or touch) until ready, release to start,
 * press any key / touch to stop.
 */
export function useTimer(onStop: (ms: number) => void, { disabled = false } = {}) {
  const [state, setState] = useState<TimerState>('idle')
  const [elapsed, setElapsed] = useState(0)

  const stateRef = useRef<TimerState>('idle')
  const startRef = useRef(0)
  const rafRef = useRef(0)
  const holdTimeout = useRef<number | undefined>(undefined)
  const onStopRef = useRef(onStop)
  useEffect(() => {
    onStopRef.current = onStop
  }, [onStop])

  const set = (s: TimerState) => {
    stateRef.current = s
    setState(s)
  }

  const tick = useCallback(function loop() {
    setElapsed(performance.now() - startRef.current)
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const press = useCallback(() => {
    const s = stateRef.current
    if (s === 'running') {
      cancelAnimationFrame(rafRef.current)
      const ms = Math.round(performance.now() - startRef.current)
      setElapsed(ms)
      set('stopped')
      onStopRef.current(ms)
      return
    }
    if (s === 'idle' || s === 'stopped') {
      set('holding')
      holdTimeout.current = window.setTimeout(() => {
        if (stateRef.current === 'holding') {
          setElapsed(0)
          set('ready')
        }
      }, HOLD_MS)
    }
  }, [])

  const release = useCallback(() => {
    const s = stateRef.current
    window.clearTimeout(holdTimeout.current)
    if (s === 'ready') {
      startRef.current = performance.now()
      set('running')
      rafRef.current = requestAnimationFrame(tick)
    } else if (s === 'holding') {
      set(elapsed > 0 ? 'stopped' : 'idle')
    }
  }, [tick, elapsed])

  // Ignore keys while typing or while a dialog is open (unless a solve is running)
  const disabledRef = useRef(disabled)
  useEffect(() => {
    disabledRef.current = disabled
  }, [disabled])
  const ignore = (e: KeyboardEvent) => {
    if (stateRef.current === 'running') return false
    const t = e.target as HTMLElement | null
    const typing = !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))
    return disabledRef.current || typing
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat || ignore(e)) return
      if (stateRef.current === 'running') {
        e.preventDefault()
        press()
      } else if (e.code === 'Space') {
        e.preventDefault()
        press()
      }
    }
    const up = (e: KeyboardEvent) => {
      if (ignore(e) && stateRef.current !== 'ready' && stateRef.current !== 'holding') return
      if (e.code === 'Space') {
        e.preventDefault()
        release()
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      cancelAnimationFrame(rafRef.current)
      window.clearTimeout(holdTimeout.current)
    }
  }, [press, release])

  return { state, elapsed, press, release }
}
