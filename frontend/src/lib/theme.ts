/**
 * Light / dark theme. Toggles the `dark` class on <html>, which Tailwind's
 * `dark:` variant keys off (see @custom-variant in index.css).
 * index.html runs the same check inline before first paint, so there's no flash.
 */
export type Theme = 'system' | 'light' | 'dark'

const media = window.matchMedia('(prefers-color-scheme: dark)')

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && media.matches)
  document.documentElement.classList.toggle('dark', dark)
}

/** Apply a theme now, and follow the OS setting while it's "system". Returns a cleanup. */
export function applyTheme(theme: Theme) {
  apply(theme)
  if (theme !== 'system') return () => {}
  const onChange = () => apply(theme)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
