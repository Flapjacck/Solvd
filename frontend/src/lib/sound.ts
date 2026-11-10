/**
 * Audio cues, synthesised with the Web Audio API (no sound files to download).
 *
 * Browsers only let a page make sound after a user gesture, so the AudioContext is
 * created (or resumed) by unlockAudio(), which useAudioUnlock() calls on the first
 * key press or tap. Until then playCue() does nothing.
 */

export type Cue = 'inspect8' | 'inspect12' | 'inspectEnd' | 'threshold' | 'finish' | 'pb'

interface Tone {
  freq: number // Hz
  start: number // seconds after the cue starts
  dur: number // seconds
  type?: OscillatorType
}

const CUES: Record<Cue, Tone[]> = {
  // WCA judges call "8 seconds" and "12 seconds": one beep, then two
  inspect8: [{ freq: 880, start: 0, dur: 0.12 }],
  inspect12: [
    { freq: 880, start: 0, dur: 0.1 },
    { freq: 880, start: 0.16, dur: 0.1 },
  ],
  // 15s: inspection is over (+2 from here, DNF after 17s)
  inspectEnd: [{ freq: 587, start: 0, dur: 0.35, type: 'square' }],
  // running time passed the target time
  threshold: [
    { freq: 1047, start: 0, dur: 0.07 },
    { freq: 1319, start: 0.09, dur: 0.07 },
  ],
  finish: [{ freq: 660, start: 0, dur: 0.09 }],
  // new best single: a quick rising arpeggio
  pb: [
    { freq: 523, start: 0, dur: 0.1 },
    { freq: 659, start: 0.09, dur: 0.1 },
    { freq: 784, start: 0.18, dur: 0.1 },
    { freq: 1047, start: 0.27, dur: 0.22 },
  ],
}

let ctx: AudioContext | null = null

function supported() {
  return typeof window !== 'undefined' && 'AudioContext' in window
}

/** Create or resume the AudioContext. Must run inside a user gesture handler. */
export function unlockAudio() {
  if (!supported()) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

/** Play a cue at a volume from 0 to 1. Silently skipped if audio isn't unlocked yet. */
export function playCue(cue: Cue, volume: number) {
  if (!ctx || ctx.state !== 'running' || volume <= 0) return
  const now = ctx.currentTime
  // square waves sound much louder than sines at the same gain
  for (const t of CUES[cue]) {
    const peak = Math.min(1, volume) * (t.type === 'square' ? 0.12 : 0.3)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = t.type ?? 'sine'
    osc.frequency.value = t.freq
    // short attack and release so tones don't click
    const at = now + t.start
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(peak, at + 0.005)
    gain.gain.setValueAtTime(peak, at + Math.max(0.005, t.dur - 0.03))
    gain.gain.linearRampToValueAtTime(0, at + t.dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start(at)
    osc.stop(at + t.dur + 0.02)
  }
}

/** Inspection call-outs, in ms since inspection started */
export const INSPECTION_CUES: readonly { at: number; cue: Cue }[] = [
  { at: 8000, cue: 'inspect8' },
  { at: 12000, cue: 'inspect12' },
  { at: 15000, cue: 'inspectEnd' },
]
