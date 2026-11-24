// The placeholder home page that comes with the template: once developers add their own pages, change it or take it out of pages/index.js.
import { html } from '../lib/format.js'

export function render(state = {}) {
  return String(html`<section class="hero glass panel">
    <p class="eyebrow">Larkspur Outfitters</p>
    <h1 class="display">${state.title || 'New page'}</h1>
    <p class="muted">This project started from the company web template; the page has not been written yet.</p>
  </section>`)
}

export function mount(root) {
  root.innerHTML = render({})
}
