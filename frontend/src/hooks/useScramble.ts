import { useCallback, useEffect, useState } from 'react'
import { randomScrambleForEvent } from 'cubing/scramble'

/** Random-state WCA scramble for an event (default 3x3). */
export function useScramble(event = '333') {
  const [scramble, setScramble] = useState('')
  const [loading, setLoading] = useState(true)
  // bump to request a new scramble
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    let cancelled = false
    randomScrambleForEvent(event).then((alg) => {
      if (cancelled) return
      setScramble(alg.toString())
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [event, counter])

  const next = useCallback(() => {
    setLoading(true)
    setCounter((c) => c + 1)
  }, [])

  return { scramble, loading, next }
}
