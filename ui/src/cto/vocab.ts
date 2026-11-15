/**
 * Display names for the Chinese vocabulary the backend uses on the CTO page (kinds, kanban columns, segment labels,
 * decisions, mark labels). The values themselves are protocol tokens and stay in Chinese in the data; this only
 * decides what a person reads. Anything it does not know is shown as it is.
 */
// protocol token: kept in Chinese (the keys are what the backend sends)
const WORDS: Record<string, string> = {
  需求池: 'Backlog', 已交付: 'Delivered', 构思: 'Ideation', 启动: 'Inception', 构建: 'Construction', 运维: 'Operation',
  返工: 'Rework', 建仓库: 'Set up repository', 签字放行: 'Sign-off', 部署到本机: 'Deployed locally',
  批准: 'Approved', 退回: 'Sent back', 签字: 'Signed',
  无补充意见: 'No further comment', 按审查意见再改一轮: 'One more round as the review said',
  范围: 'Scope', 需求: 'Requirements', 方案: 'Plan', 上线: 'Release', 安全: 'Security', 沉淀: 'Lessons',
}

const gate = (g: string) => WORDS[g] ?? g

const PATTERNS: [RegExp, (m: RegExpExecArray) => string][] = [
  [/^等人批准 · (.+)关卡$/, (m) => `Awaiting approval · ${gate(m[1])} gate`],
  [/^(.+)关卡：等人批准$/, (m) => `${gate(m[1])} gate: awaiting approval`],
  [/^(.+)关卡$/, (m) => `${gate(m[1])} gate`],
  [/^批准(.+)$/, (m) => `Approved ${gate(m[1])}`],
  [/^退回(.+)$/, (m) => `Sent back ${gate(m[1])}`],
  [/^检查不过，退回(.+)$/, (m) => `Checks failed, sent back ${m[1]}`],
  [/^(.+)要改，退回(.+)$/, (m) => `${m[1]} asked for changes, sent back ${m[2]}`],
  [/^(.*) 签字放行$/, (m) => `${m[1]} signed off`.trim()],
  [/^PR #(\d+) 合入 main$/, (m) => `PR #${m[1]} merged into main`],
]

/** What a person reads for a backend label: exact words first, then the sentence patterns, else the text itself. */
export function zh(text: string | null | undefined): string {
  if (!text) return ''
  if (WORDS[text]) return WORDS[text]
  for (const [re, f] of PATTERNS) {
    const m = re.exec(text)
    if (m) return f(m)
  }
  return text
}
export const segLabel = zh
export const decisionLabel = zh
