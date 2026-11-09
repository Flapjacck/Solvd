/**
 * Timer fonts (Google Fonts). Only the selected font is downloaded:
 * Orbitron (the default) is linked in index.html, the others are added on demand.
 */
export interface TimerFont {
  id: string
  label: string
  family: string
  weight: number
  /**
   * Fixed width per digit for fonts without equal-width digits, so a running
   * time doesn't jitter. null = the font's digits are already equal width.
   * Measured from each font's widest digit.
   */
  digitWidth: string | null
}

export const TIMER_FONTS = [
  { id: 'orbitron', label: 'Orbitron', family: 'Orbitron', weight: 700, digitWidth: '0.85em' },
  { id: 'share-tech-mono', label: 'Share Tech Mono', family: 'Share Tech Mono', weight: 400, digitWidth: null },
  { id: 'chakra-petch', label: 'Chakra Petch', family: 'Chakra Petch', weight: 700, digitWidth: '0.66em' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', family: 'JetBrains Mono', weight: 700, digitWidth: null },
  { id: 'vt323', label: 'VT323', family: 'VT323', weight: 400, digitWidth: null },
] as const satisfies readonly TimerFont[]

export type TimerFontId = (typeof TIMER_FONTS)[number]['id']
export const DEFAULT_TIMER_FONT: TimerFontId = 'orbitron'

export function getTimerFont(id: string): TimerFont {
  return TIMER_FONTS.find((f) => f.id === id) ?? TIMER_FONTS[0]
}

/** Google Fonts css2 URL for one family at one weight */
function cssUrl(font: TimerFont) {
  return `https://fonts.googleapis.com/css2?family=${font.family.replace(/ /g, '+')}:wght@${font.weight}&display=swap`
}

/** Add the font's stylesheet to <head> once. Orbitron is already in index.html. */
export function loadTimerFont(font: TimerFont) {
  if (font.id === DEFAULT_TIMER_FONT) return
  const id = `timer-font-${font.id}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = cssUrl(font)
  document.head.append(link)
}
