/**
 * Open folder: where a run's code is on this Mac, and a way there. The run branch's worktree holds the whole project as
 * merged so far; every writing role also has its own worktree. The backend opens only those (Finder or the Kiro IDE).
 */
import { useState } from 'react'
import type { AppApi } from '@kirocrew/app-sdk'
import { paths } from './format'
import { errorText } from './useBoard'

export function FolderActions({ api, run, role, path }: { api: AppApi; run: string; role: string | null; path: string | null }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const open = (app: 'finder' | 'kiro') => {
    setMsg(null)
    api
      .post<{ ok: boolean; path: string; app: string }>(paths.open(run), { role, app })
      .then((r) => setMsg({ ok: true, text: app === 'kiro' ? 'Opened in Kiro' : 'Opened in Finder' }))
      .catch((e) => setMsg({ ok: false, text: errorText(e) }))
  }
  const copy = () => {
    if (!path) return
    const done = () => setMsg({ ok: true, text: 'Path copied' })
    const fail = () => setMsg({ ok: false, text: 'Could not copy; select the path above by hand' })
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(path).then(done, fail)
    else fail()
  }
  return (
    <div className="kt-folder" data-testid="kt-folder">
      {path && (
        <code className="kt-folder-path" title={path}>
          {path}
        </code>
      )}
      <span className="kt-folder-acts">
        <button type="button" className="kt-btn is-small" onClick={() => open('finder')}>
          📁 Open in Finder
        </button>
        <button type="button" className="kt-btn is-small" onClick={() => open('kiro')}>
          Open in Kiro
        </button>
        {path && (
          <button type="button" className="kt-btn is-small" onClick={copy}>
            Copy path
          </button>
        )}
        {msg && (
          <span role="status" className={msg.ok ? 'kt-dim' : 'kt-error'}>
            {msg.text}
          </span>
        )}
      </span>
    </div>
  )
}

/** Under the top bar: the run's own folder. */
export function FolderPanel({ api, run, folder, onClose }: { api: AppApi; run: string; folder: string; onClose: () => void }) {
  return (
    <section className="kt-folder-panel" aria-label="Project folder">
      <div className="kt-folder-panel-head">
        <strong>Project folder</strong>
        <span className="kt-dim">The run branch is checked out here: all the code the team has merged. Each role's own working directory opens from Outputs.</span>
        <span className="kt-grow" />
        <button type="button" className="kt-btn is-small" onClick={onClose} aria-label="Collapse project folder">
          ✕
        </button>
      </div>
      <FolderActions api={api} run={run} role={null} path={folder} />
    </section>
  )
}
