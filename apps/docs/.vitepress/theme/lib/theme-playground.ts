export type ThemeName = 'classic' | 'pastel' | 'mono' | 'warm'
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
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    success: string
    successForeground: string
    muted: string
    mutedForeground: string
    ring: string
    pressedOffset: string
    info: string
    infoForeground: string
    overlay: string
    placeholder: string
}

export type ColorTokenKey =
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
        label: '主强调色文本',
        usage: 'primaryForeground / primary',
        foregroundToken: 'primaryForeground',
        backgroundToken: 'primary',
        threshold: 4.5,
    },
    {
        id: 'secondary',
        label: '辅助色文本',
        usage: 'secondaryForeground / secondary',
        foregroundToken: 'secondaryForeground',
        backgroundToken: 'secondary',
        threshold: 4.5,
    },
    {
        id: 'accent',
        label: '强调色文本',
        usage: 'accentForeground / accent',
        foregroundToken: 'accentForeground',
        backgroundToken: 'accent',
        threshold: 4.5,
    },
    {
        id: 'destructive',
        label: '危险色文本',
        usage: 'destructiveForeground / destructive',
        foregroundToken: 'destructiveForeground',
        backgroundToken: 'destructive',
        threshold: 4.5,
    },
    {
        id: 'success',
        label: '成功色文本',
        usage: 'successForeground / success',
        foregroundToken: 'successForeground',
        backgroundToken: 'success',
        threshold: 4.5,
    },
    {
        id: 'info',
        label: '信息色文本',
        usage: 'infoForeground / info',
        foregroundToken: 'infoForeground',
        backgroundToken: 'info',
        threshold: 4.5,
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
                primaryForeground: '#000000',
                secondary: '#4ECDC4',
                secondaryForeground: '#000000',
                accent: '#FFE66D',
                accentForeground: '#000000',
                destructive: '#EF476F',
                destructiveForeground: '#ffffff',
                success: '#7FB069',
                successForeground: '#000000',
                muted: '#f3f4f6',
                mutedForeground: '#4B5563',
                ring: '#000000',
                pressedOffset: '2px',
                info: '#4A90D9',
                infoForeground: '#ffffff',
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
                primaryForeground: '#000000',
                secondary: '#4ECDC4',
                secondaryForeground: '#000000',
                accent: '#FFE66D',
                accentForeground: '#000000',
                destructive: '#EF476F',
                destructiveForeground: '#ffffff',
                success: '#7FB069',
                successForeground: '#000000',
                muted: '#1e1e1e',
                mutedForeground: '#9CA3AF',
                ring: '#ffffff',
                pressedOffset: '2px',
                info: '#3B82F6',
                infoForeground: '#ffffff',
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
                primaryForeground: '#1e1e24',
                secondary: '#c5ded9',
                secondaryForeground: '#1e1e24',
                accent: '#fbe3b5',
                accentForeground: '#1e1e24',
                destructive: '#f3b0b0',
                destructiveForeground: '#1e1e24',
                success: '#cce2cb',
                successForeground: '#1e1e24',
                muted: '#eae8e1',
                mutedForeground: '#6b6b78',
                ring: '#1e1e24',
                pressedOffset: '2px',
                info: '#a8c8e8',
                infoForeground: '#1e1e24',
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
                primaryForeground: '#ffffff',
                secondary: '#6e8e88',
                secondaryForeground: '#ffffff',
                accent: '#b28e56',
                accentForeground: '#18171c',
                destructive: '#9b5a5a',
                destructiveForeground: '#ffffff',
                success: '#678465',
                successForeground: '#ffffff',
                muted: '#27252f',
                mutedForeground: '#8a8a99',
                ring: '#e5e5e5',
                pressedOffset: '2px',
                info: '#5a7a9b',
                infoForeground: '#ffffff',
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
                primaryForeground: '#ffffff',
                secondary: '#ffffff',
                secondaryForeground: '#000000',
                accent: '#7a7a7a',
                accentForeground: '#ffffff',
                destructive: '#333333',
                destructiveForeground: '#ffffff',
                success: '#dddddd',
                successForeground: '#000000',
                muted: '#f0f0f0',
                mutedForeground: '#555555',
                ring: '#000000',
                pressedOffset: '2px',
                info: '#666666',
                infoForeground: '#ffffff',
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
                primaryForeground: '#000000',
                secondary: '#000000',
                secondaryForeground: '#ffffff',
                accent: '#888888',
                accentForeground: '#000000',
                destructive: '#cccccc',
                destructiveForeground: '#000000',
                success: '#222222',
                successForeground: '#ffffff',
                muted: '#1a1a1a',
                mutedForeground: '#aaaaaa',
                ring: '#ffffff',
                pressedOffset: '2px',
                info: '#999999',
                infoForeground: '#000000',
                overlay: 'rgba(0, 0, 0, 0.7)',
                placeholder: '#777777',
            },
        },
    },
    warm: {
        label: 'Warm',
        description: '温暖色调风格，兼顾泥土感与粗野主义硬阴影。',
        modes: {
            light: {
                borderWidth: '3px',
                borderColor: '#5C3D2E',
                shadowOffsetX: '4px',
                shadowOffsetY: '4px',
                shadowColor: '#5C3D2E',
                radius: '4px',
                bg: '#FFF8F0',
                fg: '#2D1810',
                primary: '#E8722A',
                primaryForeground: '#FFFFFF',
                secondary: '#8B6F47',
                secondaryForeground: '#FFFFFF',
                accent: '#F2C078',
                accentForeground: '#2D1810',
                destructive: '#C0392B',
                destructiveForeground: '#FFFFFF',
                success: '#7B8B3A',
                successForeground: '#FFFFFF',
                muted: '#F5EDE3',
                mutedForeground: '#6B5B4F',
                ring: '#E8722A',
                pressedOffset: '2px',
                info: '#D4956A',
                infoForeground: '#FFFFFF',
                overlay: 'rgba(45, 24, 16, 0.5)',
                placeholder: '#B8A898',
            },
            dark: {
                borderWidth: '3px',
                borderColor: '#C4A882',
                shadowOffsetX: '4px',
                shadowOffsetY: '4px',
                shadowColor: '#C4A882',
                radius: '4px',
                bg: '#1A1410',
                fg: '#F5E6D3',
                primary: '#F59E4C',
                primaryForeground: '#1A1410',
                secondary: '#B8956A',
                secondaryForeground: '#1A1410',
                accent: '#FFD89B',
                accentForeground: '#1A1410',
                destructive: '#E74C3C',
                destructiveForeground: '#FFFFFF',
                success: '#A3B556',
                successForeground: '#1A1410',
                muted: '#2A2018',
                mutedForeground: '#B8A898',
                ring: '#F59E4C',
                pressedOffset: '2px',
                info: '#E8B88A',
                infoForeground: '#1A1410',
                overlay: 'rgba(0, 0, 0, 0.7)',
                placeholder: '#6B5B4F',
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
    'primaryForeground',
    'secondary',
    'secondaryForeground',
    'accent',
    'accentForeground',
    'destructive',
    'destructiveForeground',
    'success',
    'successForeground',
    'muted',
    'mutedForeground',
    'ring',
    'pressedOffset',
    'info',
    'infoForeground',
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
    primaryForeground: '--brutal-primary-foreground',
    secondary: '--brutal-secondary',
    secondaryForeground: '--brutal-secondary-foreground',
    accent: '--brutal-accent',
    accentForeground: '--brutal-accent-foreground',
    destructive: '--brutal-destructive',
    destructiveForeground: '--brutal-destructive-foreground',
    success: '--brutal-success',
    successForeground: '--brutal-success-foreground',
    muted: '--brutal-muted',
    mutedForeground: '--brutal-muted-foreground',
    ring: '--brutal-ring',
    pressedOffset: '--brutal-pressed-offset',
    info: '--brutal-info',
    infoForeground: '--brutal-info-foreground',
    overlay: '--brutal-overlay',
    placeholder: '--brutal-placeholder',
}

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
    { value: 'warm', label: 'Warm' },
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
