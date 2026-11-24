/** A small CTO view answer for tests: four deliveries before AI-DLC, five with it (two measured runs), four cards. */
import type { CtoData, CtoFlow } from './types'

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  const t = new Date(y, m - 1, d + n)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export function ctoData(): CtoData {
  const base = { signer: '', real: null, period: 'base' as const }
  const agent = { signer: 'Maya Chen', real: null, period: 'agent' as const }
  return {
    meta: {
      today: '2026-10-20', agentStart: '2026-07-29', weeks: Array.from({ length: 24 }, (_, i) => addDays('2026-05-06', 7 * i)),
      lines: ['E-commerce', 'Mobile app', 'CRM', 'Supply chain', 'Internal systems'], peoplePerLine: 12,
      eq: { S: 1, M: 5, L: 30 }, human: { S: 0.25, M: 1, L: 7 }, currency: 'USD', company: 'Larkspur Outfitters', dayRate: 282, seatUsdMonth: 40, fx: 1, months: 3, realAvgMins: 21,
    },
    items: [
      { ...agent, t: 'Black Friday appliance sale page', line: 0, kind: 'feat', size: 'M', ship: '2026-10-19', cyc: 0.012, mins: 17, credits: 34.2, agent_s: 504, signer: 'R&D lead', real: 'r1013f04d', tests: '37/37', members: 8,
        issue: 'LK-4127', reporter: 'Operations', created: '2026-10-19', pr: 5123, defects: [],
        decisions: [['Approved Requirements', 'Added rule: at most 2 units per person per model'], ['Sent back Release', 'Price-adjustment refund $68,000, above $42,000 needs CFO approval'], ['Approved Release', 'Price-adjustment refund reserved at $39,000']],
        caught: { person: 1, review: 0, checks: 2 }, risks: [{ what: 'Price-adjustment refund above the $42,000 approval limit', amount: 29000, gate: 'Release', role: 'compliance', at: 731 }] },
      { ...agent, t: 'Product spec comparison (refrigerators)', line: 0, kind: 'feat', size: 'M', ship: '2026-10-19', cyc: 2.5, issue: 'LK-2790', reporter: 'Merchandising', created: '2026-10-17', pr: 2990, defects: ['LK-2801'] },
      { ...agent, t: 'Delivery, with a comma', line: 0, kind: 'feat', size: 'M', ship: '2026-10-18', cyc: 0.02, mins: 25, credits: 21.8, agent_s: 1260, signer: 'Noah Fischer', real: 'r1020live', tests: '20/20', members: 5, decisions: [['Approved Scope', 'No further comment']] },
      { ...agent, t: 'Stock alert threshold setting (East warehouse)', line: 4, kind: 'fix', size: 'S', ship: '2026-10-18', cyc: 0.8 },
      { ...agent, t: 'Supplier reconciliation platform', line: 3, kind: 'app', size: 'L', ship: '2026-10-01', cyc: 7 },
      { ...base, t: 'Coupon stacking rules (air conditioners)', line: 0, kind: 'feat', size: 'M', ship: '2026-06-01', cyc: 10 },
      { ...base, t: 'Final price calculation (TVs)', line: 0, kind: 'feat', size: 'M', ship: '2026-06-02', cyc: 10 },
      { ...base, t: 'Store stock sync service', line: 3, kind: 'app', size: 'L', ship: '2026-06-10', cyc: 30 },
      { ...base, t: 'Address book department ordering (Administration)', line: 4, kind: 'fix', size: 'S', ship: '2026-06-12', cyc: 2 },
    ],
    wip: [
      { t: 'Black Friday store sale', line: 0, kind: 'feat', size: 'M', state: 'wait', col: 'Operation', gate: 'Release gate', role: 'compliance', who: 'Owner', hours: 0.2, focus: 'The independent review has a verdict; waiting for the owner to decide', live: true, real: 'r1020gate', issue: 'LK-4130', reporter: 'Operations' },
      { t: 'Member phone number masking digits fix', line: 2, kind: 'fix', size: 'S', state: 'wait', col: 'Ideation', gate: 'Scope gate', who: 'Hannah Reed', hours: 2.1, focus: '3 questions waiting for an answer' },
      { t: 'Stock sync delay (South warehouse)', line: 3, kind: 'fix', size: 'S', state: 'agent', col: 'Construction', members: 4, mins: 12 },
      { t: 'Overtime request approval (Legal)', line: 4, kind: 'feat', size: 'M', state: 'pool', col: 'Backlog', mins: 4 },
    ],
  }
}

/** The value stream of the Black Friday measured delivery (r1013f04d), as GET /cto/flow answers it (rounded). */
export function ctoFlow(): CtoFlow {
  const seg = (from: number, to: number, who: 'agent' | 'person', col: string, phase: string, label: string, roles: string[], gate: string | null = null, decision: 'Approved' | 'Sent back' | null = null) =>
    ({ from, to, who, col, phase, label, roles, gate, decision })
  return {
    run: 'r1013f04d', status: 'done', started_at: 1791840066, end: 1022,
    segments: [

      seg(0, 52, 'agent', 'Inception', 'inception', 'Inception', ['product']),
      seg(52, 259, 'person', 'Inception', 'inception', 'Awaiting approval · Requirements gate', ['product'], 'product', 'Approved'),
      seg(260, 536, 'agent', 'Construction', 'construction', 'Construction', ['backend1', 'tester']),
      seg(536, 731, 'person', 'Operation', 'construction', 'Awaiting approval · Release gate', ['compliance'], 'compliance', 'Sent back'),
      seg(731, 837, 'agent', 'Construction', 'construction', 'Rework', ['backend1', 'compliance']),
      seg(837, 951, 'person', 'Operation', 'construction', 'Awaiting approval · Release gate', ['compliance'], 'compliance', 'Approved'),
      seg(952, 1022, 'agent', 'Operation', 'operation', 'Operation', ['deploy']),
    ],
    marks: [

      { at: 52, kind: 'gate', role: 'product', label: 'Requirements gate: awaiting approval' }, { at: 259, kind: 'approved', role: 'product', label: 'Approved Requirements' },
      { at: 536, kind: 'gate', role: 'compliance', label: 'Release gate: awaiting approval' }, { at: 731, kind: 'bounce', role: 'compliance', label: 'Sent back Release' },
      { at: 1019, kind: 'deployed', role: 'deploy', label: 'Deployed locally' }, { at: 1022, kind: 'signoff', role: null, label: 'R&D lead signed off' },
    ],
    decisions: [

      { at: 259, role: 'product', gate: 'Approved Requirements', note: 'Added rule: at most 2 units per person per model' },
      { at: 731, role: 'compliance', gate: 'Sent back Release', note: 'Price-adjustment refund $68,000, above $42,000 needs CFO approval' },
      { at: 951, role: 'compliance', gate: 'Approved Release', note: 'Price-adjustment refund reserved at $39,000' },
    ],
    agent_s: 504, person_s: 516, gates: 3, credits: 34.2, members: 8, tests: { passed: 37, total: 37, enterprise: 28 },
    sent_back: { person: 1, review: 0, checks: 0 }, risks: [{ what: 'Price-adjustment refund above the $42,000 approval limit', amount: 29000, gate: 'Release', role: 'compliance', at: 731 }], rework: 1, review: 'Review says ready to deliver', deployed: true,
    issue: { id: 'LK-4127', kind: 'Requirement', reporter: 'Operations', created_at: 1791840066 },
    pr: { number: 5123, head: 'team/r1013f04d/run', base: 'main', state: 'signed', opened_at: 1791841088, merged_at: 1791841088, merged_by: 'R&D lead', sha: '', files: 17, added: 1523, removed: 40, checks: '37/37', review: 'Review says ready to deliver' },
    titles: { product: 'Product manager', backend1: 'Backend development #1', tester: 'Test engineer', compliance: 'Compliance review', deploy: 'Deploy engineer' },
    team: [
      { key: 'product', title: 'Product manager', icon: 'pm', skipped: false, credits: 2.3 }, { key: 'backend1', title: 'Backend development #1', icon: 'backend', skipped: false, credits: 9.1 },
      { key: 'tester', title: 'Test engineer', icon: 'tester', skipped: false, credits: 4.2 }, { key: 'compliance', title: 'Compliance review', icon: 'compliance', skipped: false, credits: 6.0 },
      { key: 'deploy', title: 'Deploy engineer', icon: 'deploy', skipped: false, credits: 3.1 }, { key: 'mobile', title: 'Android development', icon: 'mobile', skipped: true, credits: 0 },
    ],
  }
}
