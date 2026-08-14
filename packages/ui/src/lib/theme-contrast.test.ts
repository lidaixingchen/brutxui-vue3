import { describe, expect, it } from 'vitest'
import {
    BASE_THEME,
    THEME_PRESETS,
    type ThemeTokens,
} from 'brutx-shared-vue'

function parseHexColor(hex: string): [number, number, number] {
    const cleaned = hex.replace('#', '').trim()
    if (cleaned.length === 3) {
        const r = Number.parseInt(cleaned[0] + cleaned[0], 16)
        const g = Number.parseInt(cleaned[1] + cleaned[1], 16)
        const b = Number.parseInt(cleaned[2] + cleaned[2], 16)
        return [r, g, b]
    }
    if (cleaned.length === 6) {
        const r = Number.parseInt(cleaned.slice(0, 2), 16)
        const g = Number.parseInt(cleaned.slice(2, 4), 16)
        const b = Number.parseInt(cleaned.slice(4, 6), 16)
        return [r, g, b]
    }
    throw new Error(`Unsupported hex color: ${hex}`)
}

function srgbToLinear(channel: number): number {
    const v = channel / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function getRelativeLuminance(hex: string): number {
    const [r, g, b] = parseHexColor(hex)
    const linR = srgbToLinear(r)
    const linG = srgbToLinear(g)
    const linB = srgbToLinear(b)
    return 0.2126 * linR + 0.7152 * linG + 0.0722 * linB
}

function calculateContrastRatio(color1: string, color2: string): number {
    const lum1 = getRelativeLuminance(color1)
    const lum2 = getRelativeLuminance(color2)
    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)
}

const MIN_WCAG_AA_CONTRAST = 4.5

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
                            })
                        }
                    })
                }
            })
        }
    })
})
