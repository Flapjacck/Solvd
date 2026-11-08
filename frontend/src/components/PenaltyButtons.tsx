import type { Penalty } from '../lib/time'

const OPTIONS: { value: Penalty; label: string }[] = [
  { value: 'none', label: 'OK' },
  { value: '+2', label: '+2' },
  { value: 'DNF', label: 'DNF' },
]

interface Props {
  value: Penalty
  onChange: (penalty: Penalty) => void
}

/** OK / +2 / DNF toggle group. The current penalty is highlighted. */
export function PenaltyButtons({ value, onChange }: Props) {
  return (
    <div className="flex gap-1" role="group" aria-label="penalty">
      {OPTIONS.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            className={`border px-2 ${active ? 'bg-black text-white' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
