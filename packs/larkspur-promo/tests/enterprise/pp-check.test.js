// Price-Adjustment Guarantee Rules PP-1 and PP-2: the payouts in the pre-launch check (check in server/lib/pricing.js).
import test from 'node:test'
import assert from 'node:assert/strict'
import { CANON, LIMIT, pricing, refCheck, withPct } from './_lib.js'

const data = { products: CANON.products, orders: CANON.orders }
const fixed = withPct(CANON.campaign, { TENT4: 90, JACKET: 80 })

test('PP-1: payouts are worked out per order: within 14 days, completed, with the guarantee, paid more than the final price', async () => {
  const { check } = await pricing()
  for (const config of [CANON.campaign, fixed]) {
    const got = check(config, data).priceProtect
    const want = refCheck(config).priceProtect
    assert.equal(got.amount, want.amount, 'total payout (dollars)')
    assert.equal(got.orders, want.orders, 'orders that get a payout')
    for (const w of want.bySku) {
      const g = got.bySku.find((s) => s.sku === w.sku)
      assert.ok(g, `bySku has no ${w.sku}`)
      assert.deepEqual([g.orders, g.amount], [w.orders, w.amount], `payout for ${w.name}`)
    }
  }
})

test('PP-2: payouts over $20,000 need CFO approval and the sale cannot launch without it', async () => {
  const { check } = await pricing()
  const before = check(CANON.campaign, data)
  assert.equal(before.priceProtect.limit, LIMIT)
  assert.equal(before.priceProtect.needsCfo, true, `the plan's payout $${refCheck(CANON.campaign).priceProtect.amount} is over $20,000`)
  assert.ok(before.blockers.some((b) => /CFO/.test(b)), 'the reasons it cannot launch must say CFO approval is needed')
  const after = check(fixed, data)
  assert.equal(after.priceProtect.needsCfo, false, 'the changed plan pays out $20,000 or less')
  assert.deepEqual([after.canLaunch, after.blockers], [true, []], 'the changed plan can launch')
})
