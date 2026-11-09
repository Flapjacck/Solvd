import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  /** Tailwind max-width class, e.g. 'max-w-3xl' for a wider dialog */
  width?: string
}

/** Native <dialog> modal with a title and close button. Esc and "close" both call onClose. */
export function Modal({ title, onClose, children, width = 'max-w-lg' }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] ${width} overflow-y-auto bg-white p-4 text-gray-900 backdrop:bg-black/40 dark:bg-neutral-900 dark:text-gray-100 dark:backdrop:bg-black/60`}
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
