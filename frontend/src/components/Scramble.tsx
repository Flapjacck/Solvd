/**
 * Scramble shown move by move with clear spacing between moves.
 * Keeps line breaks (Megaminx scrambles come as one line per row).
 */
// A move is a Square-1 pair like "(1, -2)" or any other run of non-spaces
const MOVE = /\([^)]*\)|\S+/g

export function Scramble({ scramble, loading }: { scramble: string; loading: boolean }) {
  if (loading) return <p className="text-center text-2xl text-gray-500 dark:text-gray-400">generating scramble...</p>

  const lines = scramble
    .split('\n')
    .map((line) => line.match(MOVE) ?? [])
    .filter((moves) => moves.length)
  const count = lines.reduce((n, moves) => n + moves.length, 0)
  // big cubes and Megaminx have 40-100 moves, so shrink the text to keep it readable
  const size = count > 60
      ? 'text-base gap-x-2 md:text-xl md:gap-x-3'
      : count > 30
        ? 'text-lg gap-x-3 md:text-2xl md:gap-x-4'
        : 'text-2xl gap-x-4 md:text-4xl md:gap-x-6'

  return (
    <div className="flex flex-col items-center gap-1" aria-label={scramble}>
      {lines.map((moves, i) => (
        <p key={i} className={`flex flex-wrap justify-center gap-y-2 ${size}`} aria-hidden>
          {moves.map((m, j) => (
            <span key={j}>{m}</span>
          ))}
        </p>
      ))}
    </div>
  )
}
