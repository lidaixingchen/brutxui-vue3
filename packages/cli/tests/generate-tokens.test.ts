import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

vi.mock('brutx-shared-vue/tokens', async () => import('../../shared/src/tokens/index.ts'))

import { TokenStyleCompiler, THEME_START } from 'brutx-shared-vue/tokens'
import { patchBrutalistCss } from '../scripts/generate-tokens.js'

describe('patchBrutalistCss', () => {
    it('normalizes the generated theme region and is idempotent', () => {
        const template = readFileSync(resolve(process.cwd(), 'src/styles/brutalist.css'), 'utf8')
        const compiler = new TokenStyleCompiler()
        const patched = patchBrutalistCss(template, compiler)

        expect(patched).toContain(`${THEME_START}\n@theme inline {`)
        expect(patched.match(/^@theme inline \{/gm)).toHaveLength(1)
        expect(patched.match(/^@theme \{/gm)).toHaveLength(1)
        expect(patched).not.toContain('@theme {\n    @theme inline {')
        expect(patchBrutalistCss(patched, compiler)).toBe(patched)
    })
})
