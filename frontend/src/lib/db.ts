import Dexie, { type EntityTable } from 'dexie'
import type { Penalty } from './time'

export interface Solve {
  id: string // UUID, so solves can be synced to a server later
  createdAt: number // epoch ms
  timeMs: number // raw time without penalty
  penalty: Penalty
  scramble: string
  event: string // e.g. "333"
  session: string // e.g. "default"
  notes: string // free text, '' when empty
}

const db = new Dexie('solvd') as Dexie & {
  solves: EntityTable<Solve, 'id'>
}

db.version(1).stores({
  solves: 'id, createdAt, event, session',
})

// v2: add notes (not indexed). Backfill older solves with an empty note.
db.version(2)
  .stores({ solves: 'id, createdAt, event, session' })
  .upgrade((tx) =>
    tx
      .table('solves')
      .toCollection()
      .modify((solve: Partial<Solve>) => {
        solve.notes ??= ''
      }),
  )

export type NewSolve = Omit<Solve, 'id' | 'createdAt' | 'notes'> & { notes?: string }
export type SolveChanges = Partial<Pick<Solve, 'penalty' | 'notes'>>

/**
 * Storage interface. v1 uses IndexedDB (below); a later version can
 * swap in an API-backed store without touching the UI.
 */
export interface SolveStore {
  add(solve: NewSolve): Promise<Solve>
  list(session?: string): Promise<Solve[]>
  get(id: string): Promise<Solve | undefined>
  update(id: string, changes: SolveChanges): Promise<void>
  remove(id: string): Promise<void>
  clear(session?: string): Promise<void>
}

export const localStore: SolveStore = {
  async add(input) {
    const solve: Solve = { notes: '', ...input, id: crypto.randomUUID(), createdAt: Date.now() }
    await db.solves.add(solve)
    return solve
  },
  async list(session = 'default') {
    return db.solves.where('session').equals(session).reverse().sortBy('createdAt')
  },
  async get(id) {
    return db.solves.get(id)
  },
  async update(id, changes) {
    await db.solves.update(id, changes)
  },
  async remove(id) {
    await db.solves.delete(id)
  },
  async clear(session = 'default') {
    await db.solves.where('session').equals(session).delete()
  },
}

export { db }
