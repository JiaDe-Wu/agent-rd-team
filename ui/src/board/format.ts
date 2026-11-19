/**
 * Words, tones and number formats every part of the board shares. Pure: no React, no DOM.
 *
 * A tone is a meaning, not a colour: styles.ts maps each to a colour per host mode (kiro-dark /
 * kiro-light), so the same word always has the same colour and every colour has a word next to it.
 */
import type { Lane, LaneStatus, RunDetail, RunStatus, TeamEventKind, TestCase } from '../types'

export const BASE = '/api/apps/agent-rd-team'
export const POLL_MS = 2000
const enc = encodeURIComponent

export const paths = {
  board: (run?: string | null) => `${BASE}/board${run ? `?run=${enc(run)}` : ''}`,
  runs: () => `${BASE}/runs`,
  stop: (run: string) => `${BASE}/runs/${enc(run)}/stop`,
  role: (run: string, role: string) => `${BASE}/runs/${enc(run)}/roles/${enc(role)}`,
  file: (run: string, role: string, path: string, view: 'content' | 'diff') =>
    `${BASE}/runs/${enc(run)}/roles/${enc(role)}/file?path=${enc(path)}&view=${view}`,
  site: (run: string) => `${BASE}/runs/${enc(run)}/site`,
  siteStop: (run: string) => `${BASE}/runs/${enc(run)}/site/stop`,
  retry: (run: string) => `${BASE}/runs/${enc(run)}/retry`,
  gate: (run: string) => `${BASE}/runs/${enc(run)}/gate`,
  open: (run: string) => `${BASE}/runs/${enc(run)}/open`,
  route: () => `${BASE}/route`,
  models: () => `${BASE}/models`,
  cleanup: () => `${BASE}/sessions/cleanup`,
  signoff: (run: string) => `${BASE}/runs/${enc(run)}/signoff`,
  hide: (run: string) => `${BASE}/runs/${enc(run)}/hide`,
  events: (run: string) => `${BASE}/runs/${enc(run)}/events`,
  cto: () => `${BASE}/cto`,
  ctoOffline: () => `${BASE}/cto/offline`,
  ctoFlow: (run: string) => `${BASE}/cto/flow?run=${encodeURIComponent(run)}`,
}

export type Tone = 'run' | 'fix' | 'ok' | 'done' | 'queue' | 'warn' | 'approve' | 'bad' | 'idle' | 'handoff' | 'info'

export interface StatusMeta {
  label: string
  tone: Tone
  icon: string
  /** One line for a person who does not know the word. */
  hint: string
}

export const LANE_META: Record<LaneStatus, StatusMeta> = {
  waiting: { label: 'Waiting', tone: 'idle', icon: '⏳', hint: 'Upstream is not merged yet, so it cannot start' },
  queued: { label: 'Queued', tone: 'queue', icon: '⏸', hint: 'Dispatched; KiroCrew has not started it yet' },
  running: { label: 'Running', tone: 'run', icon: '●', hint: 'The agent is working' },
  stalled: { label: 'Stalled', tone: 'warn', icon: '⚠', hint: 'KiroCrew marked it as stalled' },
  awaiting_approval: { label: 'Needs your approval', tone: 'approve', icon: '✋', hint: 'A tool call is waiting for your approval' },
  done: { label: 'Done · waiting to merge', tone: 'done', icon: '✓', hint: 'The agent is finished; its branch is not merged into the run branch yet' },
  merged: { label: 'Merged', tone: 'ok', icon: '✔', hint: 'Its branch is merged into the run branch' },
  fixing: { label: 'Fixing', tone: 'fix', icon: '↻', hint: 'Sent back because tests failed; fixing now' },
  failed: { label: 'Failed', tone: 'bad', icon: '✕', hint: 'This role failed' },
  skipped: { label: 'Skipped', tone: 'idle', icon: '–', hint: 'Not in this run: not on Crew, or the approved split leaves it out (the reason is on its card)' },
}

export const RUN_META: Record<RunStatus, { label: string; tone: Tone; active: boolean }> = {
  starting: { label: 'Starting', tone: 'run', active: true },
  running: { label: 'In progress', tone: 'run', active: true },
  fixing: { label: 'Fixing', tone: 'fix', active: true },
  reviewing: { label: 'In review', tone: 'run', active: true },
  gating: { label: 'Needs your approval', tone: 'approve', active: true },
  done: { label: 'Completed', tone: 'ok', active: false },
  failed: { label: 'Failed', tone: 'bad', active: false },
  stopped: { label: 'Stopped', tone: 'idle', active: false },
}

export const EVENT_META: Record<TeamEventKind, { icon: string; label: string; tone: Tone }> = {
  run: { icon: '🏁', label: 'Run', tone: 'info' },
  handoff: { icon: '📨', label: 'Handoff', tone: 'handoff' },
  spawned: { icon: '▶️', label: 'Start', tone: 'run' },
  tool: { icon: '🔧', label: 'Tool', tone: 'idle' },
  committed: { icon: '📝', label: 'Commit', tone: 'info' },
  merged: { icon: '⤵️', label: 'Merge', tone: 'ok' },
  conflict: { icon: '⚡', label: 'Conflict', tone: 'bad' },
  tests: { icon: '🧪', label: 'Tests', tone: 'info' },
  bounce: { icon: '↩️', label: 'Sent back', tone: 'bad' },
  violation: { icon: '🚫', label: 'Out of bounds', tone: 'bad' },
  done: { icon: '✅', label: 'Done', tone: 'ok' },
  failed: { icon: '❌', label: 'Failed', tone: 'bad' },
  review: { icon: '🔍', label: 'Review', tone: 'info' },
  ownership: { icon: '🧭', label: 'Assign', tone: 'info' },
  skipped: { icon: '–', label: 'Skipped', tone: 'idle' },
  gate: { icon: '✋', label: 'Awaiting approval', tone: 'approve' },
  approved: { icon: '👍', label: 'Approved', tone: 'ok' },
  deployed: { icon: '🚀', label: 'Deploy', tone: 'ok' },
  standards: { icon: '📚', label: 'Matched standards', tone: 'info' },
  signoff: { icon: '✍️', label: 'Signed off', tone: 'approve' },
  plan: { icon: '🗂️', label: 'Work split proposal', tone: 'handoff' },
  member: { icon: '⏸', label: 'Missing member', tone: 'warn' },
  talk: { icon: '💬', label: 'Discuss', tone: 'approve' },
}

export const CASE_META: Record<TestCase['status'], { label: string; glyph: string }> = {
  pass: { label: 'Passed', glyph: '✓' },
  fail: { label: 'Failed', glyph: '✕' },
  skip: { label: 'Skipped', glyph: '–' },
}

/** The meaning of a lane's status: a role that writes nothing (the reviewer) has nothing to merge, so
 * for it `done` is the end (Done), not Done · waiting to merge. */
export function laneMeta(lane: Pick<Lane, 'status' | 'writable'>): StatusMeta {
  if (lane.status === 'done' && lane.writable.length === 0) return { label: 'Done', tone: 'ok', icon: '✔', hint: 'It only reads and writes nothing, so it is finished when it is done' }
  // a status this page does not know yet (a newer backend) is shown as is, never a crash
  return LANE_META[lane.status] ?? { label: String(lane.status), tone: 'idle', icon: '•', hint: '' }
}

export function caseMeta(status: string): { label: string; glyph: string } {
  return CASE_META[status as TestCase['status']] ?? { label: status, glyph: '?' }
}

export function runMeta(status: string): { label: string; tone: Tone; active: boolean } {
  return RUN_META[status as RunStatus] ?? { label: status, tone: 'idle', active: false }
}

/** Nothing more will happen to this lane in this run. */
export const isFinal = (lane: Pick<Lane, 'status' | 'writable'>) => lane.status === 'merged' || (lane.status === 'done' && lane.writable.length === 0)

/** Display names of the delivery tag values the backend stores (protocol tokens: the keys stay in Chinese). */
const DELIVERY_LABEL: Record<string, string> = {
  新应用: 'New app', 新功能: 'New feature', 修复: 'Fix', // protocol token: kept in Chinese
  小: 'Small', 中: 'Medium', 大: 'Large', // protocol token: kept in Chinese
  电商: 'E-commerce', 移动应用: 'Mobile app', 客户关系管理: 'CRM', 供应链: 'Supply chain', 内部系统: 'Internal systems', // protocol token: kept in Chinese
  运营部: 'Operations dept', 用户体验组: 'UX group', 会员运营部: 'Membership operations', 供应链管理部: 'Supply chain management', 行政部: 'Administration', 人力资源部: 'HR dept', // reporters in the sample data
}
/** Issue kinds the backend sends (protocol tokens: kept in Chinese), as a person reads them. */
export const issueKind = (k: string) => (k === '需求' ? 'Requirement' : k === '缺陷' ? 'Defect' : k)
export const deliveryLabel = (v: string) => DELIVERY_LABEL[v] ?? v

/** The AI-DLC phases, in order: the team graph's column groups. */
export const PHASES: ReadonlyArray<{ key: string; n: string; title: string; en: string }> = [
  { key: 'ideation', n: '1', title: 'Ideation', en: 'Ideation' },
  { key: 'inception', n: '2', title: 'Inception', en: 'Inception' },
  { key: 'construction', n: '3', title: 'Construction', en: 'Construction' },
  { key: 'review', n: '✓', title: 'Review gate', en: 'Review gate' },
  { key: 'operation', n: '4', title: 'Operation', en: 'Operation' },
]

/** An agent of this role is alive in KiroCrew right now. */
export const LIVE: ReadonlySet<LaneStatus> = new Set<LaneStatus>(['running', 'fixing', 'stalled', 'awaiting_approval'])
/** …and making progress (these glow; stalled and awaiting-approval get their own loud look). */
export const WORKING: ReadonlySet<LaneStatus> = new Set<LaneStatus>(['running', 'fixing'])
/** Finished its part. */
export const FINISHED: ReadonlySet<LaneStatus> = new Set<LaneStatus>(['done', 'merged'])

export const isRunActive = (s: RunStatus) => RUN_META[s]?.active ?? false

/** 0:05, 25:00, 1:02:03 */
export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return `${h ? `${h}:${String(m).padStart(2, '0')}` : m}:${String(r).padStart(2, '0')}`
}

/** 45 s, 23 min, 1 h 5 min */
export function fmtSpan(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  if (s < 60) return `${s} s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return mm ? `${h} h ${mm} min` : `${h} h`
}

export function fmtAgo(delta: number): string {
  const s = Math.max(0, Math.round(delta))
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function fmtCredits(c: number | null | undefined): string {
  if (c === null || c === undefined || !Number.isFinite(c)) return '—'
  return c >= 100 ? String(Math.round(c)) : (Math.round(c * 10) / 10).toFixed(1)
}

/** The parallel saving: what one agent doing it all would take, minus what it really took. */
export function saving(run: Pick<RunDetail, 'wall_s' | 'serial_s'>): { saved_s: number; speedup: number | null } {
  const saved = Math.max(0, run.serial_s - run.wall_s)
  const speedup = run.wall_s > 0 && run.serial_s > 0 ? run.serial_s / run.wall_s : null
  return { saved_s: saved, speedup }
}

/** The upstream roles a lane still waits for: its dependencies whose branch is not merged yet. */
export function waitingFor(lane: Pick<Lane, 'depends_on'>, lanes: Lane[]): Lane[] {
  const by = new Map(lanes.map((l) => [l.key, l]))
  return lane.depends_on.map((k) => by.get(k)).filter((l): l is Lane => !!l && l.status !== 'merged')
}

export function waitingText(lane: Pick<Lane, 'depends_on'>, lanes: Lane[]): string {
  const w = waitingFor(lane, lanes)
  if (w.length) return `Waiting for ${w.map((l) => l.title).join(', ')}`
  return lane.depends_on.length ? 'Upstream is all merged; starting soon' : 'Starting soon'
}

/** 'AC-12' → 12 (sorting); no number → a big one, last. */
/** Case-id groups, in wall order: functional acceptance AC, then from the standards pack security SEC, experience UX, compliance COMP, store STORE. */
export const CASE_GROUPS: { prefix: string; label: string }[] = [
  { prefix: 'AC', label: 'Functional' },
  { prefix: 'RULE', label: 'Business rules' },
  { prefix: 'ACC', label: 'Account security' },
  { prefix: 'PII', label: 'Personal data' },
  { prefix: 'SEC', label: 'Security' },
  { prefix: 'FE', label: 'Frontend engineering' },
  { prefix: 'UX', label: 'Experience' },
  { prefix: 'BR', label: 'Brand' },
  { prefix: 'COMP', label: 'Compliance' },
  { prefix: 'STORE', label: 'Store listing' },
  { prefix: 'PRC', label: 'Price compliance' },
  { prefix: 'MGN', label: 'Gross margin' },
  { prefix: 'PP', label: 'Price protection' },
  { prefix: 'DATA', label: 'Data' },
]

export function caseGroup(ac: string | null): number {
  const prefix = ac ? ac.split('-')[0] : ''
  const i = CASE_GROUPS.findIndex((g) => g.prefix === prefix)
  return i < 0 ? CASE_GROUPS.length : i
}

/** Sort key of a case id: its group, then its number; ids without a number go last. */
export function acNumber(ac: string | null): number {
  const m = ac ? /(\d+)/.exec(ac) : null
  return m ? caseGroup(ac) * 1e6 + Number(m[1]) : 1e9
}

export const baseName = (p: string) => p.replace(/\/+$/, '').split('/').pop() || p

/** Approximate rendered width in em: CJK ≈ 1, emoji ≈ 1.2, latin ≈ 0.58, space ≈ 0.3. */
export function textWidth(s: string): number {
  let w = 0
  for (const ch of s) w += charWidth(ch)
  return w
}

function charWidth(ch: string): number {
  const c = ch.codePointAt(0) ?? 0
  if (c === 0x20) return 0.3
  if (c > 0x1f000) return 1.2
  if ((c >= 0x2e80 && c <= 0x9fff) || (c >= 0xff00 && c <= 0xffef) || (c >= 0x3000 && c <= 0x303f)) return 1
  return 0.58
}

/** Cut *s* to about *maxEm* em with an ellipsis (SVG text does not ellipsize by itself). */
export function clip(s: string, maxEm: number): string {
  if (textWidth(s) <= maxEm) return s
  let out = ''
  let w = 0
  for (const ch of s) {
    const cw = charWidth(ch)
    if (w + cw > maxEm - 0.8) break
    out += ch
    w += cw
  }
  return `${out.trimEnd()}…`
}

/** An emoji-ish icon for a tool call kind (KiroCrew's live tool log). */
export function toolIcon(kind: string | null, tool: string): string {
  const k = (kind ?? '').toLowerCase()
  const t = tool.toLowerCase()
  if (k === 'read' || /read|cat\b|view/.test(t)) return '📖'
  if (k === 'write' || k === 'edit' || /write|edit|patch|replace/.test(t)) return '✏️'
  if (k === 'search' || /grep|glob|search|find/.test(t)) return '🔎'
  if (k === 'shell' || /bash|shell|exec|command/.test(t)) return '⌘'
  if (/web|fetch|http/.test(t)) return '🌐'
  return '🔧'
}

/** 'passed/total' parsed from a tests event's text ("Tests 7/12"), or null. */
export function parseScore(text: string): { passed: number; total: number } | null {
  const m = /(\d+)\s*\/\s*(\d+)/.exec(text)
  if (!m) return null
  const passed = Number(m[1])
  const total = Number(m[2])
  return total > 0 && passed <= total ? { passed, total } : null
}

/** The lane an event is about, for filtering: its role, or the role at either end. */
export function eventTouches(e: { role: string | null; from: string | null; to: string | null }, role: string): boolean {
  return e.role === role || e.from === role || e.to === role
}

/** The 14 agents AWS AI-DLC ships (core/agents): 11 domain experts, 2 reviewers, 1 composer. */
export const AIDLC_AGENTS: ReadonlyArray<{ key: string; name: string }> = [
  { key: 'aidlc-product-agent', name: 'Product' },
  { key: 'aidlc-architect-agent', name: 'Architecture' },
  { key: 'aidlc-design-agent', name: 'Design' },
  { key: 'aidlc-developer-agent', name: 'Development' },
  { key: 'aidlc-quality-agent', name: 'Quality' },
  { key: 'aidlc-devsecops-agent', name: 'Security' },
  { key: 'aidlc-compliance-agent', name: 'Compliance' },
  { key: 'aidlc-pipeline-deploy-agent', name: 'Pipeline deploy' },
  { key: 'aidlc-aws-platform-agent', name: 'AWS platform' },
  { key: 'aidlc-operations-agent', name: 'Operations' },
  { key: 'aidlc-delivery-agent', name: 'Delivery' },
  { key: 'aidlc-architecture-reviewer-agent', name: 'Architecture review' },
  { key: 'aidlc-product-lead-agent', name: 'Product lead' },
  { key: 'aidlc-composer-agent', name: 'Team selection Composer' },
]

/** Experts a company adds to the official 14 (a Crew member of its own), by their member name. */
export const CUSTOM_EXPERTS: Readonly<Record<string, string>> = { 'taoyuan-motion-agent': 'Brand motion' }

export const expertName = (key: string) => AIDLC_AGENTS.find((a) => a.key === key)?.name ?? CUSTOM_EXPERTS[key] ?? key

/** The experts a run shows: the official 14, then the company's own its roles use. */
/** The official expert a company's own copy of it stands for: a company's `acme-architect-agent` is AI-DLC's
 * `aidlc-architect-agent` with the company's working notes (example/agents/make_templates.py); "" for anything else. */
export function officialOf(member: string): string {
  const key = member.replace(/^[a-z0-9]+-(.+-agent)$/, 'aidlc-$1')
  return AIDLC_AGENTS.some((a) => a.key === key) ? key : ''
}

export function expertsOf(roles: ReadonlyArray<Pick<Lane, 'aidlc_agent'>>): { key: string; name: string; custom: boolean }[] {
  const official = new Set(AIDLC_AGENTS.map((a) => a.key))
  const custom = [...new Set(roles.flatMap((l) => l.aidlc_agent.split(',').map((x) => x.trim())).filter((k) => k && !official.has(k)))]
  return [...AIDLC_AGENTS.map((a) => ({ ...a, custom: false })), ...custom.map((k) => ({ key: k, name: expertName(k), custom: true }))]
}

/** The official agents a run's roles use (comma-separated per role), and those of roles at work right now. */
export function aidlcUse(roles: ReadonlyArray<Pick<Lane, 'aidlc_agent' | 'status'>>): { team: Set<string>; used: Set<string>; busy: Set<string> } {
  const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)
  const team = new Set(roles.filter((l) => l.status !== 'skipped').flatMap((l) => split(l.aidlc_agent)))
  const used = new Set(roles.filter((l) => l.status !== 'skipped' && l.status !== 'waiting').flatMap((l) => split(l.aidlc_agent)))
  const busy = new Set(roles.filter((l) => LIVE.has(l.status) || l.status === 'queued').flatMap((l) => split(l.aidlc_agent)))
  return { team, used, busy }
}
