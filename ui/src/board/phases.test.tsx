/** v2 board: AI-DLC phase bands, the orchestrator, the gates card, and a person's gate answered from the graph. */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { TeamPage } from '../main'
import { apiCalls, setApiRoutes } from '../test/stubs/app-sdk'
import { aidlcBoard } from '../test/fixtures'

const BOARD = 'GET /api/apps/aidlc-team/board*'

afterEach(() => vi.restoreAllMocks())

describe('a phased team', () => {
  test('phases left to right, the orchestrator, the grey operation phase, and the gates card', async () => {
    setApiRoutes({ [BOARD]: () => aidlcBoard() })
    render(<TeamPage pollMs={60_000} />)
    const graph = await screen.findByTestId('kt-graph')
    expect(within(graph).getByTestId('kt-orch')).toBeInTheDocument()
    for (const p of ['Ideation', 'Inception', 'Construction', 'Review gate', 'Operation']) expect(graph.textContent).toContain(p)
    expect(graph.textContent).toContain('Not run this time')
    expect(graph.textContent).toContain('2.1 Reverse engineering')
    const gates = screen.getByTestId('kt-gates')
    expect(gates.textContent).toContain('40/82')
    expect(screen.getByText('What this run used')).toBeInTheDocument()
    expect(screen.queryByTestId('kt-saving')).toBeNull()
  })

  test('a gate waits for the person: Approve Scope posts the answer with the note', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [BOARD]: () => aidlcBoard(true), 'POST /api/apps/aidlc-team/runs/*': () => ({ ok: true }) })
    render(<TeamPage pollMs={60_000} />)
    const gate = await screen.findByTestId('kt-gate')
    await user.click(within(gate).getByRole('button', { name: /Approve Scope/ }))
    const dialog = await screen.findByTestId('kt-gate-dialog') // in the page: the desktop app has no window.prompt
    await user.type(within(dialog).getByLabelText('Comment'), 'Skip STORE-4 this time')
    await user.click(within(dialog).getByRole('button', { name: 'Confirm approval' }))
    await waitFor(() =>
      expect(apiCalls.find((c) => c.method === 'POST')).toMatchObject({ path: expect.stringMatching(/\/runs\/[^/]+\/gate$/), body: { role: 'scope', decision: 'approve', note: 'Skip STORE-4 this time' } }),
    )
  })
})

describe('a gate where the team offers Discuss and the role put questions to the person', () => {
  const asked = (gate: 'pending' | 'discussing' = 'pending') => {
    const b = aidlcBoard(true)
    const scope = b.run!.roles.find((l) => l.key === 'scope')!
    Object.assign(scope, {
      gate, can_discuss: true,
      questions: [
        { id: '1', q: 'How does the assistant communicate?', options: [{ key: 'A', text: 'In-house rules' }, { key: 'B', text: 'External LLM' }], recommend: 'A', why: 'Stays in the company' },
        { id: '2', q: 'Use Little Peach as the avatar?', options: [{ key: 'A', text: 'Use' }, { key: 'B', text: 'Do not use' }], recommend: 'B', why: '' },
      ],
      talk: [{ who: 'person', text: 'Why not for question 2?', at: 1, changed: null }, { who: 'agent', text: 'BR-4 does not list the avatar case.', at: 2, changed: false }],
    })
    b.run!.gate_discuss = true
    return b
  }

  test('Approve · Discuss · Send back under it; Discuss sends what the person asks, the gate stays', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [BOARD]: () => asked(), 'POST /api/apps/aidlc-team/runs/*': () => ({ ok: true }) })
    render(<TeamPage pollMs={60_000} />)
    const gate = await screen.findByTestId('kt-gate')
    expect(within(gate).getAllByRole('button').map((b) => b.textContent)).toEqual(['✓ Approve Scope', 'Discuss', 'Send back'])
    await user.click(within(gate).getByRole('button', { name: 'Discuss' }))
    const dialog = await screen.findByTestId('kt-gate-dialog')
    expect(within(dialog).getByText('Discuss Scope')).toBeInTheDocument()
    const talk = within(dialog).getByTestId('kt-gate-talk')
    expect(talk.textContent).toContain('YouWhy not for question 2?')
    expect(talk.textContent).toContain('BR-4 does not list the avatar case.')
    expect(within(dialog).queryByTestId('kt-gate-questions')).toBeNull() // the questions are answered when approving
    await user.click(within(dialog).getByRole('button', { name: 'Send' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Write what you want to ask or discuss')
    await user.type(within(dialog).getByLabelText('Discussion'), 'What if we use Little Peach?')
    await user.click(within(dialog).getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(apiCalls.find((c) => c.method === 'POST')).toMatchObject({ body: { role: 'scope', decision: 'discuss', note: 'What if we use Little Peach?' } }))
  })

  test('Approve answers each question: its recommendation picked first, another choice marked, Other needs words', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [BOARD]: () => asked(), 'POST /api/apps/aidlc-team/runs/*': () => ({ ok: true }) })
    render(<TeamPage pollMs={60_000} />)
    await user.click(within(await screen.findByTestId('kt-gate')).getByRole('button', { name: /Approve Scope/ }))
    const qs = within(await screen.findByTestId('kt-gate-dialog')).getByTestId('kt-gate-questions')
    const q1 = within(qs).getByRole('group', { name: 'Decision 1' })
    const q2 = within(qs).getByRole('group', { name: 'Decision 2' })
    expect(within(q1).getByRole('radio', { name: /A\. In-house rules/ })).toBeChecked()
    expect(within(q2).getByRole('radio', { name: /B\. Do not use/ })).toBeChecked()
    await user.click(within(q2).getByRole('radio', { name: /A\. Use/ }))
    expect(q2.textContent).toContain('Differs from the recommendation (B)')
    await user.click(within(q1).getByRole('radio', { name: 'Other' }))
    await user.click(screen.getByRole('button', { name: 'Confirm approval' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Decision 1 is set to "Other": write your decision')
    await user.type(within(q1).getByLabelText('Decision 1: other answer'), 'Rules first, evaluate next term')
    await user.click(screen.getByRole('button', { name: 'Confirm approval' }))
    await waitFor(() => expect(apiCalls.find((c) => c.method === 'POST')).toMatchObject({
      body: { role: 'scope', decision: 'approve', answers: { 1: { choice: 'other', text: 'Rules first, evaluate next term' }, 2: { choice: 'A', text: '' } } },
    }))
  })

  test('while the role answers, the gate says so and offers nothing to click', async () => {
    setApiRoutes({ [BOARD]: () => asked('discussing') })
    render(<TeamPage pollMs={60_000} />)
    const gate = await screen.findByTestId('kt-gate')
    expect(gate.textContent).toBe('Discussing · answering')
    expect(within(gate).queryByRole('button')).toBeNull()
  })
})

describe('The 14 official AI-DLC experts', () => {
  test('all 14 are shown, each in one of four states: at work, called, not its turn yet, not on this team', async () => {
    const { render: r, screen: s, within: w } = await import('@testing-library/react')
    const { ExpertStrip } = await import('./Header')
    const { aidlcBoard } = await import('../test/fixtures')
    const run = aidlcBoard(false).run!
    r(<ExpertStrip run={run} />)
    const strip = s.getByTestId('kt-experts')
    const items = w(strip).getAllByRole('listitem')
    expect(items).toHaveLength(14)
    const states = new Set(items.map((li) => li.getAttribute('data-state')))
    expect(states.has('none')).toBe(true) // e.g. AWS platform: no task on this team, shown greyed
    for (const li of items) expect(['Working', 'Called', 'Standing by', 'Not involved']).toContain(li.querySelector('small')?.textContent)
  })

  test("a company's own copies of the official experts are those experts; only a truly new one is custom", async () => {
    const { render: r, screen: s, within: w } = await import('@testing-library/react')
    const { ExpertStrip } = await import('./Header')
    const { officialOf } = await import('./format')
    const { aidlcBoard } = await import('../test/fixtures')
    expect([officialOf('luming-architect-agent'), officialOf('luming-motion-agent'), officialOf('aidlc-architect-agent')]).toEqual(['aidlc-architect-agent', '', 'aidlc-architect-agent'])
    const run = { ...aidlcBoard(false).run!, crew_members: ['luming-architect-agent', 'luming-operations-agent', 'luming-recruit-agent'] }
    r(<ExpertStrip run={run} />)
    const strip = s.getByTestId('kt-experts')
    const joined = w(strip).getAllByRole('listitem').filter((li) => li.getAttribute('data-state') === 'joined')
    expect(joined.map((li) => li.querySelector('b')?.textContent)).toEqual(['luming-recruit']) // on the page, nothing to do this time
    expect(strip.textContent).toContain('+ 1 custom')
  })
})
