import type { TimerState } from '../hooks/useTimer'
import { formatMs, INSPECTION_DNF_MS, INSPECTION_MS, type Precision } from '../lib/time'

interface Props {
  state: TimerState
  elapsed: number
  inspecting: boolean
  inspectElapsed: number
  hideWhileSolving: boolean
  precision: Precision
}

/** The big number: solve time, inspection countdown, or "solving" when hidden. */
export function TimerDisplay({ state, elapsed, inspecting, inspectElapsed, hideWhileSolving, precision }: Props) {
  const color = state === 'holding' ? 'text-red-600' : state === 'ready' ? 'text-green-600' : ''

  let text: string
  if (inspecting) {
    const left = Math.ceil((INSPECTION_MS - inspectElapsed) / 1000)
    text = left > 0 ? String(left) : inspectElapsed > INSPECTION_DNF_MS ? 'DNF' : '+2'
  } else if (state === 'running' && hideWhileSolving) {
    text = 'solving'
  } else {
    text = formatMs(elapsed, precision)
  }

  // orange in the last 7 seconds of inspection (8s and 12s are the WCA call-outs)
  const warn = inspecting && !color && inspectElapsed >= 8000 ? 'text-orange-500' : ''

  return (
    <span className={`font-timer text-7xl font-bold ${color || warn}`} aria-live="off" aria-label={text}>
      <FixedDigits text={text} />
    </span>
  )
}

/**
 * Orbitron has no tabular (fixed-width) digits, so a running time would jitter
 * as "1" and "8" change width. Give each digit its own fixed-width box instead.
 */
function FixedDigits({ text }: { text: string }) {
  return (
    <>
      {[...text].map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="inline-block w-[0.85em] text-center" aria-hidden>
            {ch}
          </span>
        ) : (
          <span key={i} aria-hidden>
            {ch}
          </span>
        ),
      )}
    </>
  )
}
