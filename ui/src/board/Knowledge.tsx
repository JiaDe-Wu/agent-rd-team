/**
 * Knowledge base and company standards: the left shift on the board. Which company standards (and which knowledge-base data) the
 * requirement touched, matched by keywords like team selection (deterministic, with why); the team's Kiro Crew knowledge source
 * and its state; and what the roles looked up there, live: their knowledge-base lookups and their reads of the data files.
 */
import type { Lane, RunDetail, Standard } from '../types'
import { fmtAgo } from './format'
import { useServerNow } from './hooks'
import { RoleIcon } from './RoleIcon'

function sourceText(run: RunDetail): string {
  const s = run.knowledge.source
  if (!s) return ''
  if (s.present === null) return 'Reading…'
  if (!s.present) return `Not attached yet: add ${s.path || 'knowledge/larkspur'} in the Crew sidebar under Knowledge base > Sources`
  const sync = s.status === 'synced' ? 'Synced' : s.files_total ? `Indexing ${s.files_done ?? 0}/${s.files_total}` : s.status || 'Indexing'
  return `${s.items ?? 0} document${s.items === 1 ? '' : 's'} · ${sync}`
}

function Chip({ s }: { s: Standard }) {
  const rules = s.rules.length ? `${s.rules[0]}${s.rules.length > 1 ? `–${s.rules[s.rules.length - 1].split('-')[1]}` : ''}` : ''
  return (
    <li className={`kt-kb-chip is-${s.kind}`} title={`${s.owner ? `Set by ${s.owner}` : ''}${s.doc ? ` · ${s.doc} in the knowledge base` : ''}; ${s.why}`}>
      <b>{s.kind === 'data' ? 'Data' : 'Standard'}: {s.title}</b>
      {rules && <span className="kt-mono">{rules}</span>}
    </li>
  )
}

export function KnowledgePanel({ run, onRole }: { run: RunDetail; onRole?: (key: string) => void }) {
  const now = useServerNow()
  const src = run.knowledge.source
  if (!src && run.standards.length === 0) return null
  const byKey = new Map<string, Lane>(run.roles.map((l) => [l.key, l]))
  const hits = [...run.knowledge.hits].reverse()
  const searches = run.knowledge.hits.filter((h) => h.kind === 'search').length
  const reads = run.knowledge.hits.length - searches
  return (
    <section className="kt-kb" aria-label="Knowledge base and company standards" data-testid="kt-kb">
      <div className="kt-kb-col">
        <p className="kt-kb-head">
          <b><RoleIcon role="book" size={16} /> Knowledge base{src ? ` "${src.name}"` : ''}</b>
          <span className={`kt-dim${src && src.present === false ? ' kt-warn' : ''}`}>{sourceText(run)}</span>
        </p>
        <ul className="kt-kb-chips" aria-label="Applicable company standards and data">
          {run.standards.map((s) => (
            <Chip key={s.id} s={s} />
          ))}
        </ul>
      </div>
      <div className="kt-kb-col is-hits">
        <p className="kt-kb-head">
          <b>What the agents looked up</b>
          <span className="kt-dim">
            {searches} knowledge-base search{searches === 1 ? '' : 'es'} · {reads} data read{reads === 1 ? '' : 's'}
          </span>
        </p>
        {hits.length === 0 ? (
          <p className="kt-dim kt-kb-empty">No lookups yet</p>
        ) : (
          <ol className="kt-kb-hits">
            {hits.slice(0, 8).map((h, i) => {
              const lane = byKey.get(h.role)
              return (
                <li key={`${h.at}-${i}`} className={`is-${h.kind}`}>
                  <button type="button" className="kt-kb-who" onClick={() => onRole?.(h.role)}>
                    <RoleIcon role={lane?.icon || h.role} size={13} /> {lane?.title ?? h.role}
                  </button>
                  <span className="kt-kb-what">{h.kind === 'search' ? `Searched the knowledge base for "${h.text}"` : `Read data ${h.text}`}</span>
                  <small className="kt-dim">{fmtAgo(now - h.at)}</small>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
