import type { ReactNode } from 'react'

interface Props {
  hidden: boolean
  children: ReactNode
}

/**
 * Left sidebar holding everything except the scramble and timer.
 * Fixed height: only its solve list scrolls, never the page.
 */
export function Sidebar({ hidden, children }: Props) {
  return (
    <aside
      className={`flex h-full w-80 shrink-0 flex-col gap-5 overflow-hidden border-r p-4 ${hidden ? 'hidden' : ''}`}
    >
      {children}
    </aside>
  )
}

/** A titled block inside the sidebar */
export function SidebarSection({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-2 ${className}`}>
      {title && <h2 className="text-xs font-bold tracking-wide text-gray-500 uppercase dark:text-gray-400">{title}</h2>}
      {children}
    </section>
  )
}
