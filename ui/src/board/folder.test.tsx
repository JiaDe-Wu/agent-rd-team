import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { apiCalls, apiError, setApiRoutes } from '../test/stubs/app-sdk'
import { runningBoard } from '../test/fixtures'
import { TeamPage } from '../main'

const API = '/api/apps/agent-rd-team'

describe('Open folder', () => {
  test('the top bar shows where the project is and opens it in Finder or Kiro', async () => {
    const user = userEvent.setup()
    setApiRoutes({
      [`GET ${API}/board*`]: () => runningBoard(),
      [`POST ${API}/runs/r1006a/open`]: (body) => {
        if ((body as { app: string }).app === 'kiro') throw apiError(502, 'open_failed', 'Cannot open: Kiro is not installed')
        return { ok: true, path: '/x', app: 'finder' }
      },
    })
    render(<TeamPage pollMs={60_000} />)
    await screen.findAllByTestId('kt-lane')
    await user.click(screen.getByRole('button', { name: '📁 Folder' }))
    const panel = screen.getByRole('region', { name: 'Project folder' })
    expect(within(panel).getByText('/Users/you/workplace/agent-rd-team/runs/r1006a/wt/_run')).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: '📁 Open in Finder' }))
    expect(await within(panel).findByRole('status')).toHaveTextContent('Opened in Finder')
    await user.click(within(panel).getByRole('button', { name: 'Open in Kiro' }))
    expect(await within(panel).findByText(/^Cannot open: Kiro is not installed/)).toBeInTheDocument()
    expect(apiCalls.filter((c) => c.method === 'POST').map((c) => c.body)).toEqual([{ role: null, app: 'finder' }, { role: null, app: 'kiro' }])
    await user.click(within(panel).getByRole('button', { name: 'Collapse project folder' }))
    expect(screen.queryByRole('region', { name: 'Project folder' })).toBeNull()
  })
})
