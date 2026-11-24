/**
 * The example team's setup, as the backend plans it (GET /setup, backend/team/setup.py): the steps still to do, each one
 * call this page makes with the owner's own session. A step that exists already answers 409 and counts as done.
 */
import type { AppApi } from '@kirocrew/app-sdk'
import { errorStatus, errorText } from '../board/useBoard'

export type SetupStep = { id: string; label: string; call: { method: string; path: string; body?: unknown } }
export type SetupStatus = {
  workspace: { name: string; dir: string; done: boolean | null }
  templates: { total: number; present: number; done: boolean }
  members: { total: number; created: number | null; missing: string[] | null; done: boolean | null }
  knowledge: { source: string; documents: number; items: number; state: string; done: boolean | null }
  sample: { id: string; done: boolean }
  problems: string[]
  ready: boolean
}
export type SetupData = {
  status: SetupStatus
  plan: SetupStep[]
  example: { requirement: string; team: string }
  terminal: string
  disclosure: string
}
export type PlanFailure = { step: SetupStep; message: string }

export const SETUP_PATH = '/api/apps/agent-rd-team/setup'

function send(api: AppApi, call: SetupStep['call']): Promise<unknown> {
  const m = call.method.toUpperCase()
  if (m === 'POST') return api.post(call.path, call.body ?? {})
  if (m === 'PUT') return api.put(call.path, call.body ?? {})
  if (m === 'PATCH') return api.patch(call.path, call.body ?? {})
  if (m === 'DELETE') return api.del(call.path)
  return api.get(call.path)
}

/** Run *steps* in order. Null when every one is done; else the step that failed, and why (the steps after it are not tried). */
export async function runPlan(
  api: AppApi,
  steps: SetupStep[],
  onStep: (index: number, step: SetupStep) => void = () => {},
): Promise<PlanFailure | null> {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    onStep(i, step)
    try {
      await send(api, step.call)
    } catch (e) {
      if (errorStatus(e) === 409) continue
      return { step, message: errorText(e) }
    }
  }
  return null
}

/** The line a person reads for the plan so far: "Step 3 of 17: Add Quality". */
export function progressText(index: number, total: number, step: SetupStep): string {
  return `Step ${index + 1} of ${total}: ${step.label}`
}
