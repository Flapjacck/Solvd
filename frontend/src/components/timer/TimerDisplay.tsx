import { useEffect } from 'react'
import type { TimerState } from '../../hooks/useTimer'
import { getTimerFont, loadTimerFont } from '../../lib/fonts'
import { formatMs, INSPECTION_DNF_MS, INSPECTION_MS, type Precision } from '../../lib/time'

interface Props {
  state: TimerState
  elapsed: number
  inspecting: boolean
  inspectElapsed: number
  hideWhileSolving: boolean
  precision: Precision
  fontId: string
}

/** The big number: solve time, inspection countdown, or "solving" when hidden. */
export function TimerDisplay({ state, elapsed, inspecting, inspectElapsed, hideWhileSolving, precision, fontId }: Props) {
  const font = getTimerFont(fontId)
  useEffect(() => loadTimerFont(font), [font])

  const color = state === 'holding' ? 'text-red-600 dark:text-red-400' : state === 'ready' ? 'text-green-600 dark:text-green-400' : ''

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
  const warn = inspecting && !color && inspectElapsed >= 8000 ? 'text-orange-500 dark:text-orange-400' : ''

  return (
    <TimerText text={text} family={font.family} weight={font.weight} digitWidth={font.digitWidth} className={color || warn} />
  )
}

interface TimerTextProps {
  text: string
  family: string
  weight: number
  digitWidth: string | null
  className?: string
  size?: string // Tailwind text size class
}

/** Big timer text in a given font. Also used for the font preview in settings. */
export function TimerText({
  text,
  family,
  weight,
  digitWidth,
  className = '',
  size = 'text-[clamp(3rem,15vw,11rem)]',
}: TimerTextProps) {
  return (
    <span
      className={`${size} leading-none tabular-nums ${className}`}
      data-timer
      style={{ fontFamily: `"${family}", ui-monospace, monospace`, fontWeight: weight }}
      aria-label={text}
    >
      {digitWidth ? <FixedDigits text={text} width={digitWidth} /> : <span aria-hidden>{text}</span>}
    </span>
  )
}

/**
 * Some fonts (Orbitron, Chakra Petch) have no equal-width digits, so a running
 * time would jitter as "1" and "8" change width. Give each digit its own box.
 */
function FixedDigits({ text, width }: { text: string; width: string }) {
  return (
    <>
      {[...text].map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="inline-block text-center" style={{ width }} aria-hidden>
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
