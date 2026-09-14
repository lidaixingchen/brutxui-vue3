import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Z_INDEX_TOKENS as SHARED_Z_INDEX_TOKENS } from 'brutx-shared-vue'
import { Z_INDEX, Z_INDEX_TOKENS } from './z-index'

describe('z-index', () => {
    it('matches design tokens defined in brutx-shared-vue', () => {
        expect(Z_INDEX_TOKENS.sticky).toBe(SHARED_Z_INDEX_TOKENS.sticky)
        expect(Z_INDEX_TOKENS.header).toBe(SHARED_Z_INDEX_TOKENS.header)
        expect(Z_INDEX_TOKENS.floating).toBe(SHARED_Z_INDEX_TOKENS.floating)
        expect(Z_INDEX_TOKENS.popover).toBe(SHARED_Z_INDEX_TOKENS.popover)
        expect(Z_INDEX_TOKENS.dropdown).toBe(SHARED_Z_INDEX_TOKENS.dropdown)
        expect(Z_INDEX_TOKENS.tooltip).toBe(SHARED_Z_INDEX_TOKENS.tooltip)
        expect(Z_INDEX_TOKENS.dialog).toBe(SHARED_Z_INDEX_TOKENS.dialog)
        expect(Z_INDEX_TOKENS.tourCanvas).toBe(SHARED_Z_INDEX_TOKENS.tourCanvas)
        expect(Z_INDEX_TOKENS.tourPopover).toBe(SHARED_Z_INDEX_TOKENS.tourPopover)
        expect(Z_INDEX_TOKENS.previewOverlay).toBe(SHARED_Z_INDEX_TOKENS.previewOverlay)
        expect(Z_INDEX_TOKENS.previewControl).toBe(SHARED_Z_INDEX_TOKENS.previewControl)
        expect(Z_INDEX_TOKENS.loading).toBe(SHARED_Z_INDEX_TOKENS.loading)
        expect(Z_INDEX_TOKENS.toast).toBe(SHARED_Z_INDEX_TOKENS.toast)
        expect(Z_INDEX_TOKENS.message).toBe(SHARED_Z_INDEX_TOKENS.message)
    })

    it('exposes semantic overlay layers on Z_INDEX', () => {
        expect(Z_INDEX.STICKY).toBe(Z_INDEX_TOKENS.sticky)
        expect(Z_INDEX.HEADER).toBe(Z_INDEX_TOKENS.header)
        expect(Z_INDEX.FLOATING).toBe(Z_INDEX_TOKENS.floating)
        expect(Z_INDEX.POPOVER).toBe(Z_INDEX_TOKENS.popover)
        expect(Z_INDEX.DROPDOWN).toBe(Z_INDEX_TOKENS.dropdown)
        expect(Z_INDEX.TOOLTIP).toBe(Z_INDEX_TOKENS.tooltip)
        expect(Z_INDEX.DIALOG).toBe(Z_INDEX_TOKENS.dialog)
        expect(Z_INDEX.TOUR_CANVAS).toBe(Z_INDEX_TOKENS.tourCanvas)
        expect(Z_INDEX.TOUR_POPOVER).toBe(Z_INDEX_TOKENS.tourPopover)
        expect(Z_INDEX.IMAGE_PREVIEW_OVERLAY).toBe(Z_INDEX_TOKENS.previewOverlay)
        expect(Z_INDEX.IMAGE_PREVIEW_CONTROL).toBe(Z_INDEX_TOKENS.previewControl)
        expect(Z_INDEX.LOADING).toBe(Z_INDEX_TOKENS.loading)
        expect(Z_INDEX.TOAST).toBe(Z_INDEX_TOKENS.toast)
        expect(Z_INDEX.MESSAGE).toBe(Z_INDEX_TOKENS.message)
    })

    it('remains strictly self-contained with no external module imports', () => {
        const sourcePath = resolve(__dirname, 'z-index.ts')
        const fileContent = readFileSync(sourcePath, 'utf8')
        expect(fileContent).not.toMatch(/^\s*import\s+/m)
    })
})
