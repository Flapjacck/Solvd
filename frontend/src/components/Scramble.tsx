/** Scramble shown move by move with clear spacing between moves. */
export function Scramble({ scramble, loading }: { scramble: string; loading: boolean }) {
  if (loading) return <p className="text-center text-lg text-gray-500">generating scramble...</p>
  const moves = scramble.split(/\s+/).filter(Boolean)
  return (
    <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xl" aria-label={scramble}>
      {moves.map((m, i) => (
        <span key={i} aria-hidden>
          {m}
        </span>
      ))}
    </p>
  )
}
