// The API conventions (project README, "API conventions"), Pricing and Promotion Compliance Standard PRC-4, PRC-5: campaign, pre-launch check, changing a discount, launching, cart quote.
import test from 'node:test'
import assert from 'node:assert/strict'
import { CANON, SERVER_NOW, currentConfig, refCheck, refFinal, startServer, withPct } from './_lib.js'

const fixed = withPct(CANON.campaign, { TENT4: 90, JACKET: 80 })

test('DATA-2: the campaign configuration is copied from the knowledge base plan; only the discounts may change, by a person\'s decision', () => {
  const c = currentConfig()
  for (const k of ['name', 'start', 'end', 'fullReduction']) assert.deepEqual(c[k], CANON.campaign[k], `${k} in server/config/campaign.json differs from the knowledge base plan`)
  assert.deepEqual(c.items.map((i) => i.sku), CANON.campaign.items.map((i) => i.sku), 'the items and their order must be those of the plan')
  for (const i of c.items) assert.ok(Number.isInteger(i.pct) && i.pct >= 50 && i.pct <= 100, `the discount of ${i.sku} must be a whole number from 50 to 100`)
})

test('PRC-4: server time; the campaign and the check endpoints', async () => {
  const s = await startServer()
  try {
    const t = await s.get('/api/time')
    assert.equal(t.status, 200)
    assert.equal(Date.parse(t.json.now), Date.parse(SERVER_NOW), '/api/time must use ctx.now()')
    const c = await s.get('/api/campaign')
    assert.equal(c.status, 200)
    assert.equal(c.json.campaign.status, 'draft', 'a freshly started sale is not live yet')
    const want = refCheck(currentConfig())
    assert.equal(c.json.items.length, want.items.length)
    for (const w of want.items) {
      const g = c.json.items.find((i) => i.sku === w.sku)
      assert.deepEqual([g?.final, g?.linePrice], [w.final, w.linePrice], `final price and reference price of ${w.name}`)
    }
    const k = await s.get('/api/campaign/check')
    assert.equal(k.status, 200)
    assert.equal(k.json.status, 'draft')
    assert.equal(k.json.priceProtect.amount, want.priceProtect.amount, 'the check endpoint\'s payout')
  } finally {
    await s.close()
  }
})

test('PRC-5: changing a discount: bad input is 400, an unknown item is 404, and the new check comes back', async () => {
  const s = await startServer({ config: CANON.campaign })
  try {
    for (const body of [{ pct: 45 }, { pct: 85.5 }, { pct: '80' }, { fullReduction: 'yes' }]) {
      const r = await s.put('/api/campaign/items/TENT4', body)
      assert.equal(r.status, 400, `${JSON.stringify(body)} should be 400`)
      assert.ok(r.json?.error?.message, 'the error needs a message in plain English')
    }
    assert.equal((await s.put('/api/campaign/items/NOPE', { pct: 80 })).status, 404)
    const r = await s.put('/api/campaign/items/TENT4', { pct: 90 })
    assert.equal(r.status, 200)
    const tent = r.json.items.find((i) => i.sku === 'TENT4')
    assert.equal(tent.final, refFinal(599, 90), 'the tent\'s final price after the change')
    assert.equal(r.json.priceProtect.amount, refCheck(withPct(CANON.campaign, { TENT4: 90 })).priceProtect.amount, 'payouts are worked out again after the change')
  } finally {
    await s.close()
  }
})

test('PRC-5: a failed check cannot launch, a passed one can; after launch nothing can be changed', async () => {
  const blocked = await startServer({ config: CANON.campaign })
  try {
    const r = await blocked.post('/api/campaign/launch')
    assert.equal(r.status, 409, 'the check failed, so launching should be 409')
    assert.equal(r.json?.error?.code, 'blocked')
    assert.match(r.json?.error?.message || '', /CFO|margin/i, 'the 409 must say why it cannot launch')
  } finally {
    await blocked.close()
  }
  const ok = await startServer({ config: fixed })
  try {
    const r = await ok.post('/api/campaign/launch')
    assert.equal(r.status, 200, `the check passed, so it should launch: ${r.text.slice(0, 200)}`)
    assert.equal(r.json.campaign.status, 'live')
    assert.equal((await ok.get('/api/campaign')).json.campaign.status, 'live')
    assert.equal((await ok.post('/api/campaign/launch')).status, 409, 'launching a live sale again is 409')
    assert.equal((await ok.put('/api/campaign/items/TENT4', { pct: 85 })).status, 409, 'discounts cannot change after launch')
  } finally {
    await ok.close()
  }
})

test('PRC-4: cart: before launch nothing is priced at the sale price; after launch spend-and-save is right', async () => {
  const s = await startServer({ config: fixed })
  try {
    const items = [{ sku: 'TENT4', qty: 1 }, { sku: 'PACK40', qty: 1 }, { sku: 'GPS', qty: 1 }]
    const early = await s.post('/api/cart/quote', { items })
    assert.equal(early.status, 409, 'the sale is not live, so nothing can be priced at the sale price (PRC-4)')
    assert.equal(early.json?.error?.code, 'not_live')
    await s.post('/api/campaign/launch')
    const r = await s.post('/api/cart/quote', { items })
    assert.equal(r.status, 200, r.text.slice(0, 200))
    const want = refCheck(fixed).items
    const f = (sku) => want.find((i) => i.sku === sku)
    const subtotal = items.reduce((n, i) => n + f(i.sku).final * i.qty, 0)
    const frBase = items.filter((i) => f(i.sku).fullReduction).reduce((n, i) => n + f(i.sku).final * i.qty, 0)
    const off = Math.floor(frBase / fixed.fullReduction.every) * fixed.fullReduction.off
    assert.deepEqual([r.json.subtotal, r.json.off, r.json.total], [subtotal, off, subtotal - off], 'subtotal, spend-and-save, total (the watch is not in spend-and-save)')
    assert.equal((await s.post('/api/cart/quote', { items: [] })).status, 400, 'an empty cart is 400')
    assert.equal((await s.post('/api/cart/quote', { items: [{ sku: 'TENT4', qty: 0 }] })).status, 400, 'the quantity must be a positive whole number')
    assert.equal((await s.post('/api/cart/quote', { items: [{ sku: 'NOPE', qty: 1 }] })).status, 404)
  } finally {
    await s.close()
  }
})
