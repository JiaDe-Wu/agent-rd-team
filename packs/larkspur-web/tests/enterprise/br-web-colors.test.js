// Brand Standard BR-1 and Frontend Engineering Standard UX-4: colours only from the brand variables in tokens.css; pages do not write a colour of their own.
import test from 'node:test'
import assert from 'node:assert/strict'
import { files } from './_lib.js'

const TEMPLATE = new Set(['web/styles/tokens.css', 'web/styles/base.css', 'web/styles/shell.css'])

test('BR-1: pages, page styles and motion contain no hard-coded colour value', () => {
  for (const f of [...files('web/styles', ['.css']), ...files('web/pages', ['.js']), ...files('web/motion', ['.js', '.css'])]) {
    if (TEMPLATE.has(f.file)) continue
    const lines = f.text.split('\n').filter((ln) => !/^\s*(\/\/|\/\*|\*)/.test(ln))
    const bad = lines.filter((ln) => /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(\s*\d/.test(ln))
    assert.deepEqual(bad, [], `${f.file} hard-codes a colour: use var(--brand-…)`)
  }
})
