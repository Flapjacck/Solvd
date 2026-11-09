const REPO_URL = 'https://github.com/Flapjacck/Solvd'

/** Small GitHub mark linking to the repo. The hover tilt and scale are skipped for reduced motion. */
export function GitHubLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Solvd on GitHub"
      title="Solvd on GitHub"
      className={`group inline-flex size-9 items-center justify-center rounded-full text-gray-500 transition-colors duration-200 hover:text-black focus-visible:text-black dark:text-gray-400 dark:hover:text-white dark:focus-visible:text-white ${className}`}
      // taps on it shouldn't start the timer
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="size-6 fill-current transition-transform duration-300 ease-out motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-125 motion-safe:group-focus-visible:-rotate-12 motion-safe:group-focus-visible:scale-125 motion-safe:group-active:scale-95"
      >
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    </a>
  )
}
