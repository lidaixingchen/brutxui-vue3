export type ThemeName = 'classic' | 'pastel' | 'mono'
export type ColorMode = 'light' | 'dark'

export interface ThemeTokens {
    borderWidth: string
    borderColor: string
    shadowOffsetX: string
    shadowOffsetY: string
    shadowColor: string
    radius: string
    bg: string
    fg: string
    primary: string
    secondary: string
    accent: string
    destructive: string
    success: string
    muted: string
    mutedForeground: string
    ring: string
    pressedOffset: string
    info: string
    overlay: string
    placeholder: string
}

export type ColorTokenKey = 'primary' | 'secondary' | 'accent' | 'destructive' | 'success' | 'info'
export type LengthTokenKey = 'borderWidth' | 'radius' | 'shadowOffsetX' | 'shadowOffsetY'

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
        threshold: 4.5,
    },
    {
        id: 'muted',
        label: '柔和文本',
        usage: 'mutedForeground / muted',
        foregroundToken: 'mutedForeground',
        backgroundToken: 'muted',
        threshold: 4.5,
    },
    {
        id: 'primary',
        label: '主强调',
        usage: 'primary / bg',
        foregroundToken: 'primary',
        backgroundToken: 'bg',
        threshold: 3,
    },
    {
        id: 'destructive',
        label: '危险强调',
        usage: 'destructive / bg',
        foregroundToken: 'destructive',
        backgroundToken: 'bg',
        threshold: 3,
    },
    {
        id: 'success',
        label: '成功强调',
        usage: 'success / bg',
        foregroundToken: 'success',
        backgroundToken: 'bg',
        threshold: 3,
    },
    {
        id: 'info',
        label: '信息强调',
        usage: 'info / bg',
        foregroundToken: 'info',
        backgroundToken: 'bg',
        threshold: 3,
    },
]

export const themePresets: Record<ThemeName, ThemePreset> = {
    classic: {
        label: 'Classic',
        description: '粗边框、硬阴影、零圆角和高饱和强调色。',
        modes: {
            light: {
                borderWidth: '3px',
                borderColor: '#000000',
                shadowOffsetX: '4px',
                shadowOffsetY: '4px',
                shadowColor: '#000000',
                radius: '0px',
                bg: '#ffffff',
                fg: '#000000',
                primary: '#FF6B6B',
                secondary: '#4ECDC4',
                accent: '#FFE66D',
                destructive: '#EF476F',
                success: '#7FB069',
                muted: '#f3f4f6',
                mutedForeground: '#4B5563',
                ring: '#000000',
                pressedOffset: '2px',
                info: '#4A90D9',
                overlay: 'rgba(0, 0, 0, 0.5)',
                placeholder: '#9CA3AF',
            },
            dark: {
                borderWidth: '3px',
                borderColor: '#ffffff',
                shadowOffsetX: '4px',
                shadowOffsetY: '4px',
                shadowColor: '#ffffff',
                radius: '0px',
                bg: '#141414',
                fg: '#ffffff',
                primary: '#FF6B6B',
                secondary: '#4ECDC4',
                accent: '#FFE66D',
                destructive: '#EF476F',
                success: '#7FB069',
                muted: '#1e1e1e',
                mutedForeground: '#9CA3AF',
                ring: '#ffffff',
                pressedOffset: '2px',
                info: '#3B82F6',
                overlay: 'rgba(0, 0, 0, 0.7)',
                placeholder: '#6B7280',
            },
        },
    },
    pastel: {
        label: 'Pastel',
        description: '更柔和的色调、轻一些的边框和 8px 圆角。',
        modes: {
            light: {
                borderWidth: '2px',
                borderColor: '#1e1e24',
                shadowOffsetX: '3px',
                shadowOffsetY: '3px',
                shadowColor: '#1e1e24',
                radius: '8px',
                bg: '#faf9f6',
                fg: '#1e1e24',
                primary: '#d6c6e1',
                secondary: '#c5ded9',
                accent: '#fbe3b5',
                destructive: '#f3b0b0',
                success: '#cce2cb',
                muted: '#eae8e1',
                mutedForeground: '#6b6b78',
                ring: '#1e1e24',
                pressedOffset: '2px',
                info: '#a8c8e8',
                overlay: 'rgba(0, 0, 0, 0.4)',
                placeholder: '#b0aeb5',
            },
            dark: {
                borderWidth: '2px',
                borderColor: '#e5e5e5',
                shadowOffsetX: '3px',
                shadowOffsetY: '3px',
                shadowColor: '#e5e5e5',
                radius: '8px',
                bg: '#18171c',
                fg: '#e5e5e5',
                primary: '#8a739b',
                secondary: '#6e8e88',
                accent: '#b28e56',
                destructive: '#9b5a5a',
                success: '#678465',
                muted: '#27252f',
                mutedForeground: '#8a8a99',
                ring: '#e5e5e5',
                pressedOffset: '2px',
                info: '#5a7a9b',
                overlay: 'rgba(0, 0, 0, 0.7)',
                placeholder: '#5a5866',
            },
        },
    },
    mono: {
        label: 'Mono',
        description: '黑白灰极限对比，更粗的线条和更强的阴影偏移。',
        modes: {
            light: {
                borderWidth: '4px',
                borderColor: '#000000',
                shadowOffsetX: '5px',
                shadowOffsetY: '5px',
                shadowColor: '#000000',
                radius: '0px',
                bg: '#ffffff',
                fg: '#000000',
                primary: '#000000',
                secondary: '#ffffff',
                accent: '#7a7a7a',
                destructive: '#333333',
                success: '#dddddd',
                muted: '#f0f0f0',
                mutedForeground: '#555555',
                ring: '#000000',
                pressedOffset: '2px',
                info: '#666666',
                overlay: 'rgba(0, 0, 0, 0.5)',
                placeholder: '#888888',
            },
            dark: {
                borderWidth: '4px',
                borderColor: '#ffffff',
                shadowOffsetX: '5px',
                shadowOffsetY: '5px',
                shadowColor: '#ffffff',
                radius: '0px',
                bg: '#000000',
                fg: '#ffffff',
                primary: '#ffffff',
                secondary: '#000000',
                accent: '#888888',
                destructive: '#cccccc',
                success: '#222222',
                muted: '#1a1a1a',
                mutedForeground: '#aaaaaa',
                ring: '#ffffff',
                pressedOffset: '2px',
                info: '#999999',
                overlay: 'rgba(0, 0, 0, 0.7)',
                placeholder: '#777777',
            },
        },
    },
}

export const tokenKeys: (keyof ThemeTokens)[] = [
    'borderWidth',
    'borderColor',
    'shadowOffsetX',
    'shadowOffsetY',
    'shadowColor',
    'radius',
    'bg',
    'fg',
    'primary',
    'secondary',
    'accent',
    'destructive',
    'success',
    'muted',
    'mutedForeground',
    'ring',
    'pressedOffset',
    'info',
    'overlay',
    'placeholder',
]

export const cssVariableNames: Record<keyof ThemeTokens, string> = {
    borderWidth: '--brutal-border-width',
    borderColor: '--brutal-border-color',
    shadowOffsetX: '--brutal-shadow-offset-x',
    shadowOffsetY: '--brutal-shadow-offset-y',
    shadowColor: '--brutal-shadow-color',
    radius: '--brutal-radius',
    bg: '--brutal-bg',
    fg: '--brutal-fg',
    primary: '--brutal-primary',
    secondary: '--brutal-secondary',
    accent: '--brutal-accent',
    destructive: '--brutal-destructive',
    success: '--brutal-success',
    muted: '--brutal-muted',
    mutedForeground: '--brutal-muted-foreground',
    ring: '--brutal-ring',
    pressedOffset: '--brutal-pressed-offset',
    info: '--brutal-info',
    overlay: '--brutal-overlay',
    placeholder: '--brutal-placeholder',
}

export const colorControls: { key: ColorTokenKey; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'destructive', label: 'Destructive' },
    { key: 'success', label: 'Success' },
    { key: 'info', label: 'Info' },
]

export const lengthControls: { key: LengthTokenKey; label: string; min: number; max: number; step: number }[] = [
    { key: 'borderWidth', label: 'Border', min: 1, max: 8, step: 1 },
    { key: 'radius', label: 'Radius', min: 0, max: 24, step: 1 },
    { key: 'shadowOffsetX', label: 'Shadow X', min: 0, max: 12, step: 1 },
    { key: 'shadowOffsetY', label: 'Shadow Y', min: 0, max: 12, step: 1 },
]

export const themeOptions: { value: ThemeName; label: string }[] = [
    { value: 'classic', label: 'Classic' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'mono', label: 'Mono' },
]

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
        const ratio = getContrastRatio(tokens[pair.foregroundToken], tokens[pair.backgroundToken])

        return {
            ...pair,
            ratio,
            status: ratio === null ? 'unavailable' : ratio >= pair.threshold ? 'pass' : 'warn',
        }
    })
}

function getContrastRatio(foreground: string, background: string): number | null {
    const foregroundRgb = parseHexColor(foreground)
    const backgroundRgb = parseHexColor(background)

    if (!foregroundRgb || !backgroundRgb) {
        return null
    }

    const foregroundLuminance = getRelativeLuminance(foregroundRgb)
    const backgroundLuminance = getRelativeLuminance(backgroundRgb)
    const lighter = Math.max(foregroundLuminance, backgroundLuminance)
    const darker = Math.min(foregroundLuminance, backgroundLuminance)

    return roundContrastRatio((lighter + 0.05) / (darker + 0.05))
}

function parseHexColor(value: string): [number, number, number] | null {
    const normalized = value.trim()

    if (!isValidHex(normalized)) {
        return null
    }

    const hex = normalized.slice(1)
    const expandedHex = hex.length === 3
        ? hex.split('').map((char) => `${char}${char}`).join('')
        : hex

    return [
        Number.parseInt(expandedHex.slice(0, 2), 16),
        Number.parseInt(expandedHex.slice(2, 4), 16),
        Number.parseInt(expandedHex.slice(4, 6), 16),
    ]
}

function getRelativeLuminance([red, green, blue]: [number, number, number]): number {
    const [linearRed, linearGreen, linearBlue] = [red, green, blue].map((channel) => {
        const value = channel / 255
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })

    return 0.2126 * linearRed + 0.7152 * linearGreen + 0.0722 * linearBlue
}

function roundContrastRatio(value: number): number {
    return Math.round(value * 10) / 10
}
