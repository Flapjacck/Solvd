import { useRef, useState } from 'react'
import { downloadExport, ImportError, importText, type ImportSummary } from '../../lib/transfer'

type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'exported'; solves: number; sessions: number }
  | { kind: 'imported'; summary: ImportSummary }
  | { kind: 'error'; message: string }

/** Export everything to a JSON file, or import a Solvd backup or csTimer export. */
export function DataTransfer() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const fileRef = useRef<HTMLInputElement>(null)

  const exportAll = async () => {
    setStatus({ kind: 'busy' })
    try {
      const data = await downloadExport()
      setStatus({ kind: 'exported', solves: data.solves.length, sessions: data.sessions.length })
    } catch (err) {
      setStatus({ kind: 'error', message: `Export failed: ${String(err)}` })
    }
  }

  const importFile = async (file: File) => {
    setStatus({ kind: 'busy' })
    try {
      setStatus({ kind: 'imported', summary: await importText(await file.text()) })
    } catch (err) {
      const message = err instanceof ImportError ? err.message : `Import failed: ${String(err)}`
      setStatus({ kind: 'error', message })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="underline" disabled={status.kind === 'busy'} onClick={() => void exportAll()}>
          export
        </button>
        <button
          type="button"
          className="underline"
          disabled={status.kind === 'busy'}
          onClick={() => fileRef.current?.click()}
        >
          import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.txt,application/json,text/plain"
          className="hidden"
          aria-label="import file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = '' // so picking the same file again still fires
            if (file) void importFile(file)
          }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Export saves every session, solve and note to a JSON file. Import adds solves from a Solvd export or a csTimer
        export and skips ones you already have.
      </p>
      <StatusLine status={status} />
    </div>
  )
}

function StatusLine({ status }: { status: Status }) {
  switch (status.kind) {
    case 'idle':
      return null
    case 'busy':
      return <p role="status">working…</p>
    case 'exported':
      return (
        <p role="status">
          Exported {plural(status.solves, 'solve')} in {plural(status.sessions, 'session')}.
        </p>
      )
    case 'imported': {
      const s = status.summary
      return (
        <p role="status" data-import-summary>
          {s.source === 'cstimer' ? 'csTimer import: ' : ''}
          {s.imported} imported, {s.skipped} skipped (already saved), {s.invalid} invalid
          {s.sessionsCreated ? `, ${plural(s.sessionsCreated, 'new session')}` : ''}.
        </p>
      )
    }
    case 'error':
      return (
        <p role="alert" className="text-red-600 dark:text-red-400">
          {status.message}
        </p>
      )
  }
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}
