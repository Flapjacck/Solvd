import type { Penalty } from '../../lib/time'
import { SegmentButton } from '../ui/SegmentButton'

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
      {OPTIONS.map((o) => (
        <SegmentButton key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </SegmentButton>
      ))}
    </div>
  )
}
