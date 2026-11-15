import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import type { FileView, OutputAttempt, RoleOutput, SiteStatus } from '../types'
import { apiCalls, setApiRoutes } from '../test/stubs/app-sdk'
import { clone, runningBoard } from '../test/fixtures'
import { TeamPage } from '../main'
import { lineKind, sortFiles, tabsFor } from './Outputs'

const API = '/api/apps/aidlc-team'
const BOARD = `GET ${API}/board*`

const attempt = (over: Partial<OutputAttempt> = {}): OutputAttempt => ({
  n: 1, kind: 'work', label: '', agent: 'f84496b48dc1536a', started: 1000, ended: 1041, credits: 2.6, error: null,
  summary: 'Wrote 21 acceptance criteria', reply: 'DONE: Wrote 21 acceptance criteria\n\n- AC-1 The home page lists events', task: '[aidlc-team run=r1006a role=pm]\n\nWrite the requirements in the README as acceptance criteria',
  calls: [{ at: 1003, tool: 'Reading', kind: 'read', detail: 'README.md' }, { at: 1020, tool: 'Creating', kind: 'edit', detail: 'acceptance.md' }],
  live: false, ...over,
})

const output = (role: string, over: Partial<RoleOutput> = {}): RoleOutput => ({
  run: 'r1006a', role, title: role, emoji: '', status: 'merged', branch: `team/r1006a/${role}`, folder: `/w/runs/r1006a/wt/${role}`, base: '5e1f0aa', head: 'd5d735a',
  writable: ['docs/product/**'], ended: false, attempts: [attempt()],
  files: [
    { path: 'docs/product/notes.md', added: 3, removed: 0, status: 'A', output: false, owner: role },
    { path: 'docs/product/acceptance.md', added: 42, removed: 0, status: 'A', output: true, owner: role },
  ],
  ...over,
})

const fileView = (path: string, view: 'content' | 'diff'): FileView => ({
  path, view, lang: view === 'diff' ? 'diff' : path.endsWith('.md') ? 'markdown' : 'javascript', binary: false, size: 40, truncated: false,
  text: view === 'diff' ? `diff --git a/${path} b/${path}\n@@ -0,0 +1,2 @@\n+# Acceptance criteria\n+AC-1 The home page lists events\n` : path.endsWith('.md') ? '# Acceptance criteria\nAC-1 The home page lists events\n' : 'export const x = 1\nexport const y = 2\n',
})

function routes(extra: Record<string, (body: unknown, path: string) => unknown> = {}, board = runningBoard()) {
  setApiRoutes({
    [BOARD]: () => clone(board),
    [`GET ${API}/runs/r1006a/roles/pm`]: () => output('pm', { title: 'Product manager' }),
    [`GET ${API}/runs/r1006a/roles/architect`]: () => output('architect', { title: 'Architect', files: [] }),
    [`GET ${API}/runs/r1006a/roles/pm/file*`]: (_b, path) => {
      const q = new URLSearchParams(path.split('?')[1])
      return fileView(q.get('path')!, q.get('view') as 'content' | 'diff')
    },
    ...extra,
  })
}

const laneOf = (key: string) => screen.getAllByTestId('kt-lane').find((l) => l.dataset.role === key)!

describe('Output of each step', () => {
  test('a role card opens its deliverables: the promised file first, rendered; its diff on demand', async () => {
    const user = userEvent.setup()
    routes()
    render(<TeamPage pollMs={60_000} />)
    await screen.findAllByTestId('kt-lane')
    await user.click(within(laneOf('pm')).getByRole('button', { name: /View outputs/ }))
    const drawer = await screen.findByRole('dialog', { name: 'Output of Product manager' })
    const list = await within(drawer).findByText('What it agreed to deliver')
    expect(list.nextElementSibling).toHaveTextContent('docs/product/acceptance.md')
    expect(await within(drawer).findByTestId('markdown')).toHaveTextContent('# Acceptance criteria AC-1 The home page lists events')
    await user.click(within(drawer).getByRole('button', { name: 'Changes' }))
    await waitFor(() => expect(apiCalls.some((c) => c.path.endsWith('/roles/pm/file?path=docs%2Fproduct%2Facceptance.md&view=diff'))).toBe(true))
    const added = await within(drawer).findByText('+AC-1 The home page lists events')
    expect(added.closest('li')).toHaveClass('is-add')
    await user.click(within(drawer).getByRole('button', { name: /docs\/product\/notes\.md/ }))
    expect(await within(drawer).findByTestId('kt-file-view')).toHaveTextContent('docs/product/notes.md')

    await user.click(within(drawer).getByRole('button', { name: /Architect/ }))
    expect(await screen.findByRole('dialog', { name: 'Output of Architect' })).toBeInTheDocument()
    expect(await screen.findByText('It has not committed any files yet.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(await screen.findByRole('dialog', { name: 'Output of Product manager' })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  test('its reply, its task and every tool call, per round', async () => {
    const user = userEvent.setup()
    routes({
      [`GET ${API}/runs/r1006a/roles/pm`]: () =>
        output('pm', {
          title: 'Product manager',
          attempts: [attempt(), attempt({ n: 2, kind: 'fix', label: 'fix AC-19', reply: 'DONE: Changed AC-19', calls: [{ at: 2001, tool: 'Running', kind: 'execute', detail: 'node --test tests/ops-project.test.js' }], started: 2000, ended: 2030 })],
        }),
    })
    render(<TeamPage pollMs={60_000} />)
    await screen.findAllByTestId('kt-lane')
    await user.click(within(laneOf('pm')).getByRole('button', { name: /View outputs/ }))
    const drawer = await screen.findByRole('dialog', { name: 'Output of Product manager' })
    await user.click(await within(drawer).findByRole('tab', { name: 'Its reply' }))
    expect(within(drawer).getByTestId('kt-reply')).toHaveTextContent('DONE: Changed AC-19')  // the latest round first
    await user.click(within(drawer).getByRole('button', { name: 'Round 1 · start' }))
    expect(within(drawer).getByTestId('kt-reply')).toHaveTextContent('AC-1 The home page lists events')
    await user.click(within(drawer).getByRole('tab', { name: 'Task it got' }))
    expect(within(drawer).getByText(/Write the requirements in the README as acceptance criteria/)).toBeInTheDocument()
    await user.click(within(drawer).getByRole('tab', { name: 'What it did' }))
    const calls = within(drawer).getByRole('list', { name: 'What it did' })
    expect(within(calls).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['0:03📖Reading README.md', '0:20✏️Creating acceptance.md'])
  })

  test('a file on the card opens the drawer at that file', async () => {
    const user = userEvent.setup()
    routes()
    render(<TeamPage pollMs={60_000} />)
    await screen.findAllByTestId('kt-lane')
    await user.click(within(laneOf('pm')).getByRole('button', { name: 'docs/product/acceptance.md' }))
    const drawer = await screen.findByRole('dialog', { name: 'Output of Product manager' })
    expect(await within(drawer).findByTestId('kt-file-view')).toHaveTextContent('docs/product/acceptance.md')
  })

  test('Open site: once the run has ended the product runs on a local port, shown in place', async () => {
    const user = userEvent.setup()
    const board = runningBoard()
    board.run!.status = 'done'
    board.runs[0].status = 'done'
    expect(board.run!.tests.total).toBeGreaterThan(0) // Open site shows once there is something to run
    let state: SiteStatus = { run: 'r1006a', state: 'off', url: null, port: null, entry: null, started_at: null, expires_at: null, error: null, log: [] }
    routes(
      {
        [`GET ${API}/runs/r1006a/roles/run`]: () => output('run', { title: 'Whole product', attempts: [], ended: true }),
        [`GET ${API}/runs/r1006a/site`]: () => state,
        [`POST ${API}/runs/r1006a/site`]: () => (state = { ...state, state: 'running', url: 'http://127.0.0.1:54321/', port: 54321, entry: 'backend/server.js', started_at: 1, expires_at: 1801, log: ['listening on 54321'] }),
        [`POST ${API}/runs/r1006a/site/stop`]: () => (state = { ...state, state: 'off', url: null, port: null }),
      },
      board,
    )
    render(<TeamPage pollMs={60_000} />)
    await screen.findAllByTestId('kt-lane')
    await user.click(screen.getByRole('button', { name: 'Open site' }))
    const drawer = await screen.findByRole('dialog', { name: 'Output of Whole product' })
    await user.click(await within(drawer).findByRole('button', { name: 'Start site' }))
    const frame = await within(drawer).findByTitle('The site the team built')
    expect(frame).toHaveAttribute('src', 'http://127.0.0.1:54321/')
    expect(within(drawer).getByRole('link', { name: /127\.0\.0\.1:54321/ })).toHaveAttribute('target', '_blank')
    await user.click(within(drawer).getByRole('button', { name: 'Stop' }))
    expect(await within(drawer).findByRole('button', { name: 'Start site' })).toBeInTheDocument()
    expect(apiCalls.filter((c) => c.method === 'POST').map((c) => c.path)).toEqual([`${API}/runs/r1006a/site`, `${API}/runs/r1006a/site/stop`])
  })

  test('while the run is active the site waits, and there is no Open site button', async () => {
    const user = userEvent.setup()
    routes({ [`GET ${API}/runs/r1006a/roles/run`]: () => output('run', { title: 'Whole product', attempts: [] }) })
    render(<TeamPage pollMs={60_000} />)
    await screen.findAllByTestId('kt-lane')
    expect(screen.queryByRole('button', { name: 'Open site' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Outputs' }))
    await screen.findByRole('dialog', { name: 'Output of Product manager' })
    await user.click(screen.getByRole('button', { name: 'Whole product' }))
    const drawer = await screen.findByRole('dialog', { name: 'Output of Whole product' })
    expect(within(drawer).getByRole('tab', { name: /Output files/ })).toHaveAttribute('aria-selected', 'true')
    await user.click(within(drawer).getByRole('tab', { name: 'Site' }))
    expect(within(drawer).getByText(/The site can only be opened after the run has ended/)).toBeInTheDocument()
    await act(async () => {})
  })
})

describe('helpers', () => {
  test('promised outputs come first; diff lines are classified', () => {
    expect(sortFiles(output('pm').files).map((f) => f.path)).toEqual(['docs/product/acceptance.md', 'docs/product/notes.md'])
    expect(['@@ -1 +1 @@', '+++ b/x', '+a', '-b', ' c'].map(lineKind)).toEqual(['is-hunk', 'is-meta', 'is-add', 'is-del', ''])
    expect(tabsFor('reviewer', false)).toEqual(['reply', 'task', 'calls'])
    expect(tabsFor('run', true)).toEqual(['site', 'files'])
  })
})

describe('the session runner', () => {
  test('Open session in Crew opens the role session in the dashboard (no message sent)', async () => {
    const { chatLaunches } = await import('../test/stubs/app-sdk')
    const board = runningBoard()
    board.run!.roles.find((l) => l.key === 'pm')!.session = 'aidlc-team-r1006a-1-ab12'
    routes({}, board)
    render(<TeamPage />)
    const user = userEvent.setup()
    await screen.findAllByTestId('kt-lane')
    await user.click(screen.getByRole('button', { name: 'Outputs' }))
    const drawer = await screen.findByTestId('kt-outputs')
    await user.click(await within(drawer).findByRole('button', { name: 'Open session in Crew' }))
    expect(chatLaunches).toEqual([{ slotKey: 'aidlc-team-r1006a-1-ab12', autoSend: false }])
  })
})
