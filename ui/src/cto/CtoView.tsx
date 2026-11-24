/**
 * CTO view: what AI-DLC delivered, for a CTO — one sentence and three numbers (More, Faster, Cheaper), the weekly releases,
 * Requirement flow (what is in progress now) and the Delivery list. Everything is computed from `GET /cto` (metrics.ts), every 5 s:
 * a run of this app shows up on the kanban as it goes and in the numbers once a person signs it off. Its buttons open
 * the Team board at the right place (onOpen, marked ↗); Download saves a PDF (the browser's print), the ledger as CSV, or an
 * offline page. Projection is the app's (AppBar.tsx): this view takes bigger type while it is on. Each delivery carries its
 * Issue and PR; a defect raised after something shipped links the two. The method notes are at the foot of the page (Method).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppApi } from '@kirocrew/app-sdk'
import { BOARD_CSS } from '../board/styles'
import { deliveryLabel, paths } from '../board/format'
import { errorText } from '../board/useBoard'
import { itemOf, type BoardEntry, type CtoEntry, type CtoFilters, type ItemEntry } from '../nav'
import { boardAt } from './stream'
import { word } from './vocab'
import { MiniCheap, MiniFast, MiniMore, WeeklyChart, MiniSteady } from './charts'
import { Flow } from './Flow'
import { KIND, KINDS, KIND_VAR, SIZE, baseCycles, day1, fmt, kilo, ledger, ledgerCsv, md, metrics, ratioOf, weekly, money } from './metrics'
import { CTO_CSS } from './styles'
import { KIT_CSS } from '../kit'
import type { CtoData, CtoFlow, CtoItem, Kind, Size } from './types'

export const CTO_POLL_MS = 5000

function save(text: string, name: string, type: string): boolean {
  if (typeof URL.createObjectURL !== 'function') return false
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  document.body.append(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(a.href)
    a.remove()
  }, 0)
  return true
}

type Props = {
  onOpen: (e: BoardEntry) => void
  /** a delivery's Delivery detail */
  onItem?: (e: ItemEntry) => void
  /** the way in: its filters, a delivery to pick out, a part to scroll to */
  entry?: CtoEntry
  /** the filters changed (or the delivery picked out faded): the app rewrites the URL's entry */
  onState?: (f: CtoFilters) => void
  /** opened again by back or forward: the app puts the page back where it was left, so it does not scroll here */
  returning?: boolean
  pollMs?: number
  projection?: boolean
  onProjection?: (on: boolean) => void
}

export function CtoView({ onOpen, onItem = () => {}, onState, returning = false, entry, pollMs = CTO_POLL_MS, projection = false, onProjection }: Props) {
  const api = useAppApi()
  const [data, setData] = useState<CtoData | null>(null)
  const [error, setError] = useState('')
  const [line, setLine] = useState(entry?.line ?? -1)
  const [kind, setKind] = useState<Kind | 'all'>(entry?.type ?? 'all')
  const [realOnly, setRealOnly] = useState(!!entry?.real)
  const [size, setSize] = useState<Size | null>(entry?.size ?? null)
  const [week, setWeek] = useState<string | null>(entry?.week ?? null)
  const [defects, setDefects] = useState<boolean>(entry?.defects ?? false)
  const [hl, setHl] = useState<string | null>(null)
  const [limit, setLimit] = useState(12)
  const [perDay, setPerDay] = useState('')
  const [calcOpen, setCalcOpen] = useState(false)
  const [assumeOpen, setAssumeOpen] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [toast, setToast] = useState('')
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set())
  const seen = useRef<Set<string> | null>(null)
  const dlRef = useRef<HTMLDetailsElement>(null)
  const ledgerRef = useRef<HTMLElement>(null)

  // GET /cto now and every pollMs; a run signed off since the last poll is "just now"
  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const pull = async () => {
      try {
        const d = await api.get<CtoData>(paths.cto())
        if (!alive) return
        const reals = new Set(d.items.flatMap((i) => (i.real ? [i.real] : [])))
        if (seen.current) {
          const added = [...reals].filter((r) => !seen.current?.has(r))
          if (added.length) setFresh((f) => new Set([...f, ...added]))
        }
        seen.current = reals
        setData(d)
        setError('')
      } catch (e) {
        if (alive) setError(errorText(e))
      }
      if (alive) timer = setTimeout(() => void pull(), pollMs)
    }
    void pull()
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [api, pollMs])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3600)
    return () => clearTimeout(t)
  }, [toast])

  // Projection is the app's; Esc here ends it (full screen ends on its own)
  useEffect(() => {
    if (!projection) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onProjection?.(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [projection, onProjection])

  // PDF: the browser's print of this view only, light, without the controls
  useEffect(() => {
    const before = () => setPrinting(true)
    const after = () => setPrinting(false)
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [])

  const base = useMemo(() => (data ? baseCycles(data.items) : { S: 0, M: 0, L: 0 }), [data])
  const m = useMemo(() => (data ? metrics(data, line, base) : null), [data, line, base])
  const weeks = useMemo(() => (data ? weekly(data.items, data.meta, line) : []), [data, line])
  const rows = useMemo(() => (data ? ledger(data.items, line, kind, realOnly, fresh, { size, week, defects }) : []), [data, line, kind, realOnly, fresh, size, week, defects])
  // the filters in the URL: a change rewrites the view's history entry (and drops the delivery picked out)
  const filters = (): CtoFilters => ({ ...(line >= 0 ? { line } : {}), ...(kind !== 'all' ? { type: kind } : {}), ...(size ? { size } : {}), ...(week ? { week } : {}), ...(realOnly ? { real: true } : {}), ...(defects ? { defects: true } : {}) })
  const now = useRef(filters)
  now.current = filters
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    onState?.(filters())
  }, [line, kind, realOnly, size, week, defects]) // eslint-disable-line react-hooks/exhaustive-deps
  // the way in: once the data is here, the delivery asked for is picked out — its ledger row under the filters it was left
  // with (they are relaxed, and the page says so, only when it is not under them), else its kanban card — or a part
  const entered = useRef(false)
  useEffect(() => {
    if (!data || entered.current || !entry) return
    entered.current = true
    const go = (sel: string, block: ScrollLogicalPosition = 'start') => void (returning || setTimeout(() => document.querySelector(sel)?.scrollIntoView?.({ behavior: 'smooth', block }), 80))
    if (entry.at) go(`[data-anchor="${entry.at}"]`)
    const key = entry.hl
    if (!key) return
    const is = (i: CtoItem) => i.real === key || i.issue === key
    setHl(key)
    setTimeout(() => {
      setHl(null)
      onState?.(now.current())  // the URL no longer picks it out: a reload does not jump to it again
    }, 6000)
    const under = ledger(data.items, line, kind, realOnly, fresh, { size, week, defects }).findIndex(is)
    if (under >= 0) {
      setLimit((n) => Math.max(n, under + 1))
      go(`[data-key="${key}"]`, 'center')
      return
    }
    const all = ledger(data.items, -1, 'all', false, fresh).findIndex(is)
    const before = all < 0 ? data.items.find(is) : undefined
    if (all >= 0 || before) {
      if (Object.keys(filters()).length) setToast('This item was not in the previous filter; now showing all business lines and types')
      setLine(-1)
      setKind('all')
      setRealOnly(false)
      setSize(null)
      setDefects(false)
      setWeek(before ? (data.meta.weeks.filter((w) => w <= before.ship).pop() ?? null) : null)
      setLimit(Math.max(12, before ? 30 : all + 1))
      go(`[data-key="${key}"]`, 'center')
    } else if (data.wip.some((w) => w.real === key || w.issue === key)) {
      go(`[data-key="${key}"]`, 'center')
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!data || !m) {
    return (
      <div className="kt-root cto-root" data-testid="cto-root">
        <style>{BOARD_CSS}</style>
        <style>{CTO_CSS}</style>
        <style>{KIT_CSS}</style>
        <p className="cto-dim">{error ? `Could not get the CTO view data: ${error}` : 'Reading delivery data…'}</p>
      </div>
    )
  }
  const M = data.meta
  const scopeName = line < 0 ? 'All business lines' : deliveryLabel(M.lines[line])
  const scope = line < 0 ? `R&D centre ${m.seats} people · ${M.lines.length} business lines` : `${deliveryLabel(M.lines[line])} · ${m.seats} people`
  const st = m.steady
  const value = Number(perDay) > 0 ? `$${kilo(m.built.length * m.adv * Number(perDay))}` : '—'
  const pickKind = (k: Kind | 'all') => {
    setKind(k)
    setLimit(12)
  }
  const toLedger = () => ledgerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  const reals = data.items.filter((i) => i.real).sort((a, b) => (a.ship < b.ship ? 1 : a.ship > b.ship ? -1 : 0))
  const latest = data.items.find((i) => i.real && (line < 0 || i.line === line)) ?? data.items.find((i) => i.real)
  // Awaiting approval, with no run of this app at a gate: the newest measured delivery's first gate, at its moment
  const gateOf = async (run: string) => {
    try {
      const f = await api.get<CtoFlow>(paths.ctoFlow(run))
      const s = f.segments.find((x) => x.who === 'person' && x.gate !== 'signoff')
      onOpen({ ...(s ? boardAt(run, s) : { run }), pick: 'latest' })
    } catch {
      onOpen({ run, pick: 'latest' })
    }
  }
  const item = (i: CtoItem) => onItem(itemOf(i))
  const stop = (f: () => void) => (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    f()
  }
  const download = async (what: 'pdf' | 'csv' | 'html') => {
    if (dlRef.current) dlRef.current.open = false
    if (what === 'pdf') {
      setPrinting(true)
      setTimeout(() => window.print(), 60)
    } else if (what === 'csv') {
      const all = ledger(data.items, line, kind, realOnly, fresh)
      if (save(ledgerCsv(all, M, base), `CTO-view-delivery-list-${scopeName}-${M.today}.csv`, 'text/csv;charset=utf-8'))
        setToast(`Exported ${fmt(all.length)} row${all.length === 1 ? '' : 's'} (${scopeName}${kind === 'all' ? '' : ` · ${KIND[kind]}`}${realOnly ? ' · measured only' : ''})`)
    } else {
      try {
        const got = await api.get<{ name: string; html: string }>(paths.ctoOffline())
        if (save(got.html, got.name, 'text/html;charset=utf-8')) setToast('Offline version downloaded: the data is a snapshot of this moment and opens without Kiro Crew')
      } catch (e) {
        setToast(`Offline version was not downloaded: ${errorText(e)}`)
      }
    }
  }
  return (
    <div className={`kt-root cto-root${projection ? ' is-projection' : ''}${printing ? ' is-printing' : ''}`} data-testid="cto-root">
      <style>{BOARD_CSS}</style>
      <style>{CTO_CSS}</style>
      <style>{KIT_CSS}</style>
      <header className="cto-top">
        <span className="cto-tag" title="Larkspur Outfitters is a fictitious company. Its past deliveries are generated from the assumptions listed under Assumptions, not measured. The deliveries marked Measured are real runs that were signed off (including runs imported from other computers)">Simulated company · {m.real} measured</span>
        <span className="cto-org">{M.company ?? 'Larkspur Outfitters'} · {scope} · week 12 since AI-DLC was introduced</span>
        <span className="cto-grow" />
        <details className="cto-dl cto-noprint cto-noproj" ref={dlRef}>
          <summary className="kt-btn">Download ▾</summary>
          <div className="cto-menu">
            <button type="button" onClick={() => void download('pdf')}>PDF (print version, A4 landscape)</button>
            <button type="button" onClick={() => void download('csv')}>Delivery list (CSV, with the current filter)</button>
            <button type="button" onClick={() => void download('html')}>Offline version (HTML, opens without Crew)</button>
          </div>
        </details>
      </header>
      {error && <div className="kt-banner" role="status">The CTO view failed to refresh: {error}. Showing the last data received</div>}

      <section className="cto-hero">
        <h2>Same {m.seats} people: the last 12 weeks against the 12 weeks before AI-DLC</h2>
        <p>Simulated company: its history is generated from the assumptions below, not measured · only signed-off deliveries count{m.real ? <> · <button type="button" className="cto-link" onClick={() => { setRealOnly(true); setLimit(12); toLedger() }} title="Show only measured deliveries in the delivery list">{m.real} of them {m.real === 1 ? 'is a real run' : 'are real runs'} (measured)</button></> : ' · no measured run yet'}</p>
        <p className="cto-honest">Only what is marked Measured comes from a real run. <button type="button" className="cto-link" onClick={() => { setAssumeOpen(true); setTimeout(() => document.querySelector('[data-anchor="assumptions"]')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 60) }}>See the assumptions ▾</button></p>
        <div className="cto-print-only">Larkspur Outfitters · {scopeName} · exported {new Date().toLocaleString('en-US', { hour12: false })} · see Method at the end</div>
      </section>

      <nav className="cto-lines" aria-label="Business lines">
        {[-1, ...M.lines.map((_, i) => i)].map((li) => (
          <button type="button" key={li} aria-pressed={line === li} onClick={() => { setLine(li); setLimit(12) }}>
            <b>{li < 0 ? 'All' : deliveryLabel(M.lines[li])}</b>
            <span>Delivery volume {ratioOf(data.items, li).toFixed(1)}×</span>
          </button>
        ))}
      </nav>

      <section className="cto-cards">
        <article className={`cto-card${fresh.size ? ' cto-flash' : ''}`} key={`more-${fresh.size}`} aria-label="More" data-anchor="more">
          <div className="cto-eyebrow">More</div>
          <button type="button" className="cto-value cto-link-value" data-testid="cto-more" onClick={toLedger} title="See the delivery list">{m.ratio.toFixed(1)}×</button>
          <div className="cto-desc">Delivery volume · same {m.seats} people</div>
          <MiniMore m={m} />
          <div className="cto-legend">
            {KINDS.map((k) => (
              <button type="button" key={k} aria-pressed={kind === k} title={`${m.count(m.before, k)} in the first 12 weeks; click to filter the delivery list below`}
                onClick={() => { pickKind(kind === k ? 'all' : k); ledgerRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>
                <i className="cto-sw" style={{ background: KIND_VAR[k] }} />{KIND[k]}<b>{fmt(m.count(m.agent, k))}</b>
              </button>
            ))}
          </div>
        </article>
        <article className="cto-card" aria-label="Faster" data-anchor="fast">
          <div className="cto-eyebrow">Faster</div>
          <button type="button" className="cto-value cto-link-value" data-testid="cto-fast" onClick={() => { setSize('L'); setLimit(12); toLedger() }} title="See the deliveries of large requirements">{day1(base.L)} days → {m.cycle('L') ? `${day1(m.cycle('L'))} days` : '—'}</button>
          <div className="cto-desc">Delivery cycle of large requirements · click a row to see deliveries of that size</div>
          <MiniFast m={m} base={base} onPick={(s) => { setSize(s); setLimit(12); toLedger() }} />
          <div className="cto-legend">
            <span><i className="cto-dot" style={{ background: 'var(--deemph)' }} />Before</span>
            <span><i className="cto-dot" style={{ background: 'var(--s4)' }} />Now</span>
          </div>
          <div className="cto-foot">
            <span>New apps and new features ship {day1(m.adv)} days earlier on average</span>
            <button type="button" className="cto-link" onClick={() => setCalcOpen((v) => !v)}>{calcOpen ? 'Collapse ▾' : 'Estimate value ▸'}</button>
          </div>
          {calcOpen && (
            <label className="cto-calc">
              Gross margin per item per day $<input type="number" min={0} step={100} value={perDay} onChange={(e) => setPerDay(e.target.value)} placeholder="Enter an amount" autoFocus />, which brings in about <b data-testid="cto-value">{value}</b>
            </label>
          )}
        </article>
        <article className="cto-card" aria-label="Cheaper" data-anchor="cheap">
          <div className="cto-eyebrow">Cheaper</div>
          <div className="cto-value" data-testid="cto-cheap">−{Math.round((1 - m.unit / M.dayRate) * 100)}%</div>
          <div className="cto-desc">Cost per person-day of work (modelled: see Assumptions)</div>
          <MiniCheap m={m} meta={M} />
          <div className="cto-foot">
            <span>The last 12 weeks are equivalent to saving ${kilo(m.save)} of R&D spend</span>
            {latest?.real && <button type="button" className="cto-link" onClick={() => item(latest)} title={`${latest.t}: agent usage, people's time and decisions`}>See the consumption of one measured delivery ↗</button>}
          </div>
        </article>
        <article className="cto-card" aria-label="More stable" data-anchor="steady">
          <div className="cto-eyebrow">More stable</div>
          <button type="button" className="cto-value cto-link-value" data-testid="cto-steady" onClick={() => { setDefects(true); setLimit(12); toLedger() }} title="See deliveries with defects reported after release">{st.before.toFixed(1)} → {st.now.toFixed(1)}</button>
          <div className="cto-desc">Post-release defects per 100 new apps and new features</div>
          <MiniSteady m={m} />
          <div className="cto-foot cto-foot-steady">
            <span data-testid="cto-caught">{st.reals ? `${st.reals} measured deliver${st.reals === 1 ? 'y' : 'ies'} caught ${fmt(st.caughtAll)} problem${st.caughtAll === 1 ? '' : 's'} before release: checks ${st.caught.checks} · review ${st.caught.review} · people ${st.caught.person}` : 'Problems caught before release: measured deliveries only'}</span>
            {st.risks[0] && (
              <button type="button" className="cto-link" data-testid="cto-risk" onClick={() => onItem({ ...itemOf(st.risks[0].item), at: Math.round(st.risks[0].at) })} title={`${st.risks[0].item.t}: noted by the owner when sending back at the ${word(st.risks[0].gate)} gate`}>
                Risk stopped: {st.risks[0].what}{st.risks[0].amount != null ? ` ${money(st.risks[0].amount)}` : ''} ↗
              </button>
            )}
          </div>
        </article>
      </section>

      <details className="cto-notes cto-assume" data-anchor="assumptions" data-testid="cto-assumptions" open={assumeOpen || printing || undefined} onToggle={(e) => setAssumeOpen((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>Assumptions behind these numbers (simulated company)</summary>
        <table>
          <thead><tr><th>Assumption</th><th>Value</th><th>Used for</th></tr></thead>
          <tbody>
            <tr><td>The company</td><td>{M.company ?? 'Larkspur Outfitters'} (fictitious) · {M.lines.length} business lines × {M.peoplePerLine} people = {M.lines.length * M.peoplePerLine}</td><td>Headcount in More and Cheaper</td></tr>
            <tr><td>Work, people alone</td><td>Small {M.eq.S} · Medium {M.eq.M} · Large {M.eq.L} person-days per delivery</td><td>The equivalent work behind Cheaper, and the estimate for a measured run</td></tr>
            <tr><td>Work, with the agent team</td><td>Small {M.human.S} · Medium {M.human.M} · Large {M.human.L} person-days of people's time per delivery</td><td>The people's cost behind Cheaper, and the estimate for a measured run</td></tr>
            <tr><td>One person-day costs</td><td>${fmt(M.dayRate)} ({M.currency ?? 'USD'}, fully loaded)</td><td>Cheaper: before, and people's share now</td></tr>
            <tr><td>Agent seat</td><td>${M.seatUsdMonth} per person per month × {M.months} months (rate {M.fx})</td><td>Cheaper: the agent subscription</td></tr>
            <tr><td>Volume, cycle times, defects</td><td>Generated with a fixed random seed (scripts/cto_history.py)</td><td>More, Faster, More stable, the weekly chart and the Simulated rows: they show how the page reads, they do not measure a gain</td></tr>
            <tr><td>Measured runs</td><td>{m.real} so far</td><td>Their time, credits, checks and decisions are real; the work estimate beside them is the assumption above</td></tr>
          </tbody>
        </table>
      </details>

      <section className="cto-card cto-measured" aria-label="Measured runs against the estimate" data-anchor="measured" data-testid="cto-measured">
        <h3>Measured runs against the estimate</h3>
        {reals.length === 0 ? (
          <p className="cto-dim">
            No measured run yet. Raise a requirement on the team board and sign the delivery off: its real time, credits and checks appear here, next to what the same work would take people alone (an assumption).{' '}
            <button type="button" className="cto-link cto-noprint" onClick={() => onOpen({ new: 'promo' })}>New requirement ↗</button>
          </p>
        ) : (
          <>
            <table>
              <thead><tr><th>Delivery</th><th>Measured: this run</th><th>Estimate: people alone</th><th>Estimate: with the agent team</th></tr></thead>
              <tbody>
                {reals.map((i) => (
                  <tr key={i.real}>
                    <td><button type="button" className="cto-link" onClick={() => item(i)}>{i.t}</button><div className="cto-was">{SIZE[i.size]} · {KIND[i.kind]}</div></td>
                    <td>{i.mins != null ? `${i.mins} min` : '—'} run time · {i.credits != null ? `${fmt(i.credits)} credits` : 'credits not recorded'}{i.tests ? ` · checks ${i.tests}` : ''}{i.members ? ` · ${i.members} members` : ''}</td>
                    <td className="cto-est">{M.eq[i.size]} person-day{M.eq[i.size] === 1 ? '' : 's'} ≈ ${fmt(M.eq[i.size] * M.dayRate)}</td>
                    <td className="cto-est">{M.human[i.size]} person-day{M.human[i.size] === 1 ? '' : 's'} of people's time ≈ ${fmt(M.human[i.size] * M.dayRate)}, plus the run</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="cto-dim">The left column is measured from the run. The two estimates use the size you confirmed at the gate and the assumptions above; they are not measured.</p>
          </>
        )}
      </section>

      <WeeklyChart weeks={weeks} today={M.today} onWeek={(w) => { setWeek(w); setLimit(12); toLedger() }} />

      <Flow data={data} line={line} fresh={fresh} hl={hl} onOpen={onOpen} onItem={onItem} onGateOf={(r) => void gateOf(r)} onLedger={toLedger} />

      <section className="cto-card" ref={ledgerRef} aria-label="Delivery list" data-anchor="ledger">
        <div className="cto-ledger-head">
          <h3>Delivery list</h3>
          <div className="cto-seg cto-noprint" role="group" aria-label="Type">
            {(['all', ...KINDS] as (Kind | 'all')[]).map((k) => (
              <button type="button" key={k} aria-pressed={kind === k} onClick={() => pickKind(k)}>{k === 'all' ? 'All' : KIND[k]}</button>
            ))}
          </div>
          <button type="button" className={`kt-btn is-small cto-noprint${realOnly ? ' is-on' : ''}`} aria-pressed={realOnly} onClick={() => { setRealOnly((v) => !v); setLimit(12) }}>Measured only</button>
          {size && <span className="cto-filter">{SIZE[size]}<button type="button" aria-label="Stop filtering by size" onClick={() => setSize(null)}>✕</button></span>}
          {week && <span className="cto-filter">Week from {md(week)}<button type="button" aria-label="Stop filtering by week" onClick={() => setWeek(null)}>✕</button></span>}
          {defects && <span className="cto-filter">Has post-release defects<button type="button" aria-label="Stop filtering by post-release defects" onClick={() => setDefects(false)}>✕</button></span>}
          <span className="cto-dim" data-testid="cto-ledger-count">{fmt(rows.length)} item{rows.length === 1 ? '' : 's'}{realOnly ? '' : ', measured first'} · click a row for the delivery detail</span>
        </div>
        <table className="cto-table">
          <thead>
            <tr><th>Delivery</th><th>Business line</th><th>Type</th><th>Size</th><th>Released</th><th>Cycle</th><th>Signed by</th><th>Issue · PR</th><th>Source</th></tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((i) => {
              const isFresh = !!i.real && fresh.has(i.real)
              return (
                <tr key={`${i.real ?? i.t}-${i.ship}`} data-key={i.real ?? i.issue} className={`cto-row-pick${i.real ? ' is-real' : ''}${isFresh ? ' is-new' : ''}${hl && hl === (i.real ?? i.issue) ? ' is-hl' : ''}`}
                  onClick={() => item(i)} title="Delivery detail" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && (e.preventDefault(), item(i))}>
                  <td>
                    <div>{i.t}</div>
                    {i.tests && (i.real ? <button type="button" className="cto-was cto-link" onClick={stop(() => onOpen({ run: i.real as string, focus: 'tests' }))} title="The test wall on the team board">Checks {i.tests} passed ↗</button> : <div className="cto-was">Checks {i.tests} passed</div>)}
                    {i.defects?.length ? (
                      <div className="cto-defect" title={`Defects reported after release: ${i.defects.join(', ')}`}>
                        Post-release defects {i.defects.length} · fixes in{' '}
                        {i.defects.map((d) => <button type="button" key={d} className="cto-link" onClick={stop(() => onItem({ issue: d }))}>{d}</button>)}
                      </div>
                    ) : null}
                    {i.origin && <button type="button" className="cto-was cto-link" onClick={stop(() => onItem({ issue: i.origin }))}>Fix of the post-release defect of {i.origin}</button>}
                  </td>
                  <td>{M.lines[i.line]}</td>
                  <td><span className="cto-kind"><i className="cto-sw" style={{ background: KIND_VAR[i.kind] }} />{KIND[i.kind]}</span></td>
                  <td>{SIZE[i.size]}</td>
                  <td className="is-num">{isFresh ? 'just now' : md(i.ship)}</td>
                  <td><div>{i.mins != null ? `${i.mins} min` : `${day1(i.cyc)} days`}</div><div className="cto-was">Before: about {day1(base[i.size])} days</div></td>
                  <td>{i.real ? <button type="button" className="cto-link" onClick={stop(() => onOpen({ run: i.real as string, focus: 'signoff' }))} title="The sign-off sheet on the team board">{i.signer} ↗</button> : i.signer}</td>
                  <td className="cto-ids">{i.issue ? <><div title={i.reporter ? `Raised by ${deliveryLabel(i.reporter)}${i.created ? `, created ${md(i.created)}` : ''}` : undefined}><span className="kt-mono">{i.issue}</span>{i.reporter && <span className="cto-was"> {deliveryLabel(i.reporter)}</span>}</div>{i.pr ? <div className="cto-was kt-mono">PR #{i.pr}</div> : null}</> : '—'}</td>
                  <td>
                    <div className="cto-src">
                      {i.real ? (
                        <>
                          <span className="cto-tag is-real">Measured</span>
                          <button type="button" className="kt-btn is-small cto-noprint" onClick={stop(() => onOpen({ run: i.real as string, replay: 30 }))}>▶ Replay ↗</button>
                        </>
                      ) : (
                        <span className="cto-tag">Simulated</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length > limit && (
          <button type="button" className="kt-btn is-small cto-noprint" style={{ marginTop: 10 }} onClick={() => setLimit((n) => n + 30)}>Show more ({fmt(rows.length - limit)} more)</button>
        )}
      </section>

      <details className="cto-notes" open={printing || undefined}>
        <summary>Method</summary>
        <ul>
          <li>Simulated, not measured: the deliveries before AI-DLC and the simulated ones after it are generated from the assumptions at the top of the page (fixed random seed). They show how the page reads and prove nothing about a team's efficiency. A delivery is measured only when it is marked Measured: a real run that a person signed off. The estimate beside a measured run uses the assumptions too.</li>
          <li>Data: delivery records of the last 12 weeks and the 12 weeks before AI-DLC for the simulated Larkspur Outfitters R&D centre ({M.lines.length} business lines, {M.peoplePerLine} people each){m.real ? `; plus ${m.real} deliver${m.real === 1 ? 'y' : 'ies'} from real runs that were signed off (including runs imported from other computers), marked Measured` : ''}. Only signed-off deliveries count.</li>
          <li>More: items released in the last 12 weeks ÷ items released in the first 12 weeks, same organisation and headcount.</li>
          <li>Faster: delivery cycle = release date − Issue creation date; "Before" is the average cycle of deliveries of the same size in the 12 weeks before AI-DLC. Cycles in the simulated history are sample values and do not stand for measured efficiency gains.</li>
          <li>Cheaper: cost per person-day of work = (actual person-days × ${fmt(M.dayRate)} + agent subscription) ÷ equivalent work completed. Equivalent work by size: small {M.eq.S}, medium {M.eq.M}, large {M.eq.L} person-days; human effort with agent collaboration: small {M.human.S}, medium {M.human.M}, large {M.human.L} person-days; the subscription is the agent seat at USD {M.seatUsdMonth} per person per month, converted at {M.fx}. All of these are assumptions, listed under Assumptions at the top and in docs/cto-view-data.md.</li>
          <li>More stable: defects reported after release per 100 new apps and new features (a defect reported after release is recorded as a fix delivery and linked back to the original delivery); measured deliveries have no post-release observation period yet and are not counted in this ratio. Problems caught before release = send-backs by checks, independent review and people at the gates in measured deliveries; for a risk stopped, the owner fills in the content and the amount when sending back at a gate.</li>
          <li>Value: this page does not estimate revenue. After you enter the gross margin per item per day, it is estimated as "number of new apps and new features × average days earlier × daily gross margin".</li>
          <li>Delivery tags (type, size, business line) are proposed by the role at the first gate and confirmed by the owner at the gate.</li>
          <li>Issue and PR: each delivery has one Issue (raised by, creation date) and one PR merged into main; the PR of a measured run is its run branch, merged when the owner signs off. A defect reported after release is recorded as a fix delivery and linked both ways with the original delivery.</li>
        </ul>
      </details>
      {toast && <div className="cto-toast" role="status">{toast}</div>}
    </div>
  )
}
