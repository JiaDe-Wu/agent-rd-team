import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import type { Board } from '../types'
import { apiCalls, setApiRoutes } from '../test/stubs/app-sdk'
import { clone, runningBoard } from '../test/fixtures'
import { TeamPage } from '../main'
import { layoutGraph } from './layout'
import { SCENARIOS, StartForm } from './Header'

const API = '/api/apps/aidlc-team'

/** The fixture run, finished green and not signed yet. */
function doneBoard(signed = false): Board {
  const b = runningBoard()
  b.run!.status = 'done'
  b.runs[0].status = 'done'
  b.run!.tests = { ...b.run!.tests, failed: 0, passed: b.run!.tests.total || 1, total: b.run!.tests.total || 1, cases: b.run!.tests.cases.map((c) => ({ ...c, status: 'pass' as const })) }
  b.run!.sign_block = '' // finished, and what it deploys went out
  if (!signed) b.run!.signoff = null
  return b
}

describe('V3: knowledge base, applicable standards, sign-off sheet', () => {
  test('the board shows the standards the requirement touched and what the roles looked up', async () => {
    setApiRoutes({ [`GET ${API}/board*`]: () => clone(runningBoard()) })
    render(<TeamPage pollMs={60_000} />)
    const kb = await screen.findByTestId('kt-kb')
    expect(within(kb).getByText(/Standard: Annual party raffle rules/)).toBeTruthy()
    expect(within(kb).getByText(/Data: Employee roster/)).toBeTruthy()
    expect(within(kb).getByText('Searched the knowledge base for "Annual party raffle rules RULE-1"')).toBeTruthy()
    expect(within(kb).getByText('Read data employees.json')).toBeTruthy()
    expect(within(kb).getByText(/9 documents · Synced/)).toBeTruthy()
    expect(screen.queryByTestId('kt-sign')).toBeNull() // still running: nothing to sign yet
  })

  test('a finished run gets a sign-off card; the person signs for the release', async () => {
    const user = userEvent.setup()
    let signed = false
    setApiRoutes({
      [`GET ${API}/board*`]: () => clone(doneBoard(signed)),
      [`POST ${API}/runs/r1006a/signoff`]: () => {
        signed = true
        return { ok: true }
      },
    })
    render(<TeamPage pollMs={60_000} />)
    const card = await screen.findByTestId('kt-sign')
    expect(within(card).getByText('Confirmed by the owner before release')).toBeTruthy()
    await user.type(within(card).getByLabelText('Signer'), 'R&D lead')
    await user.click(within(card).getByRole('button', { name: 'Sign off' }))
    expect(apiCalls.filter((c) => c.method === 'POST' && c.path.endsWith('/signoff')).map((c) => c.body)).toEqual([{ by: 'R&D lead', note: '' }])
    expect(await within(await screen.findByTestId('kt-sign')).findByText(/signed off on/)).toBeTruthy()
  })
})

describe('Who sits this run out, what can be signed off', () => {
  test('a run that delivered nothing gets a sign-off card that says why it cannot be signed', async () => {
    const b = doneBoard()
    b.run!.status = 'failed'
    b.runs[0].status = 'failed'
    b.run!.sign_block = 'The run failed and nothing was delivered, so it cannot be signed off (you can retry the failed roles)'
    setApiRoutes({ [`GET ${API}/board*`]: () => clone(b) })
    render(<TeamPage pollMs={60_000} />)
    const card = await screen.findByTestId('kt-sign')
    expect(within(card).getByTestId('kt-sign-blocked')).toHaveTextContent('The run failed and nothing was delivered')
    expect(within(card).queryByLabelText('Signer')).toBeNull()
  })

  test('a member sitting the run out has no node or lane of its own, and the board says why', async () => {
    const b = clone(runningBoard())
    const designer = b.run!.roles.find((l) => l.key === 'designer')!
    designer.status = 'skipped'
    designer.summary = 'Not on Crew'
    setApiRoutes({ [`GET ${API}/board*`]: () => b })
    const { container } = render(<TeamPage pollMs={60_000} />)
    expect(await screen.findByTestId('kt-lanes-out')).toHaveTextContent('Not in this run: UI design (Not on Crew)')
    expect(container.querySelector('.kt-nodes [data-role="designer"]')).toBeNull()
    expect(container.querySelector('.kt-nodes [data-role="backend"]')).not.toBeNull()
  })

  test('the open form asks again who the team would be, so a member just added in Crew shows up without retyping', async () => {
    const preview = vi.fn(() => Promise.reject(new Error('not needed here')))
    render(<StartForm onStart={async () => {}} preview={preview} refreshMs={400} />)
    await waitFor(() => expect(preview.mock.calls.length).toBeGreaterThanOrEqual(3), { timeout: 3000 })
    expect(new Set(preview.mock.calls.map((c) => (c as unknown[])[0]))).toEqual(new Set([SCENARIOS[0].text]))
  })

  test('the decisions people made are on the sign-off card in the order they were made', async () => {
    const b = doneBoard()
    const r = b.run!
    const pm = r.roles.find((l) => l.key === 'pm')!
    const reviewer = r.roles.find((l) => l.key === 'reviewer')!
    pm.gate_label = 'Requirements'
    reviewer.gate_label = 'Release'
    r.gate_notes = { pm: 'Added a rule: at most 2 units each', reviewer: 'Price-protection refund reserved at 280,000' }
    const ev = (seq: number, kind: string, role: string, text: string, from: string | null = null) =>
      ({ seq, at: 1791230000 + seq, kind, role, text, from, to: null, data: null }) as (typeof r.events)[number]
    r.events = [...r.events, ev(900, 'approved', 'pm', 'A person approved Requirements'), ev(901, 'bounce', 'backend', 'A person sent it back at the Release gate: TVs get 10% off', 'person'),
      ev(902, 'approved', 'reviewer', 'A person approved Release')]
    setApiRoutes({ [`GET ${API}/board*`]: () => clone(b) })
    render(<TeamPage pollMs={60_000} />)
    const card = await screen.findByTestId('kt-sign')
    const items = within(card).getAllByRole('listitem').map((li) => li.textContent)
    expect(items.slice(0, 3)).toEqual(['Approved Requirements: Added a rule: at most 2 units each', 'A person sent it back at the Release gate: TVs get 10% off', 'Approved Release: Price-protection refund reserved at 280,000'])
  })

  test('an overruled review is one of the decisions people made, on the sign-off card', async () => {
    const b = doneBoard()
    b.run!.overruled = { role: 'reviewer', note: 'I accept the risk; finance reviews after the campaign', review: '要改：F-1' }
    const reviewer = b.run!.roles.find((l) => l.key === 'reviewer')!
    reviewer.gate_label = 'Release'
    setApiRoutes({ [`GET ${API}/board*`]: () => clone(b) })
    render(<TeamPage pollMs={60_000} />)
    const card = await screen.findByTestId('kt-sign')
    expect(within(card).getByTestId('kt-sign-overruled')).toHaveTextContent('Overruled the review and approved Release: I accept the risk; finance reviews after the campaign')
  })
})

/** The fixture's roles in AI-DLC phases: the product manager does 1.1 and 2.3; the reviewer of an older team file
 * still says phase 'review'. */
function phasedBoard(): Board {
  const b = runningBoard()
  const at: Record<string, [string, string]> = {
    pm: ['inception', '1.1 Intent capture · 2.3 Requirements analysis'], architect: ['inception', '2.8 Interface agreement'], designer: ['inception', '2.5 UI refinement'],
    tester: ['construction', '3.6 Build and test'], backend: ['construction', '3.5 Code generation'], frontend: ['construction', '3.5 Code generation'],
    ops: ['operation', '4.1 Deployment pipeline'], reviewer: ['review', 'Review gate'],
  }
  for (const l of b.run!.roles) [l.phase, l.stage] = at[l.key]
  return b
}

describe('V3: phases, hover card, compliance gate', () => {
  test('the phases read 0 to 4: the orchestrator is initialization, a member spanning two phases says so, no review phase', async () => {
    setApiRoutes({ [`GET ${API}/board*`]: () => clone(phasedBoard()) })
    const { container } = render(<TeamPage pollMs={60_000} />)
    await screen.findByTestId('kt-orch')
    const titles = [...container.querySelectorAll('.kt-phase-title')].map((t) => t.textContent ?? '')
    expect(titles[0]).toMatch(/^0 Initialization/)
    expect(titles.some((t) => t.startsWith('1–2 Ideation · Inception'))).toBe(true)
    expect(titles.some((t) => t.includes('Review gate'))).toBe(false)
    expect(titles.some((t) => t.startsWith('3 Construction'))).toBe(true)
  })

  test('resting the pointer on a member shows what it did, with View outputs and its session', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [`GET ${API}/board*`]: () => clone(phasedBoard()) })
    const { container } = render(<TeamPage pollMs={60_000} />)
    await screen.findByTestId('kt-orch')
    await user.hover(container.querySelector('.kt-node[data-role="backend"]')!)
    const card = await screen.findByTestId('kt-ncard', {}, { timeout: 2000 })
    expect(within(card).getByRole('button', { name: 'View outputs' })).toBeTruthy()
    expect(within(card).getByRole('button', { name: 'Open session in Crew' })).toBeTruthy()
    expect(within(card).getByText(/Checks it owns/)).toBeTruthy()
  })
})

test('a team that skips an official phase still reads 0 to 4: the skipped one is a narrow grey band', () => {
  const roles = [
    { key: 'pm', depends_on: [], phase: 'inception', aidlc_agent: 'aidlc-product-agent' },
    { key: 'fe', depends_on: ['pm'], phase: 'construction', aidlc_agent: 'aidlc-developer-agent' },
    { key: 'ops', depends_on: ['fe'], phase: 'operation', aidlc_agent: 'aidlc-pipeline-deploy-agent' },
  ]
  const lay = layoutGraph(roles, [['pm', 'fe'], ['fe', 'ops']])
  expect(lay.phases.map((p) => `${p.n}${p.used ? '' : '·grey'}`)).toEqual(['0', '1·grey', '2', '3', '4'])
  const grey = lay.phases.find((p) => p.key === 'ideation')!
  const pm = lay.phases.find((p) => p.key === 'inception')!
  expect(grey.x2 <= pm.x1 && grey.x2 - grey.x1 < 100).toBe(true)
  expect(lay.nodes.get('pm')!.x - 92).toBeGreaterThan(grey.x2) // the column made room for it
})

test('the roster lists the whole company team: the picked in green, the rest grey and without a node', async () => {
  const b = phasedBoard()
  const roles = b.run!.roles.map((l) => ({ key: l.key, title: l.title, member: l.aidlc_agent.split(',')[0], icon: l.key }))
  b.run!.roster = [...roles, { key: 'backend2', title: 'Backend #2', member: 'aidlc-developer-agent', icon: 'backend' },
    { key: 'compliance', title: 'Compliance', member: 'aidlc-compliance-agent', icon: 'compliance' }]
  setApiRoutes({ [`GET ${API}/board*`]: () => clone(b) })
  const { container } = render(<TeamPage pollMs={60_000} />)
  const roster = await screen.findByTestId('kt-roster')
  expect(within(roster).getByText(`Team of ${roles.length + 2} · ${roles.length} picked this run`)).toBeTruthy()
  const bench = [...roster.querySelectorAll('[data-state="bench"] > text')].map((t) => t.textContent)
  expect(bench).toEqual(['Backend #2', 'Compliance'])
  expect(roster.querySelectorAll('.kt-roster-item').length).toBe(roles.length + 2)
  expect(container.querySelector('.kt-node[data-role="backend2"]')).toBeNull() // not picked: not in the workflow
  expect(container.querySelector('.kt-node[data-role="compliance"]')).toBeNull()
  // the graph is tall enough for everyone on the list
  const lay = layoutGraph(b.run!.roles, b.run!.edges, b.run!.roster)
  const without = layoutGraph(b.run!.roles, b.run!.edges)
  expect(lay.rail.y).toBeGreaterThanOrEqual(without.rail.y)
})

test('a run imported from another Mac says so and offers nothing that needs its code', async () => {
  const b = runningBoard()
  b.run!.status = 'failed'
  b.runs[0].status = 'failed'
  b.run!.imported = { from: 'another Mac' }
  setApiRoutes({ [`GET ${API}/board*`]: () => clone(b) })
  render(<TeamPage pollMs={60_000} />)
  expect(await screen.findByText('Imported · another Mac')).toBeTruthy()
  expect(screen.queryByRole('button', { name: '📁 Folder' })).toBeNull()
  expect(screen.queryByRole('button', { name: /Retry .* failed/ })).toBeNull()
  expect(screen.getByRole('button', { name: '▶ Replay' })).toBeTruthy()
})
