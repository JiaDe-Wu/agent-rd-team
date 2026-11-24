// Personal Data Display Standard PII-1, PII-3: API responses and export files never contain a full phone number.
import test from 'node:test'
import assert from 'node:assert/strict'
import { FULL_PHONE, routes, startServer } from './_lib.js'

test('PII-1: no GET endpoint without parameters (exports included) returns a full phone number', async () => {
  const list = (await routes()).filter((r) => r.method === 'GET' && !String(r.path).includes(':'))
  const s = await startServer()
  try {
    for (const r of list) {
      const res = await s.get(r.path)
      assert.doesNotMatch(res.text, FULL_PHONE, `GET ${r.path} returned a full phone number (show only the last 4 digits, as ***-***-1234)`)
    }
  } finally {
    await s.close()
  }
})
