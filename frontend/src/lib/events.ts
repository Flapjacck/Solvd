/** WCA events, using cubing.js event ids for randomScrambleForEvent. */
export interface PuzzleEvent {
  id: string
  label: string
  /** cubing.js puzzle id for TwistyPlayer (the scramble preview) */
  puzzle: string
  /** Blindfolded: WCA has no inspection for BLD, so the timer skips it */
  blind?: boolean
}

export const EVENTS = [
  { id: '333', puzzle: '3x3x3', label: '3x3' },
  { id: '222', puzzle: '2x2x2', label: '2x2' },
  { id: '444', puzzle: '4x4x4', label: '4x4' },
  { id: '555', puzzle: '5x5x5', label: '5x5' },
  { id: '666', puzzle: '6x6x6', label: '6x6' },
  { id: '777', puzzle: '7x7x7', label: '7x7' },
  { id: '333oh', puzzle: '3x3x3', label: '3x3 OH' },
  { id: '333bf', puzzle: '3x3x3', label: '3x3 BLD', blind: true },
  { id: 'pyram', puzzle: 'pyraminx', label: 'Pyraminx' },
  { id: 'minx', puzzle: 'megaminx', label: 'Megaminx' },
  { id: 'skewb', puzzle: 'skewb', label: 'Skewb' },
  { id: 'sq1', puzzle: 'square1', label: 'Square-1' },
  { id: 'clock', puzzle: 'clock', label: 'Clock' },
] as const satisfies readonly PuzzleEvent[]

export type EventId = (typeof EVENTS)[number]['id']
export const DEFAULT_EVENT: EventId = '333'

export function getEvent(id: string): PuzzleEvent {
  return EVENTS.find((e) => e.id === id) ?? EVENTS[0]
}
