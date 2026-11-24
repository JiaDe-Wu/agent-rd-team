// Pricing and Promotion Compliance Standard PRC-5 and Frontend Engineering Standard FE-1, UX-4: the operations back office (web/pages/admin.js, web/styles/admin.css).
import test from 'node:test'
import assert from 'node:assert/strict'
import { CANON, bySku, page, read, refCheck, withPct, RAW_COLOR } from './_lib.js'

// The reference algorithm builds a check result shaped like the API's
function checkOf(config, status = 'draft') {
  const r = refCheck(config)
  const items = r.items
  const blockers = [
    ...items.filter((i) => !i.marginOk).map((i) => `${i.name}: lowest price $${i.lowest} is below the margin floor $${i.floor.toFixed(0)} (MGN-2)`),
    ...(r.priceProtect.needsCfo ? [`Price-adjustment payouts $${r.priceProtect.amount} are over $20,000: CFO approval needed (PP-2)`] : []),
  ]
  return { status, campaign: { name: config.name, start: config.start, end: config.end }, items, priceProtect: r.priceProtect, margin: r.margin, blockers, canLaunch: blockers.length === 0 }
}
const blocked = checkOf(CANON.campaign)
const ok = checkOf(withPct(CANON.campaign, { TENT4: 90, JACKET: 80 }))

test('PRC-5: one row per item; you can see which item fails; you can change the discount and spend-and-save', async () => {
  const { render } = await page('admin')
  const out = render({ status: 'ready', check: blocked })
  assert.equal(typeof out, 'string', 'render must return a string')
  const rows = bySku(out)
  for (const i of blocked.items) {
    const seg = rows.get(i.sku)
    assert.ok(seg, `the back office has no row for ${i.name} (data-sku="${i.sku}")`)
    assert.match(seg, new RegExp(`data-ok="${i.marginOk}"`), `the row of ${i.name} must have data-ok="${i.marginOk}"`)
    assert.match(seg, new RegExp(`<input[^>]*data-pct[^>]*value="${i.pct}"|<input[^>]*value="${i.pct}"[^>]*data-pct`), `the discount input of ${i.name} (data-pct, value="${i.pct}")`)
    assert.match(seg, /<input[^>]*type="checkbox"[^>]*data-fr|<input[^>]*data-fr[^>]*type="checkbox"/, `the spend-and-save switch of ${i.name} (a checkbox, data-fr)`)
  }
})

test('PRC-5: when it cannot launch it says why and shows the payout, and the launch button is disabled; when it passes the button works', async () => {
  const { render } = await page('admin')
  const out = render({ status: 'ready', check: blocked })
  const list = out.match(/data-blockers[\s\S]*?(?=data-pp|data-action="launch"|$)/)?.[0] || ''
  assert.ok(list, 'the list of reasons it cannot launch must carry data-blockers')
  for (const b of blocked.blockers) assert.ok(out.includes(b.split(' (')[0].slice(0, 12)), `a reason is not shown: ${b}`)
  assert.match(out.replace(/,/g, ''), new RegExp(`data-pp[\\s\\S]*?${blocked.priceProtect.amount}`), `the payout summary (data-pp) must show $${blocked.priceProtect.amount}`)
  assert.match(out, /<button[^>]*data-action="launch"[^>]*disabled|<button[^>]*disabled[^>]*data-action="launch"/, 'the check failed, so the launch button must be disabled')
  const good = render({ status: 'ready', check: ok })
  assert.match(good, /<button[^>]*data-action="launch"/, 'there must be a launch button')
  assert.doesNotMatch(good, /<button[^>]*data-action="launch"[^>]*disabled|<button[^>]*disabled[^>]*data-action="launch"/, 'the check passed, so the launch button works')
})

test('FE-1: no inline scripts and no inline event attributes', async () => {
  const { render } = await page('admin')
  for (const s of [{ status: 'loading', check: null }, { status: 'error', check: null, error: 'The network is slow' }, { status: 'ready', check: blocked }, { status: 'saving', check: ok }, { status: 'ready', check: { ...ok, status: 'live' } }]) {
    const out = render(s)
    assert.doesNotMatch(out, /<script/i, `${s.status}: the page has a <script>`)
    assert.doesNotMatch(out, /<[^>]*\son[a-z]+\s*=/i, `${s.status}: the page has an inline event such as onclick=`)
  }
})

test('UX-4: the back office style uses only the brand variables', () => {
  const css = read('web/styles/admin.css')
  assert.ok(css.split('\n').length > 5, 'web/styles/admin.css has not been written yet')
  const bad = css.split('\n').filter((ln) => RAW_COLOR.test(ln))
  assert.deepEqual(bad, [], 'admin.css hard-codes a colour: use var(--brand-…) from tokens.css')
})
