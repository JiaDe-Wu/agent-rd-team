// Pricing and Promotion Compliance Standard PRC-2, PRC-3, PRC-4 and Frontend Engineering Standard FE-1, FE-3, UX-4: the Black Friday campaign page (web/pages/campaign.js, web/styles/campaign.css).
import test from 'node:test'
import assert from 'node:assert/strict'
import { CANON, SERVER_NOW, bySku, num, page, read, refCheck, textOf, RAW_COLOR } from './_lib.js'

const want = refCheck(CANON.campaign).items
const items = want.map((i) => {
  const p = CANON.products.find((x) => x.sku === i.sku)
  return { sku: i.sku, name: i.name, category: p.category, price: i.price, linePrice: i.linePrice, final: i.final, pct: i.pct, fullReduction: i.fullReduction, stock: p.stock }
})
const campaign = (status) => ({ name: CANON.campaign.name, start: CANON.campaign.start, end: CANON.campaign.end, status, fullReduction: CANON.campaign.fullReduction })
const state = (status) => ({ status: 'ready', campaign: campaign(status), items, now: Date.parse(SERVER_NOW), cart: null })

test('PRC-2: every item shows its final price and reference price, and the reference price says it is the lowest price in the 7 days before the sale', async () => {
  const { render } = await page('campaign')
  const out = render(state('live'))
  assert.equal(typeof out, 'string', 'render must return a string')
  const cards = bySku(out)
  for (const i of items) {
    const seg = cards.get(i.sku)
    assert.ok(seg, `the campaign page has no ${i.name} (the card must carry data-sku="${i.sku}")`)
    assert.equal(num(textOf(seg, 'data-final')), i.final, `final price of ${i.name} (data-final)`)
    assert.equal(num(textOf(seg, 'data-line')), i.linePrice, `reference price of ${i.name} (data-line)`)
  }
  const notes = (out.match(/lowest\s+price\s+in\s+the\s+7\s+days\s+before\s+the\s+sale/gi) || []).length
  assert.ok(notes >= 1, 'next to the reference price write "Lowest price in the 7 days before the sale"')
  for (const i of items) assert.match(cards.get(i.sku), /lowest\s+price\s+in\s+the\s+7\s+days\s+before\s+the\s+sale|data-line-note/i, `there is no explanation next to the reference price of ${i.name}`)
})

test('PRC-3: the spend-and-save rule is written in full: threshold, amount, and whether it stacks with discounts and coupons', async () => {
  const { render } = await page('campaign')
  const out = render(state('live')).replace(/,/g, '')
  const { every, off } = CANON.campaign.fullReduction
  assert.match(out, new RegExp(`\\$?${off}\\s+off\\s+(?:every|each)\\s+\\$?${every}`, 'i'), `it must say "$${off} off every $${every}"`)
  assert.match(out, /discount/i, 'it must say whether it stacks with discounts')
  assert.match(out, /coupon/i, 'it must say whether it stacks with coupons')
  assert.doesNotMatch(out, /lowest prices? (?:anywhere|ever|online)|best prices? (?:anywhere|ever|online)|unbeatable|biggest savings/i, 'it must not use a claim such as "lowest prices anywhere"')
})

test('PRC-4: the countdown runs to the sale end time; before launch nothing can be bought', async () => {
  const { render } = await page('campaign')
  const live = render(state('live'))
  const end = CANON.campaign.end.replace(/\+/g, '\\+')
  assert.match(live, new RegExp(`data-countdown[^>]*data-end="${end}"|data-end="${end}"[^>]*data-countdown`), 'the countdown element must carry data-countdown and data-end="<the sale end time>"')
  assert.ok((live.match(/data-action="add"/g) || []).length >= items.length, 'when live, every item can be added to the cart (data-action="add")')
  const draft = render(state('draft'))
  assert.doesNotMatch(draft, /data-action="add"/, 'the sale is not live yet, so there must be no add-to-cart button')
  assert.match(draft, /not live yet|not started|starts soon|coming soon|not open/i, 'it must say the sale is not live yet')
})

test('FE-1, FE-3: no inline scripts or events, and product names are escaped', async () => {
  const { render } = await page('campaign')
  const evil = items.map((i, n) => (n === 0 ? { ...i, name: '<img src=x onerror=alert(1)>' } : i))
  for (const s of [{ status: 'loading', campaign: null, items: [], now: 0, cart: null }, { status: 'error', campaign: null, items: [], now: 0, cart: null, error: 'The network is slow' }, { ...state('live'), items: evil }]) {
    const out = render(s)
    assert.doesNotMatch(out, /<script/i, `${s.status}: the page has a <script>`)
    assert.doesNotMatch(out, /<[^>]*\son[a-z]+\s*=/i, `${s.status}: the page has an inline event such as onclick=`)
  }
  const out = render({ ...state('live'), items: evil })
  assert.ok(!out.includes('<img src=x') && out.includes('&lt;img'), 'a product name must be shown escaped')
  assert.match(render({ status: 'error', campaign: null, items: [], now: 0, cart: null, error: 'The network is slow' }), /The network is slow/, 'an error shows its message')
})

test('UX-4: the campaign page style uses only the brand variables', () => {
  const css = read('web/styles/campaign.css')
  assert.ok(css.split('\n').length > 5, 'web/styles/campaign.css has not been written yet')
  const bad = css.split('\n').filter((ln) => RAW_COLOR.test(ln))
  assert.deepEqual(bad, [], 'campaign.css hard-codes a colour: use var(--brand-…) from tokens.css')
})
