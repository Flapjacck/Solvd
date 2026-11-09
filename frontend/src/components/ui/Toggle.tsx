interface Props {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Labelled checkbox row for settings */
export function Toggle({ label, hint, checked, onChange }: Props) {
  return (
    <label className="flex items-start gap-2">
      <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
      </span>
    </label>
  )
}
