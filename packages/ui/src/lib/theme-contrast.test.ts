import { describe, expect, it } from 'vitest'
import {
    BASE_THEME,
    THEME_PRESETS,
    calculateContrastRatio,
    isContrastCompliant,
    CONTRAST_RATIO_THRESHOLDS,
    type ThemeTokens,
} from 'brutx-shared-vue'

const MIN_WCAG_AA_CONTRAST = CONTRAST_RATIO_THRESHOLDS.AA

type ColorPairKey = [bgKey: keyof ThemeTokens, fgKey: keyof ThemeTokens]

const SEMANTIC_COLOR_PAIRS: ColorPairKey[] = [
    ['bg', 'fg'],
    ['primary', 'primaryForeground'],
    ['secondary', 'secondaryForeground'],
    ['accent', 'accentForeground'],
    ['destructive', 'destructiveForeground'],
    ['success', 'successForeground'],
    ['info', 'infoForeground'],
    ['muted', 'mutedForeground'],
    ['statusSuccess', 'statusSuccessForeground'],
    ['statusWarning', 'statusWarningForeground'],
    ['statusInfo', 'statusInfoForeground'],
    ['statusError', 'statusErrorForeground'],
]

describe('theme contrast invariant (WCAG 2.1 AA >= 4.5:1)', () => {
    describe('BASE_THEME', () => {
        for (const mode of ['light', 'dark'] as const) {
            const tokens = BASE_THEME[mode]
            describe(`${mode} mode`, () => {
                for (const [bgKey, fgKey] of SEMANTIC_COLOR_PAIRS) {
                    const bg = tokens[bgKey]
                    const fg = tokens[fgKey]
                    it(`${String(bgKey)} (${bg}) vs ${String(fgKey)} (${fg}) should satisfy WCAG AA >= 4.5`, () => {
                        const ratio = calculateContrastRatio(bg, fg)
                        expect(ratio).toBeGreaterThanOrEqual(MIN_WCAG_AA_CONTRAST)
                        expect(isContrastCompliant(ratio, 'AA')).toBe(true)
                    })
                }
            })
        }
    })

    describe('THEME_PRESETS', () => {
        for (const [presetName, preset] of Object.entries(THEME_PRESETS)) {
            describe(`preset: ${presetName}`, () => {
                for (const mode of ['light', 'dark'] as const) {
                    const baseTokens = BASE_THEME[mode]
                    const overrides = preset[mode]
                    const mergedTokens: ThemeTokens = { ...baseTokens, ...overrides }

                    describe(`${mode} mode`, () => {
                        for (const [bgKey, fgKey] of SEMANTIC_COLOR_PAIRS) {
                            const bg = mergedTokens[bgKey]
                            const fg = mergedTokens[fgKey]
                            it(`${String(bgKey)} (${bg}) vs ${String(fgKey)} (${fg}) should satisfy WCAG AA >= 4.5`, () => {
                                const ratio = calculateContrastRatio(bg, fg)
                                expect(ratio).toBeGreaterThanOrEqual(MIN_WCAG_AA_CONTRAST)
                                expect(isContrastCompliant(ratio, 'AA')).toBe(true)
                            })
                        }
                    })
                }
            })
        }
    })
})
