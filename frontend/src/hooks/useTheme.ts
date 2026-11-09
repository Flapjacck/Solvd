import { useEffect } from 'react'
import { applyTheme } from '../lib/theme'
import { useSettings } from './useSettings'

/** Keep <html class="dark"> in sync with the theme setting. Call once, in App. */
export function useTheme() {
  const { theme } = useSettings()
  useEffect(() => applyTheme(theme), [theme])
}
