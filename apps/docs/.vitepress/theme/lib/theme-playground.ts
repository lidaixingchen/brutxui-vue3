import {
    BASE_THEME,
    calculateContrastRatio,
    CONTRAST_RATIO_THRESHOLDS,
    isContrastCompliant,
    THEME_PRESETS,
    TOKEN_TO_CSS_VAR,
} from 'brutx-shared-vue'
import type {
    ThemeMode,
    ThemePresetOverrides,
    ThemeTokens as SharedThemeTokens,
} from 'brutx-shared-vue'

export type ThemeName = 'classic' | 'pastel' | 'mono' | 'warm'
export type ColorMode = ThemeMode
export type ThemeTokens = SharedThemeTokens

export type ColorTokenKey = Extract<
    keyof ThemeTokens,
    | 'primary'
    | 'primaryForeground'
    | 'secondary'
    | 'secondaryForeground'
    | 'accent'
    | 'accentForeground'
    | 'destructive'
    | 'destructiveForeground'
    | 'success'
    | 'successForeground'
    | 'info'
    | 'infoForeground'
    | 'statusSuccess'
    | 'statusSuccessForeground'
    | 'statusWarning'
    | 'statusWarningForeground'
    | 'statusInfo'
    | 'statusInfoForeground'
    | 'statusError'
    | 'statusErrorForeground'
    | 'placeholder'
>
export type LengthTokenKey = Extract<keyof ThemeTokens, 'borderWidth' | 'radius' | 'shadowOffsetX' | 'shadowOffsetY'>

export interface ThemePreset {
    label: string
    description: string
    modes: Record<ColorMode, ThemeTokens>
}

export interface TokenCoverageResult {
    total: number
    covered: number
    missing: string[]
    isComplete: boolean
}

export interface ThemeCoverageResult {
    total: number
    covered: number
    missing: string[]
    isComplete: boolean
    modes: Record<ColorMode, TokenCoverageResult>
}

export interface ContrastCheckResult {
    id: string
    label: string
    usage: string
    foregroundToken: keyof ThemeTokens
    backgroundToken: keyof ThemeTokens
    ratio: number | null
    threshold: number
    status: 'pass' | 'warn' | 'unavailable'
}

interface ContrastPair {
    id: string
    label: string
    usage: string
    foregroundToken: keyof ThemeTokens
    backgroundToken: keyof ThemeTokens
    threshold: number
}

const contrastPairs: ContrastPair[] = [
    {
        id: 'body',
        label: '正文',
        usage: 'fg / bg',
        foregroundToken: 'fg',
        backgroundToken: 'bg',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'muted',
        label: '柔和文本',
        usage: 'mutedForeground / muted',
        foregroundToken: 'mutedForeground',
        backgroundToken: 'muted',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'placeholder',
        label: '占位文本',
        usage: 'placeholder / bg',
        foregroundToken: 'placeholder',
        backgroundToken: 'bg',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'primary',
        label: '主强调色文本',
        usage: 'primaryForeground / primary',
        foregroundToken: 'primaryForeground',
        backgroundToken: 'primary',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'secondary',
        label: '辅助色文本',
        usage: 'secondaryForeground / secondary',
        foregroundToken: 'secondaryForeground',
        backgroundToken: 'secondary',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'accent',
        label: '强调色文本',
        usage: 'accentForeground / accent',
        foregroundToken: 'accentForeground',
        backgroundToken: 'accent',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'destructive',
        label: '危险色文本',
        usage: 'destructiveForeground / destructive',
        foregroundToken: 'destructiveForeground',
        backgroundToken: 'destructive',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'success',
        label: '成功色文本',
        usage: 'successForeground / success',
        foregroundToken: 'successForeground',
        backgroundToken: 'success',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'info',
        label: '信息色文本',
        usage: 'infoForeground / info',
        foregroundToken: 'infoForeground',
        backgroundToken: 'info',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'status-success',
        label: '状态成功文本',
        usage: 'statusSuccessForeground / statusSuccess',
        foregroundToken: 'statusSuccessForeground',
        backgroundToken: 'statusSuccess',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'status-warning',
        label: '状态警告文本',
        usage: 'statusWarningForeground / statusWarning',
        foregroundToken: 'statusWarningForeground',
        backgroundToken: 'statusWarning',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'status-info',
        label: '状态信息文本',
        usage: 'statusInfoForeground / statusInfo',
        foregroundToken: 'statusInfoForeground',
        backgroundToken: 'statusInfo',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
    {
        id: 'status-error',
        label: '状态错误文本',
        usage: 'statusErrorForeground / statusError',
        foregroundToken: 'statusErrorForeground',
        backgroundToken: 'statusError',
        threshold: CONTRAST_RATIO_THRESHOLDS.AA,
    },
]

const presetDetails: Record<ThemeName, Pick<ThemePreset, 'label' | 'description'>> = {
    classic: {
        label: 'Classic',
        description: '粗边框、硬阴影、零圆角和高饱和强调色。',
    },
    pastel: {
        label: 'Pastel',
        description: '更柔和的色调、轻一些的边框和 8px 圆角。',
    },
    mono: {
        label: 'Mono',
        description: '黑白灰极限对比，更粗的线条和更强的阴影偏移。',
    },
    warm: {
        label: 'Warm',
        description: '温暖色调风格，兼顾泥土感与粗野主义硬阴影。',
    },
}

function getPresetOverrides(name: ThemeName): ThemePresetOverrides | undefined {
    return name === 'classic' ? undefined : THEME_PRESETS[name]
}

function createThemeTokens(mode: ColorMode, name: ThemeName): ThemeTokens {
    return {
        ...BASE_THEME[mode],
        ...getPresetOverrides(name)?.[mode],
    }
}

function createThemePreset(name: ThemeName): ThemePreset {
    return {
        ...presetDetails[name],
        modes: {
            light: createThemeTokens('light', name),
            dark: createThemeTokens('dark', name),
        },
    }
}

export const themePresets: Record<ThemeName, ThemePreset> = {
    classic: createThemePreset('classic'),
    pastel: createThemePreset('pastel'),
    mono: createThemePreset('mono'),
    warm: createThemePreset('warm'),
}

export const tokenKeys = Object.keys(TOKEN_TO_CSS_VAR) as Array<keyof ThemeTokens>

export const cssVariableNames = tokenKeys.reduce<Record<keyof ThemeTokens, string>>((result, key) => {
    result[key] = `--${TOKEN_TO_CSS_VAR[key]}`
    return result
}, {} as Record<keyof ThemeTokens, string>)

export const colorControls: { key: ColorTokenKey; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'primaryForeground', label: 'Primary FG' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'secondaryForeground', label: 'Secondary FG' },
    { key: 'accent', label: 'Accent' },
    { key: 'accentForeground', label: 'Accent FG' },
    { key: 'destructive', label: 'Destructive' },
    { key: 'destructiveForeground', label: 'Destructive FG' },
    { key: 'success', label: 'Success' },
    { key: 'successForeground', label: 'Success FG' },
    { key: 'info', label: 'Info' },
    { key: 'infoForeground', label: 'Info FG' },
    { key: 'statusSuccess', label: 'Status Success' },
    { key: 'statusSuccessForeground', label: 'Status Success FG' },
    { key: 'statusWarning', label: 'Status Warning' },
    { key: 'statusWarningForeground', label: 'Status Warning FG' },
    { key: 'statusInfo', label: 'Status Info' },
    { key: 'statusInfoForeground', label: 'Status Info FG' },
    { key: 'statusError', label: 'Status Error' },
    { key: 'statusErrorForeground', label: 'Status Error FG' },
    { key: 'placeholder', label: 'Placeholder' },
]

export const lengthControls: { key: LengthTokenKey; label: string; min: number; max: number; step: number }[] = [
    { key: 'borderWidth', label: 'Border', min: 1, max: 8, step: 1 },
    { key: 'radius', label: 'Radius', min: 0, max: 24, step: 1 },
    { key: 'shadowOffsetX', label: 'Shadow X', min: 0, max: 12, step: 1 },
    { key: 'shadowOffsetY', label: 'Shadow Y', min: 0, max: 12, step: 1 },
]

export const themeOptions = (Object.keys(themePresets) as ThemeName[]).map((name) => ({
    value: name,
    label: themePresets[name].label,
}))

export const modeOptions: { value: ColorMode; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
]

function cloneTokens(tokens: ThemeTokens): ThemeTokens {
    return { ...tokens }
}

export function clonePreset(name: ThemeName): Record<ColorMode, ThemeTokens> {
    const preset = themePresets[name]
    return {
        light: cloneTokens(preset.modes.light),
        dark: cloneTokens(preset.modes.dark),
    }
}

export function isValidHex(value: string): boolean {
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

export function toCssVariableObject(tokens: ThemeTokens): Record<string, string> {
    return tokenKeys.reduce<Record<string, string>>((result, key) => {
        result[cssVariableNames[key]] = tokens[key]
        return result
    }, {})
}

export function formatCssBlock(selectors: string[], tokens: ThemeTokens): string {
    const body = tokenKeys
        .map((key) => `    ${cssVariableNames[key]}: ${tokens[key]};`)
        .join('\n')
    return `${selectors.join(',\n')} {\n${body}\n}`
}

export function formatThemeCss(tokens: Record<ColorMode, ThemeTokens>): string {
    return [
        formatCssBlock(['.theme-custom'], tokens.light),
        formatCssBlock(['.dark .theme-custom', '.theme-custom.dark'], tokens.dark),
    ].join('\n\n')
}

export function getTokenCoverage(tokens: Partial<ThemeTokens>): TokenCoverageResult {
    const missing = tokenKeys
        .filter((key) => tokens[key] === undefined || cssVariableNames[key] === undefined)
        .map((key) => cssVariableNames[key] ?? String(key))

    return {
        total: tokenKeys.length,
        covered: tokenKeys.length - missing.length,
        missing,
        isComplete: missing.length === 0,
    }
}

export function getThemeCoverage(tokens: Record<ColorMode, Partial<ThemeTokens>>): ThemeCoverageResult {
    const light = getTokenCoverage(tokens.light)
    const dark = getTokenCoverage(tokens.dark)
    const missing = Array.from(new Set([...light.missing, ...dark.missing]))

    return {
        total: light.total + dark.total,
        covered: light.covered + dark.covered,
        missing,
        isComplete: light.isComplete && dark.isComplete,
        modes: {
            light,
            dark,
        },
    }
}

export function getContrastChecks(tokens: ThemeTokens): ContrastCheckResult[] {
    return contrastPairs.map((pair) => {
        let ratio: number | null = null

        try {
            ratio = calculateContrastRatio(tokens[pair.foregroundToken], tokens[pair.backgroundToken])
        } catch {
            ratio = null
        }

        return {
            ...pair,
            ratio,
            status: ratio === null
                ? 'unavailable'
                : isContrastCompliant(ratio, 'AA')
                    ? 'pass'
                    : 'warn',
        }
    })
}
