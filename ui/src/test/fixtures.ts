/**
 * Board fixtures for the tests and the standalone preview, all derived from the realistic mid-run
 * snapshot board-running.json:
 *
 * - runningBoard: the snapshot as is (architect/designer/tester merged, backend on fix round 2,
 *   frontend running with a violation and a merge conflict, ops done, reviewer waiting, tests 6/12);
 * - scenario(): the same run played forward, one snapshot per poll (tool calls, backend's fix merged
 *   and tests flipping green, frontend undoing its violation, ops merged, a bounce, frontend's second
 *   round, 12/12, the handoffs to the reviewer, the review, done); finishedBoard is its last step;
 * - startedBoard (just started), troubleBoard (stalled, awaiting approval, queued), failedBoard
 *   (frontend failed after two fix rounds), emptyBoard (no runs), multiRunBoard (three runs).
 */
import raw from './fixtures/board-running.json'
import type { Board, FileChange, Lane, RunDetail, TeamEvent, TeamEventKind, TestCase } from '../types'

export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

export function runningBoard(): Board {
  return clone(raw) as unknown as Board
}

export function emptyBoard(at: number = raw.at): Board {
  return { at, runs: [], run: null }
}

const LIVE_STATUSES = new Set(['running', 'fixing', 'stalled', 'awaiting_approval'])

export function lane(b: Board, key: string): Lane {
  const l = b.run?.roles.find((r) => r.key === key)
  if (!l) throw new Error(`no lane ${key}`)
  return l
}

export function caseOf(b: Board, id: string): TestCase {
  const c = b.run?.tests.cases.find((x) => x.id === id || x.ac === id)
  if (!c) throw new Error(`no test case ${id}`)
  return c
}

/** Recount passed / failed / total from the cases. */
export function recount(b: Board): Board {
  const t = b.run!.tests
  t.passed = t.cases.filter((c) => c.status === 'pass').length
  t.failed = t.cases.filter((c) => c.status === 'fail').length
  t.total = t.cases.length
  return b
}

/** One case to *status* (an id like `api-signup.test.js#AC-6`, or just `AC-6`). */
export function setCase(b: Board, id: string, status: TestCase['status'], message: string | null = null): Board {
  const c = caseOf(b, id)
  c.status = status
  c.message = status === 'fail' ? (message ?? c.message ?? 'failed') : null
  return recount(b)
}

/** Append an event (next seq, at the snapshot's time unless given). */
export function withEvent(b: Board, e: Partial<TeamEvent> & { kind: TeamEventKind }): Board {
  const r = b.run!
  const seq = r.events.reduce((m, x) => Math.max(m, x.seq), 0) + 1
  r.events.push({ seq, at: e.at ?? b.at, kind: e.kind, role: e.role ?? null, text: e.text ?? e.kind, from: e.from ?? null, to: e.to ?? null, data: e.data ?? null })
  return b
}

/** Move every timestamp in the board by *dt* seconds. */
export function shiftTimes(b: Board, dt: number): Board {
  const s = (v: number | null) => (v === null ? null : v + dt)
  b.at += dt
  for (const c of b.runs) {
    c.started_at += dt
    c.ended_at = s(c.ended_at)
  }
  const r = b.run
  if (!r) return b
  r.started_at += dt
  r.ended_at = s(r.ended_at)
  for (const l of r.roles) {
    l.started_at = s(l.started_at)
    l.done_at = s(l.done_at)
    for (const c of l.commits) c.at += dt
    if (l.agent) {
      l.agent.started += dt
      l.agent.last_activity = s(l.agent.last_activity)
      for (const t of l.agent.recent_tools) t.at += dt
    }
  }
  r.tests.at = s(r.tests.at)
  for (const h of r.tests.history) h.at += dt
  for (const m of r.merges) m.at += dt
  for (const e of r.events) e.at += dt
  return b
}

/** The same board as another run (id, title and branch names), its times moved by *dt*. */
export function asRun(b: Board, id: string, title: string, dt: number): Board {
  const old = b.run!.id
  const swap = (s: string | null) => (s === null ? null : s.split(old).join(id))
  shiftTimes(b, dt)
  const r = b.run!
  r.id = id
  r.title = title
  r.delivery = { ...r.delivery, name: title } // the delivery name the team's defaults give: the requirement's first line
  r.branch = swap(r.branch)!
  r.repo = swap(r.repo)!
  for (const l of r.roles) {
    l.branch = swap(l.branch)
    l.worktree = swap(l.worktree)
  }
  b.runs = b.runs.map((c) => (c.id === old ? { ...c, id, title, name: title } : c))
  r.events = r.events.map((e) => (e.kind === 'run' ? { ...e, text: e.text.replace('Event signup site', title) } : e))
  return b
}

/** Keep the run's card (Board.runs) and the derived totals in step with the run. */
function sync(b: Board): Board {
  const r = b.run!
  recount(b)
  const credits = r.roles.reduce((a, l) => a + (l.credits ?? 0), 0)
  r.credits = credits ? Math.round(credits * 10) / 10 : null
  b.runs = b.runs.map((c) =>
    c.id === r.id
      ? {
          ...c,
          status: r.status,
          ended_at: r.ended_at,
          roles_done: r.roles.filter((l) => l.status === 'done' || l.status === 'merged').length,
          roles_total: r.roles.length,
          tests: { passed: r.tests.passed, failed: r.tests.failed, total: r.tests.total },
        }
      : c,
  )
  return b
}

// ---------------------------------------------------------------------------------------------
// the scripted run
// ---------------------------------------------------------------------------------------------

class Script {
  readonly b: Board
  constructor(base: Board) {
    this.b = clone(base)
  }
  private get run(): RunDetail {
    return this.b.run!
  }
  lane(k: string): Lane {
    return lane(this.b, k)
  }
  /** World time passes: the run, its live lanes and their agents get older. */
  tick(dt: number): this {
    const r = this.run
    this.b.at += dt
    if (!r.ended_at) r.wall_s += dt
    const live = r.roles.filter((l) => LIVE_STATUSES.has(l.status))
    for (const l of live) {
      l.active_s += dt
      if (l.agent) l.agent.elapsed_s += dt
    }
    r.serial_s += dt * live.length
    return this
  }
  event(kind: TeamEventKind, role: string | null, text: string, ago = 0, from: string | null = null, to: string | null = null): this {
    withEvent(this.b, { kind, role, text, from, to, at: this.b.at - ago })
    const r = this.run
    if (r.events.length > 200) r.events.splice(0, r.events.length - 200)
    return this
  }
  tool(role: string, tool: string, kind: string, detail: string, last: string, ago: number): this {
    const l = this.lane(role)
    const a = l.agent!
    const at = this.b.at - ago
    a.recent_tools = [...a.recent_tools, { at, tool, kind, detail }].slice(-8)
    a.last_tool = last
    a.last_activity = at
    a.turns += 1
    a.tool_count += 1
    return this.event('tool', role, `${l.title}: ${last}`, ago)
  }
  say(role: string, text: string): this {
    const a = this.lane(role).agent!
    a.text_tail = `${a.text_tail ?? ''}${text}`.slice(-300)
    return this
  }
  commit(role: string, sha: string, subject: string, files: FileChange[], ago: number, drop: string[] = []): this {
    const l = this.lane(role)
    l.commits = [...l.commits, { sha, subject, at: this.b.at - ago }].slice(-8)
    const by = new Map(l.files.filter((f) => !drop.includes(f.path)).map((f) => [f.path, f]))
    for (const f of files) {
      const had = by.get(f.path)
      by.set(f.path, had ? { ...had, added: had.added + f.added, removed: had.removed + f.removed } : f)
    }
    l.files = [...by.values()].sort((x, y) => y.added + y.removed - (x.added + x.removed)).slice(0, 12)
    l.lines = { added: l.files.reduce((a, f) => a + f.added, 0), removed: l.files.reduce((a, f) => a + f.removed, 0) }
    l.violations = l.violations.filter((v) => !drop.includes(v))
    return this.event('committed', role, `${l.title} committed: ${subject}`, ago)
  }
  done(role: string, summary: string, credits: number, ago: number): this {
    const l = this.lane(role)
    l.status = 'done'
    l.done_at = this.b.at - ago
    l.summary = summary
    if (l.agent) {
      l.agent.credits = credits
      l.agent.last_activity = this.b.at - ago
    }
    l.credits = Math.round(((l.credits ?? 0) + credits) * 10) / 10
    return this.event('done', role, `${l.title} done: ${summary}`, ago)
  }
  merge(role: string, sha: string, files: number, ago: number): this {
    const l = this.lane(role)
    this.run.merges.push({ role, sha, at: this.b.at - ago, status: 'merged', files, note: null })
    l.status = 'merged'
    return this.event('merged', role, `${l.title}'s branch merged into the run branch`, ago, role, 'run')
  }
  test(pass: string[], ago: number, text?: string): this {
    for (const id of pass) setCase(this.b, id, 'pass')
    const t = this.run.tests
    t.at = this.b.at - ago
    t.history.push({ at: t.at, passed: t.passed, failed: t.failed })
    return this.event('tests', null, text ?? `Tests ${t.passed}/${t.total}`, ago)
  }
  bounce(role: string, acs: string[], ago: number): this {
    const l = this.lane(role)
    return this.event('bounce', role, `${acs.join(', ')} failed, sent back to ${l.title}`, ago, 'tests', role)
  }
  spawn(role: string, attempt: number, text: string, ago: number, first: { tool: string; kind: string; detail: string; last: string; tail: string }): this {
    const l = this.lane(role)
    const at = this.b.at - ago
    l.status = attempt > 1 ? 'fixing' : 'running'
    l.attempt = attempt
    l.started_at = l.started_at ?? at
    l.done_at = null
    l.agent = {
      id: `s-${role}${attempt}`,
      turns: 1,
      tool_count: 1,
      last_tool: first.last,
      last_activity: at,
      started: at,
      elapsed_s: ago,
      queued_reason: null,
      error: null,
      recent_tools: [{ at, tool: first.tool, kind: first.kind, detail: first.detail }],
      text_tail: first.tail,
      credits: null,
    }
    if (!l.worktree) {
      l.worktree = `${this.run.repo.replace(/\/repo$/, '')}/wt/${role}`
      l.branch = `team/${this.run.id}/${role}`
    }
    return this.event('spawned', role, text, ago)
  }
  status(s: RunDetail['status'], ago = 0): this {
    this.run.status = s
    if (s === 'done' || s === 'failed' || s === 'stopped') this.run.ended_at = this.b.at - ago
    return this
  }
  snap(): Board {
    return clone(sync(this.b))
  }
}

/** The running fixture played forward, one snapshot per poll; the first is the fixture itself. */
export function scenario(): Board[] {
  const s = new Script(runningBoard())
  const out: Board[] = [s.snap()]
  // 1: both implementers at work; frontend commits the error message
  s.tick(15)
    .tool('backend', 'fs_write', 'write', 'backend/validate.js', 'Editing backend/validate.js', 12)
    .say('backend', 'Change checkCapacity to >= and put checkDuplicate before the write. Run the api-signup tests.')
    .tool('backend', 'execute_bash', 'shell', 'node --test tests/api-signup.test.js', 'Running: node --test tests/api-signup.test.js', 4)
    .tool('frontend', 'fs_write', 'write', 'frontend/app.js', 'Editing frontend/app.js', 9)
    .say('frontend', 'When the submit fails, render .error-msg under the form, with the reason the API returned as its text.')
    .commit('frontend', 'f6a1c3e', '[frontend] Show the reason when signup fails', [{ path: 'frontend/app.js', added: 24, removed: 3, status: 'A' }], 2)
  out.push(s.snap())
  // 2: backend's second round is merged, three cases flip green
  s.tick(20)
    .say('backend', 'AC-6, AC-7 and AC-10 pass; committing.')
    .commit(
      'backend',
      'e9c4d21',
      '[backend] Fix: capacity check >=, duplicate email check before write, list sorted by time',
      [
        { path: 'backend/validate.js', added: 12, removed: 3, status: 'A' },
        { path: 'backend/store.js', added: 6, removed: 1, status: 'A' },
      ],
      17,
    )
    .done('backend', 'Capacity check changed to >=, duplicate email check before write, list sorted by signup time', 4.8, 13)
    .merge('backend', 'e9c4d21', 2, 10)
    .test(['AC-6', 'AC-7', 'AC-10'], 3)
  out.push(s.snap())
  // 3: frontend gives backend/server.js back; ops is merged
  s.tick(20)
    .tool('frontend', 'execute_bash', 'shell', 'git checkout team/r1006a/run -- backend/server.js', 'Running: git checkout team/r1006a/run -- backend/server.js', 17)
    .say('frontend', 'backend/server.js is not the frontend\'s; reverting my change. The frontend handles 409 itself.')
    .commit('frontend', 'f6d9e10', '[frontend] Revert the change to backend/server.js', [], 12, ['backend/server.js'])
    .merge('ops', '0a6d3e1', 3, 7)
    .test([], 2)
  out.push(s.snap())
  // 4: frontend is merged, two more green, AC-11 still red: bounced back for round 2
  s.tick(25)
    .done('frontend', 'Home, detail, signup form, list page; shows the reason when signup fails', 14.2, 22)
    .merge('frontend', 'f6d9e10', 3, 18)
    .test(['AC-8', 'AC-12'], 12)
    .bounce('frontend', ['AC-11'], 8)
    .spawn('frontend', 2, 'Frontend, round 2: fix AC-11', 4, {
      tool: 'fs_read',
      kind: 'read',
      detail: 'tests/web-render.test.js',
      last: 'Reading tests/web-render.test.js',
      tail: 'AC-11: the form must work at mobile width. The failure says form wider than 375px; first check what sets the form width...',
    })
  out.push(s.snap())
  // 5: frontend's second round at work
  s.tick(20)
    .tool('frontend', 'fs_read', 'read', 'frontend/styles/main.css', 'Reading frontend/styles/main.css', 15)
    .say('frontend', 'Found it: the wrapper around the form hard-codes min-width: 420px. Change it to width: 100%, at most 420px.')
    .tool('frontend', 'fs_write', 'write', 'frontend/index.html', 'Editing frontend/index.html', 8)
    .tool('frontend', 'execute_bash', 'shell', 'node --test tests/web-render.test.js', 'Running: node --test tests/web-render.test.js', 3)
  out.push(s.snap())
  // 6: 12/12; the implementation is handed to the reviewer
  s.tick(25)
    .commit('frontend', 'f8b2a47', '[frontend] Fix: the form is no longer too wide on mobile', [{ path: 'frontend/index.html', added: 5, removed: 2, status: 'A' }], 22)
    .done('frontend', 'AC-11 fixed: the form no longer overflows at 375px', 3.9, 19)
    .merge('frontend', 'f8b2a47', 1, 16)
    .test(['AC-11'], 11, 'Tests 12/12: all green')
    .event('handoff', 'reviewer', 'Backend handed its implementation to Review', 7, 'backend', 'reviewer')
    .event('handoff', 'reviewer', 'Frontend handed its implementation to Review', 7, 'frontend', 'reviewer')
    .event('handoff', 'reviewer', 'Operations handed its scripts to Review', 6, 'ops', 'reviewer')
    .spawn('reviewer', 1, 'Review started: read-only check of the merged changes', 3, {
      tool: 'fs_read',
      kind: 'read',
      detail: 'docs/product/acceptance.md',
      last: 'Reading docs/product/acceptance.md',
      tail: 'First read the acceptance criteria, then all changes of the run branch against 5e1f0aa.',
    })
    .status('reviewing')
  out.push(s.snap())
  // 7: the review
  s.tick(20)
    .tool('reviewer', 'execute_bash', 'shell', 'git diff 5e1f0aa..team/r1006a/run --stat', 'Running: git diff 5e1f0aa..team/r1006a/run --stat', 14)
    .say('reviewer', 'Checking the 12 acceptance criteria one by one: the interfaces match contracts/api.md; the frontend only gets data over HTTP; the ops script has a health check; no out-of-bounds changes...')
    .tool('reviewer', 'fs_read', 'read', 'backend/validate.js', 'Reading backend/validate.js', 4)
  out.push(s.snap())
  // 8: done
  s.tick(25)
    .say('reviewer', 'DONE: 可以交付。') // protocol token: kept in Chinese
    .done('reviewer', 'DONE: 可以交付 · all 12 acceptance criteria have an implementation and tests', 7.6, 14) // protocol token: kept in Chinese
    .event('review', 'reviewer', 'Review: 可以交付', 12) // protocol token: kept in Chinese
    .event('run', null, 'Run finished: 12/12 all green, review says 可以交付', 6) // protocol token: kept in Chinese
    .status('done', 6)
  out.push(s.snap())
  return out
}

export function finishedBoard(): Board {
  const steps = scenario()
  return steps[steps.length - 1]
}

/** A run 42 s in: the product manager is reading the requirement, everyone else waits. */
export function startedBoard(): Board {
  const b = runningBoard()
  const r = b.run!
  const t0 = r.started_at
  b.at = t0 + 42
  Object.assign(r, { status: 'running', wall_s: 42, serial_s: 42, credits: null, ended_at: null })
  for (const l of r.roles) {
    Object.assign(l, {
      status: 'waiting',
      attempt: 1,
      agent: null,
      worktree: null,
      branch: null,
      files: [],
      lines: { added: 0, removed: 0 },
      commits: [],
      violations: [],
      owns_tests: [],
      started_at: null,
      done_at: null,
      active_s: 0,
      credits: null,
      summary: null,
    })
  }
  const pm = lane(b, 'pm')
  Object.assign(pm, {
    status: 'running',
    started_at: t0,
    active_s: 42,
    worktree: `${r.repo.replace(/\/repo$/, '')}/wt/pm`,
    branch: `team/${r.id}/pm`,
    agent: {
      id: 's-pm',
      turns: 3,
      tool_count: 4,
      last_tool: 'Reading README.md',
      last_activity: t0 + 40,
      started: t0,
      elapsed_s: 42,
      queued_reason: null,
      error: null,
      recent_tools: [
        { at: t0 + 6, tool: 'fs_read', kind: 'read', detail: 'README.md' },
        { at: t0 + 19, tool: 'execute_bash', kind: 'shell', detail: 'ls docs/' },
        { at: t0 + 40, tool: 'fs_read', kind: 'read', detail: 'README.md' },
      ],
      text_tail: 'The requirement is an event signup site: the home page lists events, a click opens the detail, and a visitor signs up with a name and an email; no signup when capacity is full, the same email cannot sign up twice; the organiser can see the list. First list the pages and actions, then write them as testable acceptance criteria AC-1, AC-2...',
      credits: null,
    },
  })
  r.tests = { at: null, command: 'node --test tests/', cases: [], passed: 0, failed: 0, total: 0, history: [] }
  r.merges = []
  r.events = r.events.slice(0, 2)
  withEvent(b, { kind: 'tool', role: 'pm', text: 'Product manager: Reading README.md', at: t0 + 6 })
  return sync(b)
}

/** The loud states at once: backend stalled, frontend waiting for approval, ops queued. */
export function troubleBoard(): Board {
  const b = runningBoard()
  const r = b.run!
  const be = lane(b, 'backend')
  be.status = 'stalled'
  be.agent!.last_activity = b.at - 260
  be.agent!.last_tool = 'Running: node --test tests/api-signup.test.js'
  const fe = lane(b, 'frontend')
  fe.status = 'awaiting_approval'
  fe.agent!.last_tool = 'Running: rm -rf frontend/dist && node build.js'
  const ops = lane(b, 'ops')
  Object.assign(ops, {
    status: 'queued',
    files: [],
    lines: { added: 0, removed: 0 },
    commits: [],
    started_at: null,
    done_at: null,
    active_s: 0,
    credits: null,
    summary: null,
    agent: {
      id: 's-op',
      turns: 0,
      tool_count: 0,
      last_tool: '',
      last_activity: null,
      started: b.at - 35,
      elapsed_s: 35,
      queued_reason: 'KiroCrew runs only 2 sub-agents at a time; it is first in the queue',
      error: null,
      recent_tools: [],
      text_tail: null,
      credits: null,
    },
  })
  r.events = r.events.filter((e) => !(e.role === 'ops' && e.kind === 'done'))
  withEvent(b, { kind: 'spawned', role: 'ops', text: 'Operations dispatched: queued, waiting for Kiro Crew to start the session', at: b.at - 35 })
  sync(b)
  return b
}

/** Frontend's second round did not fix AC-11: the run stops there. */
export function failedBoard(): Board {
  const steps = scenario()
  const s = new Script(steps[5])
  s.tick(30)
    .commit('frontend', 'f8b2a47', '[frontend] Try to fix the mobile width', [{ path: 'frontend/index.html', added: 5, removed: 2, status: 'A' }], 27)
    .done('frontend', 'Changed the form width', 3.9, 24)
    .merge('frontend', 'f8b2a47', 1, 20)
    .test([], 14, 'Tests 11/12')
    .event('failed', 'frontend', 'AC-11 still fails after two rounds of frontend fixes', 9)
    .event('run', null, 'Run failed: the frontend used up its 2 fix rounds', 6)
    .status('failed', 6)
  const b = s.snap()
  const fe = lane(b, 'frontend')
  fe.status = 'failed'
  fe.agent!.error = 'AC-11 still fails after two rounds of fixes: form wider than 375px'
  return sync(b)
}

/** Three runs: the live one, yesterday's finished one, a failed one the day before. */
export function multiRunBoard(selected?: string | null): Board {
  const live = runningBoard()
  const done = asRun(finishedBoard(), 'r1005z', 'Book club signup page', -86400)
  const failed = asRun(failedBoard(), 'r1004x', 'Club recruitment page', -2 * 86400)
  const pick = selected === 'r1005z' ? done : selected === 'r1004x' ? failed : live
  return { at: live.at, runs: [live.runs[0], done.runs[0], failed.runs[0]], run: pick.run }
}

/** A v2 run (team-aidlc.json) in the middle of construction: phases, an approved scope gate, a fix round. */
export function aidlcBoard(gatePending = false): Board {
  const b = runningBoard()
  const run = b.run!
  const tpl = run.roles.find((r) => r.key === 'backend')!
  const mk = (key: string, title: string, phase: string, stage: string, deps: string[], status: Lane['status'], extra: Partial<Lane> = {}): Lane => ({
    ...clone(tpl), key, title, phase, stage, depends_on: deps, status, gate: null, gate_label: '', kinds: ['work'], attempt: 1, aidlc_agent: '',
    writable: [`${key}/**`], violations: [], mission: '', summary: null, ...extra,
  })
  const dev = 'aidlc-developer-agent'
  const later = (s: Lane['status']): Lane['status'] => (gatePending ? 'waiting' : s)
  run.roles = [
    mk('intent', 'Intent', 'ideation', '1.1 Intent capture', [], 'merged', { aidlc_agent: 'aidlc-product-agent' }),
    mk('feasibility', 'Constraints', 'ideation', '1.3 Feasibility and constraints', [], 'merged', { aidlc_agent: 'aidlc-compliance-agent,aidlc-devsecops-agent' }),
    mk('scope', 'Scope', 'ideation', '1.4 Scope definition', ['intent', 'feasibility'], 'merged', { gate: gatePending ? 'pending' : 'approved', gate_label: 'Scope', aidlc_agent: 'aidlc-product-agent' }),
    mk('architect', 'Architect', 'inception', '2.1 Reverse engineering · 2.8 Interface agreement', ['scope'], later('merged'), { aidlc_agent: 'aidlc-architect-agent' }),
    mk('pm', 'Requirements', 'inception', '2.3 Requirements analysis', ['architect'], later('merged'), { aidlc_agent: 'aidlc-product-agent' }),
    mk('designer', 'UI design', 'inception', '2.5 UI refinement', ['architect'], later('merged'), { aidlc_agent: 'aidlc-design-agent' }),
    mk('compliance', 'Compliance & security', 'construction', '3.2 Non-functional requirements → checks', ['architect'], later('merged'), { aidlc_agent: 'aidlc-compliance-agent,aidlc-devsecops-agent' }),
    mk('tester', 'Testing', 'construction', '3.6 Build and test · guardrails', ['pm'], later('merged'), { aidlc_agent: 'aidlc-quality-agent' }),
    mk('backend', 'Backend', 'construction', '3.5 Code generation', ['architect', 'compliance'], later('fixing'), { aidlc_agent: dev, attempt: 2, kinds: ['work', 'fix'] }),
    mk('frontend', 'Web', 'construction', '3.5 Code generation', ['architect', 'designer', 'compliance'], later('running'), { aidlc_agent: dev }),
    mk('mobile', 'Android', 'construction', '3.5 Code generation', ['architect', 'designer', 'compliance'], later('merged'), { aidlc_agent: dev }),
    mk('ops', 'Operations', 'construction', '3.5 Code generation', ['architect', 'compliance'], later('merged'), { aidlc_agent: 'aidlc-pipeline-deploy-agent' }),
    mk('reviewer', 'Review', 'review', 'Review gate', ['backend', 'frontend', 'mobile', 'ops'], 'waiting', { writable: [], aidlc_agent: 'aidlc-architecture-reviewer-agent,aidlc-product-lead-agent' }),
  ]
  run.edges = run.roles.flatMap((r) => r.depends_on.map((d) => [d, r.key] as [string, string]))
  run.team = { name: 'AI-DLC expert team', orchestrator: 'kirocrew-team' }
  run.title = 'Private IM goes to the whole company next month and is listed on Google Play.'
  run.status = gatePending ? 'gating' : 'fixing'
  run.tests = gatePending ? { ...run.tests, cases: [], passed: 0, failed: 0, total: 0, history: [] } : { ...run.tests, passed: 70, failed: 12, total: 82, history: [{ at: run.tests.at ?? b.at, passed: 40, failed: 42 }, ...run.tests.history] }
  return b
}

export const FIXTURES = {
  running: runningBoard,
  aidlc: () => aidlcBoard(),
  'aidlc-gate': () => aidlcBoard(true),
  finished: finishedBoard,
  started: startedBoard,
  trouble: troubleBoard,
  failed: failedBoard,
  empty: () => emptyBoard(),
  multi: () => multiRunBoard(),
} as const

export type FixtureName = keyof typeof FIXTURES
