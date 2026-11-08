import { localStore, type Solve } from '../lib/db'
import { ConfirmButton } from './ConfirmButton'
import { PenaltyButtons } from './PenaltyButtons'

interface Props {
  solve: Solve
  onDeleted?: () => void
}

/** Penalty toggles plus a confirmed delete for one solve. Used anywhere a solve can be edited. */
export function SolveActions({ solve, onDeleted }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <PenaltyButtons value={solve.penalty} onChange={(penalty) => void localStore.update(solve.id, { penalty })} />
      <ConfirmButton
        className="text-red-600 underline"
        confirmLabel="yes, delete"
        onConfirm={() => {
          void localStore.remove(solve.id).then(onDeleted)
        }}
      >
        delete
      </ConfirmButton>
    </div>
  )
}
