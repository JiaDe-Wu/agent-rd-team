/**
 * "Set up the example team": what a person sees right after installing the app. Two states:
 *
 *   not set up   the checklist (workspace, members, company rules) and one button that runs the backend's plan;
 *   set up       the example requirement and "Start the example delivery", plus a finished delivery to look at first
 *                (no model credits), until the person hides the panel.
 *
 * Everything it does is a call the backend planned (plan.ts); the page only runs them in order, as the owner.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppApi } from '@kirocrew/app-sdk'
import { errorStatus, errorText } from '../board/useBoard'
import { SETUP_PATH, progressText, runPlan, type PlanFailure, type SetupData } from './plan'

const HIDE_KEY = 'agent-rd-team:setup-hidden'

const CSS = `
.kt-setup { margin: 12px 16px; padding: 16px 18px; border: 1px solid var(--border, #3a3640); border-radius: 14px;
  background: color-mix(in srgb, var(--accent, #8a63f2) 8%, var(--card, transparent)); color: var(--text, inherit); }
.kt-setup h2 { margin: 0 0 4px; font-size: 1.1em; }
.kt-setup p { margin: 4px 0; color: var(--muted, #938f9b); font-size: .93em; line-height: 1.45; }
.kt-setup ul { list-style: none; margin: 10px 0; padding: 0; display: grid; gap: 4px; }
.kt-setup li { display: flex; gap: 8px; align-items: baseline; font-size: .95em; }
.kt-setup li i { font-style: normal; width: 1.2em; text-align: center; }
.kt-setup li.is-done i { color: var(--kt-ok, #3ee08f); }
.kt-setup blockquote { margin: 8px 0; padding: 8px 12px; border-left: 3px solid var(--accent, #8a63f2); font-size: .93em; line-height: 1.45;
  background: color-mix(in srgb, var(--text, #dcdadf) 5%, transparent); border-radius: 0 8px 8px 0; }
.kt-setup .kt-setup-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; }
.kt-setup button { appearance: none; font: inherit; font-weight: 650; padding: 7px 14px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--border, #3a3640); background: var(--card, transparent); color: inherit; }
.kt-setup button.is-primary { background: var(--accent, #8a63f2); border-color: var(--accent, #8a63f2); color: var(--accent-fg, #fff); }
.kt-setup button.is-link { border-color: transparent; background: none; font-weight: 500; color: var(--muted, #938f9b); text-decoration: underline; }
.kt-setup button:disabled { opacity: .6; cursor: progress; }
.kt-setup code { font-size: .9em; padding: 1px 6px; border-radius: 6px; background: color-mix(in srgb, var(--text, #dcdadf) 8%, transparent); }
.kt-setup .kt-setup-error { color: var(--kt-bad, #ff5d6c); font-size: .93em; margin-top: 8px; }
.kt-setup details { margin-top: 8px; font-size: .88em; color: var(--muted, #938f9b); }
`

type Props = { onOpenRun?: (rid: string) => void }

function hidden(): boolean {
  try {
    return localStorage.getItem(HIDE_KEY) === '1'
  } catch {
    return false
  }
}

export function SetupPanel({ onOpenRun }: Props) {
  const api = useAppApi()
  const [data, setData] = useState<SetupData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState('')
  const [failure, setFailure] = useState<PlanFailure | null>(null)
  const [actionError, setActionError] = useState('')
  const [hide, setHide] = useState(hidden)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const load = useCallback(async () => {
    try {
      const d = await api.get<SetupData>(SETUP_PATH)
      if (alive.current) {
        setData(d)
        setLoadError('')
      }
    } catch (e) {
      // not the owner (401, 403), or a backend that has no setup yet (404): the panel is not for this page
      if (alive.current) setLoadError([401, 403, 404].includes(errorStatus(e)) ? '' : errorText(e))
    }
  }, [api])

  useEffect(() => {
    void load()
  }, [load])

  const setUp = async () => {
    if (!data) return
    setFailure(null)
    setActionError('')
    const steps = data.plan
    const failed = await runPlan(api, steps, (i, step) => alive.current && setBusy(progressText(i, steps.length, step)))
    if (!alive.current) return
    setBusy('')
    setFailure(failed)
    await load()
  }

  const startExample = async () => {
    if (!data) return
    setActionError('')
    setBusy('Starting the example delivery…')
    try {
      const r = await api.post<{ run: string }>('/api/apps/agent-rd-team/runs', { requirement: data.example.requirement, team: data.example.team })
      if (alive.current && r?.run) onOpenRun?.(r.run)
    } catch (e) {
      if (alive.current) setActionError(errorText(e))
    } finally {
      if (alive.current) setBusy('')
    }
  }

  const showSample = async () => {
    setActionError('')
    setBusy('Loading the sample delivery…')
    try {
      const r = await api.post<{ run: string }>(`${SETUP_PATH}/sample`, {})
      await load()
      if (alive.current && r?.run) onOpenRun?.(r.run)
    } catch (e) {
      if (alive.current) setActionError(errorText(e))
    } finally {
      if (alive.current) setBusy('')
    }
  }

  const hideForGood = () => {
    try {
      localStorage.setItem(HIDE_KEY, '1')
    } catch {
      /* storage is off: it hides until the page is opened again */
    }
    setHide(true)
  }

  if (loadError) {
    return (
      <section className="kt-setup" data-testid="kt-setup">
        <style>{CSS}</style>
        <p className="kt-setup-error" role="alert">Could not read the setup state: {loadError}</p>
        <div className="kt-setup-row"><button type="button" onClick={() => void load()}>Try again</button></div>
      </section>
    )
  }
  if (!data) return null
  const s = data.status
  if (s.ready && hide) return null

  if (!s.ready) {
    const members = s.members.created ?? 0
    const items: [string, boolean][] = [
      [`The ${s.workspace.name} workspace`, s.workspace.done === true],
      [`${s.members.total} team members (${members} added)`, s.members.done === true],
      [`The company's rules (${s.knowledge.documents} documents) in the knowledge base`, s.knowledge.done === true],
    ]
    return (
      <section className="kt-setup" data-testid="kt-setup">
        <style>{CSS}</style>
        <h2>Set up the example team</h2>
        <p>Larkspur Outfitters is a made-up outdoor-gear retailer with its own delivery team and company rules. One button adds them to your Kiro Crew; nothing leaves your machine.</p>
        <ul aria-label="What the example needs">
          {items.map(([label, done]) => (
            <li key={label} className={done ? 'is-done' : ''}><i aria-hidden>{done ? '✓' : '○'}</i>{label}</li>
          ))}
        </ul>
        <div className="kt-setup-row">
          <button type="button" className="is-primary" disabled={!!busy} onClick={() => void setUp()}>Set up the example team</button>
          {busy && <span role="status">{busy}</span>}
        </div>
        {failure && (
          <p className="kt-setup-error" role="alert">
            Stopped at “{failure.step.label}”: {failure.message}. Press the button again to continue from there.
          </p>
        )}
        {s.knowledge.state === 'error' && !failure && (
          <p className="kt-setup-error" role="alert">
            Kiro Crew could not read the rule documents. Open Knowledge base, then Sources, for the reason (it needs a signed-in Kiro), then press the button again.
          </p>
        )}
        {s.knowledge.registered === true && s.knowledge.items === 0 && s.knowledge.state !== 'error' && !failure && (
          <p data-testid="kt-setup-reading" role="status">
            The rule documents are with Kiro Crew, but none is read yet. Reading them takes a minute and needs Kiro to be signed in (Settings, then Kiro account).
            If this stays empty, sign in and press the button again.
          </p>
        )}
        {s.problems.length > 0 && !failure && <p>Could not read: {s.problems.join('; ')}. The button still works.</p>}
        <details>
          <summary>What this adds</summary>
          <p>{data.disclosure}</p>
          <p>Prefer a terminal? Run <code>{data.terminal}</code> in the app's folder.</p>
        </details>
      </section>
    )
  }

  return (
    <section className="kt-setup" data-testid="kt-setup">
      <style>{CSS}</style>
      <h2>The example team is ready</h2>
      <p>Hand it this requirement and watch it work through Larkspur Outfitters' rules. Each person decides at the gates.</p>
      <blockquote data-testid="kt-setup-requirement">{data.example.requirement}</blockquote>
      <div className="kt-setup-row">
        <button type="button" className="is-primary" disabled={!!busy || !data.example.requirement} onClick={() => void startExample()}>Start the example delivery</button>
        {!s.sample.done && s.sample.id && (
          <button type="button" disabled={!!busy} onClick={() => void showSample()}>Look at a finished delivery first (no credits)</button>
        )}
        <button type="button" className="is-link" onClick={hideForGood}>Hide this</button>
        {busy && <span role="status">{busy}</span>}
      </div>
      {actionError && <p className="kt-setup-error" role="alert">{actionError}</p>}
    </section>
  )
}
