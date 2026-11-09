import { useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onConfirm: () => void
  confirmLabel?: string
  className?: string
  /** Optional controlled mode, e.g. so a keyboard shortcut can open the confirm step */
  asking?: boolean
  onAskingChange?: (asking: boolean) => void
}

/** Button that asks "are you sure?" inline before running a destructive action. */
export function ConfirmButton({
  children,
  onConfirm,
  confirmLabel = 'confirm',
  className = '',
  asking: askingProp,
  onAskingChange,
}: Props) {
  const [askingState, setAskingState] = useState(false)
  const asking = askingProp ?? askingState
  const setAsking = (v: boolean) => {
    setAskingState(v)
    onAskingChange?.(v)
  }

  if (!asking) {
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {children}
      </button>
    )
  }

  return (
    <span className="flex gap-2" onKeyDown={(e) => e.key === 'Escape' && setAsking(false)}>
      {/* Focus lands on confirm so Enter confirms; Esc or cancel backs out */}
      <button
        type="button"
        className="text-red-600 underline"
        autoFocus
        onClick={() => {
          setAsking(false)
          onConfirm()
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className="underline" onClick={() => setAsking(false)}>
        cancel
      </button>
    </span>
  )
}
