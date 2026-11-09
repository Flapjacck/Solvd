import { EVENTS } from '../lib/events'

interface Props {
  value: string
  onChange: (event: string) => void
  /** Locked once a session has solves, so its stats stay one event */
  locked: boolean
}

/** Event dropdown for the active session. */
export function EventPicker({ value, onChange, locked }: Props) {
  return (
    <select
      className="border px-1 disabled:opacity-60"
      value={value}
      disabled={locked}
      aria-label="event"
      title={locked ? 'This session has solves. Make a new session for another event.' : undefined}
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
