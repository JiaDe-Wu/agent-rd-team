/**
 * The card a team member's node shows when the pointer rests on it: who it is and what it was given this run, what it
 * did (its own summary, its changes, the checks it answers for, its knowledge lookups) or is doing now, and the two
 * ways to look closer: View outputs (the outputs drawer) and Open session in Crew (its Kiro Crew session).
 */
import type { Lane, RunDetail } from '../types'
import { LIVE, fmtClock, fmtCredits, laneMeta } from './format'
import { OpenSession } from './Outputs'
import { RoleIcon } from './RoleIcon'

export function NodeCard({ run, lane, onOutputs }: { run: RunDetail; lane: Lane; onOutputs?: (role: string) => void }) {
  const meta = laneMeta(lane)
  const live = LIVE.has(lane.status)
  const mine = run.tests.cases.filter((c) => c.owner === lane.key)
  const passed = mine.filter((c) => c.status === 'pass').length
  const lookups = run.knowledge.hits.filter((h) => h.role === lane.key).length
  const files = lane.files.length
  const sentBack = lane.doing && lane.doing !== lane.assignment
  const did = live
    ? lane.agent?.last_tool
      ? `Now: ${lane.agent.last_tool}`
      : 'Just started'
    : lane.summary || (lane.status === 'waiting' ? (lane.awaiting_member ? '' : 'Not its turn yet') : lane.status === 'skipped' ? 'Not in this run' : '')
  const missing = lane.status === 'waiting' ? lane.awaiting_member : null
  return (
    <div className="kt-ncard-body">
      <p className="kt-ncard-head">
        <RoleIcon role={lane.icon || lane.key} size={16} /> <b>{lane.title}</b>
        <span className={`kt-pill tone-${meta.tone}`}>{meta.label}</span>
      </p>
      {lane.assignment && (
        <p className="kt-ncard-task">
          <span className="kt-dim">Task</span> {lane.assignment}
        </p>
      )}
      {missing && (
        <p className="kt-ncard-back">
          ⏸ Not started: there is no member {missing} under Agents yet. In Kiro Crew, go to Agents → Add team member and add it (use {missing} for both name and template); it starts automatically once added.
        </p>
      )}
      {sentBack && <p className="kt-ncard-back">This round: {lane.doing}</p>}
      {did && <p className="kt-ncard-did">{did}</p>}
      <ul className="kt-ncard-facts">
        {(lane.active_s > 0 || live) && <li>Time {fmtClock(live && lane.agent ? lane.agent.elapsed_s : lane.active_s)}</li>}
        {lane.writable.length > 0 && files > 0 && (
          <li>
            Changed {files} file{files === 1 ? '' : 's'} <span className="kt-ok">+{lane.lines.added}</span> <span className="kt-bad">−{lane.lines.removed}</span> · {lane.commits.length} commit{lane.commits.length === 1 ? '' : 's'}
          </li>
        )}
        {lane.writable.length === 0 && lane.status !== 'waiting' && <li>Read only: does not change code, only looks at the actual changes</li>}
        {mine.length > 0 && (
          <li>
            Checks it owns: {passed}/{mine.length} passing
          </li>
        )}
        {lookups > 0 && <li>Knowledge-base lookups and data reads: {lookups}</li>}
        {lane.credits !== null && <li>{fmtCredits(lane.credits)} credits</li>}
      </ul>
      <div className="kt-ncard-actions">
        {onOutputs && lane.status !== 'waiting' && (
          <button type="button" className="kt-btn" onClick={() => onOutputs(lane.key)}>
            View outputs
          </button>
        )}
        {lane.session && <OpenSession slot={lane.session} title={lane.title} />}
      </div>
    </div>
  )
}
