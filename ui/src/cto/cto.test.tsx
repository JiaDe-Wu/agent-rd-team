import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import AidlcTeamApp from '../main'
import { GateDialog } from '../board/Header'
import { SignOff } from '../board/SignOff'
import { parseView, searchOf } from '../nav'
import { apiCalls, navigations, setApiRoutes } from '../test/stubs/app-sdk'
import { clone, finishedBoard, multiRunBoard, runningBoard } from '../test/fixtures'
import type { Delivery } from '../types'
import { CtoView } from './CtoView'
import { segAt } from './stream'
import { ctoData, ctoFlow } from './testdata'

const API = '/api/apps/agent-rd-team'

function routes(data = ctoData()) {
  setApiRoutes({ [`GET ${API}/cto`]: () => clone(data), [`GET ${API}/cto/flow*`]: () => clone(ctoFlow()), [`GET ${API}/board*`]: () => clone(runningBoard()) })
}

describe('the CTO view and the board, both ways', () => {
  test('the app opens on the CTO view; its three views are tabs of one bar that stays where it is', async () => {
    const user = userEvent.setup()
    routes()
    render(<AidlcTeamApp pollMs={60_000} />)
    expect(await screen.findByTestId('cto-more')).toHaveTextContent('1.3×')
    expect(screen.getByTestId('cto-fast')).toHaveTextContent('30 days → 7 days')
    expect(screen.getByText(/2 of them are real runs \(measured\)/)).toBeInTheDocument()
    const bar = screen.getByTestId('kt-appbar')
    expect(within(bar).getByRole('tab', { name: 'CTO view' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1) // the app's name, once
    await user.click(within(bar).getByRole('tab', { name: 'Team board' }))
    expect(window.location.search).toBe('?view=board')
    expect(await screen.findByTestId('kt-run-status')).toBeInTheDocument()
    expect(screen.getByTestId('kt-appbar')).toBe(bar) // the same bar, not a second one
    expect(within(bar).getByRole('tab', { name: 'Team board' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /CTO view/ })).toBeNull()
    expect(screen.getAllByRole('button', { name: 'Projection' })).toHaveLength(1) // the app's, not one per view
    await user.click(within(bar).getByRole('tab', { name: 'Delivery detail' }))  // the delivery in hand: the board's run
    expect(window.location.search).toBe('?view=item&run=r1006a&from=board')  // ← Back to the team board
    await user.click(within(bar).getByRole('tab', { name: 'CTO view' }))
    expect(window.location.search).toBe('?hl=r1006a')
    expect(await screen.findByTestId('cto-more')).toBeInTheDocument()
  })

  test('Projection is the app’s: switching views keeps it on; Exit projection or Esc ends it', async () => {
    const user = userEvent.setup()
    routes()
    render(<AidlcTeamApp pollMs={60_000} />)
    await screen.findByTestId('cto-more')
    const bar = within(screen.getByTestId('kt-appbar'))
    await user.click(bar.getByRole('button', { name: 'Projection' }))
    expect(screen.getByTestId('kt-app')).toHaveClass('is-projection')
    expect(screen.getByTestId('cto-root')).toHaveClass('is-projection')
    await user.click(bar.getByRole('tab', { name: 'Team board' }))
    expect(await screen.findByTestId('kt-root')).toHaveClass('is-projection')
    expect(screen.getByTestId('kt-app')).toHaveClass('is-projection')
    await user.click(bar.getByRole('tab', { name: 'CTO view' }))
    expect(await screen.findByTestId('cto-root')).toHaveClass('is-projection')
    await user.keyboard('{Escape}')
    expect(screen.getByTestId('kt-app')).not.toHaveClass('is-projection')
    await user.click(bar.getByRole('button', { name: 'Projection' }))
    await user.click(bar.getByRole('button', { name: 'Exit projection' }))
    expect(screen.getByTestId('cto-root')).not.toHaveClass('is-projection')
  }, 15_000)

  test('every delivery shows its Issue and PR; one with a defect after it shipped says so', async () => {
    routes()
    render(<CtoView onOpen={() => {}} pollMs={60_000} />)
    await screen.findByTestId('cto-more')
    const table = within(screen.getByRole('region', { name: 'Delivery list' })).getByRole('table')
    const row = within(table).getByText('Product spec comparison (refrigerators)').closest('tr') as HTMLElement
    expect(row).toHaveTextContent('LO-2790')
    expect(row).toHaveTextContent('LO-2790 MerchandisingPR #2990')
    expect(row).toHaveTextContent('Post-release defects 1 · fixes in LO-2801')
    expect(within(table).getByText('Black Friday appliance sale page').closest('tr')).toHaveTextContent('PR #5123')
    expect(screen.getByTestId('cto-live-card')).toHaveTextContent('E-commerce · LO-4130')
  })

  test('a run of this app waiting at its gate is a card that opens the board at that gate', async () => {
    const user = userEvent.setup()
    routes()
    render(<AidlcTeamApp pollMs={60_000} />)
    const card = await screen.findByTestId('cto-live-card')
    expect(card).toHaveTextContent('Release gate')
    expect(card).toHaveTextContent('The independent review has a verdict; waiting for the owner to decide')
    await user.click(within(card).getByRole('button', { name: 'Go to approve ↗' }))
    expect(parseView(window.location.search)).toEqual({ kind: 'board', run: 'r1020gate', gate: 'compliance', from: 'cto' })
    await waitFor(() => expect(apiCalls.some((c) => c.path === `${API}/board?run=r1020gate`)).toBe(true))
  })

  test('a delivered measured delivery opens its Delivery detail: four numbers, the value stream, what people decided; each opens the board there', async () => {
    const user = userEvent.setup()
    routes()
    render(<AidlcTeamApp pollMs={60_000} />)
    const flow = await screen.findByRole('region', { name: 'Requirement flow' })
    await user.click(within(flow).getByRole('button', { name: /Black Friday appliance sale page/ }))
    expect(parseView(window.location.search)).toEqual({ kind: 'item', run: 'r1013f04d', from: 'cto' })
    expect(await screen.findByTestId('item-cycle')).toHaveTextContent('17 min')
    const item = screen.getByTestId('item-root')
    expect(within(item).getByRole('article', { name: 'Where the time went' })).toHaveTextContent('8 minAgent working · awaiting approval 9 min (3 gates)')
    expect(within(item).getByRole('article', { name: 'More stable' })).toHaveTextContent('Checks 37/37')
    expect(within(item).getByRole('article', { name: 'More stable' })).toHaveTextContent('Sent back 1×: people 1 · review 0 · checks 0')
    expect(within(item).getByTestId('cto-item-risk')).toHaveTextContent('Risk stopped: Price-adjustment refund above the $42,000 approval limit $29.0k (Release gate) ↗')
    const decided = within(item).getByRole('region', { name: 'Owner decisions' })
    expect(decided).toHaveTextContent('Sent back ReleasePrice-adjustment refund $68,000, above $42,000 needs CFO approval')
    await user.click(within(decided).getAllByRole('button', { name: 'Board · replay to this moment ↗' })[1])
    expect(parseView(window.location.search)).toEqual({ kind: 'board', run: 'r1013f04d', gate: 'compliance', at: 731, from: 'item' })
  })

  test('each segment and moment of the value stream opens the board at that phase or gate, at that moment', async () => {
    const user = userEvent.setup()
    routes()
    window.history.replaceState(null, '', '/apps/agent-rd-team?view=item&run=r1013f04d')
    render(<AidlcTeamApp pollMs={60_000} />)
    const stream = await screen.findByTestId('item-stream')
    await user.click(within(stream).getByRole('button', { name: /^Construction/ }))
    expect(parseView(window.location.search)).toEqual({ kind: 'board', run: 'r1013f04d', phase: 'construction', at: 260, from: 'item' })
  })

  test('a moment of the value stream and its PR open the board too', async () => {
    const user = userEvent.setup()
    routes()
    window.history.replaceState(null, '', '/apps/agent-rd-team?view=item&run=r1013f04d')
    render(<AidlcTeamApp pollMs={60_000} />)
    const stream = await screen.findByTestId('item-stream')
    await user.click(within(stream).getByRole('button', { name: /Sent back Release: replay the board to this moment/ }))
    expect(parseView(window.location.search)).toEqual({ kind: 'board', run: 'r1013f04d', role: 'compliance', at: 731, from: 'item' })
  })

  test('a simulated delivery says it has no run, and offers the similar measured delivery', async () => {
    const user = userEvent.setup()
    routes()
    render(<AidlcTeamApp pollMs={60_000} />)
    const table = within(await screen.findByRole('region', { name: 'Delivery list' })).getByRole('table')
    await user.click(within(table).getByText('Product spec comparison (refrigerators)'))
    expect(parseView(window.location.search)).toEqual({ kind: 'item', issue: 'LO-2790', from: 'cto' })
    expect(await screen.findByText('Simulated delivery with no run record: the step details only exist for real runs.')).toBeInTheDocument()
    const twin = screen.getByTestId('item-twin')
    expect(twin).toHaveTextContent('Black Friday appliance sale page')
    expect(screen.getByRole('article', { name: 'More stable' })).toHaveTextContent('Post-release defects 1:LO-2801')
    await user.click(within(twin).getByRole('button', { name: 'See its value stream ↗' }))
    expect(parseView(window.location.search)).toEqual({ kind: 'item', run: 'r1013f04d' })
  })

  test('the CTO view picks out the delivery it comes back to; its checks and signature open the board', async () => {
    const user = userEvent.setup()
    routes()
    window.history.replaceState(null, '', '/apps/agent-rd-team?hl=LO-2790')
    render(<AidlcTeamApp pollMs={60_000} />)
    const table = within(await screen.findByRole('region', { name: 'Delivery list' })).getByRole('table')
    await waitFor(() => expect(within(table).getByText('Product spec comparison (refrigerators)').closest('tr')).toHaveClass('is-hl'))
    await user.click(within(table).getByRole('button', { name: 'Checks 37/37 passed ↗' }))
    expect(parseView(window.location.search)).toEqual({ kind: 'board', run: 'r1013f04d', focus: 'tests', from: 'cto' })
  })

  test('a column of Requirement flow opens that phase on the board; Weekly releases and Faster filter the ledger', async () => {
    const user = userEvent.setup()
    routes()
    const opened: unknown[] = []
    render(<CtoView onOpen={(e) => opened.push(e)} pollMs={60_000} />)
    const flow = await screen.findByRole('region', { name: 'Requirement flow' })
    await user.click(within(flow).getByRole('button', { name: /^Construction ↗/ }))
    expect(opened).toEqual([{ run: 'r1013f04d', phase: 'construction', pick: 'latest' }])  // no run of this app is in Construction now
    await user.click(within(screen.getByRole('article', { name: 'Faster' })).getByLabelText('Medium: see deliveries of this size'))
    expect(screen.getByTestId('cto-ledger-count')).toHaveTextContent('3 items')
    await user.click(screen.getByRole('button', { name: 'Stop filtering by size' }))
    expect(screen.getByTestId('cto-ledger-count')).toHaveTextContent('5 items')
    await user.click(within(screen.getByRole('region', { name: 'Weekly releases' })).getAllByLabelText(/Week from .*: see this week's deliveries/)[3])  // before AI-DLC: 06-01 and 06-02
    expect(screen.getByRole('button', { name: 'Stop filtering by week' })).toBeInTheDocument()
    expect(screen.getByTestId('cto-ledger-count')).toHaveTextContent('2 items')
  }, 15_000)

  test('the sign-off sheet and Delivery detail go both ways', async () => {
    const user = userEvent.setup()
    const run = clone(finishedBoard()).run!
    run.signoff = { by: 'R&D lead', note: '', at: run.ended_at ?? 0, tests: '37/37' }
    const onItem = vi.fn()
    render(<SignOff run={run} onCto={() => {}} onItem={onItem} />)
    await user.click(screen.getByRole('button', { name: 'Delivery detail ↗' }))
    expect(onItem).toHaveBeenCalled()
  })

  test('a measured row’s ▶ Replay ↗ opens its replay, not its Delivery detail', async () => {
    const user = userEvent.setup()
    routes()
    render(<AidlcTeamApp pollMs={60_000} />)
    const table = within(await screen.findByRole('region', { name: 'Delivery list' })).getByRole('table')
    await user.click(within(table).getAllByRole('button', { name: '▶ Replay ↗' })[0])
    expect(parseView(window.location.search)).toEqual({ kind: 'board', run: 'r1013f04d', replay: 30, from: 'cto' })
  })

  test('a business line filters every number, the kanban and the ledger', async () => {
    const user = userEvent.setup()
    routes()
    render(<CtoView onOpen={() => {}} pollMs={60_000} />)
    await screen.findByTestId('cto-more')
    expect(screen.getByTestId('cto-ledger-count')).toHaveTextContent('5 items')
    await user.click(screen.getByRole('button', { name: /^Supply chain/ }))
    expect(screen.getByTestId('cto-more')).toHaveTextContent('1.0×')
    expect(screen.getByTestId('cto-ledger-count')).toHaveTextContent('1 item')
    expect(screen.getByTestId('cto-flow-stats')).toHaveTextContent('In progress 1·Agent working 1·Awaiting approval 0·Backlog 0')
    await user.click(screen.getByRole('button', { name: /^E-commerce/ }))
    expect(screen.getByTestId('cto-flow-stats')).toHaveTextContent('Awaiting approval 1')
  })

  test('the ledger downloads as CSV, as filtered', async () => {
    const user = userEvent.setup()
    routes()
    const made: Blob[] = []
    URL.createObjectURL = vi.fn((b: Blob) => (made.push(b), 'blob:cto')) as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<CtoView onOpen={() => {}} pollMs={60_000} />)
    await screen.findByTestId('cto-more')
    await user.click(screen.getByRole('button', { name: 'Measured only' }))
    await user.click(screen.getByText('Download ▾'))
    await user.click(screen.getByRole('button', { name: 'Delivery list (CSV, with the current filter)' }))
    expect(click).toHaveBeenCalled()
    const text = await new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsText(made[0]) })
    expect(text).toContain('r1013f04d')
    expect(text.split('\r\n')[0]).toContain('Issue,Raised by,Issue created,Release date')
    expect(text).toContain('LO-4127,Operations,2026-10-19')
    expect(screen.getByRole('status')).toHaveTextContent('Exported 2 rows (All business lines · measured only)')
  })

  test('a run signed off since the last look is just now, on the kanban and in the ledger', async () => {
    let calls = 0
    setApiRoutes({
      [`GET ${API}/cto`]: () => {
        const d = ctoData()
        if (++calls > 1) d.items.unshift({ ...d.items[0], t: 'Black Friday store sale', real: 'r1020gate', ship: '2026-10-20' })
        return d
      },
    })
    render(<CtoView onOpen={() => {}} pollMs={30} />)
    await screen.findByTestId('cto-more')
    await waitFor(() => expect(screen.getAllByText('just now').length).toBeGreaterThanOrEqual(2))
    expect(screen.getByText(/3 of them are real runs/)).toBeInTheDocument()
  })

  test('the URL carries the view and the way into the board; anything else is the CTO view', () => {
    expect(parseView('')).toEqual({ kind: 'cto' })
    expect(parseView('?view=board&run=r1013f04d&replay=30&focus=signoff&gate=compliance')).toEqual({ kind: 'board', run: 'r1013f04d', gate: 'compliance', replay: 30, focus: 'signoff' })
    expect(parseView('?view=board&run=../x&replay=7&gate=Bad Role&new=promo')).toEqual({ kind: 'board', new: 'promo' })
    expect(searchOf({ kind: 'board', run: 'r1020gate', gate: 'compliance' })).toBe('?view=board&run=r1020gate&gate=compliance')
    expect(searchOf({ kind: 'cto' })).toBe('')
  })
})

describe('the board side of it', () => {
  const proposal: Delivery = { name: 'Black Friday appliance sale page', kind: 'New feature', size: 'Medium', line: 'E-commerce', why: 'The official store sale campaign page', confirmed: false }

  test('approving the planner’s gate confirms its delivery tag, as proposed or changed', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn(async () => {})
    render(<GateDialog label="Requirements" decision="approve" delivery={proposal} onConfirm={onConfirm} onCancel={() => {}} />)
    const box = screen.getByTestId('kt-gate-delivery')
    expect(box).toHaveTextContent('Delivery tag (proposed: The official store sale campaign page)')
    await user.selectOptions(within(box).getByLabelText('Size'), 'Large')
    await user.click(screen.getByRole('button', { name: 'Confirm approval' }))
    expect(onConfirm).toHaveBeenCalledWith('', { name: 'Black Friday appliance sale page', kind: 'New feature', size: 'Large', line: 'E-commerce' })
  })

  test('sending the gate back asks nothing about labels', () => {
    render(<GateDialog label="Requirements" decision="revise" delivery={proposal} onConfirm={async () => {}} onCancel={() => {}} />)
    expect(screen.queryByTestId('kt-gate-delivery')).toBeNull()
  })

  test('a signed sign-off sheet says the delivery is in the CTO view, and goes there', async () => {
    const user = userEvent.setup()
    const run = clone(finishedBoard()).run!
    run.signoff = { by: 'R&D lead', note: '', at: run.ended_at ?? 0, tests: '37/37' }
    const onCto = vi.fn()
    render(<SignOff run={run} onCto={onCto} />)
    await user.click(screen.getByRole('button', { name: 'Counted on the CTO view ↗' }))
    expect(onCto).toHaveBeenCalled()
  })

  test('the sign-off sheet and the top bar carry the run’s Issue and PR: Waiting to merge until the signature, then merged into main', () => {
    const run = clone(finishedBoard()).run!
    run.issue = { id: 'LO-4127', kind: 'Requirement', reporter: 'Operations', created_at: run.started_at }
    run.pr = { number: 5123, head: `team/${run.id}/run`, base: 'main', state: 'open', opened_at: run.ended_at ?? 0, merged_at: null, merged_by: null,
      sha: '', files: 12, added: 340, removed: 8, checks: '37/37', review: 'The review says it can be merged' }
    const { rerender } = render(<SignOff run={run} onSign={async () => {}} />)
    expect(screen.getByTestId('kt-sign-pr')).toHaveTextContent(`Issue LO-4127 (Requirement · raised by Operations) → PR #5123: team/${run.id}/run → main · Waiting to merge: merged into main when signed off`)
    run.signoff = { by: 'R&D lead', note: '', at: run.ended_at ?? 0, tests: '37/37' }
    run.pr = { ...run.pr, state: 'merged', sha: 'a1b2c3d' }
    rerender(<SignOff run={clone(run)} />)
    expect(screen.getByTestId('kt-sign-pr')).toHaveTextContent('Merged into main (a1b2c3d)')
    rerender(<SignOff run={{ ...clone(run), imported: { from: 'MacBook' }, pr: { ...run.pr, state: 'signed', sha: '' } }} />)
    expect(screen.getByTestId('kt-sign-pr')).toHaveTextContent('the run was imported from another computer and the code repository is not here, so nothing was merged here')
  })
})

describe('moving between the three views', () => {
  const ledgerOf = () => within(screen.getByRole('region', { name: 'Delivery list' })).getByRole('table')

  test('a move to another view is a history entry: back returns to the CTO view with its filters and the row left from', async () => {
    const user = userEvent.setup()
    routes()
    render(<AidlcTeamApp pollMs={60_000} />)
    await screen.findByTestId('cto-more')
    await user.click(screen.getByRole('button', { name: /^E-commerce/ }))
    await user.click(within(screen.getByRole('region', { name: 'Delivery list' })).getByRole('button', { name: 'New feature' }))
    expect(window.location.search).toBe('?line=0&kind=feat')  // a filter rewrites the entry
    const length = window.history.length
    await user.click(within(ledgerOf()).getByText('Product spec comparison (refrigerators)'))
    expect(parseView(window.location.search)).toEqual({ kind: 'item', issue: 'LO-2790', from: 'cto' })
    expect(window.history.length).toBe(length + 1)  // the move is a new entry
    expect(navigations).toEqual(['/apps/agent-rd-team?view=item&issue=LO-2790&from=cto'])  // made by the host's router (its ← → know about it)
    expect((window.history.state as { ktDepth?: number }).ktDepth).toBe(1)
    window.history.back()
    await waitFor(() => expect(window.location.search).toBe('?line=0&kind=feat&hl=LO-2790'))
    expect(await screen.findByTestId('cto-ledger-count')).toHaveTextContent('3 items')
    await waitFor(() => expect(within(ledgerOf()).getByText('Product spec comparison (refrigerators)').closest('tr')).toHaveClass('is-hl'))
    window.history.forward()
    await waitFor(() => expect(window.location.search).toBe('?view=item&issue=LO-2790&from=cto'))
    expect(await screen.findByTestId('item-root')).toBeInTheDocument()
  })

  test('the breadcrumb back to the CTO view brings back the filters it was left with', async () => {
    const user = userEvent.setup()
    routes()
    render(<AidlcTeamApp pollMs={60_000} />)
    await screen.findByTestId('cto-more')
    await user.click(screen.getByRole('button', { name: /^E-commerce/ }))
    await user.click(within(ledgerOf()).getByText('Product spec comparison (refrigerators)'))
    await user.click(await screen.findByRole('button', { name: 'CTO view' }))
    expect(parseView(window.location.search)).toEqual({ kind: 'cto', line: 0, hl: 'LO-2790' })
    expect(await screen.findByTestId('cto-ledger-count')).toHaveTextContent('3 items')
  })

  test('a row not under the filters it comes back to: they are relaxed, and the page says so', async () => {
    routes()
    window.history.replaceState(null, '', '/apps/agent-rd-team?line=3&hl=LO-2790')  // Supply chain, but the spec comparison is E-commerce
    render(<AidlcTeamApp pollMs={60_000} />)
    expect(await screen.findByText('This item was not in the previous filter; now showing all business lines and types')).toBeInTheDocument()
    await waitFor(() => expect(within(ledgerOf()).getByText('Product spec comparison (refrigerators)').closest('tr')).toHaveClass('is-hl'))
  })

  test('a ledger row opens with the keyboard', async () => {
    const user = userEvent.setup()
    routes()
    render(<AidlcTeamApp pollMs={60_000} />)
    await screen.findByTestId('cto-more')
    within(ledgerOf()).getByText('Product spec comparison (refrigerators)').closest('tr')!.focus()
    await user.keyboard('{Enter}')
    expect(parseView(window.location.search)).toEqual({ kind: 'item', issue: 'LO-2790', from: 'cto' })
  })

  test('the run picked in the board picker is what the URL says; See each member usage opens the lanes', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [`GET ${API}/cto`]: () => clone(ctoData()), [`GET ${API}/cto/flow*`]: () => clone(ctoFlow()),
      [`GET ${API}/board*`]: (_b: unknown, path: string) => multiRunBoard(new URL(path, 'http://x').searchParams.get('run')) })
    window.history.replaceState(null, '', '/apps/agent-rd-team?view=board&run=r1006a')
    render(<AidlcTeamApp pollMs={60_000} />)
    await user.selectOptions(await screen.findByRole('combobox', { name: 'Select run' }), 'r1005z')
    expect(window.location.search).toBe('?view=board&run=r1005z')
    window.history.replaceState(null, '', '/apps/agent-rd-team?view=item&run=r1013f04d')
    window.dispatchEvent(new PopStateEvent('popstate'))
    await user.click(await screen.findByRole('button', { name: 'See each member\'s usage ↗' }))
    expect(parseView(window.location.search)).toEqual({ kind: 'board', run: 'r1013f04d', focus: 'lanes', from: 'item' })
  })

  test('a moment between two segments (or rounded down) picks out the next one', () => {
    const segs = [{ from: 55.3, to: 90.6 }, { from: 91.4, to: 260.8 }] as unknown as Parameters<typeof segAt>[0]
    expect([segAt(segs, 60), segAt(segs, 91), segAt(segs, 300), segAt(segs, undefined)]).toEqual([0, 1, -1, -1])
  })

  test('back on Delivery detail at a moment of the board: that segment of the value stream is picked out', async () => {
    routes()
    window.history.replaceState(null, '', '/apps/agent-rd-team?view=item&run=r1013f04d&at=300')
    render(<AidlcTeamApp pollMs={60_000} />)
    const stream = await screen.findByTestId('item-stream')
    const picked = stream.querySelector('[data-hl="true"]')
    expect(picked?.textContent).toContain('Construction')
    expect(screen.getByTestId('item-at')).toHaveTextContent('5:00 on the team board falls in "Construction", outlined')
  })

  test('Delivery detail opened from the board has its way back there, beside its actions', async () => {
    const user = userEvent.setup()
    routes()
    window.history.replaceState(null, '', '/apps/agent-rd-team?view=board&run=r1006a')
    render(<AidlcTeamApp pollMs={60_000} />)
    await screen.findByTestId('kt-graph')
    await user.click(screen.getByRole('tab', { name: 'Delivery detail' }))
    await user.click(await screen.findByRole('button', { name: '← Back to the team board' }))
    await waitFor(() => expect(window.location.search).toBe('?view=board&run=r1006a'))
  })
})

describe('More stable: the fourth outcome, defects after release and what was caught before it', () => {
  test('the card compares defects per 100 new apps and features, counts what measured runs caught, and opens the largest risk', async () => {
    const user = userEvent.setup()
    routes()
    render(<AidlcTeamApp pollMs={60_000} />)
    expect(await screen.findByRole('heading', { name: 'Same 60 people: the last 12 weeks against the 12 weeks before AI-DLC' })).toBeInTheDocument()
    const card = screen.getByRole('article', { name: 'More stable' })
    expect(within(card).getByTestId('cto-steady')).toHaveTextContent('0.0 → 50.0') // the test data: none before, 1 of 2 since
    expect(within(card).getByText('Post-release defects per 100 new apps and new features')).toBeInTheDocument()
    expect(within(card).getByTestId('cto-caught')).toHaveTextContent('2 measured deliveries caught 3 problems before release: checks 2 · review 0 · people 1')
    await user.click(within(card).getByTestId('cto-risk'))
    expect(parseView(window.location.search)).toEqual({ kind: 'item', run: 'r1013f04d', at: 731, from: 'cto' })
  })

  test('its number filters the ledger to deliveries with defects after release, and the URL keeps the filter', async () => {
    const user = userEvent.setup()
    routes()
    render(<AidlcTeamApp pollMs={60_000} />)
    await user.click(await screen.findByTestId('cto-steady'))
    const ledger = screen.getByRole('region', { name: 'Delivery list' })
    expect(within(ledger).getByText('Has post-release defects')).toBeInTheDocument()
    expect(within(ledger).getByTestId('cto-ledger-count')).toHaveTextContent('1 item')
    expect(within(ledger).getByText('Product spec comparison (refrigerators)')).toBeInTheDocument()
    await waitFor(() => expect(window.location.search).toContain('defect=1'))
    expect(parseView('?defect=1')).toEqual({ kind: 'cto', defects: true })
    expect(searchOf({ kind: 'cto', defects: true })).toBe('?defect=1')
    await user.click(within(ledger).getByRole('button', { name: 'Stop filtering by post-release defects' }))
    expect(within(ledger).queryByText('Has post-release defects')).toBeNull()
  })

  test('a send-back can note the risk it keeps from going live; the preset fills it in; without one nothing extra is sent', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn(async () => undefined)
    const { unmount } = render(<GateDialog label="Release" decision="revise" preset="Sent back on the pre-release check. Send back: Backend #1" presetRisk={{ what: 'Price-adjustment refund above the $42,000 approval limit', amount: 29000 }} report="" onConfirm={onConfirm} onCancel={() => undefined} />)
    const risk = screen.getByTestId('kt-gate-risk')
    await user.click(screen.getByRole('button', { name: 'Fill in the preset comment' }))
    expect(within(risk).getByLabelText('Risk stopped')).toHaveValue('Price-adjustment refund above the $42,000 approval limit')
    expect(within(risk).getByLabelText('Amount (USD thousands)')).toHaveValue(29)
    await user.click(screen.getByRole('button', { name: 'Confirm send back' }))
    expect(onConfirm).toHaveBeenCalledWith('Sent back on the pre-release check. Send back: Backend #1', undefined, undefined, { what: 'Price-adjustment refund above the $42,000 approval limit', amount: 29000 })
    unmount()
    const plain = vi.fn(async () => undefined)
    render(<GateDialog label="Requirements" decision="revise" onConfirm={plain} onCancel={() => undefined} />)
    await user.type(screen.getByLabelText('Comment'), 'An acceptance criterion is missing')
    await user.click(screen.getByRole('button', { name: 'Confirm send back' }))
    expect(plain).toHaveBeenCalledWith('An acceptance criterion is missing')
    expect(screen.queryByTestId('kt-gate-risk')).toBeInTheDocument() // Send back offers it…
  })

  test('approving offers no risk, and the sign-off sheet lists the risks people noted', () => {
    render(<GateDialog label="Requirements" decision="approve" onConfirm={async () => undefined} onCancel={() => undefined} />)
    expect(screen.queryByTestId('kt-gate-risk')).toBeNull() // …Approve does not: nothing was kept from going live
    const run = clone(finishedBoard()).run!
    run.risks = [{ what: 'Price-adjustment refund above the $42,000 approval limit', amount: 29000, gate: 'Release', role: 'compliance', at: 1 }]
    render(<SignOff run={run} />)
    expect(screen.getByTestId('kt-sign-risks')).toHaveTextContent('Price-adjustment refund above the $42,000 approval limit $29.0k (noted when Release was sent back)')
  })
})
