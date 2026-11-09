import { useSyncExternalStore } from 'react'
import { getSettings, subscribeSettings } from '../lib/settings'

/** Current settings; re-renders when they change (in this tab or another). */
export function useSettings() {
  return useSyncExternalStore(subscribeSettings, getSettings)
}
