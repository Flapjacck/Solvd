import { useEffect, useMemo, useRef } from 'react'
import type { Solve } from '../lib/db'
import type { Settings } from '../lib/settings'
import { INSPECTION_CUES, playCue } from '../lib/sound'
import { bestSingle, toTimes } from '../lib/stats'
import { averageOf } from '../lib/time'
import type { TimerState } from './useTimer'

interface TimerSnapshot {
  state: TimerState
  elapsed: number
  inspecting: boolean
  inspectElapsed: number
}

/** The running time that triggers the threshold beep, or undefined for none */
export function thresholdTarget(settings: Settings, solves: Solve[]): number | undefined {
  const times = toTimes(solves)
  switch (settings.soundThreshold) {
    case 'best':
      return bestSingle(times)
    case 'ao5':
      return averageOf(times, 5) ?? undefined
    case 'ao12':
      return averageOf(times, 12) ?? undefined
    case 'custom':
      return settings.soundThresholdMs > 0 ? settings.soundThresholdMs : undefined
    default:
      return undefined
  }
}

/**
 * Plays inspection call-outs (8s, 12s, 15s) and the threshold beep while solving.
 * Each cue fires at most once per inspection or solve.
 */
export function useSoundCues(timer: TimerSnapshot, settings: Settings, solves: Solve[]) {
  const on = settings.sound
  const volume = settings.soundVolume

  // Inspection: remember which call-outs already played in this inspection
  const firedInspect = useRef(new Set<number>())
  useEffect(() => {
    if (!timer.inspecting) {
      firedInspect.current.clear()
      return
    }
    if (!on || !settings.soundInspection) return
    for (const { at, cue } of INSPECTION_CUES) {
      // only cues crossed in the last second, so turning sound on mid-inspection doesn't play a backlog
      if (timer.inspectElapsed >= at && timer.inspectElapsed < at + 1000 && !firedInspect.current.has(at)) {
        firedInspect.current.add(at)
        playCue(cue, volume)
      }
    }
  }, [timer.inspecting, timer.inspectElapsed, on, settings.soundInspection, volume])

  // Threshold: the target is fixed when the solve starts, so the beep can't move mid-solve
  const target = useMemo(() => thresholdTarget(settings, solves), [settings, solves])
  const solveTarget = useRef<number | undefined>(undefined)
  const firedThreshold = useRef(false)
  const running = timer.state === 'running'
  useEffect(() => {
    // keep the latest target while at rest; it's frozen once running starts
    if (!running) {
      solveTarget.current = target
      firedThreshold.current = false
    }
  }, [running, target])
  useEffect(() => {
    if (!running || !on || firedThreshold.current) return
    const t = solveTarget.current
    if (t !== undefined && timer.elapsed >= t) {
      firedThreshold.current = true
      playCue('threshold', volume)
    }
  }, [running, timer.elapsed, on, volume])
}

/** Finish or PB sound for a solve that just ended. `before` is the solves list before it was added. */
export function playFinishCue(settings: Settings, effective: number | null, before: Solve[]) {
  if (!settings.sound) return
  const best = bestSingle(toTimes(before))
  const isPb = effective !== null && best !== undefined && effective < best
  if (isPb && settings.soundPb) playCue('pb', settings.soundVolume)
  else if (settings.soundFinish) playCue('finish', settings.soundVolume)
}
