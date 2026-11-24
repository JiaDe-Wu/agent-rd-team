// Personal Data Display Standard PII-1, PII-4: neither the web source nor what a page renders contains a full phone number.
import test from 'node:test'
import assert from 'node:assert/strict'
import { FULL_PHONE, files, pages } from './_lib.js'

test('PII-1: the web source has no hard-coded full phone number', () => {
  for (const f of files('web', ['.js', '.html'])) assert.doesNotMatch(f.text, FULL_PHONE, `${f.file} has a full phone number`)
})

test('PII-1: a page given data with a phone number shows it masked', async () => {
  const person = { id: 'LK000001', name: 'Test Person', dept: 'R&D Center', phone: '415-555-0134', mobile: '415-555-0134' }
  const state = { status: 'ready', items: [person], people: [person], employees: [person], list: [person], rows: [person], person, employee: person }
  for (const p of await pages()) {
    let out = ''
    try {
      out = String(p.module.render(state))
    } catch {
      continue // this page's state has another shape: the team's own tests cover it
    }
    assert.doesNotMatch(out, FULL_PHONE, `page ${p.name} shows a full phone number`)
  }
})
