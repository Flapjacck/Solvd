import { useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onConfirm: () => void
  confirmLabel?: string
  className?: string
}

/** Button that asks "are you sure?" inline before running a destructive action. */
export function ConfirmButton({ children, onConfirm, confirmLabel = 'confirm', className = '' }: Props) {
  const [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {children}
      </button>
    )
  }

  return (
    <span className="flex gap-2">
      <button
        type="button"
        className="text-red-600 underline"
        onClick={() => {
          setAsking(false)
          onConfirm()
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className="underline" autoFocus onClick={() => setAsking(false)}>
        cancel
      </button>
    </span>
  )
}
