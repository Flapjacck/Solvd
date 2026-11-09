import { localStore, type Solve } from '../lib/db'
import { ConfirmButton } from './ConfirmButton'
import { PenaltyButtons } from './PenaltyButtons'

interface Props {
  solve: Solve
  onDeleted?: () => void
  /** Controlled delete-confirm state (used by the delete-last shortcut) */
  confirmingDelete?: boolean
  onConfirmingDeleteChange?: (v: boolean) => void
}

/** Penalty toggles plus a confirmed delete for one solve. Used anywhere a solve can be edited. */
export function SolveActions({ solve, onDeleted, confirmingDelete, onConfirmingDeleteChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <PenaltyButtons value={solve.penalty} onChange={(penalty) => void localStore.update(solve.id, { penalty })} />
      <ConfirmButton
        className="text-red-600 dark:text-red-400 underline"
        confirmLabel="yes, delete"
        asking={confirmingDelete}
        onAskingChange={onConfirmingDeleteChange}
        onConfirm={() => {
          void localStore.remove(solve.id).then(onDeleted)
        }}
      >
        delete
      </ConfirmButton>
    </div>
  )
}
