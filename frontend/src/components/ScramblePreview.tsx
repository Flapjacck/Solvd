import { useEffect, useRef, useState } from 'react'
import type { TwistyPlayer } from 'cubing/twisty'

interface Props {
  puzzle: string // cubing.js puzzle id, e.g. "3x3x3", "megaminx"
  scramble: string
  visualization: '2D' | '3D'
  hidden?: boolean
}

/**
 * The puzzle as it should look after the scramble, drawn by cubing.js TwistyPlayer.
 * cubing/twisty is loaded on first use, so it costs nothing when the preview is off.
 * The player is created once and updated in place (creating one per scramble is slow).
 */
export function ScramblePreview({ puzzle, scramble, visualization, hidden }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<TwistyPlayer | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let created: TwistyPlayer | undefined
    void import('cubing/twisty').then(({ TwistyPlayer }) => {
      if (cancelled || !host.current) return
      created = new TwistyPlayer({ controlPanel: 'none', background: 'none', hintFacelets: 'none' })
      created.style.width = '100%'
      created.style.height = '100%'
      host.current.append(created)
      player.current = created
      setReady(true)
    })
    return () => {
      cancelled = true
      created?.remove()
      player.current = null
    }
  }, [])

  useEffect(() => {
    const p = player.current
    if (!ready || !p) return
    p.puzzle = puzzle as TwistyPlayer['puzzle']
    p.visualization = visualization
    // show the end state: the scramble as setup, nothing left to play
    p.experimentalSetupAlg = scramble
    p.alg = ''
  }, [ready, puzzle, scramble, visualization])

  return (
    <div
      ref={host}
      className={`mx-auto h-44 w-64 ${hidden || !scramble ? 'invisible' : ''}`}
      role="img"
      aria-label={`${puzzle} after the scramble`}
    />
  )
}
