import { db, type Session, type Solve } from './db'
import { DEFAULT_EVENT, EVENTS } from './events'
import type { Penalty } from './time'

/** Bump when the export shape changes; import refuses versions it doesn't know. */
export const EXPORT_VERSION = 1

/** Versioned backup of everything: sessions plus every solve (notes live on each solve). */
export interface SolvdExport {
  app: 'solvd'
  version: number
  exportedAt: number // epoch ms
  sessions: Session[]
  solves: Solve[]
}

export interface ImportSummary {
  /** 'solvd' backup or a csTimer export */
  source: 'solvd' | 'cstimer'
  imported: number
  /** already saved (same solve id), or listed twice in the file */
  skipped: number
  /** rows that didn't look like a solve */
  invalid: number
  sessionsCreated: number
}

const EVENT_IDS = new Set<string>(EVENTS.map((e) => e.id))
const PENALTIES = new Set<string>(['none', '+2', 'DNF'])

export async function exportData(): Promise<SolvdExport> {
  const [sessions, solves] = await db.transaction('r', db.sessions, db.solves, () =>
    Promise.all([db.sessions.orderBy('createdAt').toArray(), db.solves.orderBy('createdAt').toArray()]),
  )
  return { app: 'solvd', version: EXPORT_VERSION, exportedAt: Date.now(), sessions, solves }
}

/** Export and save it as a .json download, e.g. solvd-2026-11-09.json */
export async function downloadExport(): Promise<SolvdExport> {
  const data = await exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `solvd-${new Date(data.exportedAt).toISOString().slice(0, 10)}.json`
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return data
}

/** Thrown for files we can't read at all. The message is shown to the user as is. */
export class ImportError extends Error {}

/** Read a Solvd backup or a csTimer export and add its solves. Never overwrites existing solves. */
export async function importText(text: string): Promise<ImportSummary> {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ImportError("That file isn't JSON. Pick a Solvd or csTimer export.")
  }
  if (!isObject(data)) throw new ImportError("That file isn't a Solvd or csTimer export.")
  if (data.app === 'solvd') return importSolvd(data)
  if (isCsTimer(data)) return importCsTimer(data)
  throw new ImportError("That file isn't a Solvd or csTimer export.")
}

// ---- Solvd backups ----

async function importSolvd(data: Record<string, unknown>): Promise<ImportSummary> {
  if (typeof data.version !== 'number') throw new ImportError('This Solvd export has no version.')
  if (data.version > EXPORT_VERSION)
    throw new ImportError(`This export is from a newer Solvd (v${data.version}). This app reads v${EXPORT_VERSION}.`)
  if (data.version !== EXPORT_VERSION) throw new ImportError(`Unknown Solvd export version: ${data.version}.`)
  if (!Array.isArray(data.sessions) || !Array.isArray(data.solves))
    throw new ImportError('This Solvd export is missing its sessions or solves.')

  const sessions = data.sessions.filter(isSession)
  const solves: Solve[] = []
  let invalid = 0
  for (const raw of data.solves) {
    const solve = toSolve(raw)
    if (solve) solves.push(solve)
    else invalid++
  }
  return { source: 'solvd', invalid, ...(await save(sessions, solves)) }
}

function isSession(v: unknown): v is Session {
  return isObject(v) && typeof v.id === 'string' && !!v.id && typeof v.name === 'string'
}

/** Check one exported solve, keeping only the fields we know */
function toSolve(v: unknown): Solve | null {
  if (!isObject(v)) return null
  const { id, createdAt, timeMs, penalty, scramble, event, session, notes } = v
  if (typeof id !== 'string' || !id) return null
  if (!isFiniteNumber(createdAt) || !isFiniteNumber(timeMs) || timeMs < 0) return null
  if (typeof penalty !== 'string' || !PENALTIES.has(penalty)) return null
  if (typeof scramble !== 'string' || typeof session !== 'string' || !session) return null
  if (typeof event !== 'string' || !EVENT_IDS.has(event)) return null
  return {
    id,
    createdAt,
    timeMs,
    penalty: penalty as Penalty,
    scramble,
    event,
    session,
    notes: typeof notes === 'string' ? notes : '',
  }
}

/**
 * Add new sessions and solves in one transaction.
 * Sessions match by id. A file session we don't have is created (keeping its name and event);
 * a solve whose session is in neither place gets an "Imported" session with that id.
 * Solves whose id is already saved (or repeated in the file) are skipped.
 */
async function save(fileSessions: Session[], solves: Solve[]) {
  return db.transaction('rw', db.sessions, db.solves, async () => {
    const have = new Set((await db.sessions.toCollection().primaryKeys()) as string[])
    const fromFile = new Map(fileSessions.map((s) => [s.id, s]))
    const newSessions: Session[] = []
    const ensureSession = (id: string, event: string) => {
      if (have.has(id)) return
      const s = fromFile.get(id)
      newSessions.push({
        id,
        name: s?.name.trim() || 'Imported',
        createdAt: isFiniteNumber(s?.createdAt) ? s.createdAt : Date.now(),
        event: s && EVENT_IDS.has(s.event) ? s.event : event,
      })
      have.add(id)
    }

    // every file session comes across, even empty ones
    for (const s of fileSessions) ensureSession(s.id, DEFAULT_EVENT)

    const existing = await db.solves.bulkGet(solves.map((s) => s.id))
    const seen = new Set<string>()
    const fresh: Solve[] = []
    solves.forEach((s, i) => {
      if (existing[i] || seen.has(s.id)) return
      seen.add(s.id)
      ensureSession(s.session, s.event)
      fresh.push(s)
    })

    await db.sessions.bulkAdd(newSessions)
    await db.solves.bulkAdd(fresh)
    return { imported: fresh.length, skipped: solves.length - fresh.length, sessionsCreated: newSessions.length }
  })
}

// ---- csTimer exports ----
// { session1: [[[penalty, ms], scramble, comment, unixSeconds], ...], ..., properties: { sessionData: '{"1":{"name":..,"opt":{"scrType":..}}}' } }
// penalty: 0 = none, 2000 = +2, -1 = DNF

/** csTimer scramble types we can map to a WCA event. Anything else (or none) is 3x3. */
const CSTIMER_EVENTS: Record<string, string> = {
  '333': '333',
  '333oh': '333oh',
  '333ni': '333bf',
  '222so': '222',
  '444wca': '444',
  '555wca': '555',
  '666wca': '666',
  '777wca': '777',
  pyrso: 'pyram',
  mgmp: 'minx',
  skbso: 'skewb',
  sqrs: 'sq1',
  clkwca: 'clock',
}

function isCsTimer(data: Record<string, unknown>) {
  return Object.keys(data).some((k) => /^session\d+$/.test(k) && Array.isArray(data[k]))
}

interface CsSessionInfo {
  name?: unknown
  opt?: { scrType?: unknown }
}

async function importCsTimer(data: Record<string, unknown>): Promise<ImportSummary> {
  let info: Record<string, CsSessionInfo> = {}
  const props = data.properties
  if (isObject(props) && typeof props.sessionData === 'string') {
    try {
      const parsed: unknown = JSON.parse(props.sessionData)
      if (isObject(parsed)) info = parsed as Record<string, CsSessionInfo>
    } catch {
      // names are optional; fall back to "csTimer N"
    }
  }

  const sessions: Session[] = []
  const solves: Solve[] = []
  let invalid = 0
  for (const key of Object.keys(data)) {
    const n = /^session(\d+)$/.exec(key)?.[1]
    const rows = data[key]
    if (!n || !Array.isArray(rows) || !rows.length) continue // csTimer keeps empty sessions around

    const meta = isObject(info[n]) ? info[n] : {}
    const scrType = isObject(meta.opt) ? meta.opt.scrType : undefined
    const event = (typeof scrType === 'string' && CSTIMER_EVENTS[scrType]) || DEFAULT_EVENT
    const name = meta.name !== undefined && String(meta.name).trim() ? String(meta.name).trim() : n
    // stable ids so importing the same export twice skips everything
    const sessionId = `cstimer-${n}`
    let first = Infinity

    for (const row of rows) {
      const solve = csSolve(row, sessionId, event)
      if (!solve) {
        invalid++
        continue
      }
      first = Math.min(first, solve.createdAt)
      solves.push(solve)
    }
    sessions.push({ id: sessionId, name: `csTimer ${name}`, createdAt: Number.isFinite(first) ? first : Date.now(), event })
  }
  return { source: 'cstimer', invalid, ...(await save(sessions, solves)) }
}

function csSolve(row: unknown, session: string, event: string): Solve | null {
  if (!Array.isArray(row) || !Array.isArray(row[0])) return null
  const [[pen, ms], scramble, comment, ts] = row as [unknown[], unknown, unknown, unknown]
  if (!isFiniteNumber(ms) || ms < 0 || !isFiniteNumber(ts)) return null
  let penalty: Penalty
  if (pen === 0) penalty = 'none'
  else if (pen === 2000) penalty = '+2'
  else if (pen === -1) penalty = 'DNF'
  else return null
  return {
    id: `cstimer-${session.slice(8)}-${ts}-${ms}`,
    createdAt: ts * 1000,
    timeMs: ms,
    penalty,
    scramble: typeof scramble === 'string' ? scramble : '',
    event,
    session,
    notes: typeof comment === 'string' ? comment : '',
  }
}

// ---- helpers ----

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}
