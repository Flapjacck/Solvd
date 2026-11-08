import { useCallback, useEffect, useRef, useState } from 'react'

export type TimerState = 'idle' | 'holding' | 'ready' | 'running' | 'stopped'

const HOLD_MS = 300 // how long space/touch must be held before the timer arms

/**
 * Stackmat-style timer: hold space (or touch) until ready, release to start,
 * press any key / touch to stop. The display counts up live while running.
 */
export function useTimer(onStop: (ms: number) => void, { disabled = false } = {}) {
  const [state, setState] = useState<TimerState>('idle')
  const [elapsed, setElapsed] = useState(0)

  const stateRef = useRef<TimerState>('idle')
  const elapsedRef = useRef(0)
  const startRef = useRef(0)
  const rafRef = useRef(0)
  const holdTimeout = useRef<number | undefined>(undefined)
  const onStopRef = useRef(onStop)
  const disabledRef = useRef(disabled)
  useEffect(() => {
    onStopRef.current = onStop
    disabledRef.current = disabled
  }, [onStop, disabled])

  const set = (s: TimerState) => {
    stateRef.current = s
    setState(s)
  }
  const show = (ms: number) => {
    elapsedRef.current = ms
    setElapsed(ms)
  }

  const loop = useCallback(function frame() {
    show(performance.now() - startRef.current)
    rafRef.current = requestAnimationFrame(frame)
  }, [])

  const press = useCallback(() => {
    const s = stateRef.current
    if (s === 'running') {
      cancelAnimationFrame(rafRef.current)
      const ms = Math.round(performance.now() - startRef.current)
      show(ms)
      set('stopped')
      onStopRef.current(ms)
      return
    }
    if (s === 'idle' || s === 'stopped') {
      set('holding')
      holdTimeout.current = window.setTimeout(() => {
        if (stateRef.current === 'holding') {
          show(0)
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
      rafRef.current = requestAnimationFrame(loop)
    } else if (s === 'holding') {
      set(elapsedRef.current > 0 ? 'stopped' : 'idle')
    }
  }, [loop])

  // Keyboard. press/release are stable, so this only binds once.
  useEffect(() => {
    // Ignore keys while typing or while a dialog is open (unless a solve is running)
    const ignore = (e: KeyboardEvent) => {
      if (stateRef.current === 'running') return false
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))
      return disabledRef.current || typing
    }
    const down = (e: KeyboardEvent) => {
      if (e.repeat || ignore(e)) return
      if (stateRef.current === 'running' || e.code === 'Space') {
        e.preventDefault()
        press()
      }
    }
    const up = (e: KeyboardEvent) => {
      const armed = stateRef.current === 'holding' || stateRef.current === 'ready'
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
  }, [press, release])

  // Stop the animation frame and hold timer only on unmount
  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      window.clearTimeout(holdTimeout.current)
    },
    [],
  )

  return { state, elapsed, press, release }
}
