import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import type { Board } from '../types'
import { apiCalls, apiError, setApiRoutes } from '../test/stubs/app-sdk'
import { clone, runningBoard } from '../test/fixtures'
import { TeamPage } from '../main'

const API = '/api/apps/aidlc-team'
const NEVER = 'never started: waiting for memory (macOS memory pressure did not ease in time); retry once it eases or a running agent finishes'

/** The fixture run, ended: the tester never got to start. */
function failedBoard(): Board {
  const b = runningBoard()
  b.run!.status = 'failed'
  b.runs[0].status = 'failed'
  const tester = b.run!.roles.find((l) => l.key === 'tester')!
  tester.status = 'failed'
  tester.agent = { ...tester.agent!, error: NEVER }
  return b
}

const laneOf = (key: string) => screen.getAllByTestId('kt-lane').find((l) => l.dataset.role === key)!
const posts = () => apiCalls.filter((c) => c.method === 'POST').map((c) => [c.path, c.body])

describe('Retry', () => {
  test('a failed role can be retried from the top bar, its card and its node', async () => {
    const user = userEvent.setup()
    setApiRoutes({ [`GET ${API}/board*`]: () => clone(failedBoard()), [`POST ${API}/runs/r1006a/retry`]: () => ({ ok: true, run: 'r1006a', roles: ['tester'], status: 'running' }) })
    render(<TeamPage pollMs={60_000} />)
    await screen.findAllByTestId('kt-lane')
    expect(within(laneOf('tester')).getByText(NEVER, { exact: false })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '↻ Retry 1 failed role' }))
    await user.click(within(laneOf('tester')).getByRole('button', { name: '↻ Retry' }))
    await user.click(screen.getByRole('button', { name: 'Retry Testing' }))
    await waitFor(() =>
      expect(posts()).toEqual([
        [`${API}/runs/r1006a/retry`, {}],
        [`${API}/runs/r1006a/retry`, { roles: ['tester'] }],
        [`${API}/runs/r1006a/retry`, { roles: ['tester'] }],
      ]),
    )
    expect(within(laneOf('backend')).queryByRole('button', { name: '↻ Retry' })).toBeNull()
  })

  test('a refused retry says why', async () => {
    const user = userEvent.setup()
    setApiRoutes({
      [`GET ${API}/board*`]: () => clone(failedBoard()),
      [`POST ${API}/runs/r1006a/retry`]: () => {
        throw apiError(409, 'run_active', 'A run is already going (r1006b); only one at a time')
      },
    })
    render(<TeamPage pollMs={60_000} />)
    await screen.findAllByTestId('kt-lane')
    await user.click(screen.getByRole('button', { name: '↻ Retry 1 failed role' }))
    expect(await screen.findByText(/Retry failed: A run is already going \(r1006b\); only one at a time/)).toBeInTheDocument()
  })

  test('nothing failed: no retry anywhere', async () => {
    setApiRoutes({ [`GET ${API}/board*`]: () => runningBoard() })
    render(<TeamPage pollMs={60_000} />)
    await screen.findAllByTestId('kt-lane')
    expect(screen.queryByRole('button', { name: /Retry/ })).toBeNull()
  })
})
