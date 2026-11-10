import { useEffect } from 'react'
import { unlockAudio } from '../lib/sound'

/**
 * Unlock audio on user gestures while sound is on. Listens in the capture phase,
 * so it still runs when a handler stops propagation (the scramble area does).
 */
export function useAudioUnlock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const events = ['pointerdown', 'pointerup', 'keydown', 'touchend'] as const
    events.forEach((e) => window.addEventListener(e, unlockAudio, { capture: true, passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, unlockAudio, { capture: true }))
  }, [enabled])
}
