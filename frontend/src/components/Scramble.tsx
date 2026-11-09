/**
 * Scramble shown move by move with clear spacing between moves.
 * Keeps line breaks (Megaminx scrambles come as one line per row).
 */
export function Scramble({ scramble, loading }: { scramble: string; loading: boolean }) {
  if (loading) return <p className="text-center text-lg text-gray-500">generating scramble...</p>

  const lines = scramble
    .split('\n')
    .map((line) => line.trim().split(/\s+/).filter(Boolean))
    .filter((moves) => moves.length)
  const count = lines.reduce((n, moves) => n + moves.length, 0)
  // big cubes and Megaminx have 40-100 moves, so shrink the text to keep it readable
  const size = count > 60 ? 'text-sm gap-x-2' : count > 30 ? 'text-base gap-x-3' : 'text-xl gap-x-4'

  return (
    <div className="flex flex-col items-center gap-1" aria-label={scramble}>
      {lines.map((moves, i) => (
        <p key={i} className={`flex flex-wrap justify-center gap-y-1 ${size}`} aria-hidden>
          {moves.map((m, j) => (
            <span key={j}>{m}</span>
          ))}
        </p>
      ))}
    </div>
  )
}
