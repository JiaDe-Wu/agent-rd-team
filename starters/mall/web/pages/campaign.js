// The Black Friday campaign page (what shoppers see): frontend developers implement it from the README, "Page conventions" (render is a pure function, mount binds events). Here it is a placeholder.
import { html } from '../lib/format.js'

export function render(state) {
  return html`<section class="hero glass">
    <p class="eyebrow">Larkspur Outfitters Official Store</p>
    <h1 class="display">Black Friday</h1>
    <p class="muted">${state.status === 'error' ? state.error : 'This page has not been built yet'}</p>
  </section>`.toString()
}

export function mount(root) {
  root.innerHTML = render({ status: 'loading', campaign: null, items: [], now: Date.now(), cart: null })
}
