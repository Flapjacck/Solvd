/** WCA events, using cubing.js event ids for randomScrambleForEvent. */
export interface PuzzleEvent {
  id: string
  label: string
  /** Blindfolded: WCA has no inspection for BLD, so the timer skips it */
  blind?: boolean
}

export const EVENTS = [
  { id: '333', label: '3x3' },
  { id: '222', label: '2x2' },
  { id: '444', label: '4x4' },
  { id: '555', label: '5x5' },
  { id: '666', label: '6x6' },
  { id: '777', label: '7x7' },
  { id: '333oh', label: '3x3 OH' },
  { id: '333bf', label: '3x3 BLD', blind: true },
  { id: 'pyram', label: 'Pyraminx' },
  { id: 'minx', label: 'Megaminx' },
  { id: 'skewb', label: 'Skewb' },
  { id: 'sq1', label: 'Square-1' },
  { id: 'clock', label: 'Clock' },
] as const satisfies readonly PuzzleEvent[]

export type EventId = (typeof EVENTS)[number]['id']
export const DEFAULT_EVENT: EventId = '333'

export function getEvent(id: string): PuzzleEvent {
  return EVENTS.find((e) => e.id === id) ?? EVENTS[0]
}
