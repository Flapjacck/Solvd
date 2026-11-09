import type { ReactNode } from 'react'

interface Props {
  /** Solving or inspecting: hide the sidebar so only the timer shows */
  focus: boolean
  /** Phones: whether the drawer is pulled out */
  open: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * Everything except the scramble and timer.
 * Desktop (md and up): a fixed left column. Phones: a drawer that slides in
 * from the left over a backdrop, opened from the menu button.
 * Fixed height either way: only its solve list scrolls, never the page.
 */
export function Sidebar({ focus, open, onClose, children }: Props) {
  // hidden, not unmounted, during focus so the scramble preview isn't rebuilt every solve
  return (
    <>
      {open && !focus && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-[85vw] max-w-80 flex-col gap-5 overflow-hidden border-r bg-white p-4 shadow-xl transition-transform dark:bg-neutral-950 md:static md:z-auto md:w-80 md:shrink-0 md:translate-x-0 md:shadow-none ${open ? 'translate-x-0' : '-translate-x-full'} ${focus ? 'hidden' : ''}`}
        aria-label="menu"
      >
        <button type="button" className="self-end text-sm underline md:hidden" onClick={onClose}>
          close
        </button>
        {children}
      </aside>
    </>
  )
}

/** A titled block inside the sidebar */
export function SidebarSection({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-2 ${className}`}>
      {title && <SectionTitle>{title}</SectionTitle>}
      {children}
    </section>
  )
}

/** Small uppercase heading used by sidebar sections */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-bold tracking-wide text-gray-500 uppercase dark:text-gray-400">{children}</h2>
}
