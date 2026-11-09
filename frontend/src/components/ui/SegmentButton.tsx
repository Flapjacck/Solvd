import type { ReactNode } from 'react'

interface Props {
  active: boolean
  onClick: () => void
  children: ReactNode
}

/** One button in a toggle group. Shows pressed state visually and via aria-pressed. */
export function SegmentButton({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`border px-2 ${active ? 'bg-black text-white dark:bg-white dark:text-black' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
