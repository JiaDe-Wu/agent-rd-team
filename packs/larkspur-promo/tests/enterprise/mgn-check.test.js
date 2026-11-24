// Margin and Pricing Rules MGN-2 and MGN-3: the margin floor and the expected margin rate in the pre-launch check (check in server/lib/pricing.js).
import test from 'node:test'
import assert from 'node:assert/strict'
import { CANON, pricing, refCheck, withPct } from './_lib.js'

const data = { products: CANON.products, orders: CANON.orders }
const fixed = withPct(CANON.campaign, { TENT4: 90, JACKET: 80 })

test('MGN-2: the lowest price and the margin floor of each item', async () => {
  const { check } = await pricing()
  for (const config of [CANON.campaign, fixed]) {
    const got = check(config, data)
    const want = refCheck(config)
    assert.equal(got.items.length, want.items.length, 'the check lists every item in the configuration')
    for (const w of want.items) {
      const g = got.items.find((i) => i.sku === w.sku)
      assert.ok(g, `the check has no ${w.name}`)
      assert.equal(g.final, w.final, `${w.name} final price`)
      assert.equal(g.linePrice, w.linePrice, `${w.name} reference price`)
      assert.equal(g.lowest, w.lowest, `${w.name} lowest price (for an item in spend-and-save: 90% of the final price)`)
      assert.ok(Math.abs(g.floor - w.floor) < 0.01, `${w.name} margin floor is 108% of cost`)
      assert.equal(g.marginOk, w.marginOk, `${w.name} meets the floor or not`)
    }
  }
})

test('MGN-2: a plan with an item below the floor cannot launch; the changed plan has none', async () => {
  const { check } = await pricing()
  const before = check(CANON.campaign, data)
  const low = before.items.filter((i) => !i.marginOk).map((i) => i.sku).sort()
  assert.deepEqual(low, [...refCheck(CANON.campaign).low].sort(), 'the items below the margin floor')
  assert.equal(before.canLaunch, false, 'an item is below the floor, so the sale cannot launch')
  for (const i of before.items.filter((x) => !x.marginOk)) {
    assert.ok(before.blockers.some((b) => b.includes(i.name)), `the reasons it cannot launch must name ${i.name}`)
  }
  assert.equal(check(fixed, data).items.every((i) => i.marginOk), true, 'every item in the changed plan meets the floor')
})

test('MGN-3: expected margin rate', async () => {
  const { check } = await pricing()
  for (const config of [CANON.campaign, fixed]) {
    const got = check(config, data).margin
    const want = refCheck(config).margin
    assert.deepEqual(got, want, 'expected margin rate (from the units of completed orders in the 30 days before the sale, one decimal place)')
  }
})
