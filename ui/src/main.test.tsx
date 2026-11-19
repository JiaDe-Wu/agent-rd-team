import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type { Board } from './types'
import { apiCalls, apiError, setApiRoutes } from './test/stubs/app-sdk'
import { clone, emptyBoard, multiRunBoard, runningBoard, setCase, withEvent } from './test/fixtures'
import { TeamPage, mostActive } from './main'
import { SCENARIOS } from './board/Header'

const BOARD = 'GET /api/apps/agent-rd-team/board*'
const ROUTE = 'POST /api/apps/agent-rd-team/route'
const RUNS = '/api/apps/agent-rd-team/runs'
/** What POST /route answers for an MVP requirement: the shop team, picked by the keyword. */
const shopPick = () => ({
  team: {
    file: 'team-shop.json', name: 'Online shop · MVP team', scope: 'mvp', keywords: ['mvp'], priority: 50, fallback: false, official_stages: 23,
    needs_source: false, starter: 'starters/shop', agents: ['aidlc-product-agent', 'aidlc-developer-agent'],
    stages: ['1.1 Intent capture', '3.5 Code generation'], extra_stages: [], extra_note: '',
    roles: [
      { key: 'product', title: 'Product', phase: 'ideation', stage: '1.1 Intent capture', aidlc_agent: 'aidlc-product-agent', gate: false },
      { key: 'architect', title: 'Architecture', phase: 'inception', stage: '2.8 Interface agreement', aidlc_agent: 'aidlc-architect-agent', gate: true },
      { key: 'catalog', title: 'Frontend · product list', phase: 'construction', stage: '3.5 Code generation', aidlc_agent: 'aidlc-developer-agent', gate: false },
    ],
  },
  matched: ['mvp'], why: 'AI-DLC mvp flow (the first version of a new product)', others: [], roster: [], teams: [],
})
const POLL = 25

/** A board route that serves *first* until `next()` switches it to *second*. */
function twoPhase(first: Board, second: Board) {
  let phase = 1
  setApiRoutes({ [BOARD]: () => clone(phase === 1 ? first : second) })
  return { next: () => (phase = 2) }
}

const lanes = () => screen.getAllByTestId('kt-lane')
const laneOf = (key: string) => lanes().find((l) => l.dataset.role === key)!
const particles = (c: HTMLElement) => c.querySelectorAll('.kt-p[data-src]')
const sleep = (ms: number) => act(() => new Promise<void>((r) => setTimeout(r, ms)))

function reduceMotion() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

afterEach(() => {
  delete (HTMLElement.prototype as { requestFullscreen?: unknown }).requestFullscreen
})

describe('the board', () => {
  test('renders the running fixture: 8 lanes, 6/12, the violation, the conflict, the reviewer waiting', async () => {
    setApiRoutes({ [BOARD]: () => runningBoard() })
    render(<TeamPage />)
    expect(await screen.findAllByTestId('kt-lane')).toHaveLength(8)
    expect(lanes().map((l) => l.dataset.role)).toEqual(['pm', 'architect', 'designer', 'tester', 'backend', 'frontend', 'ops', 'reviewer'])
    expect(screen.getByTestId('kt-tests-counter')).toHaveTextContent('6/12')
    expect(screen.getByTestId('kt-saving')).toHaveTextContent('Parallel work saved 23 min')
    expect(within(laneOf('frontend')).getByRole('alert')).toHaveTextContent('Changed something that is not its own backend/server.js')
    const conveyor = screen.getByTestId('kt-conveyor')
    expect(within(conveyor).getByText('backend/server.js').closest('.kt-belt-chip')).toHaveClass('is-conflict')
    expect(within(conveyor).getByText('1 conflict')).toBeInTheDocument()
    expect(within(laneOf('reviewer')).getByText('Waiting for Backend, Frontend, Operations')).toBeInTheDocument()
    expect(within(laneOf('backend')).getByText('Round 2')).toBeInTheDocument()
    expect(within(laneOf('backend')).getByText('Editing backend/validate.js')).toBeInTheDocument()
    expect(screen.getAllByTestId('kt-cell')).toHaveLength(12)
    expect(screen.getByTestId('kt-station')).toHaveAccessibleName('Tests 6/12')
    expect(within(screen.getByTestId('kt-graph')).getByRole('button', { name: /Backend: Fixing, round 2/ })).toBeInTheDocument()
    expect(apiCalls[0].path).toBe('/api/apps/agent-rd-team/board')
  })

  test('the first snapshot does not animate; a new handoff after it flies along its edge', async () => {
    const first = runningBoard()
    const second = withEvent(runningBoard(), { kind: 'handoff', role: 'reviewer', from: 'ops', to: 'reviewer', text: 'Operations handed its scripts to Review' })
    const p = twoPhase(first, second)
    const { container } = render(<TeamPage pollMs={POLL} />)
    await screen.findAllByTestId('kt-lane')
    await sleep(120) // several polls of the same snapshot
    expect(particles(container)).toHaveLength(0)
    expect(container.querySelectorAll('.kt-cell-face.is-flip, .kt-belt-chip.is-new, .kt-ev.is-new')).toHaveLength(0)
    p.next()
    await waitFor(() => expect(container.querySelector('.kt-p[data-src="r1006a#32"]')).not.toBeNull())
    expect(container.querySelector('.kt-p[data-src="r1006a#32"]')).toHaveAttribute('data-kind', 'handoff')
    expect(container.querySelector('.kt-ev.is-new[data-seq="32"]')).not.toBeNull()
  })

  test('a bounce flies red from the test station; a test case going red → green flips', async () => {
    const second = withEvent(setCase(runningBoard(), 'api-signup.test.js#AC-6', 'pass'), { kind: 'bounce', role: 'backend', from: 'tests', to: 'backend', text: 'AC-7 failed, sent back to Backend' })
    const p = twoPhase(runningBoard(), second)
    const { container } = render(<TeamPage pollMs={POLL} />)
    await screen.findAllByTestId('kt-lane')
    const cell = () => container.querySelector('[data-case="api-signup.test.js#AC-6"]')!
    expect(cell()).toHaveAttribute('data-status', 'fail')
    expect(cell().querySelector('.is-flip')).toBeNull()
    p.next()
    await waitFor(() => expect(cell()).toHaveAttribute('data-status', 'pass'))
    expect(cell().querySelector('.kt-cell-face.is-flip')).not.toBeNull()
    await waitFor(() => expect(container.querySelector('.kt-p.is-bounce[data-src="r1006a#32"]')).not.toBeNull())
    expect(screen.getByTestId('kt-tests-counter')).toHaveAccessibleName('Tests passed 7/12')
    expect(screen.getByTestId('kt-announce')).toHaveTextContent('Tests 6/12 → 7/12')
  })

  test('with reduced motion nothing flies or pulses, but the state still changes', async () => {
    reduceMotion()
    const second = withEvent(runningBoard(), { kind: 'handoff', role: 'reviewer', from: 'ops', to: 'reviewer', text: 'Operations handed its scripts to Review' })
    const p = twoPhase(runningBoard(), second)
    const { container } = render(<TeamPage pollMs={POLL} />)
    await screen.findAllByTestId('kt-lane')
    expect(screen.getByTestId('kt-root')).toHaveAttribute('data-motion', 'reduce')
    p.next()
    expect(await within(screen.getByTestId('kt-feed')).findByText('Operations handed its scripts to Review')).toBeInTheDocument()
    await sleep(150)
    expect(particles(container)).toHaveLength(0)
    expect(container.querySelector('.kt-node-halo[style]')).toBeNull()
  })

  test('projection: fullscreen where the API exists, bigger type, no chrome; Esc or Exit projection leaves it', async () => {
    const user = userEvent.setup()
    const fs = vi.fn().mockResolvedValue(undefined)
    HTMLElement.prototype.requestFullscreen = fs
    setApiRoutes({ [BOARD]: () => runningBoard() })
    render(<TeamPage />)
    await screen.findAllByTestId('kt-lane')
    await user.click(screen.getByRole('button', { name: 'Projection' }))
    const root = screen.getByTestId('kt-root')
    expect(root).toHaveAttribute('data-projection', 'true')
    expect(root).toHaveClass('is-projection')
    expect(fs).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'New requirement' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
    expect(screen.queryByText('Debug: probe')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Exit projection' }))
    expect(root).not.toHaveAttribute('data-projection')
    expect(screen.getByRole('button', { name: 'New requirement' })).toBeInTheDocument()
    // without the Fullscreen API: the CSS overlay, and Esc leaves it
    delete (HTMLElement.prototype as { requestFullscreen?: unknown }).requestFullscreen
    await user.click(screen.getByRole('button', { name: 'Projection' }))
    expect(root).toHaveAttribute('data-projection', 'true')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(root).not.toHaveAttribute('data-projection')
  })

  test('Starting a new run posts the requirement, then shows the new run', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [BOARD]: () => runningBoard(), [ROUTE]: () => shopPick(), 'POST /api/apps/agent-rd-team/runs': () => ({ run: 'r1007b' }) })
    render(<TeamPage pollMs={POLL} />)
    await screen.findAllByTestId('kt-lane')
    await user.click(screen.getByRole('button', { name: 'New requirement' }))
    // Team selection preview: the orchestrator's pick for the requirement, before anything starts
    expect(await screen.findByText(/AI-DLC mvp flow \(the first version of a new product\)/)).toBeInTheDocument()
    expect(within(screen.getByTestId('kt-pick')).getByText(/Covers 2 stages of the AI-DLC mvp flow/)).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Requirement for the agent team'))
    await user.type(screen.getByLabelText('Requirement for the agent team'), 'Build a book club signup page')
    await user.click(screen.getByRole('button', { name: 'Hand to the team' }))
    await waitFor(() => expect(apiCalls.find((c) => c.method === 'POST' && c.path === RUNS)).toEqual({ method: 'POST', path: RUNS, body: { requirement: 'Build a book club signup page', team: 'auto' } }))
    await waitFor(() => expect(apiCalls.some((c) => c.method === 'GET' && c.path === '/api/apps/agent-rd-team/board?run=r1007b')).toBe(true))
    expect(screen.queryByLabelText(/^Requirement/)).toBeNull()
  })

  test('the form proposes the demo requirement and auto team selection; a refused start shows why', async () => {
    const user = userEvent.setup()
    let ok = false
    setApiRoutes({
      [BOARD]: () => runningBoard(),
      'POST /api/apps/agent-rd-team/runs': () => {
        if (!ok) throw apiError(409, 'busy', 'A run is already going')
        return { run: 'r1007b' }
      },
    })
    render(<TeamPage />)
    await screen.findAllByTestId('kt-lane')
    await user.click(screen.getByRole('button', { name: 'New requirement' }))
    await user.click(screen.getByRole('button', { name: 'Hand to the team' }))
    expect(await within(screen.getByRole('form', { name: 'Give a requirement to the agent team' })).findByRole('alert')).toHaveTextContent('A run is already going (409)')
    expect(apiCalls.filter((c) => c.method === 'POST' && c.path === RUNS).map((c) => c.body)).toEqual([{ requirement: SCENARIOS[0].text, team: 'auto' }])
    ok = true
    await user.click(screen.getByRole('button', { name: 'Hand to the team' }))
    await waitFor(() => expect(screen.queryByLabelText(/^Requirement/)).toBeNull())
  })

  test('Stop asks first; only Confirm stop posts the stop', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [BOARD]: () => runningBoard(), 'POST /api/apps/agent-rd-team/runs/r1006a/stop': () => ({ ok: true }) })
    render(<TeamPage />)
    await screen.findAllByTestId('kt-lane')
    await user.click(screen.getByRole('button', { name: 'Stop' }))
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent('Stop "Event signup site"?')
    expect(dialog).toHaveTextContent('The 2 running and queued agents will be stopped')
    expect(apiCalls.some((c) => c.method === 'POST')).toBe(false)
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(apiCalls.some((c) => c.method === 'POST')).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Stop' }))
    await user.click(screen.getByRole('button', { name: 'Confirm stop' }))
    await waitFor(() => expect(apiCalls.filter((c) => c.method === 'POST').map((c) => c.path)).toEqual(['/api/apps/agent-rd-team/runs/r1006a/stop']))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  test('no runs: an inviting start panel with the AI-DLC team and the start form', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [BOARD]: () => emptyBoard(), 'POST /api/apps/agent-rd-team/runs': () => ({ id: 'r1' }) })
    render(<TeamPage />)
    const empty = await screen.findByTestId('kt-empty')
    expect(within(empty).getByRole('heading', { name: 'Building keeps getting cheaper; good products are still scarce' })).toBeInTheDocument()
    for (const t of ['Intent', 'Constraints', 'Scope', 'Architect', 'Requirements', 'UI design', 'Compliance & security', 'Testing', 'Backend', 'Web', 'Android', 'Operations', 'Review']) expect(within(empty).getByText(t)).toBeInTheDocument()
    expect(screen.queryAllByTestId('kt-lane')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
    await user.clear(within(empty).getByLabelText('Requirement for the agent team'))
    await user.type(within(empty).getByLabelText('Requirement for the agent team'), 'Build a club recruitment page')
    await user.click(within(empty).getByRole('button', { name: 'Hand to the team' }))
    await waitFor(() => expect(apiCalls.find((c) => c.method === 'POST' && c.path === RUNS)?.body).toEqual({ requirement: 'Build a club recruitment page', team: 'auto' }))
  })

  test('several runs: the picker asks the board for the chosen one', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [BOARD]: (_b, path) => multiRunBoard(new URL(path, 'http://x').searchParams.get('run')) })
    render(<TeamPage pollMs={POLL} />)
    await screen.findAllByTestId('kt-lane')
    const picker = screen.getByRole('combobox', { name: 'Select run' })
    expect(within(picker).getAllByRole('option')).toHaveLength(3)
    await user.selectOptions(picker, 'r1005z')
    await waitFor(() => expect(screen.getByText('Book club signup page', { selector: '.kt-run-title' })).toBeInTheDocument())
    expect(apiCalls.some((c) => c.path === '/api/apps/agent-rd-team/board?run=r1005z')).toBe(true)
    expect(screen.getByTestId('kt-tests-counter')).toHaveTextContent('12/12')
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
  })

  test('clicking a role looks at that role only: the feed filters, the rest dims; again shows all', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [BOARD]: () => runningBoard() })
    const { container } = render(<TeamPage />)
    await screen.findAllByTestId('kt-lane')
    const feed = screen.getByTestId('kt-feed')
    expect(within(feed).getByText('Frontend started')).toBeInTheDocument()
    await user.click(within(laneOf('backend')).getByRole('button', { name: 'Show only Backend' }))
    expect(within(feed).queryByText('Frontend started')).toBeNull()
    expect(within(feed).getByText('Backend started')).toBeInTheDocument()
    expect(within(feed).getByText('AC-6, AC-7 failed, sent back to Backend')).toBeInTheDocument()
    expect(laneOf('frontend')).toHaveClass('is-dim')
    expect(container.querySelector('.kt-node[data-role="frontend"]')).toHaveClass('is-dim')
    expect(container.querySelector('.kt-node[data-role="backend"]')).toHaveClass('is-focus')
    await user.click(within(laneOf('backend')).getByRole('button', { name: 'Stop showing only Backend' }))
    expect(within(feed).getByText('Frontend started')).toBeInTheDocument()
  })

  test('Follow enlarges and scrolls to the most active lane', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [BOARD]: () => runningBoard() })
    render(<TeamPage />)
    await screen.findAllByTestId('kt-lane')
    expect(mostActive(runningBoard().run!)).toBe('frontend')
    await user.click(screen.getByRole('button', { name: 'Follow' }))
    expect(laneOf('frontend')).toHaveClass('is-followed')
    expect(laneOf('backend')).not.toHaveClass('is-followed')
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
  })

  test('a board without its route says so', async () => {
    render(<TeamPage />)
    expect(await screen.findByText(/The backend does not have the board endpoint yet/)).toBeInTheDocument()
  })
})
