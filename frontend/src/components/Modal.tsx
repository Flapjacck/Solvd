import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Native <dialog> modal with a title and close button. Esc and "close" both call onClose. */
export function Modal({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className="m-auto w-full max-w-lg p-4 font-mono backdrop:bg-black/40"
      onCancel={(e) => {
        e.preventDefault() // let the parent decide (e.g. save first)
        onClose()
      }}
    >
      <div className="flex flex-col gap-3">
        <header className="flex items-baseline justify-between">
          <h2 className="font-bold">{title}</h2>
          <button type="button" className="underline" onClick={onClose}>
            close
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
