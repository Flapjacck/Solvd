import { EVENTS } from '../../lib/events'

interface Props {
  value: string
  onChange: (event: string) => void
}

/** Event dropdown. Each solve is saved with its event, so switching is always safe. */
export function EventPicker({ value, onChange }: Props) {
  return (
    <select
      className="border px-1"
      value={value}
      aria-label="event"
      onChange={(e) => {
        onChange(e.target.value)
        e.currentTarget.blur() // hand space back to the timer
      }}
    >
      {EVENTS.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {ev.label}
        </option>
      ))}
    </select>
  )
}
