import Dexie, { type EntityTable } from 'dexie'
import type { Penalty } from './time'
import { DEFAULT_EVENT } from './events'

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

export interface Session {
  id: string // UUID ('default' for the first session)
  name: string
  createdAt: number // epoch ms
  event: string // last picked event (cubing.js id, e.g. "333", "pyram"); each solve keeps its own
}

export const DEFAULT_SESSION: Session = { id: 'default', name: 'Session 1', createdAt: 0, event: DEFAULT_EVENT }

const db = new Dexie('solvd') as Dexie & {
  solves: EntityTable<Solve, 'id'>
  sessions: EntityTable<Session, 'id'>
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

// v3: sessions table. Existing solves already use session 'default', so give it a row.
db.version(3)
  .stores({ solves: 'id, createdAt, event, session', sessions: 'id, createdAt' })
  .upgrade((tx) => tx.table('sessions').add({ ...DEFAULT_SESSION, createdAt: Date.now() }))

// v4: each session has an event. Existing sessions were all 3x3.
db.version(4)
  .stores({ solves: 'id, createdAt, event, session', sessions: 'id, createdAt' })
  .upgrade((tx) =>
    tx
      .table('sessions')
      .toCollection()
      .modify((session: Partial<Session>) => {
        session.event ??= DEFAULT_EVENT
      }),
  )

// v5: index solves by session + event, so a session can hold several events
// and each event's list and stats load on their own
db.version(5).stores({ solves: 'id, createdAt, event, session, [session+event]', sessions: 'id, createdAt' })

// Brand new database: start with one session
db.on('populate', (tx) => {
  void tx.table('sessions').add({ ...DEFAULT_SESSION, createdAt: Date.now() })
})

export type NewSolve = Omit<Solve, 'id' | 'createdAt' | 'notes'> & { notes?: string }
export type SolveChanges = Partial<Pick<Solve, 'penalty' | 'notes'>>

/**
 * Storage interface. v1 uses IndexedDB (below); a later version can
 * swap in an API-backed store without touching the UI.
 */
export interface SolveStore {
  add(solve: NewSolve): Promise<Solve>
  /** Newest first. With an event, only that event's solves in the session. */
  list(session?: string, event?: string): Promise<Solve[]>
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
  async list(session = 'default', event) {
    const query = event
      ? db.solves.where('[session+event]').equals([session, event])
      : db.solves.where('session').equals(session)
    return query.reverse().sortBy('createdAt')
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

/** Session storage. Same idea as SolveStore: swap for an API later. */
export interface SessionStore {
  list(): Promise<Session[]>
  add(name: string, event: string): Promise<Session>
  rename(id: string, name: string): Promise<void>
  setEvent(id: string, event: string): Promise<void>
  /** Deletes the session and all of its solves. Refuses to delete the last session. */
  remove(id: string): Promise<void>
}

export const localSessions: SessionStore = {
  async list() {
    return db.sessions.orderBy('createdAt').toArray()
  },
  async add(name, event) {
    const session: Session = { id: crypto.randomUUID(), name, createdAt: Date.now(), event }
    await db.sessions.add(session)
    return session
  },
  async rename(id, name) {
    await db.sessions.update(id, { name })
  },
  async setEvent(id, event) {
    await db.sessions.update(id, { event })
  },
  async remove(id) {
    await db.transaction('rw', db.sessions, db.solves, async () => {
      if ((await db.sessions.count()) <= 1) throw new Error("Can't delete the only session")
      await db.solves.where('session').equals(id).delete()
      await db.sessions.delete(id)
    })
  },
}

export { db }
