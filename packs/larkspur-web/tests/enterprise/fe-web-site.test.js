// Frontend Engineering Standard FE-1, FE-2, UX-2: no inline scripts, no third-party resources, images have alt text.
import test from 'node:test'
import assert from 'node:assert/strict'
import { files, pages } from './_lib.js'

const web = () => files('web', ['.js', '.css', '.html'])

test('FE-1: pages contain no inline script and no inline event attribute such as onclick', async () => {
  for (const f of files('web', ['.html', '.js'])) {
    assert.doesNotMatch(f.text, /<script(?![^>]*\bsrc=)[^>]*>/i, `${f.file} has an inline <script>`)
    assert.doesNotMatch(f.text, /\son[a-z]+\s*=\s*["'{]/i, `${f.file} has an on…= inline event attribute`)
  }
  for (const p of await pages()) {
    const out = String(p.module.render({}))
    assert.doesNotMatch(out, /<script|\son[a-z]+\s*=/i, `the output of render for page ${p.name} has an inline script or event attribute`)
  }
})

test('FE-2: web pages do not load scripts, fonts, images or styles from other domains', () => {
  for (const f of web()) {
    const urls = (f.text.match(/(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"')]*/gi) || []).filter((u) => !/w3\.org/.test(u))
    assert.deepEqual(urls, [], `${f.file} refers to an external address`)
  }
})

test('UX-2: every image has alt text (a decorative image uses alt="")', async () => {
  for (const f of files('web', ['.html', '.js'])) {
    const imgs = f.text.match(/<img\b[^>]*>/gi) || []
    for (const img of imgs) assert.match(img, /\balt=/i, `${f.file}: ${img} has no alt`)
  }
  for (const p of await pages()) {
    for (const img of String(p.module.render({})).match(/<img\b[^>]*>/gi) || []) {
      assert.match(img, /\balt=/i, `page ${p.name}: ${img} has no alt`)
    }
  }
})
