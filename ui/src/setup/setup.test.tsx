import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { apiCalls, apiError, setApiRoutes } from '../test/stubs/app-sdk'
import { SetupPanel } from './SetupPanel'
import type { SetupData, SetupStep } from './plan'

const GET = 'GET /api/apps/agent-rd-team/setup'

const step = (id: string, label: string, path = '/api/agents'): SetupStep => ({ id, label, call: { method: 'POST', path, body: { id } } })

function data(over: Partial<SetupData['status']> = {}, plan: SetupStep[] = [], example = 'Build the Black Friday page'): SetupData {
  return {
    status: {
      workspace: { name: 'larkspur', dir: '/h/workplace/larkspur', done: false },
      templates: { total: 14, present: 0, done: false },
      members: { total: 14, created: 0, missing: [], done: false },
      knowledge: { source: 'Larkspur Outfitters', documents: 13, items: 0, state: '', done: false },
      sample: { id: 'r1124a2e4', done: false },
      problems: [], ready: false, ...over,
    },
    plan,
    example: { requirement: example, team: 'auto' },
    terminal: 'python3 scripts/setup_plan.py',
    disclosure: 'The 14 members can run shell commands in git worktrees.',
  }
}

const ready = () => data({
  workspace: { name: 'larkspur', dir: '/h', done: true }, templates: { total: 14, present: 14, done: true },
  members: { total: 14, created: 14, missing: [], done: true }, knowledge: { source: 'Larkspur Outfitters', documents: 13, items: 90, state: 'synced', done: true },
  ready: true,
})

describe('SetupPanel', () => {
  test('a set-up that is not done lists what the example needs and one button runs the plan in order, as the owner', async () => {
    const plan = [step('templates', 'Add templates', '/api/apps/agent-rd-team/setup/templates'), step('workspace', 'Create the larkspur workspace', '/api/workspaces'),
      step('member:a', 'Add Product')]
    let served = data({}, plan)
    setApiRoutes({
      [GET]: () => served,
      'POST /api/apps/agent-rd-team/setup/templates': () => ({ ok: true }),
      'POST /api/workspaces': () => ({ ok: true }),
      'POST /api/agents': () => {
        served = data(ready().status)
        return { ok: true }
      },
    })
    render(<SetupPanel />)
    expect(await screen.findByRole('heading', { name: 'Set up the example team' })).toBeInTheDocument()
    expect(screen.getByText(/The larkspur workspace/)).toBeInTheDocument()
    expect(screen.getByText(/14 team members \(0 added\)/)).toBeInTheDocument()
    expect(screen.getByText(/The company's rules \(13 documents\)/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Set up the example team' }))
    expect(await screen.findByRole('heading', { name: 'The example team is ready' })).toBeInTheDocument()
    expect(apiCalls.filter((c) => c.method === 'POST').map((c) => c.path)).toEqual([
      '/api/apps/agent-rd-team/setup/templates', '/api/workspaces', '/api/agents'])
    expect(apiCalls.find((c) => c.path === '/api/workspaces')?.body).toEqual({ id: 'workspace' })
  })

  test('a step that exists already (409) is done, and the next one runs', async () => {
    setApiRoutes({
      [GET]: () => data({}, [step('workspace', 'Create the workspace', '/api/workspaces'), step('member:a', 'Add Product')]),
      'POST /api/workspaces': () => { throw apiError(409, 'exists', 'Workspace already exists') },
      'POST /api/agents': () => ({ ok: true }),
    })
    render(<SetupPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Set up the example team' }))
    await waitFor(() => expect(apiCalls.filter((c) => c.method === 'POST').map((c) => c.path)).toEqual(['/api/workspaces', '/api/agents']))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  test('a step that fails stops there, says which and why, and the button continues from it', async () => {
    let fail = true
    setApiRoutes({
      [GET]: () => data({}, [step('workspace', 'Create the larkspur workspace', '/api/workspaces'), step('member:a', 'Add Product')]),
      'POST /api/workspaces': () => { if (fail) throw apiError(403, 'owner_only', 'owner authorization required'); return { ok: true } },
      'POST /api/agents': () => ({ ok: true }),
    })
    render(<SetupPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Set up the example team' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Stopped at “Create the larkspur workspace”: owner authorization required (403)')
    expect(apiCalls.filter((c) => c.method === 'POST').map((c) => c.path)).toEqual(['/api/workspaces'])  // Add Product was not tried
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Set up the example team' }))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    expect(apiCalls.filter((c) => c.method === 'POST').map((c) => c.path)).toEqual(['/api/workspaces', '/api/workspaces', '/api/agents'])
  })

  test('what the example adds, and the terminal way, are one click away and not in the way', async () => {
    setApiRoutes({ [GET]: () => data({}, [step('workspace', 'Create', '/api/workspaces')]) })
    render(<SetupPanel />)
    await userEvent.click(await screen.findByText('What this adds'))
    expect(screen.getByText(/can run shell commands in git worktrees/)).toBeInTheDocument()
    expect(screen.getByText('python3 scripts/setup_plan.py')).toBeInTheDocument()
  })

  test('a set-up team offers the example requirement; starting it opens that run', async () => {
    const opened: string[] = []
    setApiRoutes({ [GET]: () => ready(), 'POST /api/apps/agent-rd-team/runs': () => ({ run: 'r1125abcd' }) })
    render(<SetupPanel onOpenRun={(rid) => opened.push(rid)} />)
    expect(await screen.findByTestId('kt-setup-requirement')).toHaveTextContent('Build the Black Friday page')
    await userEvent.click(screen.getByRole('button', { name: 'Start the example delivery' }))
    await waitFor(() => expect(opened).toEqual(['r1125abcd']))
    expect(apiCalls.find((c) => c.path === '/api/apps/agent-rd-team/runs')?.body).toEqual({ requirement: 'Build the Black Friday page', team: 'auto' })
  })

  test('a run that cannot start says why on the panel', async () => {
    setApiRoutes({ [GET]: () => ready(), 'POST /api/apps/agent-rd-team/runs': () => { throw apiError(409, 'run_active', 'A run is already going') } })
    render(<SetupPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Start the example delivery' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('A run is already going (409)')
  })

  test('a finished delivery can be looked at first, without credits, and opens its replay', async () => {
    const opened: string[] = []
    let served = ready()
    setApiRoutes({ [GET]: () => served, 'POST /api/apps/agent-rd-team/setup/sample': () => { served = { ...ready(), status: { ...ready().status, sample: { id: 'r1124a2e4', done: true } } }; return { ok: true, run: 'r1124a2e4' } } })
    render(<SetupPanel onOpenRun={(rid) => opened.push(rid)} />)
    await userEvent.click(await screen.findByRole('button', { name: /Look at a finished delivery first/ }))
    await waitFor(() => expect(opened).toEqual(['r1124a2e4']))
    expect(screen.queryByRole('button', { name: /Look at a finished delivery first/ })).toBeNull()  // loaded once
  })

  test('Hide removes a set-up panel for good, but never the set-up that is still to do', async () => {
    setApiRoutes({ [GET]: () => ready() })
    const { unmount } = render(<SetupPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Hide this' }))
    expect(screen.queryByTestId('kt-setup')).toBeNull()
    unmount()
    render(<SetupPanel />)
    await waitFor(() => expect(apiCalls.filter((c) => c.method === 'GET')).toHaveLength(2))
    expect(screen.queryByTestId('kt-setup')).toBeNull()
    unmount()
    setApiRoutes({ [GET]: () => data({}, [step('workspace', 'Create', '/api/workspaces')]) })
    render(<SetupPanel />)
    expect(await screen.findByRole('heading', { name: 'Set up the example team' })).toBeInTheDocument()  // hidden only applies once ready
  })

  test('it stays out of the way where it does not apply: not the owner, or a backend without setup', async () => {
    for (const status of [401, 403, 404]) {
      setApiRoutes({ [GET]: () => { throw apiError(status, 'x', 'no') } })
      const { unmount } = render(<SetupPanel />)
      await waitFor(() => expect(apiCalls.filter((c) => c.method === 'GET').length).toBeGreaterThan(0))
      expect(screen.queryByTestId('kt-setup')).toBeNull()
      unmount()
    }
  })

  test('any other failure to read the state is said, with a way to try again', async () => {
    let fail = true
    setApiRoutes({ [GET]: () => { if (fail) throw apiError(500, 'boom', 'The gateway is not answering'); return ready() } })
    render(<SetupPanel />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read the setup state: The gateway is not answering (500)')
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'The example team is ready' })).toBeInTheDocument()
  })

  test('rules Kiro Crew could not read are said, with where to look, and the button stays', async () => {
    setApiRoutes({ [GET]: () => data({ knowledge: { source: 'Larkspur Outfitters', documents: 13, items: 0, state: 'error', done: false } }, [step('knowledge', 'Read the rules', '/api/apps/agent-rd-team/setup/knowledge')]) })
    render(<SetupPanel />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Kiro Crew could not read the rule documents. Open Knowledge base, then Sources')
    expect(screen.getByRole('button', { name: 'Set up the example team' })).toBeEnabled()
  })

  test('what could not be read is said without stopping the button', async () => {
    setApiRoutes({ [GET]: () => data({ problems: ['workspaces: app_permission_not_approved'] }, [step('workspace', 'Create', '/api/workspaces')]) })
    render(<SetupPanel />)
    expect(await screen.findByText(/Could not read: workspaces: app_permission_not_approved/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set up the example team' })).toBeEnabled()
    vi.restoreAllMocks()
  })
})
