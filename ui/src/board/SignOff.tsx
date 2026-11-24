/**
 * Sign-off sheet: the right shift on the board, at the end of a run. Everything a person needs to sign for the release on one
 * card: the requirement, what people decided at the gates, what the machine checks said (by the company standard
 * they enforce), what the independent review concluded, where it is deployed, and what the agents did. Then the one
 * step no agent takes: a person signs (Signed off), and the board keeps who, when and what the checks said then. The
 * signature merges the run's PR (its run branch) into main.
 */
import { useState, type FormEvent } from 'react'
import type { RunDetail } from '../types'
import { CASE_GROUPS, caseGroup, deliveryLabel, fmtCredits, fmtSpan, issueKind } from './format'
import { RoleIcon } from './RoleIcon'
import { money } from '../cto/metrics'
import { word } from '../cto/vocab'

const SIGNER_KEY = 'agent-rd-team:signer'

/** Where the run's PR stands, in the sign-off sheet's words. */
export function prState(run: RunDetail): string {
  const pr = run.pr
  if (!pr) return ''
  if (pr.state === 'open') return 'Waiting to merge: merged into main when signed off'
  if (pr.state === 'merged') return `Merged into main (${pr.sha})`
  return run.imported ? 'Signed off; the run was imported from another computer and the code repository is not here, so nothing was merged here' : 'Signed off; main got new commits during the run, so it could not be merged directly'
}

/** Older runs' event texts began with the Chinese word for "a person" (decoded at run time): it is dropped. */
const OLD_PERSON = new RegExp(String.raw`^\u4eba`)

export function SignOff({ run, onSign, onCto, onItem }: { run: RunDetail; onSign?: (by: string, note: string) => Promise<void>; onCto?: () => void; onItem?: () => void }) {
  const [by, setBy] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem(SIGNER_KEY)) || '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const t = run.tests
  const groups = CASE_GROUPS.map((g, i) => {
    const cases = t.cases.filter((c) => caseGroup(c.ac) === i)
    return { ...g, total: cases.length, passed: cases.filter((c) => c.status === 'pass').length }
  }).filter((g) => g.total > 0)
  const over = run.overruled // a person approved over a review that still said changes needed
  const gates = run.roles.filter((l) => l.gate_label && run.gate_notes[l.key] && l.key !== over?.role)
  const sentBack = run.events.filter((e) => e.kind === 'bounce' && e.from === 'person')
  // in the order they were made: an approval sits where its "approved by a person" event is
  const approvedAt = (key: string) => Math.max(-1, ...run.events.filter((e) => e.kind === 'approved' && e.role === key).map((e) => e.seq))

  const decisions = [
    ...sentBack.map((e) => ({ seq: e.seq, key: `b${e.seq}`, back: true, text: e.text.replace(OLD_PERSON, '') })),
    ...gates.map((l) => ({ seq: approvedAt(l.key), key: l.key, back: false, text: `Approved ${l.gate_label}: ${run.gate_notes[l.key]}` })),
  ].sort((a, b) => (a.seq < 0 ? Infinity : a.seq) - (b.seq < 0 ? Infinity : b.seq))
  const review = run.roles.find((l) => l.writable.length === 0)
  const deployed = run.roles.find((l) => l.deployed)?.deployed ?? null
  const commits = run.roles.reduce((n, l) => n + l.commits.length, 0)
  const members = run.roles.filter((l) => l.status !== 'skipped')
  const green = t.total > 0 && t.failed === 0
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!onSign || !by.trim() || busy) return
    setBusy(true)
    setErr('')
    try {
      localStorage.setItem(SIGNER_KEY, by.trim())
      await onSign(by.trim(), note.trim())
    } catch (x) {
      setErr(x instanceof Error ? x.message : String(x))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section id="kt-signoff" className={`kt-sign${run.signoff ? ' is-signed' : ''}`} aria-label="Sign-off sheet" data-testid="kt-sign">
      <header className="kt-sign-head">
        <h2>Sign-off sheet</h2>
        <p className="kt-dim">Confirmed by the owner before release</p>
      </header>
      <dl className="kt-sign-grid">
        <div>
          <dt>Requirement</dt>
          <dd>{run.requirement || run.title}</dd>
        </div>
        {run.issue && (
          <div>
            <dt>Issue · PR</dt>
            <dd data-testid="kt-sign-pr">
              Issue {run.issue.id} ({issueKind(run.issue.kind)} · raised by {deliveryLabel(run.issue.reporter)})
              {run.pr ? ` → PR #${run.pr.number}: ${run.pr.head} → ${run.pr.base} · ${prState(run)}` : ''}
            </dd>
          </div>
        )}
        <div>
          <dt>Decisions made by people</dt>
          <dd>
            {gates.length || sentBack.length || over ? (
              <ul>
                {decisions.map((d) => (
                  <li key={d.key} className={d.back ? 'kt-sign-back' : undefined}>
                    {d.text}
                  </li>
                ))}
                {over && (
                  <li className="kt-sign-back" data-testid="kt-sign-overruled">
                    Overruled the review and approved {run.roles.find((l) => l.key === over.role)?.gate_label || over.role}: {over.note}
                  </li>
                )}
              </ul>
            ) : (
              '(no comment left at the gates)'
            )}
          </dd>
        </div>
        {(run.risks ?? []).length > 0 && (
          <div>
            <dt>Risks stopped</dt>
            <dd data-testid="kt-sign-risks">
              <ul>
                {(run.risks ?? []).map((r, i) => (
                  <li key={i} className="kt-sign-back">
                    {r.what}{r.amount != null ? ` ${money(r.amount)}` : ''} (noted when {word(r.gate)} was sent back)
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        <div>
          <dt>Machine checks</dt>
          <dd>
            <b className={green ? 'kt-ok' : 'kt-bad'}>
              {t.passed}/{t.total} passed
            </b>
            <ul className="kt-sign-groups">
              {groups.map((g) => (
                <li key={g.prefix} className={g.passed === g.total ? 'is-ok' : 'is-bad'}>
                  {g.label} {g.passed}/{g.total}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>Independent review</dt>
          <dd>{review ? `${review.title} (separate session, reads the changes only): ${review.summary || 'no verdict'}${over?.role === review.key ? ' (a person overruled this verdict)' : ''}` : 'This team has no independent review'}</dd>
        </div>
        <div>
          <dt>Deploy</dt>
          <dd>
            {deployed ? (
              <a href={deployed.url} target="_blank" rel="noreferrer">
                {deployed.url}
              </a>
            ) : (
              'Not deployed'
            )}
          </dd>
        </div>
        <div>
          <dt>What the agents did</dt>
          <dd>
            {members.length} member{members.length === 1 ? '' : 's'} · {commits} commit{commits === 1 ? '' : 's'} · time {fmtSpan(run.wall_s)} · {fmtCredits(run.credits)} credits
          </dd>
        </div>
      </dl>
      {run.signoff ? (
        <p className="kt-sign-done" role="status">
          <RoleIcon role="sign" size={16} /> <b>{run.signoff.by}</b> signed off on {new Date(run.signoff.at * 1000).toLocaleString('en-US', { hour12: false })}
          {run.signoff.note ? `: ${run.signoff.note}` : ''} (checks at sign-off {run.signoff.tests})
          {onCto && (
            <button type="button" className="kt-btn is-primary kt-sign-cto" onClick={onCto} title="A signed-off delivery counts on the CTO view: the delivery list, the three cards and weekly releases">
              Counted on the CTO view ↗
            </button>
          )}
          {onItem && (
            <button type="button" className="kt-btn kt-sign-cto" onClick={onItem} title="This delivery's cycle time, where the time went, cost, quality and value stream">
              Delivery detail ↗
            </button>
          )}
        </p>
      ) : run.sign_block ? (
        <p className="kt-sign-blocked" role="status" data-testid="kt-sign-blocked">
          {run.sign_block}
        </p>
      ) : onSign ? (
        <form className="kt-sign-form" onSubmit={submit}>
          <input aria-label="Signer" placeholder="Signer" value={by} onChange={(e) => setBy(e.target.value)} />
          <input aria-label="Note" placeholder="Note (optional), for example: checked in the staging environment" value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="submit" className="kt-btn is-primary" disabled={busy || !by.trim()}>
            {busy ? 'Signing…' : green ? 'Sign off' : `${t.failed} check${t.failed === 1 ? '' : 's'} still failing; sign off anyway`}
          </button>
          {err && <span className="kt-error">{err}</span>}
        </form>
      ) : null}
    </section>
  )
}
