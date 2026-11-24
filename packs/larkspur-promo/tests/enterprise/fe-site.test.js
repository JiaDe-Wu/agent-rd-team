// Frontend Engineering Standard FE-2 and FE-4: no third-party resources and no hard-coded secrets.
import test from 'node:test'
import assert from 'node:assert/strict'
import { files } from './_lib.js'

test('FE-2: web pages do not load scripts, fonts, images or styles from other domains', () => {
  for (const f of files('web', ['.js', '.css', '.html'])) {
    const urls = (f.text.match(/(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"')]*/gi) || []).filter((u) => !/w3\.org/.test(u))
    assert.deepEqual(urls, [], `${f.file} refers to an external address`)
  }
})

test('FE-4: no hard-coded secrets in the code', () => {
  for (const f of [...files('web', ['.js']), ...files('server', ['.js'])]) {
    assert.doesNotMatch(f.text, /AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{16,}|(?:password|secret|token)\s*[:=]\s*['"][^'"]{6,}/i, `${f.file} looks like it has a secret written into it`)
  }
})
