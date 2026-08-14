import { describe, expect, it } from 'vitest'
import { BASE_THEME } from 'brutx-shared-vue'
import {
    FALLBACK_FG_COLOR,
    FALLBACK_PRIMARY_COLOR,
    FALLBACK_SECONDARY_COLOR,
} from './theme-fallbacks'

describe('theme-fallbacks', () => {
    it('primary fallback matches BASE_THEME.light.primary', () => {
        expect(FALLBACK_PRIMARY_COLOR).toBe(BASE_THEME.light.primary)
    })

    it('secondary fallback matches BASE_THEME.light.secondary', () => {
        expect(FALLBACK_SECONDARY_COLOR).toBe(BASE_THEME.light.secondary)
    })

    it('fg fallback matches BASE_THEME.light.fg', () => {
        expect(FALLBACK_FG_COLOR).toBe(BASE_THEME.light.fg)
    })
})
