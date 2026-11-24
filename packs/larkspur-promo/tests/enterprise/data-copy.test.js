// Data as it is: the products and orders in server/data/ must be exactly the knowledge base's data (the checks' right answers are all worked out from it).
import test from 'node:test'
import assert from 'node:assert/strict'
import { CANON, read } from './_lib.js'

test('DATA-1: products and orders are copied from the knowledge base as they are', () => {
  for (const [file, want] of [['server/data/products.json', CANON.products], ['server/data/orders.json', CANON.orders]]) {
    const text = read(file)
    assert.ok(text, `There is no ${file} yet (the knowledge base document "Official store products and orders" gives the path of the data files: copy them as they are)`)
    assert.deepEqual(JSON.parse(text), want, `${file} differs from the knowledge base's data: copy it as it is; do not retype it or change it`)
  }
})
