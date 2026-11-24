// The operations back office: frontend developers implement it from the README, "Page conventions" (render is a pure function, mount binds events). Here it is a placeholder.
import { html } from '../lib/format.js'

export function render(state) {
  return html`<section class="panel glass">
    <p class="eyebrow">Back office</p>
    <h1 class="title">Campaign setup</h1>
    <p class="muted">${state.status === 'error' ? state.error : 'This page has not been built yet'}</p>
  </section>`.toString()
}

export function mount(root) {
  root.innerHTML = render({ status: 'loading', check: null })
}
