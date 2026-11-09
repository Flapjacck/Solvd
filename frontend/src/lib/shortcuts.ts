/** Keyboard shortcuts (active when the timer is idle and nothing is being typed) */
export const SHORTCUTS = [
  { key: 'n', label: 'N', action: 'newScramble', description: 'new scramble' },
  { key: '2', label: '2', action: 'togglePlus2', description: 'toggle +2 on last solve' },
  { key: 'd', label: 'D', action: 'toggleDnf', description: 'toggle DNF on last solve' },
  { key: 'Backspace', label: 'Backspace', action: 'deleteLast', description: 'delete last solve (asks first)' },
  { key: ',', label: ',', action: 'openSettings', description: 'open settings' },
] as const

export type ShortcutAction = (typeof SHORTCUTS)[number]['action']
