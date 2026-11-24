// Reference implementation: the Black Friday campaign page.
import { html, parts, pctOff, usd } from '../lib/format.js'

const pad = (n) => String(n).padStart(2, '0')

export function render(state) {
  if (state.status === 'loading') return String(html`<section class="state">Loading…</section>`)
  if (state.status === 'error') return String(html`<section class="state state--error">${state.error}</section>`)
  const c = state.campaign
  const live = c.status === 'live'
  const t = parts(Date.parse(c.end) - state.now)
  const fr = c.fullReduction
  return String(html`<section class="hero glass">
    <p class="eyebrow">${c.name}</p>
    <h1 class="display">Black Friday</h1>
    <p class="muted">${usd(fr.off)} off every ${usd(fr.every)}. ${fr.withDiscount ? 'Stacks with discounts' : 'Does not stack with discounts'}; ${fr.withCoupon ? 'stacks with coupons' : 'does not stack with coupons'}.</p>
    ${live ? html`<p data-countdown data-end="${c.end}">Ends in ${t.d} days ${pad(t.h)}:${pad(t.m)}:${pad(t.s)}</p>` : html`<p data-countdown data-end="${c.end}">The sale is not live yet. Coming soon.</p>`}
  </section>
  <section class="grid">
    ${state.items.map((i) => html`<article class="glass panel" data-sku="${i.sku}">
      <h3>${i.name}</h3>
      <p>Final price <b data-final>${usd(i.final)}</b> <span class="chip">${pctOff(i.pct)}</span></p>
      <p class="muted"><s data-line>${usd(i.linePrice)}</s> <small data-line-note>Lowest price in the 7 days before the sale</small></p>
      ${live ? html`<button class="btn btn--primary" data-action="add" data-sku="${i.sku}">Add to cart</button>` : ''}
    </article>`)}
  </section>
  <aside class="glass panel" data-cart>${state.cart ? html`Subtotal ${usd(state.cart.subtotal)}, spend and save −${usd(state.cart.off)}, total ${usd(state.cart.total)}` : 'Your cart is empty'}</aside>`)
}

export function mount(root, ctx) {
  let state = { status: 'loading', campaign: null, items: [], now: Date.now(), cart: null }
  const cart = []
  const draw = () => { root.innerHTML = render(state) }
  draw()
  Promise.all([ctx.api.get('/api/campaign'), ctx.api.get('/api/time')])
    .then(([c, t]) => { state = { ...state, status: 'ready', campaign: c.campaign, items: c.items, now: Date.parse(t.now) }; draw() })
    .catch((e) => { state = { ...state, status: 'error', error: e.message }; draw() })
  const onClick = async (e) => {
    const b = e.target.closest('[data-action="add"]')
    if (!b) return
    const hit = cart.find((x) => x.sku === b.dataset.sku)
    if (hit) hit.qty += 1
    else cart.push({ sku: b.dataset.sku, qty: 1 })
    try { state = { ...state, cart: await ctx.api.post('/api/cart/quote', { items: cart }) } } catch (err) { state = { ...state, error: err.message } }
    draw()
  }
  root.addEventListener('click', onClick)
  return () => root.removeEventListener('click', onClick)
}
