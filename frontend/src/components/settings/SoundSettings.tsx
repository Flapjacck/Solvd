import { useState } from 'react'
import { updateSettings, type Settings, type SoundThreshold } from '../../lib/settings'
import { playCue, unlockAudio } from '../../lib/sound'
import { OptionGroup } from '../ui/OptionGroup'
import { Toggle } from '../ui/Toggle'

const THRESHOLD_OPTIONS: readonly { value: SoundThreshold; label: string }[] = [
  { value: 'off', label: 'off' },
  { value: 'best', label: 'best' },
  { value: 'ao5', label: 'ao5' },
  { value: 'ao12', label: 'ao12' },
  { value: 'custom', label: 'custom' },
]

/** Sound section of the settings dialog */
export function SoundSettings({ s }: { s: Settings }) {
  // seconds as typed, so the field can be empty or half-typed
  const [customText, setCustomText] = useState(String(s.soundThresholdMs / 1000))

  return (
    <section className="flex flex-col gap-3 text-sm">
      <h3 className="font-bold">Sound</h3>
      <Toggle
        label="Sound cues"
        hint="Beeps for inspection and the timer. Plays after your first key press or tap."
        checked={s.sound}
        onChange={(sound) => {
          // this click counts as the gesture that lets the page play sound
          unlockAudio()
          updateSettings({ sound })
          if (sound) playCue('finish', s.soundVolume)
        }}
      />
      {s.sound && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-wrap items-center gap-2">
            <span className="w-32">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={s.soundVolume}
              aria-valuetext={`${Math.round(s.soundVolume * 100)}%`}
              className="w-40 accent-current"
              onChange={(e) => updateSettings({ soundVolume: Number(e.target.value) })}
              // preview the new level once the slider is let go
              onPointerUp={(e) => playCue('finish', Number(e.currentTarget.value))}
              onKeyUp={(e) => playCue('finish', Number(e.currentTarget.value))}
            />
            <span className="w-10 text-xs text-gray-500 tabular-nums dark:text-gray-400">
              {Math.round(s.soundVolume * 100)}%
            </span>
          </label>
          <Toggle
            label="Inspection call-outs"
            hint="One beep at 8s, two at 12s, a long tone at 15s."
            checked={s.soundInspection}
            onChange={(soundInspection) => updateSettings({ soundInspection })}
          />
          <div className="flex flex-col gap-1">
            <OptionGroup
              label="Beep at time"
              value={s.soundThreshold}
              options={THRESHOLD_OPTIONS}
              onChange={(soundThreshold) => updateSettings({ soundThreshold })}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Beeps once when the running time passes your session best, current ao5 or ao12, or a set time.
            </span>
          </div>
          {s.soundThreshold === 'custom' && (
            <label className="flex flex-wrap items-center gap-2">
              <span className="w-32">Time (seconds)</span>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                step={0.5}
                value={customText}
                className="w-24 border bg-transparent px-1"
                onChange={(e) => {
                  setCustomText(e.target.value)
                  const sec = Number(e.target.value)
                  if (Number.isFinite(sec) && sec > 0) updateSettings({ soundThresholdMs: Math.round(sec * 1000) })
                }}
              />
            </label>
          )}
          <Toggle
            label="Beep when a solve stops"
            checked={s.soundFinish}
            onChange={(soundFinish) => updateSettings({ soundFinish })}
          />
          <Toggle
            label="Personal best sound"
            hint="Plays instead of the stop beep for a new best single in this session and event."
            checked={s.soundPb}
            onChange={(soundPb) => updateSettings({ soundPb })}
          />
        </div>
      )}
    </section>
  )
}
