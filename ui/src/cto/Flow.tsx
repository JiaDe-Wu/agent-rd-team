/**
 * Requirement flow: the kanban of what is in progress now, one card an Issue. Columns are the AI-DLC phases (Backlog → Ideation → Inception →
 * Construction → Operation → Delivered), lanes are Awaiting approval (a person's gate, the board's word and magenta for it) and Agent working; at most
 * two cards a cell. Every card opens its Delivery detail. A column's heading opens that phase on the Team board (the run going there,
 * else the newest measured delivery, its replay paused where the phase began); a lane's heading opens a gate or the agents at work.
 */
import { deliveryLabel } from '../board/format'
import { RoleIcon } from '../board/RoleIcon'
import { zh } from './vocab'
import type { BoardEntry, ItemEntry } from '../nav'
import { itemOf } from '../nav'
import { daysBefore, fmt, inLine, md, mean, waited } from './metrics'
import type { CtoData, CtoItem, CtoWip } from './types'

// protocol token: kept in Chinese (column names the backend sends; shown through zh())
const COLS: [string, string][] = [['需求池', 'Submitted, waiting for a team'], ['构思', 'Intent · Constraints · Scope'], ['启动', 'Requirements · Design · Work split'], ['构建', 'Code · Tests · Independent review'], ['运维', 'Deploy · Release · Sign-off'], ['已交付', 'Last 7 days · click for the delivery detail']]
// protocol token: kept in Chinese (the column names the backend sends; shown through zh())
const STAGES = ['构思', '启动', '构建', '运维'] as const
/** a kanban column's AI-DLC phase on the board */
// protocol token: kept in Chinese
export const COL_PHASE: Record<string, string> = { 构思: 'ideation', 启动: 'inception', 构建: 'construction', 运维: 'operation' }

/** a gate's icon on its card: the board's icon of the role that stops there */
// protocol token: kept in Chinese (gate names the backend sends)
const GATE_ICON: Record<string, string> = { 范围关卡: 'scope', 需求关卡: 'pm', 方案关卡: 'architect', 上线关卡: 'compliance', 安全关卡: 'security', 签字放行: 'sign' }

export type FlowHandlers = {
  onOpen: (e: BoardEntry) => void
  onItem: (e: ItemEntry) => void
  /** Awaiting approval with no run of this app waiting: a measured delivery's first gate, at its moment */
  onGateOf: (run: string) => void
  onLedger: () => void
}

function Card({ w, lines, hl, h }: { w: CtoWip; lines: string[]; hl: string | null; h: FlowHandlers }) {
  const key = w.real ?? w.issue ?? ''
  const go: BoardEntry | null = w.live && w.real ? (w.state === 'wait' && w.role ? { run: w.real, gate: w.role } : { run: w.real }) : null
  const open = () => (w.real || w.issue) && h.onItem(itemOf(w))
  return (
    <div className={`cto-kcard cto-pick${go ? ` is-live is-${w.state}` : ''}${hl === key ? ' is-hl' : ''}`} data-key={key} data-testid={go ? 'cto-live-card' : undefined}
      role="button" tabIndex={0} title="Delivery detail" onClick={open} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}>
      <div className="cto-ktop">
        {w.state === 'wait' ? (
          <>
            <span className="cto-gate"><RoleIcon role={w.role || GATE_ICON[w.gate ?? ''] || 'wait'} size={13} />{zh(w.gate)}</span>
            <span>Waited {waited(w.hours ?? 0)}</span>
          </>
        ) : w.state === 'agent' ? (
          <span>{w.members} member{w.members === 1 ? '' : 's'} · {w.mins} min used</span>
        ) : (
          <>
            <span>Waiting for a team</span>
            <span>Submitted {w.mins} min ago</span>
          </>
        )}
      </div>
      <div className="cto-ktitle" title={w.t}>{w.t}</div>
      {w.state === 'wait' && <div className="cto-kfocus">{w.focus}</div>}
      <div className="cto-kmeta" title={w.reporter ? `${w.issue ?? ''} · raised by ${deliveryLabel(w.reporter)}` : undefined}>
        {deliveryLabel(lines[w.line])}{w.issue ? ` · ${w.issue}` : ''}{w.pr ? ` · PR #${w.pr} waiting to merge` : ''}{w.state === 'wait' ? ` · waiting for ${w.who}` : ''}
      </div>
      {go && (
        <button type="button" className="kt-btn is-small is-primary" onClick={(e) => { e.stopPropagation(); h.onOpen(go) }}>
          {w.state === 'wait' ? 'Go to approve ↗' : 'Open ↗'}
        </button>
      )}
    </div>
  )
}

function Cell({ list, lines, hl, h, wait, empty }: { list: CtoWip[]; lines: string[]; hl: string | null; h: FlowHandlers; wait?: boolean; empty?: string }) {
  return (
    <div className={`cto-cell${wait ? ' is-wait' : ''}`}>
      {list.length === 0 && empty && <div className="cto-kempty">{empty}</div>}
      {list.slice(0, 2).map((w, i) => <Card key={`${w.t}-${i}`} w={w} lines={lines} hl={hl} h={h} />)}
      {list.length > 2 && <div className="cto-kmore">+{list.length - 2} more</div>}
    </div>
  )
}

export function Flow({ data, line, fresh, hl = null, ...h }: { data: CtoData; line: number; fresh: ReadonlySet<string>; hl?: string | null } & FlowHandlers) {
  const M = data.meta
  const W = data.wip.filter(inLine(line))
  const waits = W.filter((w) => w.state === 'wait'), agents = W.filter((w) => w.state === 'agent'), pool = W.filter((w) => w.state === 'pool')
  const live = (a: CtoWip, b: CtoWip) => (b.live ? 1 : 0) - (a.live ? 1 : 0)
  const d7 = daysBefore(M.today, 6)
  const done = data.items.filter((i) => i.period === 'agent' && i.ship >= d7 && inLine(line)(i))
  const pin = (i: CtoItem) => (i.real && fresh.has(i.real) ? 0 : i.real ? 1 : 2)
  const shown = [...done].sort((a, b) => pin(a) - pin(b) || (a.ship < b.ship ? 1 : -1)).slice(0, 4)
  // protocol token: kept in Chinese: the column names are compared with the backend's
  const count = (col: string) => (col === '需求池' ? pool.length : col === '已交付' ? done.length : W.filter((w) => w.col === col && w.state !== 'pool').length)
  const latest = data.items.find((i) => i.real && inLine(line)(i)) ?? data.items.find((i) => i.real)
  // a column's heading: that phase on the board, in the run of this app that is there now, else the newest measured delivery
  const openCol = (col: string) => {
    if (col === '需求池') return h.onOpen({ new: 'promo' })
    if (col === '已交付') return h.onLedger()
    const here = W.find((w) => w.live && w.real && w.col === col)
    const run = here?.real ?? latest?.real
    if (run) h.onOpen({ run, phase: COL_PHASE[col], ...(here ? {} : { pick: 'latest' as const }) })
  }
  const openWaits = () => {
    const here = [...waits].filter((w) => w.live && w.real && w.role).sort((a, b) => (b.hours ?? 0) - (a.hours ?? 0))[0]
    if (here) h.onOpen({ run: here.real as string, gate: here.role })
    else if (latest?.real) h.onGateOf(latest.real)
  }
  const openAgents = () => {
    const here = agents.find((w) => w.live && w.real)
    if (here) h.onOpen({ run: here.real as string })
    else if (latest?.real) h.onOpen({ run: latest.real, replay: 30, pick: 'latest' })
  }
  const colTitle = (col: string) =>
    col === '需求池' ? 'Raise a new requirement on the team board' : col === '已交付' ? 'See the delivery list below' : `See the "${zh(col)}" step on the team board (${W.some((w) => w.live && w.col === col) ? 'the run that is here now' : 'the latest measured delivery'})`
  return (
    <section className="cto-card cto-flow" aria-label="Requirement flow" data-anchor="flow">
      <div className="cto-flow-head">
        <span className="cto-live" aria-hidden="true" />
        <h3>Requirement flow</h3>
        <span className="cto-dim">Now · from Kiro Crew · refreshes every 5 s · click a card for the delivery detail, click a column name for that step on the team board</span>
        <span className="cto-grow" />
        <button type="button" className="kt-btn is-small cto-noprint cto-noproj" onClick={() => h.onOpen({ new: 'promo' })} title="Submit a new requirement on the team board (Singles Day · appliance sale is filled in)">New requirement ↗</button>
      </div>
      <div className="cto-stats" data-testid="cto-flow-stats">
        In progress {fmt(waits.length + agents.length)}<span>·</span>Agent working {fmt(agents.length)}<span>·</span>Awaiting approval {fmt(waits.length)}<span>·</span>Backlog {fmt(pool.length)}
      </div>
      <div className="cto-dim">
        Items awaiting approval have waited {waited(mean(waits.map((w) => w.hours ?? 0)))} on average; an agent run takes {M.realAvgMins} min on average (measured).
      </div>
      <div className="cto-kanban" role="table" aria-label="Requirement flow board">
        <div />
        {COLS.map(([name, sub]) => (
          <div className="cto-kb-h" key={name}>
            <button type="button" onClick={() => openCol(name)} title={colTitle(name)}>
              <div><b>{zh(name)}{name !== '已交付' ? ' ↗' : ''}</b><span className="cto-n">{fmt(count(name))}</span></div>
              <div className="cto-st">{sub}</div>
            </button>
          </div>
        ))}
        <div className="cto-lane is-wait"><button type="button" onClick={openWaits} title="Go to the gates awaiting approval on the team board"><RoleIcon role="wait" size={15} />Awaiting approval ↗</button></div>
        <div className="cto-cell is-span">
          {[...pool].sort((a, b) => (a.mins ?? 0) - (b.mins ?? 0)).slice(0, 2).map((w, i) => <Card key={i} w={w} lines={M.lines} hl={hl} h={h} />)}
          {pool.length > 2 && <div className="cto-kmore">+{pool.length - 2} more</div>}
        </div>
        {STAGES.map((col) => (
          <Cell key={`w-${col}`} wait lines={M.lines} hl={hl} h={h} list={waits.filter((w) => w.col === col).sort((a, b) => live(a, b) || (b.hours ?? 0) - (a.hours ?? 0))}
            empty={col === '构建' ? 'No human gate in this phase: failed checks are sent back to the agent automatically' : 'None right now'} />
        ))}
        <div className="cto-cell is-span">
          {shown.map((i) => {
            const key = i.real ?? i.issue ?? i.t
            return (
              <button type="button" key={`${key}-${i.ship}`} data-key={key} className={`cto-kcard${i.real ? ' is-real' : ''}${i.real && fresh.has(i.real) ? ' is-new' : ''}${hl === key ? ' is-hl' : ''}`}
                title="Delivery detail" onClick={() => h.onItem(itemOf(i))}>
                <span className="cto-ktop">
                  <span>{i.real && fresh.has(i.real) ? 'just now' : md(i.ship)}</span>
                  {i.real ? <span className="cto-tag is-real">Measured</span> : <span>Simulated</span>}
                </span>
                <span className="cto-ktitle">{i.t}</span>
                <span className="cto-kmeta">{deliveryLabel(M.lines[i.line])} · {i.mins != null ? `${i.mins} min` : `${Math.round(i.cyc * 10) / 10} days`}</span>
              </button>
            )
          })}
          {done.length > shown.length && <button type="button" className="cto-kmore cto-link" onClick={h.onLedger}>+{fmt(done.length - shown.length)} more (see the delivery list below)</button>}
        </div>
        <div className="cto-lane"><button type="button" onClick={openAgents} title="See what the agents are doing on the team board">Agent working ↗</button></div>
        {STAGES.map((col) => (
          <Cell key={`a-${col}`} lines={M.lines} hl={hl} h={h} list={agents.filter((w) => w.col === col).sort((a, b) => live(a, b) || (b.mins ?? 0) - (a.mins ?? 0))} />
        ))}
      </div>
    </section>
  )
}
