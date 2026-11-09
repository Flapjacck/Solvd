import { useSettings } from '../hooks/useSettings'
import { HOLD_OPTIONS, resetSettings, updateSettings } from '../lib/settings'
import { SHORTCUTS } from '../lib/shortcuts'
import { ConfirmButton } from './ConfirmButton'
import { Modal } from './Modal'
import { OptionGroup } from './OptionGroup'
import { Toggle } from './Toggle'

const PRECISION_OPTIONS = [
  { value: 2, label: '0.01' },
  { value: 3, label: '0.001' },
] as const

const HOLD_LABELS = HOLD_OPTIONS.map((ms) => ({ value: ms, label: ms === 0 ? 'none' : `${ms / 1000}s` }))

/** Settings panel. Changes save immediately (localStorage, this device only). */
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const s = useSettings()

  return (
    <Modal title="Settings" onClose={onClose}>
      <section className="flex flex-col gap-3 text-sm">
        <h3 className="font-bold">Timer</h3>
        <Toggle
          label="WCA inspection"
          hint="15s to inspect. Starting after 15s is +2, after 17s is DNF. Esc cancels."
          checked={s.inspection}
          onChange={(inspection) => updateSettings({ inspection })}
        />
        <Toggle
          label="Hide timer while solving"
          hint="Shows 'solving' instead of the running time."
          checked={s.hideTimerWhileSolving}
          onChange={(hideTimerWhileSolving) => updateSettings({ hideTimerWhileSolving })}
        />
        <OptionGroup
          label="Hold to start"
          value={s.holdMs}
          options={HOLD_LABELS}
          onChange={(holdMs) => updateSettings({ holdMs })}
        />
        <OptionGroup
          label="Precision"
          value={s.precision}
          options={PRECISION_OPTIONS}
          onChange={(precision) => updateSettings({ precision })}
        />
      </section>

      <section className="flex flex-col gap-2 text-sm">
        <h3 className="font-bold">Keyboard</h3>
        <Toggle
          label="Keyboard shortcuts"
          checked={s.shortcuts}
          onChange={(shortcuts) => updateSettings({ shortcuts })}
        />
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-gray-500">
          <dt>Space</dt>
          <dd>hold and release to start, any key stops</dd>
          <dt>Esc</dt>
          <dd>cancel inspection</dd>
          {SHORTCUTS.map((k) => (
            <div key={k.key} className="contents">
              <dt>{k.label}</dt>
              <dd>{k.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ConfirmButton className="self-start text-sm underline" confirmLabel="yes, reset" onConfirm={resetSettings}>
        reset to defaults
      </ConfirmButton>
    </Modal>
  )
}
