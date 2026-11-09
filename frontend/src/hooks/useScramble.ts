import { useCallback, useEffect, useState } from 'react'
import { randomScrambleForEvent } from 'cubing/scramble'

interface Result {
  event: string
  counter: number
  scramble: string
}

/** Random-state WCA scramble for an event (cubing.js event id). */
export function useScramble(event: string) {
  const [result, setResult] = useState<Result | null>(null)
  // bump to request a new scramble
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    let cancelled = false
    randomScrambleForEvent(event).then((alg) => {
      if (!cancelled) setResult({ event, counter, scramble: alg.toString() })
    })
    return () => {
      cancelled = true
    }
  }, [event, counter])

  const next = useCallback(() => setCounter((c) => c + 1), [])

  // Loading until the scramble matches the current event and request,
  // so switching events never shows (or saves) the old event's scramble
  const loading = !result || result.event !== event || result.counter !== counter
  return { scramble: loading ? '' : result.scramble, loading, next }
}
