// Pricing and Promotion Compliance Standard PRC-1 and Margin and Pricing Rules MGN-1: the reference price and the final price (server/lib/pricing.js).
import test from 'node:test'
import assert from 'node:assert/strict'
import { CANON, pricing, refFinal, refLine } from './_lib.js'

const data = { products: CANON.products, orders: CANON.orders }

test('MGN-1: final price = regular price × discount, rounded to the dollar', async () => {
  const { finalPrice } = await pricing()
  for (const [price, pct] of [[599, 80], [599, 90], [399, 70], [379, 85], [169, 85], [79, 100]]) {
    assert.equal(finalPrice(price, pct), refFinal(price, pct), `finalPrice(${price}, ${pct}) should be ${refFinal(price, pct)}`)
  }
})

test('PRC-1: the reference price is the lowest price paid in the 7 days before the sale, not what Operations typed', async () => {
  const { linePrice } = await pricing()
  for (const p of CANON.products) {
    assert.equal(linePrice(p.sku, data, CANON.campaign), refLine(p.sku, CANON.campaign), `the reference price of ${p.name} is wrong`)
  }
  const moved = CANON.products.filter((p) => refLine(p.sku, CANON.campaign) !== p.price).map((p) => p.sku)
  assert.ok(moved.length >= 3, 'in the data, a few items sold for less in the 7 days before the sale')
})

test('PRC-1: a low price from before those 7 days and a returned order do not count', async () => {
  const { linePrice } = await pricing()
  const sku = 'TENT4'
  const extra = [
    { id: 'X1', sku, paid: 399, qty: 1, date: '2026-11-19', status: 'Completed' }, // day 8
    { id: 'X2', sku, paid: 449, qty: 1, date: '2026-11-24', status: 'Returned' },
  ]
  const got = linePrice(sku, { products: CANON.products, orders: [...CANON.orders, ...extra] }, CANON.campaign)
  assert.equal(got, refLine(sku, CANON.campaign), 'an order from before the 7 days, or a returned one, cannot set the reference price')
})
