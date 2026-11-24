// Frontend Engineering Standard FE-4: no hard-coded secrets or tokens in the code (neither in the web pages nor on the server).
import test from 'node:test'
import assert from 'node:assert/strict'
import { files } from './_lib.js'

test('FE-4: no hard-coded secrets in the code', () => {
  for (const f of [...files('web', ['.js']), ...files('server', ['.js'])]) {
    assert.doesNotMatch(f.text, /AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{16,}|(?:password|secret|token)\s*[:=]\s*['"][^'"]{6,}/i, `${f.file} looks like it has a secret written into it`)
  }
})
