import { SegmentButton } from './SegmentButton'

interface Props<T extends string | number> {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

/** Row of mutually exclusive buttons (the selected one is highlighted) */
export function OptionGroup<T extends string | number>({ label, value, options, onChange }: Props<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-32">{label}</span>
      <div className="flex gap-1" role="group" aria-label={label}>
        {options.map((o) => (
          <SegmentButton key={o.value} active={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </SegmentButton>
        ))}
      </div>
    </div>
  )
}
