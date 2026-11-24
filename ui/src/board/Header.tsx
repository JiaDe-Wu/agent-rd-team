/**
 * The top of the board: the run's title and status, the run picker, the actions (start a new run, Stop
 * after a confirmation, Follow, Projection), and the live counters: tests passed/total, the wall clock against
 * the serial estimate (what one agent doing everything would take) with the saving, roles done,
 * KiroCrew's sub-agent lanes, credits. Also the start form (here and in the empty state) and the
 * empty state itself: an introduction to the 8-role team.
 */
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import type { Board, Delivery, GateDecision, GateQuestion, ModelChoice, RoutePick, RunDetail, TalkLine, TestWall } from '../types'
import { AIDLC_AGENTS, FINISHED, deliveryLabel, issueKind, expertsOf, officialOf, LIVE, PHASES, WORKING, aidlcUse, fmtAgo, fmtClock, fmtCredits, fmtSpan, isRunActive, laneMeta, runMeta, saving } from './format'
import { useChangeCount, useServerNow, useSinceSnapshot, useTween } from './hooks'
import { groupByAc } from './TestWall'
import { errorText } from './useBoard'
import { RoleIcon } from './RoleIcon'
import { MarkdownRenderer } from '@kirocrew/app-sdk/ui'

// ---------------------------------------------------------------------------------------------
// the top bar
// ---------------------------------------------------------------------------------------------

export interface TopBarProps {
  board: Board | null
  run: RunDetail | null
  projection: boolean
  follow: boolean
  startOpen: boolean
  onSelect: (id: string) => void
  /** Projection (the page's own; inside the app the app bar has it) */
  onProjection?: () => void
  onFollow: () => void
  onStart: () => void
  onStop: () => void
  /** Retry every failed role of the run. */
  onRetry?: () => void
  /** Folder: where the run's code is on this Mac. */
  onFolder?: () => void
  folderOpen?: boolean
  /** Outputs / Open site: the drawer with each role's deliverables, or the finished product. */
  onOutputs?: (target: { role: string; tab?: 'site' | null }) => void
  /** Clean up sessions: delete the Kiro Crew sessions earlier runs opened (none while a run is going). */
  onHide?: (run: string) => void
  onCleanup?: () => void
  /** Replay: play a finished run again from its record; while it plays the write actions are hidden. */
  onReplay?: () => void
  replaying?: boolean
  /** inside the app: the app bar carries its name and Projection */
  inApp?: boolean
  /** this run's Delivery detail (its name and Issue open it) */
  onItem?: (e: { run: string }) => void
}

/** What the PR says on the board: Waiting to merge until a person signs the run off, then merged into main here (or signed only, imported). */
export const PR_STATE: Record<string, string> = { open: 'Waiting to merge', merged: 'Merged', signed: 'Signed off' }

export function TopBar({ board, run, projection, follow, startOpen, onSelect, onProjection, onFollow, onStart, onStop, onOutputs, onRetry, onFolder, onCleanup, onHide, onReplay, inApp = false, onItem, replaying = false, folderOpen = false }: TopBarProps) {
  const failed = run ? run.roles.filter((l) => l.status === 'failed') : []
  const meta = run ? runMeta(run.status) : null
  const runs = board?.runs ?? []
  return (
    <header className="kt-top">
      <div className="kt-title">
        {!inApp && <h1>AI-DLC multi-agent team</h1>}
        {run && meta && (
          <>
            {onItem ? (
              <button type="button" className="kt-run-title kt-run-link" onClick={() => onItem({ run: run.id })} title={`Delivery detail: cycle time, where the time went, cost, quality, value stream (${run.requirement || run.title})`}>
                {run.delivery?.name || run.title}
              </button>
            ) : (
              <span className="kt-run-title" title={run.requirement || run.title}>{run.delivery?.name || run.title}</span>
            )}
            {run.issue && (onItem ? (
              <button type="button" className="kt-pill tone-info kt-mono kt-pill-btn" data-testid="kt-issue" onClick={() => onItem({ run: run.id })} title={`Issue ${run.issue.id} · ${issueKind(run.issue.kind)} · raised by ${deliveryLabel(run.issue.reporter)} · Delivery detail`}>
                {run.issue.id}
              </button>
            ) : (
              <span className="kt-pill tone-info kt-mono" data-testid="kt-issue" title={`Issue ${run.issue.id} · ${issueKind(run.issue.kind)} · raised by ${deliveryLabel(run.issue.reporter)}`}>
                {run.issue.id}
              </span>
            ))}
            <span className={`kt-pill tone-${meta.tone}${meta.active ? ' is-live' : ''}`} data-testid="kt-run-status">
              <i aria-hidden="true">{meta.active ? '●' : run.status === 'done' ? '✔' : run.status === 'failed' ? '✕' : '■'}</i>
              {meta.label}
            </span>
            {run.imported && (
              <span className="kt-pill tone-info" title={`This run was made on "${run.imported.from}" and imported here to view and replay; the code and sessions stay on that Mac`}>
                Imported · {run.imported.from}
              </span>
            )}
            {!projection && run.pr ? (
              <span className="kt-run-meta kt-mono" data-testid="kt-pr" title={`${run.pr.files} file${run.pr.files === 1 ? '' : 's'} · +${run.pr.added} −${run.pr.removed} · checks ${run.pr.checks}${run.pr.review ? ` · ${run.pr.review}` : ''}`}>
                PR #{run.pr.number} · {run.pr.head} → {run.pr.base} · {PR_STATE[run.pr.state]}
              </span>
            ) : (
              !projection && !run.imported && (
                <span className="kt-run-meta kt-mono" title={run.repo}>
                  {run.branch} ← {run.base}
                </span>
              )
            )}
          </>
        )}
      </div>
      <div className="kt-actions">
        {!projection && runs.length > 1 && run && (
          <select className="kt-select" aria-label="Select run" value={run.id} onChange={(e) => onSelect(e.target.value)}>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name || r.title}{r.issue ? ` (${r.issue})` : ''} · {r.imported ? 'Imported · ' : ''}{runMeta(r.status).label} · Tests {r.tests.passed}/{r.tests.total}
              </option>
            ))}
          </select>
        )}
        {!projection && !replaying && run && onHide && !isRunActive(run.status) && (
          <button type="button" className="kt-btn kt-btn-icon" onClick={() => onHide(run.id)} title="Remove this run from the list (the record and code stay on this Mac)" aria-label="Remove this run from the list">
            🗑
          </button>
        )}
        {run && onReplay && !replaying && !isRunActive(run.status) && run.events.length > 0 && (
          <button type="button" className="kt-btn" onClick={onReplay} title="Replay this run from its record: who did what and when, where work was sent back, how tests went from red to green. No agent is called and no credits are spent">
            ▶ Replay
          </button>
        )}
        {!projection && !replaying && board && (board.runs.length > 0 || run) && (
          <button type="button" className="kt-btn is-primary" aria-expanded={startOpen} onClick={onStart}>
            New requirement
          </button>
        )}
        {!projection && !replaying && run && isRunActive(run.status) && (
          <button type="button" className="kt-btn is-danger" onClick={onStop}>
            Stop
          </button>
        )}
        {!projection && !replaying && onCleanup && board && board.runs.length > 0 && !board.runs.some((r) => isRunActive(r.status)) && (
          <button type="button" className="kt-btn" onClick={onCleanup} title="Delete the sessions that finished runs opened in the Kiro Crew sidebar (signed-off runs keep theirs, so replay can still open them); run records and code are kept">
            Clean up finished sessions
          </button>
        )}
        {!projection && !replaying && !run?.imported && onRetry && failed.length > 0 && (
          <button type="button" className="kt-btn is-danger is-solid" onClick={onRetry} title={`Give the failed roles another round: ${failed.map((l) => l.title).join(', ')}`}>
            ↻ Retry {failed.length} failed role{failed.length === 1 ? '' : 's'}
          </button>
        )}
        {!projection && run && !run.imported && onFolder && (
          <button type="button" className="kt-btn" aria-expanded={folderOpen} onClick={onFolder} title="Which folder on this Mac holds the project: open it in Finder or Kiro">
            📁 Folder
          </button>
        )}
        {run && onOutputs && run.roles.length > 0 && (
          <button type="button" className="kt-btn" onClick={() => onOutputs({ role: run.roles[0].key })} title="See what each role delivered, step by step: documents, code, replies, what it did">
            Outputs
          </button>
        )}
        {run && onOutputs && !run.imported && !isRunActive(run.status) && run.base && run.tests.total > 0 && (
          <button type="button" className="kt-btn" onClick={() => onOutputs({ role: 'run', tab: 'site' })} title="Run the site the team built on this machine and view it here">
            Open site
          </button>
        )}
        {run && (
          <button type="button" className="kt-btn" aria-pressed={follow} onClick={onFollow} title="Automatically scroll to and enlarge the most active lane">
            Follow
          </button>
        )}
        {run && onProjection && (
          <button type="button" className={`kt-btn${projection ? ' is-on' : ''}`} onClick={onProjection} title={projection ? 'Exit projection (Esc)' : 'Full screen, large text, actions hidden'}>
            {projection ? 'Exit projection' : 'Projection'}
          </button>
        )}
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------------------------
// the counters
// ---------------------------------------------------------------------------------------------

const hue = (i: number) => (i * 47 + 200) % 360

export function Kpis({ run, reducedMotion, onRole }: { run: RunDetail; reducedMotion: boolean; onRole?: (key: string) => void }) {
  return (
    <div className="kt-kpis" role="group" aria-label="Metrics">
      <TestsKpi tests={run.tests} reducedMotion={reducedMotion} />
      {phased(run) ? <GatesKpi run={run} /> : <ParallelKpi run={run} reducedMotion={reducedMotion} />}
      <RolesKpi run={run} onRole={onRole} />
      <UsedKpi run={run} />
      <CreditsKpi credits={run.credits} reducedMotion={reducedMotion} />
    </div>
  )
}

function TestsKpi({ tests, reducedMotion }: { tests: TestWall; reducedMotion: boolean }) {
  const shown = Math.round(useTween(tests.passed, 900, reducedMotion))
  const pop = useChangeCount(tests.passed)
  const now = useServerNow()
  const green = tests.total > 0 && tests.failed === 0
  const cells = groupByAc(tests.cases).flatMap((g) => g.cases)
  return (
    <div className={`kt-kpi kt-kpi-tests${green ? ' is-green' : ''}`}>
      <div className="kt-kpi-label">Tests passed</div>
      <div className="kt-kpi-value" data-testid="kt-tests-counter" aria-label={`Tests passed ${tests.passed}/${tests.total}`}>
        <span className={`kt-kpi-big${pop ? ' is-pop' : ''}`} key={pop}>
          {shown}
        </span>
        <span className="kt-kpi-of">/{tests.total}</span>
      </div>
      <div className="kt-segs" aria-hidden="true">
        {cells.map((c) => (
          <i key={c.id} className={`is-${c.status}`} title={c.name} />
        ))}
      </div>
      <div className="kt-kpi-note">
        {tests.total ? (green ? <b className="tone-ok">All green</b> : <b className="tone-bad">{tests.failed} red</b>) : 'No tests yet'}
        {tests.at ? ` · run ${fmtAgo(now - tests.at)}` : ''}
      </div>
    </div>
  )
}

/** A team laid out by AI-DLC phase (team-aidlc.json): the board leads with the gates, not the time saved. */
const phased = (run: RunDetail) => run.roles.length > 0 && run.roles.every((l) => !!l.phase)

/** What this run's gates caught: the same checks first and now, and every round a gate sent work back. */
function GatesKpi({ run }: { run: RunDetail }) {
  const first = run.tests.history[0]
  const kinds = run.roles.flatMap((l) => l.kinds)
  const testBacks = kinds.filter((k) => k === 'fix').length
  const reviewBacks = run.review_rounds
  // a person's decisions at gates: each approval, and each time a person sent work back
  const people = run.roles.filter((l) => l.gate === 'approved').length + run.events.filter((e) => e.kind === 'bounce' && e.from === 'person').length
  return (
    <div className="kt-kpi kt-kpi-gates">
      <div className="kt-kpi-label">Gate record · rounds of changes under the constraints</div>
      <div className="kt-kpi-value" data-testid="kt-gates">
        {first ? (
          <span className="kt-gates-score">
            <span className="kt-kpi-mid">{first.passed}/{first.passed + first.failed}</span>
            <span className="kt-gates-arrow">→</span>
            <span className="kt-kpi-big">{run.tests.passed}</span>
            <span className="kt-kpi-of">/{run.tests.total}</span>
          </span>
        ) : (
          <span className="kt-kpi-mid">Checks have not run yet</span>
        )}
      </div>
      <div className="kt-gates-rows">
        <span className={testBacks ? 'is-hit' : ''}>Sent back by checks <b>{testBacks}</b>×</span>
        <span className={reviewBacks ? 'is-hit' : ''}>Sent back by review <b>{reviewBacks}</b> round{reviewBacks === 1 ? '' : 's'}</span>
        <span className={people ? 'is-hit' : ''}>Human decisions <b>{people}</b>×</span>
      </div>
    </div>
  )
}

/** The three layers this run stands on: Kiro Crew runs it, AI-DLC lends the experts, the company brings its rules. */
function UsedKpi({ run }: { run: RunDetail }) {
  const used = new Set(
    run.roles.filter((l) => l.status !== 'skipped').flatMap((l) => l.aidlc_agent.split(',').map((s) => s.trim()).filter(Boolean)),
  ) // the team's: the graph's roster shows which of them are already called
  const company = run.tests.cases.filter((c) => c.file.startsWith('tests/enterprise/')).length
  const written = run.tests.cases.length - company
  const agents = run.roles.filter((l) => l.attempt > 0 && l.status !== 'waiting' && l.status !== 'skipped').length
  return (
    <div className="kt-kpi kt-kpi-used">
      <div className="kt-kpi-label">What this run used</div>
      <div className="kt-used-row">
        <b>Kiro Crew</b> base · sessions ×{agents} · approvals · audit
      </div>
      <div className="kt-used-row">
        <b>AI-DLC</b> experts {AIDLC_AGENTS.filter((a) => used.has(a.key)).length}/14
        {used.size > AIDLC_AGENTS.filter((a) => used.has(a.key)).length ? ` + custom ${used.size - AIDLC_AGENTS.filter((a) => used.has(a.key)).length}` : ''}
        <span className="kt-used-dots" aria-hidden="true">
          {AIDLC_AGENTS.map((a) => (
            <i key={a.key} className={used.has(a.key) ? 'is-on' : ''} title={`${a.name}${used.has(a.key) ? ': used this run' : ': not used this run'}`} />
          ))}
        </span>
      </div>
      <div className="kt-used-row">
        <b>Company standards</b> {run.standards.length ? `${run.standards.filter((s) => s.kind === 'standard').length} apply · ` : ''}company checks {company} · written by the team {written}
      </div>
    </div>
  )
}

function ParallelKpi({ run, reducedMotion }: { run: RunDetail; reducedMotion: boolean }) {
  const since = useSinceSnapshot()
  const wall = run.wall_s + (isRunActive(run.status) ? since : 0)
  const { saved_s, speedup } = saving({ wall_s: wall, serial_s: run.serial_s })
  const minutes = Math.round(useTween(saved_s / 60, 900, reducedMotion))
  const max = Math.max(wall, run.serial_s, 1)
  const segs = run.roles.filter((l) => l.active_s > 0)
  const segTotal = segs.reduce((a, l) => a + l.active_s, 0) || 1
  return (
    <div className="kt-kpi kt-kpi-par">
      <div className="kt-kpi-label">Time saved by parallel work · wall clock against one agent doing it all</div>
      <div className="kt-kpi-value" data-testid="kt-saving">
        {saved_s >= 60 ? (
          <span className="kt-saving">
            Parallel work saved <span className="kt-kpi-big">{minutes}</span> min
          </span>
        ) : (
          <span className="kt-kpi-mid">No time saved yet</span>
        )}
        {speedup !== null && speedup > 1.05 && <span className="kt-speedup" title="Serial estimate ÷ wall clock">×{speedup.toFixed(1)}</span>}
      </div>
      <div className="kt-bars">
        <div className="kt-bar-row">
          <span className="kt-bar-name">Wall clock</span>
          <span className="kt-bar" title={`Actual time ${fmtClock(wall)}`}>
            <i className="kt-bar-wall" style={{ width: `${(wall / max) * 100}%` }} />
          </span>
          <span className="kt-bar-val kt-mono">{fmtClock(wall)}</span>
        </div>
        <div className="kt-bar-row">
          <span className="kt-bar-name">Serial estimate</span>
          <span className="kt-bar is-segs" title={`Each role's own working time added up: ${fmtClock(run.serial_s)} (${fmtSpan(run.serial_s)})`}>
            {segs.map((l, i) => (
              <i key={l.key} className="kt-bar-seg" style={{ width: `${(l.active_s / segTotal) * (run.serial_s / max) * 100}%`, '--h': hue(i) } as CSSProperties} title={`${l.title} ${fmtClock(l.active_s)}`} />
            ))}
          </span>
          <span className="kt-bar-val kt-mono">{fmtClock(run.serial_s)}</span>
        </div>
      </div>
    </div>
  )
}

function RolesKpi({ run, onRole }: { run: RunDetail; onRole?: (key: string) => void }) {
  const done = run.roles.filter((l) => FINISHED.has(l.status)).length
  const working = run.roles.filter((l) => WORKING.has(l.status)).length
  const stuck = run.roles.filter((l) => LIVE.has(l.status) && !WORKING.has(l.status)).length
  const unmerged = run.roles.filter((l) => l.status === 'done' && l.writable.length > 0).length
  return (
    <div className="kt-kpi kt-kpi-roles">
      <div className="kt-kpi-label">Roles done</div>
      <div className="kt-kpi-value" data-testid="kt-roles-counter">
        <span className="kt-kpi-big">{done}</span>
        <span className="kt-kpi-of">/{run.roles.length}</span>
      </div>
      <div className="kt-role-dots">
        {run.roles.map((l) => (
          <button
            key={l.key}
            type="button"
            className={`kt-role-dot tone-${laneMeta(l).tone}${WORKING.has(l.status) ? ' is-working' : ''}`}
            title={`${l.title}: ${laneMeta(l).label} (click to show only it)`}
            aria-label={`${l.title}: ${laneMeta(l).label}`}
            onClick={() => onRole?.(l.key)}
          >
            <RoleIcon role={l.icon || l.key} size={16} />
          </button>
        ))}
      </div>
      <div className="kt-kpi-note">
        {working ? <b className="tone-run">Running now {working}</b> : 'None running'}
        {stuck ? <b className="tone-warn"> · {stuck} stalled or waiting for you</b> : null}
        {unmerged ? ` · ${unmerged} waiting to merge` : ''}
      </div>
    </div>
  )
}

function CreditsKpi({ credits, reducedMotion }: { credits: number | null; reducedMotion: boolean }) {
  const shown = useTween(credits ?? 0, 900, reducedMotion)
  return (
    <div className="kt-kpi kt-kpi-credits">
      <div className="kt-kpi-label">credits</div>
      <div className="kt-kpi-value">
        <span className="kt-kpi-big">{credits === null ? '—' : fmtCredits(shown)}</span>
      </div>
      <div className="kt-kpi-note">{credits === null ? 'KiroCrew has not reported yet' : 'Total for the whole run'}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// start and stop
// ---------------------------------------------------------------------------------------------

export interface StartOptions {
  source?: string
  team?: string
  /** The model of the whole run (every role, one the team file gives its own model included); none: the team's own. */
  model?: string
}
export type StartFn = (requirement: string, opts?: StartOptions) => Promise<void>

/** A one-sentence requirement for tests and the preview page. */
export const DEMO_REQUIREMENT = 'Build an MVP online shop for Shanye Coffee: customers can browse products by category, view details, add to the cart and place an order.'
export type PreviewFn = (requirement: string) => Promise<RoutePick>
/** The models Kiro Crew offers for the start form (an empty list when it cannot say). */
export type ModelsFn = () => Promise<ModelChoice[]>

/** One model in the model list: its name and Kiro's credit rate. */
export function modelLabel(m: ModelChoice): string {
  return m.rate != null ? `${m.name} · ${m.rate}x credits` : m.name
}

/** Ready-made requirements at the example company Larkspur Outfitters (fictitious): one fills the requirement box. */
export const SCENARIOS: ReadonlyArray<{ label: string; hint: string; text: string }> = [
  { label: 'Black Friday · storewide sale', hint: 'Larkspur Outfitters online store: starts from the campaign template, a person approves going live', text: 'Black Friday sale: discount 20 products with spend-and-save offers, show a countdown, the reference price and the final price on the campaign page, and let operations configure it in the back office and go live with one click.' },
]

const TEAM_CHOICES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'auto', label: 'Pick the team from the requirement automatically (recommended)' },
  { value: 'team-promo.json', label: 'Larkspur Outfitters · Black Friday sale' },
  { value: 'team-aidlc.json', label: 'AI-DLC expert team (13 roles, any new requirement)' },
  { value: 'team-bugfix.json', label: 'Bug fix · two-person squad (project directory required)' },
]

/** Team selection preview: the team the orchestrator picks for the requirement, the official AI-DLC scope it follows, and which of
 * the 14 official experts it calls (the others greyed). */
export function TeamPick({ pick }: { pick: RoutePick | null }) {
  if (!pick?.team) {
    return (
      <p className="kt-pick is-empty" data-testid="kt-pick">
        The orchestrator is picking a team from the keywords in the requirement…
      </p>
    )
  }
  const t = pick.team
  const used = new Set(t.agents.flatMap((a) => a.split(',').map((x) => x.trim())))
  const experts = expertsOf(t.roles)
  const absent = t.roles.filter((r) => r.on_crew === false)
  const kb = pick.knowledge
  const phases = PHASES.map((ph) => ({ ...ph, roles: t.roles.filter((r) => r.phase === ph.key) })).filter((ph) => ph.roles.length)
  return (
    <section className="kt-pick" aria-label="Team selection preview" data-testid="kt-pick">
      <p className="kt-pick-team" title={pick.matched.length ? `Based on "${pick.matched.join('", "')}" in the requirement` : 'No particular clues; using the default flow'}>
        <b>{t.name}</b> · {t.people?.length ? `${t.roles.length} of ${t.people.length} members picked` : `${t.roles.length} member${t.roles.length === 1 ? '' : 's'}`} · {pick.why}
      </p>
      <ol className="kt-pick-phases" aria-label="By AI-DLC phase">
        {phases.map((ph) => (
          <li key={ph.key}>
            <span className="kt-pick-phase">
              {ph.n} {ph.title}
            </span>
            {ph.roles.map((r) => (
              <span key={r.key} className={`kt-pick-role${r.on_crew === false ? ' is-absent' : ''}`} title={`${r.stage}${r.member ? ` · Crew member ${r.member}` : ''}`}>
                <RoleIcon role={r.icon || r.key} size={16} />
                <span>
                  {r.title} agent
                  {r.gate ? <em> · human approval</em> : null}
                  {r.assignment && <small>{r.assignment}</small>}
                </span>
              </span>
            ))}
          </li>
        ))}
      </ol>
      {t.official_stages ? (
        <p className="kt-dim">
          Covers {t.stages.length} stage{t.stages.length === 1 ? '' : 's'} of the AI-DLC {t.scope} flow: {t.stages.join(', ')}
          {t.extra_stages.length > 0 && `; plus ${t.extra_stages.join(', ')} (${t.extra_note})`}
        </p>
      ) : null}
      <div className="kt-pick-roster" aria-label="The 14 official AI-DLC experts and the company's own">
        {experts.map((a) => (
          <span key={a.key} className={`kt-pick-agent${used.has(a.key) ? ' is-used' : ''}${a.custom ? ' is-custom' : ''}`} title={used.has(a.key) ? 'Will be called this run' : 'Will not be called this run'}>
            {a.name}
          </span>
        ))}
      </div>
      {absent.some((r) => r.optional) && (
        <p className="kt-warn" data-testid="kt-pick-unhired">
          <span title="Optional role: if this member is not under Crew Agents when the run is handed to the team, it stays out of this run and its part is left as the template has it">
            {absent.filter((r) => r.optional).map((r) => r.title).join(', ')} not on Crew, so not in this run (add {absent.filter((r) => r.optional).map((r) => r.member).join(', ')} under Crew Agents, then hand the requirement to the team to include it)
          </span>
        </p>
      )}
      {absent.some((r) => !r.optional) && (
        <p className="kt-warn">
          <span title="If it is not added, the run stops and waits when its turn comes; once added it starts automatically">{absent.filter((r) => !r.optional).map((r) => r.title).join(', ')} not on the team yet (add {absent.filter((r) => !r.optional).map((r) => r.member).join(', ')} under Crew Agents; if not added, the run stops and waits when its turn comes)</span>
        </p>
      )}
      {pick.standards && pick.standards.length > 0 && (
        <div className="kt-pick-std" aria-label="Applicable company standards">
          <b>Applicable standards:</b>
          {pick.standards.map((s) => (
            <span key={s.id} className={`kt-pick-agent is-used is-${s.kind}`} title={`${s.owner ? `${s.owner} · ` : ''}${s.why}`}>
              {s.kind === 'data' ? 'Data: ' : ''}{s.title}
            </span>
          ))}
        </div>
      )}
      {kb && (
        <p className={kb.present === false ? 'kt-warn' : 'kt-dim'}>
          Knowledge base "{kb.name}": {kb.present === false ? `not attached yet; add ${kb.path || 'knowledge/larkspur'} in the Crew sidebar under Knowledge base > Sources` : kb.present === null ? 'Reading' : `${kb.items ?? 0} document${kb.items === 1 ? '' : 's'}${kb.status === 'synced' ? ' · synced' : ' · indexing'}`}
        </p>
      )}
      {t.source && <p className="kt-dim">Code repository: {t.source}</p>}
      {t.needs_source && !t.source && <p className="kt-warn">This team works on an existing project: enter the project's code directory below.</p>}
    </section>
  )
}

/** How often the open form asks again who the team would be: a member added in Crew meanwhile (the service reads Crew's
 * members every 5 s) shows up in the preview without retyping the requirement. */
export const PREVIEW_REFRESH_MS = 5000

export function StartForm({ onStart, onCancel, preview, models, refreshMs = PREVIEW_REFRESH_MS }: { onStart: StartFn; onCancel?: () => void; preview?: PreviewFn; models?: ModelsFn; refreshMs?: number }) {
  const [text, setText] = useState(SCENARIOS[0].text)
  const [source, setSource] = useState('')
  const [team, setTeam] = useState('auto')
  const [model, setModel] = useState('') // '': the team file's models
  const [choices, setChoices] = useState<ModelChoice[]>([])
  useEffect(() => {
    if (!models) return
    let alive = true
    models()
      .then((m) => alive && setChoices(m))
      .catch(() => alive && setChoices([]))
    return () => {
      alive = false
    }
  }, [models])
  const [pick, setPick] = useState<RoutePick | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!preview || team !== 'auto') return
    const t = setInterval(() => setTick((n) => n + 1), refreshMs)
    return () => clearInterval(t)
  }, [preview, team, refreshMs])
  useEffect(() => {
    if (!preview || team !== 'auto') return
    let alive = true
    const t = setTimeout(() => {
      preview(text)
        .then((p) => alive && setPick(p))
        .catch(() => alive && setPick(null))
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [preview, team, text, tick])
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErr('')
    try {
      const src = source.trim()
      const t = team === 'team.json' ? undefined : team // the app's default team file needs no name
      await onStart(text.trim(), { ...(src ? { source: src } : {}), ...(t ? { team: t } : {}), ...(model ? { model } : {}) })
    } catch (x) {
      setErr(errorText(x))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="kt-start" onSubmit={submit} aria-label="Give a requirement to the agent team">
      <div className="kt-scenarios" role="group" aria-label="Example requirements">
        {SCENARIOS.map((s) => (
          <button key={s.label} type="button" className={`kt-scenario${text === s.text ? ' is-on' : ''}`} onClick={() => setText(s.text)} title={s.hint}>
            <b>{s.label}</b>
            <small>{s.hint}</small>
          </button>
        ))}
      </div>
      <label htmlFor="kt-req">Requirement for the agent team</label>
      <p className="kt-dim kt-req-hint">One sentence is enough: the orchestrator picks a team from it, the team first turns it into a scope, acceptance criteria and a work split, and nothing goes further until you approve at the gate.</p>
      <textarea id="kt-req" value={text} rows={3} onChange={(e) => setText(e.target.value)} placeholder={SCENARIOS[0].text} />
      {preview && team === 'auto' && <TeamPick pick={pick} />}
      {choices.length > 0 && (
        <label className="kt-start-field kt-start-model">
          <span>Model (used by every role in this run)</span>
          <select value={model} onChange={(e) => setModel(e.target.value)} title={choices.find((c) => c.id === model)?.description || 'The model set in the team file'}>
            <option value="">Team default</option>
            {choices.map((c) => (
              <option key={c.id} value={c.id} title={c.description}>
                {modelLabel(c)}
              </option>
            ))}
          </select>
          {model && choices.find((c) => c.id === model)?.description && <small className="kt-dim">{choices.find((c) => c.id === model)?.description}</small>}
        </label>
      )}
      <details className="kt-start-more" open={team !== 'auto' || !!source}>
      <summary>Advanced options</summary>
      <div className="kt-start-row">
        <label className="kt-start-field">
          <span>Code directory of an existing project (for bug fixes or taking over an existing product; leave empty for a new project)</span>
          <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Absolute path of the directory, for example /Users/you/workplace/agent-rd-team/runs/r1009abcd/wt/_run" />
        </label>
        <label className="kt-start-field is-narrow">
          <span>Team</span>
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            {TEAM_CHOICES.filter((c) => preview || c.value !== 'auto').map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      </details>
      <div className="kt-start-actions">
        <button type="submit" className="kt-btn is-primary" disabled={busy}>
          {busy ? 'Handing to the team…' : 'Hand to the team'}
        </button>
        {onCancel && (
          <button type="button" className="kt-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
        <span className="kt-dim">Moves through the AI-DLC phases: you approve the requirement and the work split, and delivery passes company checks and an independent review first</span>
      </div>
      {err && (
        <p className="kt-error" role="alert">
          {err}
        </p>
      )}
    </form>
  )
}

export function StopConfirm({ run, onConfirm, onCancel }: { run: RunDetail; onConfirm: () => Promise<void>; onCancel: () => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const live = run.roles.filter((l) => LIVE.has(l.status) || l.status === 'queued').length
  const confirm = async () => {
    setBusy(true)
    setErr('')
    try {
      await onConfirm()
    } catch (x) {
      setErr(errorText(x))
      setBusy(false)
    }
  }
  return (
    <div className="kt-confirm" role="alertdialog" aria-labelledby="kt-stop-title" aria-describedby="kt-stop-desc">
      <strong id="kt-stop-title">Stop "{run.title}"?</strong>
      <span id="kt-stop-desc">{live ? `The ${live} running and queued agent${live === 1 ? '' : 's'} will be stopped, and roles that have not started will not be dispatched.` : 'Roles that have not started will not be dispatched.'}</span>
      <span className="kt-confirm-actions">
        <button type="button" className="kt-btn is-danger is-solid" onClick={confirm} disabled={busy}>
          {busy ? 'Stopping…' : 'Confirm stop'}
        </button>
        <button type="button" className="kt-btn" onClick={onCancel} autoFocus>
          Cancel
        </button>
      </span>
      {err && (
        <p className="kt-error" role="alert">
          {err}
        </p>
      )}
    </div>
  )
}

/** Delivery tag as the person confirms them at the gate of the role that proposed them (they count on the CTO view). */
export type DeliveryPick = Pick<Delivery, 'name' | 'kind' | 'size' | 'line'>

const DELIVERY_KINDS: Delivery['kind'][] = ['New app', 'New feature', 'Fix']
const DELIVERY_SIZES: Delivery['size'][] = ['Small', 'Medium', 'Large']
const DELIVERY_LINES: Delivery['line'][] = ['E-commerce', 'Mobile app', 'CRM', 'Supply chain', 'Internal systems']

/** A person at a gate, inside the page (the desktop app has no window.prompt): approve with an optional note for
 * everyone after it, or send it back with what to change. *skips*: the optional members the proposal leaves out (they
 * sit the run out once approved). *overrule*: a review that still says "changes needed" with its rounds used up: approving it is
 * overruling the review (a reason is required), sending it back is one more round as the review says. */
/** The person's choice for each question of a gate, by question id (sent with Approve). */
export type GateAnswers = Record<string, { choice: string; text: string; choices?: string[] }>
/** Risk stopped, sent with Send back: what the send-back keeps from going live, the amount in USD (or none). */
export type GateRisk = { what: string; amount: number | null }

/** A gate: Approve (with an answer for each question the role put to the person), Discuss (it answers; the gate stays open),
 * or Send back. What was said in a discussion so far is shown in all three; at a writing role's gate, the stage's documents too. */
export function GateDialog({ label, who = '', decision, preset, presetRisk, split, skips, report, onReport, overrule = false, delivery, questions = [], talk = [], outputs = [], onConfirm, onCancel }: {
  label: string; who?: string; decision: GateDecision; preset?: string; presetRisk?: GateRisk | null; split?: { key: string; title: string; icon: string; assignment: string }[]
  skips?: { key: string; title: string; why: string }[]; report?: string; onReport?: () => void; overrule?: boolean; delivery?: Delivery
  questions?: GateQuestion[]; talk?: TalkLine[]; outputs?: { key: string; title: string; icon: string; onOpen: () => void }[]
  onConfirm: (note: string, delivery?: DeliveryPick, answers?: GateAnswers, risk?: GateRisk) => Promise<void>; onCancel: () => void
}) {
  const [note, setNote] = useState('')
  const [risk, setRisk] = useState({ what: '', k: '' }) // Send back: what it keeps from going live, the amount in thousands of USD
  const [pick, setPick] = useState<DeliveryPick | null>(delivery ? { name: delivery.name, kind: delivery.kind, size: delivery.size, line: delivery.line } : null)
  const [answers, setAnswers] = useState<GateAnswers>(() => Object.fromEntries(questions.map((q) => [q.id, q.multi ? { choice: '', text: '', choices: [] } : { choice: q.recommend || q.options[0]?.key || '', text: '' }])))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const approve = decision === 'approve'
  const discuss = decision === 'discuss'
  const asking = approve && questions.length > 0
  const back = !approve && !discuss
  const riskOut = (): GateRisk | undefined => {
    const what = risk.what.trim(), k = Number(risk.k)
    return back && (what || k > 0) ? { what, amount: k > 0 ? Math.round(k * 1e3) : null } : undefined
  }
  const answer = (id: string, a: Partial<{ choice: string; text: string }>) => setAnswers((x) => ({ ...x, [id]: { ...x[id], ...a } }))
  const tick = (id: string, key: string) =>
    setAnswers((x) => {
      const now = x[id]?.choices ?? []
      return { ...x, [id]: { ...x[id], choice: '', text: '', choices: now.includes(key) ? now.filter((k) => k !== key) : [...now, key] } }
    })
  const confirm = async () => {
    if (overrule && approve && !note.trim()) {
      setErr('The review still says changes are needed: overruling it requires a reason')
      return
    }
    if (discuss && !note.trim()) {
      setErr('Write what you want to ask or discuss')
      return
    }
    if (!approve && !discuss && !overrule && !note.trim()) {
      setErr('Say what to change when sending back')
      return
    }
    const blank = asking ? questions.find((q) => !q.multi && answers[q.id]?.choice === 'other' && !answers[q.id].text.trim()) : undefined
    if (blank) {
      setErr(`Decision ${blank.id} is set to "Other": write your decision`)
      return
    }
    setBusy(true)
    setErr('')
    try {
      const r = riskOut()
      await (asking ? onConfirm(note.trim(), pick ?? undefined, answers) : approve && pick ? onConfirm(note.trim(), pick) : r ? onConfirm(note.trim(), undefined, undefined, r) : onConfirm(note.trim()))
    } catch (x) {
      setErr(errorText(x))
      setBusy(false)
    }
  }
  const title = discuss ? `Discuss ${label}` : overrule ? (approve ? `Approve ${label} anyway` : `Send back ${label} for another round`) : approve ? `Approve ${label}` : `Send back ${label}`
  const lead = discuss
    ? `Write what you want to ask or discuss. ${who || 'It'} will answer and, if needed, change its own documents; the gate stays open, so approve or send back when you are done.`
    : overrule ? (approve ? 'The review still says changes are needed and the send-back rounds are used up. Approving means you overrule the review and let it through: give a reason, it goes on the sign-off sheet, then it deploys.' : 'One more round as the review says: if you do not say who to send it back to, the members the review names get it; your comments go to them too, and yours win if they conflict with the review. The review looks again after the changes, then it comes back here.')
      : report !== undefined ? (approve ? 'It deploys after approval. Your comment goes on the sign-off sheet.' : 'Say who to send it back to and what to change (for example "Send back: Frontend #2"). The review looks again after the changes, then it comes back here.')
        : approve ? (asking ? 'After approval, the orchestrator starts the next phase with this work split. Pick an answer for each item below (the default is its recommendation); your decisions and comments go to every agent after it.' : 'After approval, the orchestrator starts the next phase with this work split. You can write comments here and they go to every agent after it (optional).')
          : 'Write what to change; it rewrites according to your comments and hands it back for your approval.'
  return (
    <div className={`kt-confirm kt-gate-dialog${approve ? ' is-approve' : ''}${discuss ? ' is-discuss' : ''}`} role="dialog" aria-labelledby="kt-gate-title" data-testid="kt-gate-dialog">
      <strong id="kt-gate-title">{title}</strong>
      <span>{lead}</span>
      {outputs.length > 0 && (
        <p className="kt-gate-docs" data-testid="kt-gate-docs">
          <span className="kt-dim">Output of this phase:</span>
          {outputs.map((o) => (
            <button key={o.key} type="button" className="kt-chip-link" onClick={o.onOpen}>
              <RoleIcon role={o.icon || o.key} size={13} /> {o.title} ↗
            </button>
          ))}
        </p>
      )}
      {asking && (
        <div className="kt-gate-questions" data-testid="kt-gate-questions">
          {questions.map((q) => {
            const a = answers[q.id] ?? { choice: '', text: '' }
            const differs = !!q.recommend && a.choice !== q.recommend
            if (q.multi) {
              const ticked = a.choices ?? []
              return (
                <fieldset key={q.id} className="kt-gate-q" aria-label={`Decision ${q.id}`}>
                  <legend>
                    <b>Decision {q.id}</b> {q.q}
                  </legend>
                  {q.options.map((o) => (
                    <label key={o.key} className={ticked.includes(o.key) ? 'is-picked' : undefined}>
                      <input type="checkbox" name={`q-${q.id}`} checked={ticked.includes(o.key)} onChange={() => tick(q.id, o.key)} />
                      <span>
                        {o.key}. {o.text}
                      </span>
                    </label>
                  ))}
                  <span className="kt-dim">
                    {ticked.length ? `${ticked.length} selected` : 'Nothing is recorded if none is ticked'}
                    {q.why && `; ${q.why}`}
                  </span>
                </fieldset>
              )
            }
            return (
              <fieldset key={q.id} className="kt-gate-q" aria-label={`Decision ${q.id}`}>
                <legend>
                  <b>Decision {q.id}</b> {q.q}
                </legend>
                {q.options.map((o) => (
                  <label key={o.key} className={a.choice === o.key ? 'is-picked' : undefined}>
                    <input type="radio" name={`q-${q.id}`} checked={a.choice === o.key} onChange={() => answer(q.id, { choice: o.key })} />
                    <span>
                      {o.key}. {o.text}
                      {o.key === q.recommend && <em className="kt-gate-rec">Recommended</em>}
                    </span>
                  </label>
                ))}
                <label className={a.choice === 'other' ? 'is-picked' : undefined}>
                  <input type="radio" name={`q-${q.id}`} checked={a.choice === 'other'} onChange={() => answer(q.id, { choice: 'other' })} />
                  <span>Other</span>
                  {a.choice === 'other' && <input className="kt-gate-other" aria-label={`Decision ${q.id}: other answer`} value={a.text} maxLength={300} onChange={(e) => answer(q.id, { text: e.target.value })} placeholder="Write your decision" />}
                </label>
                {(q.why || differs) && (
                  <span className="kt-dim">
                    {q.why && `Reason for the recommendation: ${q.why}`}
                    {differs && <b className="kt-gate-differs">{q.why ? '; ' : ''}Differs from the recommendation ({q.recommend})</b>}
                  </span>
                )}
              </fieldset>
            )
          })}
        </div>
      )}
      {talk.length > 0 && (
        <ol className="kt-gate-talk" aria-label="Discussion log" data-testid="kt-gate-talk">
          {talk.map((t, i) => (
            <li key={i} className={t.who === 'person' ? 'is-person' : 'is-agent'}>
              <b>{t.who === 'person' ? 'You' : who || 'It'}</b>
              <div className="kt-gate-talk-text">{t.who === 'agent' ? <MarkdownRenderer content={t.text} /> : t.text}{t.changed ? <em className="kt-dim">(changed the document)</em> : null}</div>
            </li>
          ))}
        </ol>
      )}
      {report !== undefined && !discuss && (
        <div className="kt-gate-report">
          <b>{overrule ? 'The review still says changes are needed: ' : 'Review verdict: '}</b>
          {report || '(no verdict)'}
          {onReport && (
            <button type="button" className="kt-btn" onClick={onReport}>
              View the full review report
            </button>
          )}
        </div>
      )}
      {split && split.length > 0 && !discuss && (
        <ul className="kt-gate-split" aria-label="Work split proposal">
          {split.map((m) => (
            <li key={m.key}>
              <RoleIcon role={m.icon || m.key} size={14} /> <b>{m.title}</b> {m.assignment}
            </li>
          ))}
        </ul>
      )}
      {skips && skips.length > 0 && !discuss && (
        <ul className="kt-gate-split is-out" aria-label="Members left out of this run" data-testid="kt-gate-skips">
          {skips.map((m) => (
            <li key={m.key}>
              <RoleIcon role={m.key} size={14} /> <b>{m.title}</b> left out this time: {m.why}
            </li>
          ))}
          <li className="kt-dim">After approval they sit this run out and the checks that belong to them do not run; to keep them, send back and say who.</li>
        </ul>
      )}
      {approve && pick && delivery && (
        <fieldset className="kt-gate-delivery" data-testid="kt-gate-delivery">
          <legend title="After sign-off these tags count on the CTO view">Delivery tag{delivery.why ? ` (proposed: ${delivery.why})` : ''}</legend>
          <input aria-label="Delivery name" value={pick.name} maxLength={20} onChange={(e) => setPick({ ...pick, name: e.target.value })} />
          <select aria-label="Type" value={pick.kind} onChange={(e) => setPick({ ...pick, kind: e.target.value as Delivery['kind'] })}>
            {DELIVERY_KINDS.map((k) => <option key={k} value={k}>{deliveryLabel(k)}</option>)}
          </select>
          <select aria-label="Size" value={pick.size} onChange={(e) => setPick({ ...pick, size: e.target.value as Delivery['size'] })}>
            {DELIVERY_SIZES.map((k) => <option key={k} value={k}>{deliveryLabel(k)}</option>)}
          </select>
          <select aria-label="Business line" value={pick.line} onChange={(e) => setPick({ ...pick, line: e.target.value as Delivery['line'] })}>
            {DELIVERY_LINES.map((k) => <option key={k} value={k}>{deliveryLabel(k)}</option>)}
          </select>
        </fieldset>
      )}
      {back && (
        <fieldset className="kt-gate-delivery kt-gate-risk" data-testid="kt-gate-risk">
          <legend title="Counts toward 'More stable' on the CTO view and the sign-off sheet">Risk stopped (optional)</legend>
          <input aria-label="Risk stopped" className="kt-gate-what" value={risk.what} maxLength={60} onChange={(e) => setRisk({ ...risk, what: e.target.value })} placeholder="For example: price-adjustment refunds above the approval limit" />
          <label>
            Amount <input aria-label="Amount (USD thousands)" className="kt-gate-amount" type="number" min={0} step={0.1} value={risk.k} onChange={(e) => setRisk({ ...risk, k: e.target.value })} placeholder="Optional" /> × 1,000 USD
          </label>
        </fieldset>
      )}
      <textarea className="kt-gate-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={discuss ? 'For example: why is B recommended for question 2? What changes if it becomes A?' : overrule && approve ? 'For example: I accept the risk; $39,000 is reserved for price-adjustment refunds, and finance reviews after the campaign' : approve ? 'For example: add one business rule' : 'For example: an acceptance criterion is missing'} autoFocus aria-label={discuss ? 'Discussion' : 'Comment'} />
      <span className="kt-confirm-actions">
        {preset && note !== preset && !discuss && (
          <button type="button" className="kt-btn" onClick={() => { setNote(preset); if (back && presetRisk) setRisk({ what: presetRisk.what, k: presetRisk.amount != null ? String(presetRisk.amount / 1e3) : '' }) }} title={preset}>
            Fill in the preset comment
          </button>
        )}
        <button type="button" className={`kt-btn is-solid${approve || discuss ? ' is-primary' : ' is-danger'}`} onClick={confirm} disabled={busy}>
          {busy ? 'Submitting…' : discuss ? 'Send' : overrule && approve ? 'Confirm overrule and approve' : approve ? 'Confirm approval' : 'Confirm send back'}
        </button>
        <button type="button" className="kt-btn" onClick={onCancel}>
          Cancel
        </button>
      </span>
      {err && (
        <p className="kt-error" role="alert">
          {err}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// the empty state
// ---------------------------------------------------------------------------------------------

/** The AI-DLC expert team (team/team-aidlc.json): the official AI-DLC domain experts, left to right by dependency; those in the same column run in parallel. */
const TEAM_INTRO: Array<{ phase: string; title: string; roles: Array<Array<{ key: string; title: string; does: string }>> }> = [
  {
    phase: '1 Ideation',
    title: 'One-line requirement → scope list',
    roles: [
      [
        { key: 'intent', title: 'Intent', does: 'Who it is for, why, what counts as success' },
        { key: 'feasibility', title: 'Constraints', does: 'Checked against company standards and store requirements' },
      ],
      [{ key: 'scope', title: 'Scope', does: 'Handed to a person for approval' }],
    ],
  },
  {
    phase: '2 Inception',
    title: 'Read the system, set interfaces, split the work, hand to a person for approval',
    roles: [
      [{ key: 'architect', title: 'Architect', does: 'Reverse engineering, interfaces, who changes what' }],
      [{ key: 'designer', title: 'UI design', does: 'Follows the existing style' }],
      [{ key: 'pm', title: 'Requirements', does: 'Acceptance criteria, summarised and handed to a person for approval' }],
    ],
  },
  {
    phase: '3 Construction',
    title: 'Write the checks first, then the code',
    roles: [
      [
        { key: 'compliance', title: 'Compliance & security', does: 'Standards → checks, red first' },
        { key: 'tester', title: 'Testing', does: 'Guardrail: do not break existing behaviour' },
      ],
      [
        { key: 'backend', title: 'Backend', does: '' },
        { key: 'frontend', title: 'Web', does: '' },
        { key: 'mobile', title: 'Android', does: '' },
        { key: 'ops', title: 'Operations', does: '' },
      ],
    ],
  },
  { phase: '✓ Review gate', title: 'Independent and read only; sends back if changes are needed', roles: [[{ key: 'reviewer', title: 'Review', does: 'Sends back at most two rounds, then hands to a person' }]] },
]

export function EmptyStart({ onStart, preview, models }: { onStart: StartFn; preview?: PreviewFn; models?: ModelsFn }) {
  return (
    <section className="kt-empty" data-testid="kt-empty" aria-label="No runs yet">
      <div className="kt-empty-hero">
        <h2>Building keeps getting cheaper; good products are still scarce</h2>
        <p>
          AI can turn a good idea into something demonstrable in a few days; the hard part is getting it into use across a whole company, listed in a store, and within the company's own standards. This agent team starts from a one-line requirement and follows the AWS AI-DLC flow: Ideation, Inception, Construction, Review gate. The orchestrator first picks the team from the keywords in the requirement (the same rule AI-DLC uses to pick a scope). Each role is a domain expert defined by AI-DLC, runs on Kiro Crew as its own session or sub-agent, and carries only the context it needs. The orchestrator is a deterministic program: it schedules, dispatches, merges, runs checks and sends work back according to the team configuration, and does not rely on the model to behave. A person approves the scope, machines judge the checks, and an independent review releases the delivery.
        </p>
        <p className="kt-empty-punch">A good product is not generated in one go; it is accepted gate by gate.</p>
      </div>
      <ol className="kt-team-intro is-phased" aria-label="Team, by AI-DLC phase from left to right">
        {TEAM_INTRO.map((ph) => (
          <li key={ph.phase} className="kt-intro-phase">
            <div className="kt-intro-phase-head">
              <b>{ph.phase}</b>
              <span>{ph.title}</span>
            </div>
            <div className="kt-intro-phase-body">
              {ph.roles.map((stage, i) => (
                <div key={i} className="kt-intro-stage">
                  {stage.length > 1 && <span className="kt-intro-par">Parallel ×{stage.length}</span>}
                  {stage.map((r) => (
                    <div key={r.key} className="kt-intro-role">
                      <RoleIcon role={r.key} size={26} className="kt-intro-emoji" />
                      <span className="kt-intro-name">
                        <b>{r.title}</b>
                        <small className="kt-intro-agent">agent</small>
                      </span>
                      <span className="kt-intro-does">{r.does}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <StartForm onStart={onStart} preview={preview} models={models} />
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// AI-DLC's 14 official experts
// ---------------------------------------------------------------------------------------------

const EXPERT_STATE = {
  busy: { label: 'Working', hint: 'Its agent is working' },
  used: { label: 'Called', hint: 'The orchestrator has already given it work' },
  team: { label: 'Standing by', hint: 'This team has tasks for it; its turn has not come yet' },
  none: { label: 'Not involved', hint: 'This team has no task for it, so it will not be activated this run' },
  absent: { label: 'Not on Crew', hint: 'This team needs it, but this member is not under Crew Agents yet: add it from the template on the Agents page (until then the template of the same name stands in)' },
} as const

/** All 14 experts AWS AI-DLC defines, in four states: at work, called, on the team but not its turn yet, or not on
 * this team at all (greyed, shown anyway: the orchestrator picked a team without it). */
export function ExpertStrip({ run }: { run: RunDetail }) {
  const { team, used, busy } = aidlcUse(run.roles)
  const experts = expertsOf(run.roles)
  const custom = experts.filter((a) => a.custom).length
  const members = run.crew_members ? new Set(run.crew_members) : null
  const of = (key: string) => run.roles.filter((l) => l.status !== 'skipped' && l.aidlc_agent.split(',').map((x) => x.trim()).includes(key))
  // a member added to the team's Agents page that no role here calls on: shown too, as on the team with nothing to do
  // (a company's own copy of an official expert, like luming-architect-agent, is that expert: not an extra)
  const extra = (run.crew_members ?? []).filter((m) => !experts.some((a) => a.key === m) && !officialOf(m) && !run.roles.some((l) => l.member === m))
  return (
    <section className="kt-experts" aria-label="The 14 official AI-DLC experts" data-testid="kt-experts">
      <span className="kt-experts-title">
        The 14 official AI-DLC experts{custom + extra.length ? ` + ${custom + extra.length} custom` : ''} · {team.size} used this run
      </span>
      <ul className="kt-experts-list">
        {experts.map((a) => {
          const lanes = of(a.key)
          // a role whose Crew member is not on the Agents page (not added yet): its session boots the template instead
          const absent = members !== null && lanes.some((l) => l.member && !members.has(l.member))
          const state = busy.has(a.key) ? 'busy' : used.has(a.key) ? 'used' : team.has(a.key) ? (absent ? 'absent' : 'team') : 'none'
          const n = lanes.length
          const who = lanes.map((l) => l.title).join(', ')
          return (
            <li key={a.key} className={`kt-expert is-${state}${a.custom ? ' is-custom' : ''}`} data-state={state} title={`${a.name} (${a.key}): ${EXPERT_STATE[state].hint}${who ? `; this run: ${who}` : ''}`}>
              <b>
                {a.name}
                {n > 1 ? ` ×${n}` : ''}
              </b>
              <small>{a.custom && state === 'none' ? 'Custom' : EXPERT_STATE[state].label}</small>
            </li>
          )
        })}
        {extra.map((m) => (
          <li key={m} className="kt-expert is-none is-custom is-joined" data-state="joined" title={`${m}: joined the team (it is under Crew Agents), but this requirement has no task for it`}>
            <b>{m.replace(/-agent$/, '')}</b>
            <small>On Crew</small>
          </li>
        ))}
      </ul>
    </section>
  )
}
