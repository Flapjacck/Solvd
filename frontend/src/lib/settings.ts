/**
 * Device preferences, stored in localStorage (not IndexedDB: these are per-device,
 * not part of your solve data). Read them in components with useSettings().
 */
import type { Precision } from './time'
import { DEFAULT_TIMER_FONT, type TimerFontId } from './fonts'

export interface Settings {
  hideTimerWhileSolving: boolean
  inspection: boolean // WCA 15s inspection: +2 after 15s, DNF after 17s
  holdMs: number // how long to hold before the timer arms
  precision: Precision // decimal places: 2 = 0.01s, 3 = 0.001s
  shortcuts: boolean
  timerFont: TimerFontId
}

export const DEFAULT_SETTINGS: Settings = {
  hideTimerWhileSolving: false,
  inspection: false,
  holdMs: 300,
  precision: 2,
  shortcuts: true,
  timerFont: DEFAULT_TIMER_FONT,
}

export const HOLD_OPTIONS = [0, 300, 550, 1000] as const

const KEY = 'solvd.settings'
const listeners = new Set<() => void>()
let current: Settings = load()

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function getSettings(): Settings {
  return current
}

export function updateSettings(changes: Partial<Settings>) {
  current = { ...current, ...changes }
  localStorage.setItem(KEY, JSON.stringify(current))
  listeners.forEach((l) => l())
}

export function resetSettings() {
  localStorage.removeItem(KEY)
  current = DEFAULT_SETTINGS
  listeners.forEach((l) => l())
}

export function subscribeSettings(listener: () => void) {
  listeners.add(listener)
  // keep other tabs in sync
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = load()
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}
