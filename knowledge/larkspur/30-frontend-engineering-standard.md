---
title: Frontend Engineering Standard (Larkspur Outfitters)
tags: [standard, frontend, accessibility, security]
---

# Frontend Engineering Standard

Rule IDs are FE-n (engineering) and UX-n (experience). Owner: R&D Center.

| ID | Rule | Example |
|---|---|---|
| FE-1 | No inline scripts: no code inside `<script>`, no `onclick=` style attributes. Pages carry a Content Security Policy (CSP) that blocks them. | Fails: `<button onclick="buy()">`. Passes: `<button data-action="buy">` with a delegated listener |
| FE-2 | No scripts, fonts, images or styles from other domains (no CDN). Everything is in the repository. | Fails: `<link href="https://fonts.googleapis.com/...">` |
| FE-3 | Text from users or data is escaped before it goes into a page; never concatenate it into HTML. | A product named `<img src=x onerror=alert(1)>` shows as text |
| FE-4 | No secrets or tokens written into front-end code. | Fails: `const token = 'sk-live-9f3a...'` |
| UX-1 | Animation respects the system's "reduce motion" setting: with `prefers-reduced-motion: reduce`, turn off scrolling and particles and show the result. | CSS has an `@media (prefers-reduced-motion: reduce)` block |
| UX-2 | Images have alt text; decorative images use `alt=""`. | Fails: `<img src="pip.svg">` |
| UX-3 | Text contrast is readable: body text at least 4.5:1, large text on big screens at least 3:1. | `--brand-ink` on white passes |
| UX-4 | Colours and fonts come from the brand variables (`--brand-*`); pages do not invent colours. | Fails: `color: #fff;` in a page style |
