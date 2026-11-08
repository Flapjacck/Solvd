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
}

const db = new Dexie('solvd') as Dexie & {
  solves: EntityTable<Solve, 'id'>
}

db.version(1).stores({
  solves: 'id, createdAt, event, session',
})

/**
 * Storage interface. v1 uses IndexedDB (below); a later version can
 * swap in an API-backed store without touching the UI.
 */
export interface SolveStore {
  add(solve: Omit<Solve, 'id' | 'createdAt'>): Promise<Solve>
  list(session?: string): Promise<Solve[]>
  update(id: string, changes: Partial<Pick<Solve, 'penalty'>>): Promise<void>
  remove(id: string): Promise<void>
  clear(session?: string): Promise<void>
}

export const localStore: SolveStore = {
  async add(input) {
    const solve: Solve = { ...input, id: crypto.randomUUID(), createdAt: Date.now() }
    await db.solves.add(solve)
    return solve
  },
  async list(session = 'default') {
    return db.solves.where('session').equals(session).reverse().sortBy('createdAt')
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
