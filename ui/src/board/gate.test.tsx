import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import type { RoutePick, RouteRole } from '../types'
import { GateDialog, TeamPick } from './Header'

test('Fill in the preset comment puts the demo note in, and Confirm approval sends what is in the box', async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn(async () => {})
  render(<GateDialog label="Plan" decision="approve" preset="Approved. Show Only N left when stock is below 5." onConfirm={onConfirm} onCancel={() => {}} />)
  await user.click(screen.getByRole('button', { name: 'Fill in the preset comment' }))
  expect(screen.getByLabelText('Comment')).toHaveValue('Approved. Show Only N left when stock is below 5.')
  expect(screen.queryByRole('button', { name: 'Fill in the preset comment' })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Confirm approval' }))
  expect(onConfirm).toHaveBeenCalledWith('Approved. Show Only N left when stock is below 5.')
})

test('a review gate shows the review, and Send back fills in its own preset (who is sent back, and why)', async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn(async () => {})
  const back = 'Sent back on the risk notes.\n打回：Frontend #2. Add one line about data use to the draw records page.' // protocol token: 打回： kept in Chinese
  render(<GateDialog label="Compliance" decision="revise" preset={back} report="可以交付: 2 non-blocking risk notes" onConfirm={onConfirm} onCancel={() => {}} />) // protocol token: 可以交付 kept in Chinese
  expect(screen.getByText(/可以交付: 2 non-blocking risk notes/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Fill in the preset comment' }))
  await user.click(screen.getByRole('button', { name: 'Confirm send back' }))
  expect(onConfirm).toHaveBeenCalledWith(back.trim())
})

test('over a review that still says 要改, approving is overruling it: it takes a reason', async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn(async () => {})
  render(<GateDialog label="Release" decision="approve" overrule report="要改：F-1 price-protection refund above 300,000" onConfirm={onConfirm} onCancel={() => {}} />) // protocol token: 要改 kept in Chinese
  expect(screen.getByText('Approve Release anyway')).toBeInTheDocument()
  expect(screen.getByText('The review still says changes are needed:')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Confirm overrule and approve' }))
  expect(onConfirm).not.toHaveBeenCalled()
  expect(screen.getByRole('alert')).toHaveTextContent('overruling it requires a reason')
  await user.type(screen.getByLabelText('Comment'), 'I accept the risk; finance reviews after the campaign')
  await user.click(screen.getByRole('button', { name: 'Confirm overrule and approve' }))
  expect(onConfirm).toHaveBeenCalledWith('I accept the risk; finance reviews after the campaign')
})

test('sending it back over such a review needs no note: the members the review named do one more round', async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn(async () => {})
  render(<GateDialog label="Release" decision="revise" overrule report="要改：F-1" onConfirm={onConfirm} onCancel={() => {}} />) // protocol token: 要改 kept in Chinese
  expect(screen.getByText('Send back Release for another round')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Confirm send back' }))
  expect(onConfirm).toHaveBeenCalledWith('')
})

test('a gate shows the documents of its stage, and in a discussion what each side said and whether it changed its documents', async () => {
  const user = userEvent.setup()
  const onOpen = vi.fn()
  render(<GateDialog label="Build start" who="Requirements" decision="discuss" outputs={[{ key: 'architect', title: 'Architect', icon: 'architect', onOpen }, { key: 'pm', title: 'Requirements', icon: 'pm', onOpen }]}
    talk={[{ who: 'person', text: 'Why are the interfaces not paginated?', at: 1, changed: null }, { who: 'agent', text: 'There are only 20 products; changed to pagination.', at: 2, changed: true }]} onConfirm={async () => {}} onCancel={() => {}} />)
  expect(screen.getByText('Discuss Build start')).toBeInTheDocument()
  expect(screen.getByText(/Requirements will answer/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /Architect ↗/ }))
  expect(onOpen).toHaveBeenCalled()
  const talk = screen.getByTestId('kt-gate-talk')
  expect(within(talk).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['YouWhy are the interfaces not paginated?', 'RequirementsThere are only 20 products; changed to pagination.(changed the document)'])
  expect(screen.queryByRole('button', { name: 'Fill in the preset comment' })).toBeNull()
})

test('the proposal at the Requirements gate says whom it leaves out this run', () => {
  render(<GateDialog label="Requirements" decision="approve" split={[{ key: 'backend1', title: 'Backend development #1', icon: 'backend', assignment: 'Price engine' }]} skips={[{ key: 'motion', title: 'Motion designer', why: 'This time only prices change; the page does not move' }]} onConfirm={async () => {}} onCancel={() => {}} />)
  const out = screen.getByTestId('kt-gate-skips')
  expect(within(out).getByText(/left out this time: This time only prices change; the page does not move/)).toBeInTheDocument()
  expect(within(out).getByText(/After approval they sit this run out/)).toBeInTheDocument()
})

test('the start form says an optional post whose member is not on Crew sits the run out; another is stood in for', () => {
  const role = (key: string, title: string, member: string, extra: Partial<RouteRole> = {}): RouteRole =>
    ({ key, title, phase: 'construction', stage: '3.5 Code generation', aidlc_agent: member, member, icon: key, assignment: '', gate: false, on_crew: false, ...extra })
  const pick = {
    team: { file: 'team-taoyuan-promo.json', name: 'Taoyuan Technology R&D team · Singles Day sale', scope: 'mvp', keywords: [], priority: 35, fallback: false, official_stages: null, needs_source: false, starter: 'starters/mall', source: null,
      roles: [role('motion', 'Motion designer', 'taoyuan-motion-agent', { optional: true }), role('tester', 'Test engineer', 'aidlc-quality-agent')], agents: [], stages: [], extra_stages: [], extra_note: '' },
    matched: ['Singles Day'], why: '', others: [], roster: [], teams: [],
  } as RoutePick
  render(<TeamPick pick={pick} />)
  expect(screen.getByTestId('kt-pick-unhired')).toHaveTextContent('Motion designer not on Crew, so not in this run (add taoyuan-motion-agent under Crew Agents, then hand the requirement to the team to include it)')
  expect(screen.getByText(/Test engineer not on the team yet/)).toHaveTextContent('if not added, the run stops and waits when its turn comes')
})

const LESSONS = [
  { key: 'A', text: 'Mask all personal data; do not wait for review to send it back' },
  { key: 'B', text: 'Write interfaces.md first, then touch the frontend' },
]

test('a multiple-choice question is ticked, not picked: the ticked keys go with Approve', async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn(async () => {})
  const questions = [{ id: '1', q: 'Which lessons should be kept?', options: LESSONS, recommend: '', why: 'Not ticked, not recorded', multi: true }]
  render(<GateDialog label="Lessons" decision="approve" questions={questions} onConfirm={onConfirm} onCancel={() => {}} />)
  const boxes = within(screen.getByTestId('kt-gate-questions')).getAllByRole('checkbox')
  expect(boxes).toHaveLength(2)
  expect(boxes.every((b) => !(b as HTMLInputElement).checked)).toBe(true) // nothing is ticked for the person
  expect(screen.getByText(/Nothing is recorded if none is ticked/)).toBeInTheDocument()
  expect(screen.queryByRole('radio')).toBeNull() // no Other, no recommendation: a tick is all there is
  await user.click(screen.getByRole('checkbox', { name: /A\. Mask all personal data/ }))
  expect(screen.getByText(/1 selected/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Confirm approval' }))
  expect(onConfirm).toHaveBeenCalledWith('', undefined, { '1': { choice: '', text: '', choices: ['A'] } })
})

test('ticking a box again takes the tick back, and ticking none approves with none', async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn(async () => {})
  const questions = [{ id: '1', q: 'Which lessons should be kept?', options: LESSONS, recommend: '', why: '', multi: true }]
  render(<GateDialog label="Lessons" decision="approve" questions={questions} onConfirm={onConfirm} onCancel={() => {}} />)
  const b = screen.getByRole('checkbox', { name: /B\. Write interfaces.md first/ })
  await user.click(b)
  await user.click(b)
  expect(b).not.toBeChecked()
  await user.click(screen.getByRole('button', { name: 'Confirm approval' }))
  expect(onConfirm).toHaveBeenCalledWith('', undefined, { '1': { choice: '', text: '', choices: [] } })
})
