/**
 * The team graph (the hero): the roles as nodes in stage columns (layout.ts), the dependency edges,
 * the run branch as a rail along the bottom with a dot per merge, and the test station at the rail's
 * end. React draws the static layer; the particle layer on top (overlay.ts, aria-hidden) is the only
 * thing that travels, one particle per real event the differ found.
 *
 * State is colour + shape + words, never colour alone: working roles glow and their avatar ring
 * spins; queued is a marching dashed outline; stalled is hatched; awaiting approval blinks magenta;
 * failed is solid red with ✕; done is a green outline (waiting to merge); merged is solid green with ✔.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MutableRefObject } from 'react'
import type { GateDecision, Lane, RunDetail } from '../types'
import { Engine, type Item } from './engine'
import { LIVE, PHASES, WORKING, clip, expertName, fmtClock, isFinal, laneMeta, waitingText } from './format'
import { useLatest, useServerNow, useSinceSnapshot } from './hooks'
import { NODE_H, NODE_W, ORCH_BOX, ROSTER, anchorBox, commandPath, headX, particlePath, pathD, rosterGroups, type GraphLayout, type NodeBox } from './layout'
import { Overlay } from './overlay'
import { RoleGlyph } from './RoleIcon'
import { NodeCard } from './NodeCard'

export type FlashMap = Record<string, { n: number; tone: string }>

export interface TeamGraphProps {
  run: RunDetail
  lay: GraphLayout
  focus: string | null
  onRole: (key: string) => void
  flashes: FlashMap
  reducedMotion: boolean
  /** The page hands each poll's new items to the engine through this. */
  feed: MutableRefObject<((items: Item[]) => void) | null>
  /** Retry on a failed node. */
  onRetry?: (key: string) => void
  /** A person's answer at a gate (Approve / Send back); absent: the gate is shown, not answered here (projection). */
  onGate?: (key: string, decision: GateDecision) => void
  /** Projection: no live tool tickers under the nodes (a room follows the flow, not the commands). */
  quiet?: boolean
  /** View outputs from a node's hover card. */
  onOutputs?: (role: string) => void
  /** an AI-DLC phase picked out (its band lit, the other roles dimmed); its band's title picks it */
  phase?: string | null
  onPhase?: (phase: string) => void
}

const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩'
const PULSE_MS = 2400

/** A negative delay that puts every pulse on one shared beat (simultaneous work glows together). */
const beat = () => `-${Math.round(performance.now() % PULSE_MS)}ms`

/**
 * The beat's delay for an element, taken once when it mounts: changing animation-delay later would
 * shift a running animation's phase (every poll re-renders the nodes), and the pulses would drift.
 */
function useBeat(reducedMotion: boolean) {
  const [delay] = useState(beat)
  return reducedMotion ? undefined : { animationDelay: delay }
}

function Halo({ w, h, reducedMotion }: { w: number; h: number; reducedMotion: boolean }) {
  const style = useBeat(reducedMotion)
  return <rect className="kt-node-halo" x={-w / 2 - 8} y={-h / 2 - 8} width={w + 16} height={h + 16} rx={23} style={style} />
}

function ParallelDot({ reducedMotion }: { reducedMotion: boolean }) {
  const style = useBeat(reducedMotion)
  return <circle className="kt-par-dot" cx={-38} cy={0} r={4} style={style} />
}

/** The phase a role is drawn in: AI-DLC has no review phase of its own (a review role sits at the end of Construction). */
export const phaseOfLane = (p?: string | null) => (p === 'review' ? 'construction' : p || '')

export function TeamGraph({ run, lay, focus, onRole, flashes, reducedMotion, feed, onRetry, onGate, quiet = false, onOutputs, phase = null, onPhase }: TeamGraphProps) {
  // the hover card: shown after the pointer rests on a node, kept while it moves into the card
  const [card, setCard] = useState<string | null>(null)
  const cardTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hover = useCallback((key: string | null, delay: number) => {
    if (cardTimer.current) clearTimeout(cardTimer.current)
    cardTimer.current = setTimeout(() => setCard(key), delay)
  }, [])
  useEffect(() => () => void (cardTimer.current && clearTimeout(cardTimer.current)), [])
  const engine = useMemo(() => new Engine({ now: () => performance.now(), reducedMotion }), [reducedMotion])
  const overlay = useRef<Overlay | null>(null)
  const head = headX(lay, run.merges)
  const layRef = useLatest(lay)
  const headRef = useLatest(head)
  const byKey = useMemo(() => new Map(run.roles.map((l) => [l.key, l])), [run.roles])

  const particlesRef = useCallback(
    (el: SVGGElement | null) => {
      overlay.current?.dispose()
      overlay.current =
        el && !reducedMotion
          ? new Overlay(el, engine, {
              path: (a, b) => particlePath(layRef.current, a, b, headRef.current),
              box: (a) => anchorBox(layRef.current, a, headRef.current),
              now: () => performance.now(),
            })
          : null
    },
    [engine, reducedMotion, layRef, headRef],
  )

  useEffect(() => {
    feed.current = (items) => {
      engine.ingest(items, performance.now())
      overlay.current?.wake()
    }
    return () => {
      feed.current = null
    }
  }, [engine, feed])

  // nothing plays while the page is hidden; what was due meanwhile is dropped, not played late
  useEffect(() => {
    const apply = () => {
      engine.setHidden(document.hidden, performance.now())
      if (!document.hidden) overlay.current?.wake()
    }
    document.addEventListener('visibilitychange', apply)
    return () => document.removeEventListener('visibilitychange', apply)
  }, [engine])

  useEffect(() => () => overlay.current?.dispose(), [])

  const working = run.roles.filter((l) => WORKING.has(l.status)).length
  const merged = run.roles.filter((l) => l.status === 'merged').length
  const label = `Team graph: ${run.roles.length} role${run.roles.length === 1 ? '' : 's'}, ${working} running, ${merged} merged; tests ${run.tests.passed}/${run.tests.total}. Click a role to show only it.`

  return (
    <div className={`kt-graph${lay.orch ? ' is-phased' : ''}`} data-testid="kt-graph">
      <div className="kt-graph-stage">
        <svg className="kt-graph-svg" viewBox={`0 0 ${lay.width} ${lay.height}`} role="group" aria-label={label}>
          <GraphDefs />
          <rect className="kt-g-bg" x={0} y={0} width={lay.width} height={lay.height} fill="url(#kt-dots)" />
          {lay.phases.length ? <Phases run={run} lay={lay} byKey={byKey} reducedMotion={reducedMotion} phase={phase} onPhase={onPhase} /> : <Stages run={run} lay={lay} byKey={byKey} reducedMotion={reducedMotion} />}
          {lay.orch && <Commands run={run} lay={lay} />}
          {lay.orch && <Orchestrator run={run} lay={lay} flash={flashes.orch} />}
          {lay.orch && <Roster run={run} lay={lay} />}
          <g className="kt-edges" aria-hidden="true">
            {lay.edges.map((e) => {
              const a = byKey.get(e.from)
              const b = byKey.get(e.to)
              const state = a?.status === 'merged' ? (b && b.status !== 'waiting' ? 'used' : 'ready') : 'pending'
              const hot = !!focus && (e.from === focus || e.to === focus)
              return <path key={`${e.from}>${e.to}`} className={`kt-edge is-${state}${focus ? (hot ? ' is-hot' : ' is-dim') : ''}`} d={e.d} markerEnd={`url(#kt-arrow-${state})`} />
            })}
          </g>
          <Rail run={run} lay={lay} head={head} byKey={byKey} focus={focus} flash={flashes.run} />
          <Station run={run} lay={lay} flash={flashes.tests} />
          <g className="kt-nodes">
            {run.roles.map((lane) => {
              const box = lay.nodes.get(lane.key)
              if (!box) return null
              return <GraphNode key={lane.key} lane={lane} lanes={run.roles} box={box} focus={focus} off={!focus && !!phase && phaseOfLane(lane.phase) !== phase} flash={flashes[lane.key]} onRole={onRole} reducedMotion={reducedMotion} quiet={quiet} onHover={(on) => hover(on ? lane.key : null, on ? 300 : 250)} />
            })}
            {onRetry &&
              run.roles
                .filter((l) => l.status === 'failed' && lay.nodes.get(l.key))
                .map((l) => <RetryChip key={`retry-${l.key}`} lane={l} box={lay.nodes.get(l.key)!} onRetry={onRetry} />)}
            {run.roles
              .filter((l) => (l.gate === 'pending' || l.gate === 'discussing') && lay.nodes.get(l.key))
              .map((l) => <GateChips key={`gate-${l.key}`} lane={l} box={lay.nodes.get(l.key)!} onGate={onGate} />)}
          </g>
          <g className="kt-particles" aria-hidden="true" ref={particlesRef} />
        </svg>
        {card && byKey.get(card) && lay.nodes.get(card) && (() => {
          const box = lay.nodes.get(card)!
          const right = box.x > lay.width * 0.62 // near the right edge: the card opens to the node's left
          const low = box.y > lay.height * 0.55 // in the lower half: the card grows upwards, so nothing is cut off
          const style = {
            ...(low ? { bottom: `${Math.max(1, ((lay.height - (box.y + NODE_H / 2)) / lay.height) * 100)}%` } : { top: `${Math.max(1, ((box.y - NODE_H / 2) / lay.height) * 100)}%` }),
            ...(right ? { right: `${((lay.width - (box.x - NODE_W / 2 - 10)) / lay.width) * 100}%` } : { left: `${((box.x + NODE_W / 2 + 10) / lay.width) * 100}%` }),
          }
          return (
            <div key={card} ref={fitCard} className="kt-ncard" style={style} data-testid="kt-ncard" role="dialog" aria-label={`What ${byKey.get(card)!.title} did`}
                 onMouseEnter={() => hover(card, 0)} onMouseLeave={() => hover(null, 200)}>
              <NodeCard run={run} lane={byKey.get(card)!} onOutputs={onOutputs} />
            </div>
          )
        })()}
      </div>
      <Legend />
    </div>
  )
}

/** A hover card taller than the room below (or above) its node moves up (or down) until it is all inside the graph. */
function fitCard(el: HTMLDivElement | null) {
  const room = el?.parentElement?.clientHeight
  if (!el || !room) return
  const top = Math.max(4, Math.min(el.offsetTop, room - el.offsetHeight - 4))
  if (top === el.offsetTop) return
  el.style.top = `${top}px`
  el.style.bottom = 'auto'
}

function GraphDefs() {
  return (
    <defs>
      <pattern id="kt-dots" width={22} height={22} patternUnits="userSpaceOnUse">
        <circle className="kt-g-dot" cx={2} cy={2} r={1} />
      </pattern>
      <pattern id="kt-hatch" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect className="kt-hatch-line" x={0} y={0} width={3.5} height={9} />
      </pattern>
      {(['pending', 'ready', 'used'] as const).map((s) => (
        <marker key={s} id={`kt-arrow-${s}`} viewBox="0 0 10 10" refX={8.5} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
          <path className={`kt-arrow is-${s}`} d="M0,0.8 L9,5 L0,9.2 Z" />
        </marker>
      ))}
    </defs>
  )
}

function Stages({ run, lay, byKey, reducedMotion }: { run: RunDetail; lay: GraphLayout; byKey: Map<string, Lane>; reducedMotion: boolean }) {
  return (
    <g className="kt-stages" aria-hidden="true">
      {lay.stages.map((s) => {
        const lanes = s.keys.map((k) => byKey.get(k)).filter((l): l is Lane => !!l)
        const live = lanes.filter((l) => LIVE.has(l.status)).length
        const working = lanes.filter((l) => WORKING.has(l.status)).length
        const title = clip(`${CIRCLED[s.index] ?? s.index + 1} ${lanes.map((l) => l.title).join(' ‖ ')}`, 16)
        return (
          <g key={s.index} className={`kt-stage${live ? ' is-live' : ''}`} data-stage={s.index}>
            <rect className="kt-stage-band" x={s.x - NODE_W / 2 - 14} y={8} width={NODE_W + 28} height={lay.rail.y - 34} rx={18} />
            <text className="kt-stage-title" x={s.x} y={30} textAnchor="middle">
              {title}
            </text>
            {working >= 2 && (
              <g className="kt-par" transform={`translate(${s.x},${54})`}>
                <rect x={-52} y={-12} width={104} height={24} rx={12} />
                <ParallelDot reducedMotion={reducedMotion} />
                <text x={6} y={4.5} textAnchor="middle">
                  Running now {working}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </g>
  )
}

/** A band's heading: its phase, or the phases its roles' stages span (Product manager does 1.1 and 2.3: 1–2 Ideation · Inception). */
function phaseHead(p: { key: string; n: string; title: string; en: string }, lanes: Lane[]): { n: string; title: string; en: string } {
  const nums = [...new Set(lanes.flatMap((l) => [...l.stage.matchAll(/(\d+)\.\d+/g)].map((m) => m[1])))].sort()
  const named = nums.map((n) => PHASES.find((x) => x.n === n)).filter((x): x is (typeof PHASES)[number] => !!x)
  if (named.length < 2) return p
  return { n: `${named[0].n}–${named[named.length - 1].n}`, title: named.map((x) => x.title).join(' · '), en: named.map((x) => x.en).join(' · ') }
}

/** A phased team: one band per AI-DLC phase over its columns; the phase no role is in this time stays grey. */
function Phases({ run, lay, byKey, reducedMotion, phase, onPhase }: { run: RunDetail; lay: GraphLayout; byKey: Map<string, Lane>; reducedMotion: boolean; phase: string | null; onPhase?: (p: string) => void }) {
  return (
    <g className="kt-phases" aria-hidden="true">
      {lay.phases.map((p) => {
        const keys = lay.stages.filter((s) => s.phase === p.key).flatMap((s) => s.keys)
        const lanes = keys.map((k) => byKey.get(k)).filter((l): l is Lane => !!l)
        const head = phaseHead(p, lanes)
        const live = lanes.some((l) => LIVE.has(l.status))
        const working = lanes.filter((l) => WORKING.has(l.status)).length
        const done = lanes.length > 0 && lanes.every((l) => isFinal(l) || l.status === 'skipped')
        const cx = (p.x1 + p.x2) / 2
        return (
          <g key={p.key} className={`kt-phase${p.used ? '' : ' is-unused'}${live ? ' is-live' : ''}${done ? ' is-done' : ''}${phase ? (phase === p.key ? ' is-focus' : ' is-off') : ''}`} data-phase={p.key}>
            <rect className="kt-phase-band" x={p.x1} y={8} width={p.x2 - p.x1} height={lay.rail.y - 34} rx={18} />
            <text className={`kt-phase-title${onPhase && p.used && p.key !== 'init' ? ' is-pick' : ''}`} x={cx} y={30} textAnchor="middle"
              onClick={onPhase && p.used && p.key !== 'init' ? () => onPhase(p.key) : undefined}>
              {head.n} {head.title}
              {p.x2 - p.x1 > 230 && head.en !== head.title && (
                <tspan className="kt-phase-en" dx={6}>
                  {head.en}
                </tspan>
              )}
            </text>
            <text className="kt-phase-stages" x={cx} y={48} textAnchor="middle">
              {p.key === 'init' ? 'Pick flow · select team · create repository' : clip([...new Set(lanes.flatMap((l) => l.stage.split(/\s*·\s*/)).filter(Boolean))].join(' · '), Math.max(6, (p.x2 - p.x1) / 13))}
            </text>
            {!p.used && (
              <text className="kt-phase-note" x={cx} y={lay.rail.y / 2} textAnchor="middle">
                {p.key === 'operation' ? 'Not run this time' : 'Not needed this time'}
              </text>
            )}
            {working >= 2 && (
              <g className="kt-par" transform={`translate(${cx},${p.x2 - p.x1 > 300 ? 84 : 72})`}>
                <rect x={-52} y={-12} width={104} height={24} rx={12} />
                <ParallelDot reducedMotion={reducedMotion} />
                <text x={6} y={4.5} textAnchor="middle">
                  Running now {working}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </g>
  )
}

/** The orchestrator: a deterministic engine (not a model) that reads the team file and dispatches every role. */
function Orchestrator({ run, lay, flash }: { run: RunDetail; lay: GraphLayout; flash?: { n: number; tone: string } }) {
  const o = lay.orch!
  const { w, h } = ORCH_BOX
  const active = run.status !== 'done' && run.status !== 'failed' && run.status !== 'stopped'
  return (
    <g className={`kt-orch${active ? ' is-active' : ''}`} transform={`translate(${o.x},${o.y})`} data-testid="kt-orch">
      <title>{`Orchestrator: does the AI-DLC initialization (picks the flow, selects the team, creates the repository), then dispatches, merges, runs checks and sends work back by dependency. It is a deterministic program, not a model. Implementation: ${run.team.orchestrator}`}</title>
      <rect className="kt-orch-body" x={-w / 2} y={-h / 2} width={w} height={h} rx={18} />
      <text className="kt-orch-title" y={-14} textAnchor="middle">
        Orchestrator
      </text>
      <text className="kt-orch-cn" y={6} textAnchor="middle">
        Orchestrator
      </text>
      <text className="kt-orch-sub" y={26} textAnchor="middle">
        0 Initialization · team selection, repository
      </text>
      {flash && <rect key={flash.n} className={`kt-node-flash is-${flash.tone}`} x={-w / 2 - 5} y={-h / 2 - 5} width={w + 10} height={h + 10} rx={22} />}
    </g>
  )
}

/** The orchestrator's live command lines: to every role it has at work right now (queued ones dashed). */
function Commands({ run, lay }: { run: RunDetail; lay: GraphLayout }) {
  const live = run.roles.filter((l) => LIVE.has(l.status) || l.status === 'queued')
  return (
    <g className="kt-cmds" aria-hidden="true">
      {live.map((l) => {
        const p = commandPath(lay, l.key)
        return p ? <path key={l.key} className={`kt-cmd is-${l.status}`} d={pathD(p)} /> : null
      })}
    </g>
  )
}

/** Under the orchestrator: the company's team and who of it the orchestrator picked, the way a person staffs one: each
 * expert definition, then the posts it fills (Development → Backend development #1, #2, Frontend development #1, #2). The picked are green (lit while
 * at work); the rest of the team is grey and gets no node: this requirement does not need them. Runs without the
 * company's team (older ones) list their own roles only. The 14 experts themselves are in the strip above the graph. */
function Roster({ run, lay }: { run: RunDetail; lay: GraphLayout }) {
  const o = lay.orch!
  const top = o.y + ORCH_BOX.h / 2 + ROSTER.top
  const w = ORCH_BOX.w + 12
  const byKey = new Map(run.roles.map((l) => [l.key, l]))
  const people = new Map((run.roster ?? []).map((p) => [p.key, p]))
  const groups = rosterGroups(run.roles, run.roster)
  const picked = run.roles.filter((l) => l.status !== 'skipped').length
  let y = ROSTER.title
  return (
    <g className="kt-roster" transform={`translate(${o.x},${top})`} data-testid="kt-roster">
      <text className="kt-roster-title" y={0} textAnchor="middle">
        {run.roster?.length ? `Team of ${run.roster.length} · ${picked} picked this run` : `Team · ${picked} picked`}
      </text>
      {groups.map((g) => {
        const head = y
        y += ROSTER.group
        const rows = g.keys.map((key) => {
          const l = byKey.get(key)
          const at = y
          y += ROSTER.row
          if (!l || l.status === 'skipped') {
            const title = l?.title ?? people.get(key)?.title ?? key
            return (
              <g key={key} className="kt-roster-item is-bench" transform={`translate(0,${at})`} data-state="bench">
                <title>{`${title}: ${l?.status === 'skipped' && l.summary ? `${l.summary}, ` : 'this requirement does not need this post, '}so it is not in the workflow`}</title>
                <rect x={-w / 2 + 8} y={-7.5} width={w - 8} height={15} rx={7.5} />
                <circle cx={-w / 2 + 18} cy={0.5} r={3.5} />
                <text x={-w / 2 + 28} y={4.5}>
                  {clip(title, 8)}
                </text>
              </g>
            )
          }
          const state = LIVE.has(l.status) || l.status === 'queued' ? 'busy' : l.status === 'waiting' ? 'team' : 'used'
          return (
            <g key={l.key} className={`kt-roster-item is-team${state !== 'team' ? ' is-used' : ''}${state === 'busy' ? ' is-busy' : ''}`} transform={`translate(0,${at})`} data-state={state}>
              <title>{`${l.title}: ${l.doing || l.mission}`}</title>
              <rect x={-w / 2 + 8} y={-7.5} width={w - 8} height={15} rx={7.5} />
              <circle cx={-w / 2 + 18} cy={0.5} r={3.5} />
              <text x={-w / 2 + 28} y={4.5}>
                {clip(l.title, 8)}
              </text>
            </g>
          )
        })
        y += ROSTER.gap
        return (
          <g key={g.key}>
            <text className="kt-roster-group" x={-w / 2} y={head + 4}>
              {expertName(g.key)} expert{g.keys.length > 1 ? ` ×${g.keys.length}` : ''}
            </text>
            {rows}
          </g>
        )
      })}
    </g>
  )
}

function Rail({ run, lay, head, byKey, focus, flash }: { run: RunDetail; lay: GraphLayout; head: number; byKey: Map<string, Lane>; focus: string | null; flash?: { n: number; tone: string } }) {
  const { x1, x2, y } = lay.rail
  const latest = new Map<string, { status: string; sha: string; count: number; note: string | null }>()
  for (const m of run.merges) {
    const had = latest.get(m.role)
    latest.set(m.role, { status: m.status, sha: m.sha, count: (had?.count ?? 0) + 1, note: m.note })
  }
  const anyMerged = run.merges.some((m) => m.status === 'merged')
  return (
    <g className="kt-rail" data-testid="kt-rail">
      <line className="kt-rail-base" x1={x1} y1={y} x2={x2} y2={y} />
      {anyMerged && <line className="kt-rail-fill" x1={x1} y1={y} x2={head} y2={y} />}
      <text className="kt-rail-label" x={x1} y={y - 18}>
        Run branch <tspan className="kt-mono">{run.branch}</tspan>
      </text>
      <text className="kt-rail-sub" x={x1} y={y + 24}>
        Base <tspan className="kt-mono">{run.base}</tspan>
      </text>
      {[...latest.entries()].map(([role, m]) => {
        const mx = lay.mergeX.get(role)
        const lane = byKey.get(role)
        if (mx === undefined || !lane) return null
        const tip = `${lane.title}: ${m.status === 'conflict' ? `merge conflict${m.note ? ` (${m.note})` : ''}` : `merged ${m.sha}`}${m.count > 1 ? `, merged ${m.count} times` : ''}`
        return (
          <g key={role} className={`kt-rail-dot is-${m.status}${focus && focus !== role ? ' is-dim' : ''}`} transform={`translate(${mx},${y})`}>
            <title>{tip}</title>
            <circle r={10} />
            {m.status === 'conflict' ? (
              <text y={0.5} textAnchor="middle" dominantBaseline="central">✕</text>
            ) : (
              <RoleGlyph role={lane.icon || lane.key} cx={0} cy={0} size={13} />
            )}
          </g>
        )
      })}
      {flash && <circle key={flash.n} className={`kt-rail-flash is-${flash.tone}`} cx={head} cy={y} r={14} />}
    </g>
  )
}

function Station({ run, lay, flash }: { run: RunDetail; lay: GraphLayout; flash?: { n: number; tone: string } }) {
  const st = lay.station
  const { passed, failed, total } = run.tests
  const r = st.r - 5
  const c = 2 * Math.PI * r
  const pass = total ? (passed / total) * c : 0
  const fail = total ? (failed / total) * c : 0
  const tone = !total ? 'none' : failed ? 'fail' : 'pass'
  return (
    <g className={`kt-station is-${tone}`} transform={`translate(${st.x},${st.y})`} data-testid="kt-station" role="img" aria-label={total ? `Tests ${passed}/${total}` : 'Tests have not run yet'}>
      <circle className="kt-station-bg" r={st.r} />
      <circle className="kt-station-track" r={r} />
      {pass > 0 && <circle className="kt-station-pass" r={r} strokeDasharray={`${pass} ${c}`} transform="rotate(-90)" />}
      {fail > 0 && <circle className="kt-station-fail" r={r} strokeDasharray={`${fail} ${c}`} strokeDashoffset={-pass} transform="rotate(-90)" />}
      <text className="kt-station-num" y={1} textAnchor="middle" dominantBaseline="central">
        {total ? `${passed}/${total}` : '—'}
      </text>
      <text className="kt-station-label" y={-st.r - 9} textAnchor="middle">
        🧪 Tests
      </text>
      {flash && <circle key={flash.n} className={`kt-station-flash is-${flash.tone}`} r={st.r + 3} />}
    </g>
  )
}

function Elapsed({ lane }: { lane: Lane }) {
  const since = useSinceSnapshot()
  const a = lane.agent
  const live = !!a && (LIVE.has(lane.status) || lane.status === 'queued')
  return <>{fmtClock(live && a ? a.elapsed_s + since : lane.active_s)}</>
}

function Quiet({ lane }: { lane: Lane }) {
  const now = useServerNow()
  const last = lane.agent?.last_activity
  if (!last) return <>Stalled</>
  const s = Math.max(0, now - last)
  return <>Quiet for {s < 60 ? `${Math.round(s)} s` : `${Math.round(s / 60)} min`}</>
}

function subLine(lane: Lane, lanes: Lane[]) {
  if (lane.status === 'merged' && lane.gate === 'pending') return `Awaiting approval${lane.gate_label ? `: ${lane.gate_label}` : ''}`
  switch (lane.status) {
    case 'skipped':
      return clip(lane.summary || 'Skipped: not needed for this project', 8.2)
    case 'waiting':
      if (lane.awaiting_member) return 'Waiting for a member to be added'
      return clip(waitingText(lane, lanes), 8.2)
    case 'queued':
      return 'Waiting for KiroCrew to release it'
    case 'running':
      return (
        <>
          Running · <Elapsed lane={lane} />
        </>
      )
    case 'fixing':
      return (
        <>
          Fixing · <Elapsed lane={lane} />
        </>
      )
    case 'stalled':
      return <Quiet lane={lane} />
    case 'awaiting_approval':
      return '✋ Needs your approval'
    case 'done':
      return lane.writable.length ? 'Done · waiting to merge' : `Done · ${fmtClock(lane.active_s)}`
    case 'merged':
      return lane.deployed ? `Deployed · :${lane.deployed.url.split(':').pop()?.replace(/\/$/, '')}` : `Merged · ${fmtClock(lane.active_s)}`
    case 'failed':
      return '✕ Failed'
    default:
      return laneMeta(lane).label
  }
}

function GraphNode({ lane, lanes, box, focus, off = false, flash, onRole, reducedMotion, quiet = false, onHover }: { lane: Lane; lanes: Lane[]; box: NodeBox; focus: string | null; off?: boolean; flash?: { n: number; tone: string }; onRole: (k: string) => void; reducedMotion: boolean; quiet?: boolean; onHover?: (on: boolean) => void }) {
  const meta = laneMeta(lane)
  const w = NODE_W
  const h = NODE_H
  const working = WORKING.has(lane.status)
  const ticker = !quiet && LIVE.has(lane.status) && lane.agent?.last_tool ? lane.agent.last_tool : null
  const badges: Array<{ text: string; tone: string }> = []
  if (lane.attempt > 1) badges.push({ text: `Round ${lane.attempt}`, tone: 'fix' })
  if (lane.violations.length) badges.push({ text: `Out of bounds ${lane.violations.length}`, tone: 'bad' })
  if (lane.status === 'queued') badges.push({ text: 'Queued', tone: 'queue' })
  if (lane.status === 'stalled') badges.push({ text: '⚠ Stalled', tone: 'warn' })
  if (lane.gate === 'pending') badges.push({ text: 'Needs your approval', tone: 'gate' })
  if (lane.awaiting_member && lane.status === 'waiting') badges.push({ text: 'Missing member', tone: 'warn' })
  const isFocus = focus === lane.key
  const name = `${lane.stage ? `${lane.stage} · ` : ''}${lane.title}${lane.doing ? ` (${lane.doing})` : ''}: ${meta.label}${lane.attempt > 1 ? `, round ${lane.attempt}` : ''}${lane.violations.length ? `, changed out of bounds: ${lane.violations.join(', ')}` : ''}${lane.status === 'waiting' ? `, ${waitingText(lane, lanes)}` : ''}${ticker ? `, now: ${ticker}` : ''}`
  const onKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    onRole(lane.key)
  }
  let bx = w / 2 - 8
  return (
    <g
      className={`kt-node is-${lane.status}${isFinal(lane) ? ' is-final' : ''}${focus ? (isFocus ? ' is-focus' : ' is-dim') : off ? ' is-dim' : ''}`}
      transform={`translate(${box.x},${box.y})`}
      data-role={lane.key}
      data-status={lane.status}
      role="button"
      tabIndex={0}
      aria-label={name}
      aria-pressed={isFocus}
      onClick={() => onRole(lane.key)}
      onKeyDown={onKey}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <title>{name}</title>
      {(working || lane.status === 'awaiting_approval') && <Halo w={w} h={h} reducedMotion={reducedMotion} />}
      <rect className="kt-node-body" x={-w / 2} y={-h / 2} width={w} height={h} rx={16} />
      {lane.status === 'stalled' && <rect className="kt-node-hatch" x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill="url(#kt-hatch)" />}
      {lane.status === 'queued' && <rect className="kt-node-ants" x={-w / 2 - 4} y={-h / 2 - 4} width={w + 8} height={h + 8} rx={19} />}
      <circle className="kt-node-avatar" cx={-w / 2 + 33} cy={0} r={22.5} />
      {working && <circle className="kt-node-spin" cx={-w / 2 + 33} cy={0} r={27} />}
      <RoleGlyph role={lane.icon || lane.key} cx={-w / 2 + 33} cy={0} size={24} className="kt-node-emoji" />
      <text className={`kt-node-title${lane.title.length >= 5 ? ' is-long' : ''}`} x={-w / 2 + 66} y={-15}>
        {clip(lane.title, 6.2)}
        <tspan className="kt-node-agent" dx={5}>agent</tspan>
      </text>
      {lane.doing && (
        <text className={`kt-node-task${lane.doing !== lane.assignment ? ' is-sent-back' : ''}`} x={-w / 2 + 66} y={4}>
          {clip(lane.doing, 9.2)}
        </text>
      )}
      <text className="kt-node-sub" x={-w / 2 + 66} y={lane.doing ? 23 : 16}>
        {subLine(lane, lanes)}
      </text>

      {isFinal(lane) && (
        <g className="kt-node-check" transform={`translate(${w / 2 - 14},${h / 2 - 14})`}>
          <circle r={9} />
          <path d="M-4,0 L-1.2,3 L4.2,-3.2" />
        </g>
      )}
      {badges.map((b) => {
        const bw = Math.max(34, b.text.length * 11 + 8)
        bx -= bw
        const x = bx
        bx -= 4
        return (
          <g key={b.text} className={`kt-node-badge is-${b.tone}`} transform={`translate(${x + bw / 2},${-h / 2})`}>
            <rect x={-bw / 2} y={-10} width={bw} height={20} rx={10} />
            <text y={4.5} textAnchor="middle">
              {b.text}
            </text>
          </g>
        )
      })}
      {ticker && (
        <text className="kt-node-ticker" x={0} y={h / 2 + 18} textAnchor="middle">
          ▸ {clip(ticker, 25)}
        </text>
      )}
      {flash && <rect key={flash.n} className={`kt-node-flash is-${flash.tone}`} x={-w / 2 - 5} y={-h / 2 - 5} width={w + 10} height={h + 10} rx={20} />}
      <rect className="kt-node-focus" x={-w / 2 - 5} y={-h / 2 - 5} width={w + 10} height={h + 10} rx={20} />
    </g>
  )
}

/** A failed node's own Retry, under its bottom-right corner (a sibling of the node: never a button in a button). */
function RetryChip({ lane, box, onRetry }: { lane: Lane; box: NodeBox; onRetry: (key: string) => void }) {
  const go = () => onRetry(lane.key)
  return (
    <g
      className="kt-node-retry"
      transform={`translate(${box.x + NODE_W / 2 - 34},${box.y + NODE_H / 2 + 14})`}
      role="button"
      tabIndex={0}
      aria-label={`Retry ${lane.title}`}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          go()
        }
      }}
    >
      <title>{`Retry ${lane.title}: give it another round`}</title>
      <rect x={-32} y={-12} width={64} height={24} rx={12} />
      <text y={4.5} textAnchor="middle">
        ↻ Retry
      </text>
    </g>
  )
}

/** Under a gated node: the person approves (the roles after it start) or sends it back. */
function GateChips({ lane, box, onGate }: { lane: Lane; box: NodeBox; onGate?: (key: string, decision: GateDecision) => void }) {
  const label = lane.gate_label || lane.title
  if (lane.gate === 'discussing') {
    return (
      <g className="kt-gate" transform={`translate(${box.x},${box.y + NODE_H / 2 + 22})`} data-testid="kt-gate">
        <g className="kt-gate-chip is-talking is-static" aria-label={`${lane.title} is answering your discussion`}>
          <rect x={-56} y={-13} width={112} height={26} rx={13} />
          <text y={5} textAnchor="middle">Discussing · answering</text>
        </g>
      </g>
    )
  }
  const chip = (decision: GateDecision, text: string, x: number, w: number) => {
    const go = () => onGate?.(lane.key, decision)
    return (
      <g
        className={`kt-gate-chip is-${decision}${onGate ? '' : ' is-static'}`}
        transform={`translate(${x},0)`}
        role={onGate ? 'button' : undefined}
        tabIndex={onGate ? 0 : undefined}
        aria-label={onGate ? `${text}` : undefined}
        onClick={go}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            go()
          }
        }}
      >
        <rect x={-w / 2} y={-13} width={w} height={26} rx={13} />
        <text y={5} textAnchor="middle">
          {text}
        </text>
      </g>
    )
  }
  return (
    <g className="kt-gate" transform={`translate(${box.x},${box.y + NODE_H / 2 + 22})`} data-testid="kt-gate">
      {lane.can_discuss ? (
        <>
          {lane.overrule ? chip('approve', 'Approve anyway', -70, 132) : chip('approve', `✓ Approve ${label}`, -70, 132)}
          {chip('discuss', 'Discuss', 34, 64)}
          {chip('revise', lane.overrule ? 'Another round' : 'Send back', lane.overrule ? 118 : 108, lane.overrule ? 96 : 76)}
        </>
      ) : (
        <>
          {lane.overrule ? chip('approve', 'Approve anyway', -66, 132) : chip('approve', `✓ Approve ${label}`, -66, 132)}
          {chip('revise', lane.overrule ? 'Another round' : 'Send back', lane.overrule ? 62 : 50, lane.overrule ? 96 : 84)}
        </>
      )}
    </g>
  )
}

const LEGEND: Array<{ status: Lane['status']; text: string }> = [
  { status: 'running', text: 'Running' },
  { status: 'fixing', text: 'Fixing' },
  { status: 'queued', text: 'Queued' },
  { status: 'stalled', text: 'Stalled' },
  { status: 'awaiting_approval', text: 'Needs your approval' },
  { status: 'done', text: 'Done · waiting to merge' },
  { status: 'merged', text: 'Merged' },
  { status: 'failed', text: 'Failed' },
  { status: 'waiting', text: 'Waiting for upstream' },
  { status: 'skipped', text: 'Skipped' },
]

function Legend() {
  return (
    <div className="kt-legend" role="note" aria-label="Legend">
      {LEGEND.map((l) => (
        <span key={l.status} className={`kt-legend-item is-${l.status}`}>
          <i aria-hidden="true" />
          {l.text}
        </span>
      ))}
      <span className="kt-legend-sep" aria-hidden="true" />
      <span className="kt-legend-item is-p-handoff">
        <b aria-hidden="true" />
        Handoff
      </span>
      <span className="kt-legend-item is-p-merge">
        <b aria-hidden="true" />
        Merged into the run branch
      </span>
      <span className="kt-legend-item is-p-pass">
        <b aria-hidden="true" />
        Tests all green
      </span>
      <span className="kt-legend-item is-p-fail">
        <b aria-hidden="true" />
        Tests red / sent back
      </span>
    </div>
  )
}
