import type { Solve } from '../../lib/db'
import { formatSolve, type Precision } from '../../lib/time'
import { SolveActions } from './SolveActions'

interface Props {
  solve: Solve
  precision: Precision
  confirmingDelete: boolean
  onConfirmingDeleteChange: (v: boolean) => void
}

/** The latest solve's time with its penalty and delete buttons. */
export function LastSolve({ solve, precision, confirmingDelete, onConfirmingDeleteChange }: Props) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="text-2xl tabular-nums">{formatSolve(solve.timeMs, solve.penalty, precision)}</span>
      <SolveActions
        key={solve.id}
        solve={solve}
        confirmingDelete={confirmingDelete}
        onConfirmingDeleteChange={onConfirmingDeleteChange}
        onDeleted={() => onConfirmingDeleteChange(false)}
      />
    </div>
  )
}
