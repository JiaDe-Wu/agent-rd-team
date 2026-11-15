/** A small CTO view answer for tests: four deliveries before AI-DLC, five with it (two measured runs), four cards. */
import type { CtoData, CtoFlow } from './types'

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  const t = new Date(y, m - 1, d + n)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export function ctoData(): CtoData {
  const base = { signer: '', real: null, period: 'base' as const }
  const agent = { signer: 'Zhang Min', real: null, period: 'agent' as const }
  return {
    meta: {
      today: '2026-10-20', agentStart: '2026-07-29', weeks: Array.from({ length: 24 }, (_, i) => addDays('2026-05-06', 7 * i)),
      lines: ['电商', '移动应用', '客户关系管理', '供应链', '内部系统'], peoplePerLine: 12, // protocol token: kept in Chinese (business line names, shown through deliveryLabel)
      eq: { S: 1, M: 5, L: 30 }, human: { S: 0.25, M: 1, L: 7 }, dayRate: 2000, seatUsdMonth: 40, fx: 7.1, months: 3, realAvgMins: 21,
    },
    items: [
      { ...agent, t: 'Singles Day appliance sale campaign page', line: 0, kind: 'feat', size: 'M', ship: '2026-10-19', cyc: 0.012, mins: 17, signer: 'R&D lead', real: 'r1013f04d', tests: '37/37', members: 8,
        issue: 'TY-4127', reporter: 'Operations dept', created: '2026-10-19', pr: 5123, defects: [],
        decisions: [['批准需求', 'Added rule: at most 2 units per person per model'], ['退回上线', 'Price-protection refund 486,000 yuan, above 300,000 needs CFO approval'], ['批准上线', 'Price-protection refund reserved at 280,000 yuan']],
        caught: { person: 1, review: 0, checks: 2 }, risks: [{ what: 'Price-protection refund above the 300,000 approval limit', amount: 206000, gate: '上线', role: 'compliance', at: 731 }] },
      { ...agent, t: 'Product spec comparison (refrigerators)', line: 0, kind: 'feat', size: 'M', ship: '2026-10-19', cyc: 2.5, issue: 'TY-2790', reporter: 'Merchandising dept', created: '2026-10-17', pr: 2990, defects: ['TY-2801'] },
      { ...agent, t: 'Delivery, with a comma', line: 0, kind: 'feat', size: 'M', ship: '2026-10-18', cyc: 0.02, mins: 25, signer: 'Wu Hao', real: 'r1020live', tests: '20/20', members: 5, decisions: [['批准范围', '无补充意见']] },
      { ...agent, t: 'Stock alert threshold setting (East China warehouse)', line: 4, kind: 'fix', size: 'S', ship: '2026-10-18', cyc: 0.8 },
      { ...agent, t: 'Supplier reconciliation platform', line: 3, kind: 'app', size: 'L', ship: '2026-10-01', cyc: 7 },
      { ...base, t: 'Coupon stacking rules (air conditioners)', line: 0, kind: 'feat', size: 'M', ship: '2026-06-01', cyc: 10 },
      { ...base, t: 'Final price calculation (TVs)', line: 0, kind: 'feat', size: 'M', ship: '2026-06-02', cyc: 10 },
      { ...base, t: 'Store stock sync service', line: 3, kind: 'app', size: 'L', ship: '2026-06-10', cyc: 30 },
      { ...base, t: 'Address book department ordering (Administration)', line: 4, kind: 'fix', size: 'S', ship: '2026-06-12', cyc: 2 },
    ],
    wip: [
      { t: 'Singles Day official store sale', line: 0, kind: 'feat', size: 'M', state: 'wait', col: '运维', gate: '上线关卡', role: 'compliance', who: 'Owner', hours: 0.2, focus: 'The independent review has a verdict; waiting for the owner to decide', live: true, real: 'r1020gate', issue: 'TY-4130', reporter: 'Operations dept' },
      { t: 'Member phone number masking digits fix', line: 2, kind: 'fix', size: 'S', state: 'wait', col: '构思', gate: '范围关卡', who: 'Wang Lei', hours: 2.1, focus: '3 questions waiting for an answer' },
      { t: 'Stock sync delay (South China warehouse)', line: 3, kind: 'fix', size: 'S', state: 'agent', col: '构建', members: 4, mins: 12 },
      { t: 'Overtime request approval (Legal dept)', line: 4, kind: 'feat', size: 'M', state: 'pool', col: '需求池', mins: 4 },
    ],
  }
}

/** The value stream of the Singles Day measured delivery (r1013f04d), as GET /cto/flow answers it (rounded). */
export function ctoFlow(): CtoFlow {
  const seg = (from: number, to: number, who: 'agent' | 'person', col: string, phase: string, label: string, roles: string[], gate: string | null = null, decision: '批准' | '退回' | null = null) =>
    ({ from, to, who, col, phase, label, roles, gate, decision })
  return {
    run: 'r1013f04d', status: 'done', started_at: 1791840066, end: 1022,
    segments: [
      // protocol token: kept in Chinese (the CTO page's vocabulary: columns, labels, decisions; shown through zh())
      seg(0, 52, 'agent', '启动', 'inception', '启动', ['product']),
      seg(52, 259, 'person', '启动', 'inception', '等人批准 · 需求关卡', ['product'], 'product', '批准'),
      seg(260, 536, 'agent', '构建', 'construction', '构建', ['backend1', 'tester']),
      seg(536, 731, 'person', '运维', 'construction', '等人批准 · 上线关卡', ['compliance'], 'compliance', '退回'),
      seg(731, 837, 'agent', '构建', 'construction', '返工', ['backend1', 'compliance']),
      seg(837, 951, 'person', '运维', 'construction', '等人批准 · 上线关卡', ['compliance'], 'compliance', '批准'),
      seg(952, 1022, 'agent', '运维', 'operation', '运维', ['deploy']),
    ],
    marks: [
      // protocol token: kept in Chinese (mark labels; shown through zh())
      { at: 52, kind: 'gate', role: 'product', label: '需求关卡：等人批准' }, { at: 259, kind: 'approved', role: 'product', label: '批准需求' },
      { at: 536, kind: 'gate', role: 'compliance', label: '上线关卡：等人批准' }, { at: 731, kind: 'bounce', role: 'compliance', label: '退回上线' },
      { at: 1019, kind: 'deployed', role: 'deploy', label: '部署到本机' }, { at: 1022, kind: 'signoff', role: null, label: 'R&D lead 签字放行' },
    ],
    decisions: [
      // protocol token: kept in Chinese (gate decisions; shown through zh())
      { at: 259, role: 'product', gate: '批准需求', note: 'Added rule: at most 2 units per person per model' },
      { at: 731, role: 'compliance', gate: '退回上线', note: 'Price-protection refund 486,000 yuan, above 300,000 needs CFO approval' },
      { at: 951, role: 'compliance', gate: '批准上线', note: 'Price-protection refund reserved at 280,000 yuan' },
    ],
    agent_s: 504, person_s: 516, gates: 3, credits: 34.2, members: 8, tests: { passed: 37, total: 37, enterprise: 28 },
    sent_back: { person: 1, review: 0, checks: 0 }, risks: [{ what: 'Price-protection refund above the 300,000 approval limit', amount: 206000, gate: '上线', role: 'compliance', at: 731 }], rework: 1, review: 'Review says 可以交付', deployed: true, // protocol token: kept in Chinese
    issue: { id: 'TY-4127', kind: '需求', reporter: 'Operations dept', created_at: 1791840066 },
    pr: { number: 5123, head: 'team/r1013f04d/run', base: 'main', state: 'signed', opened_at: 1791841088, merged_at: 1791841088, merged_by: 'R&D lead', sha: '', files: 17, added: 1523, removed: 40, checks: '37/37', review: 'Review says 可以交付' }, // protocol token: kept in Chinese
    titles: { product: 'Product manager', backend1: 'Backend development #1', tester: 'Test engineer', compliance: 'Compliance review', deploy: 'Deploy engineer' },
    team: [
      { key: 'product', title: 'Product manager', icon: 'pm', skipped: false, credits: 2.3 }, { key: 'backend1', title: 'Backend development #1', icon: 'backend', skipped: false, credits: 9.1 },
      { key: 'tester', title: 'Test engineer', icon: 'tester', skipped: false, credits: 4.2 }, { key: 'compliance', title: 'Compliance review', icon: 'compliance', skipped: false, credits: 6.0 },
      { key: 'deploy', title: 'Deploy engineer', icon: 'deploy', skipped: false, credits: 3.1 }, { key: 'mobile', title: 'Android development', icon: 'mobile', skipped: true, credits: 0 },
    ],
  }
}
