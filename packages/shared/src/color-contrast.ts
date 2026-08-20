export interface ColorChannels {
    r: number
    g: number
    b: number
    a?: number
}

export type ColorInput = string | ColorChannels

const HEX_SHORT_RE = /^#([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i
const HEX_LONG_RE = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i
const RGB_RE = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*((?:\d*\.\d+|\d+))\s*)?\)$/i
const HSL_RE = /^hsla?\(\s*(-?\d+)\s*,\s*((?:\d*\.\d+|\d+))%\s*,\s*((?:\d*\.\d+|\d+))%\s*(?:,\s*((?:\d*\.\d+|\d+))\s*)?\)$/i

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function hslChannelsToRgb(h: number, s: number, l: number): [number, number, number] {
    const normalizedH = ((h % 360) + 360) % 360
    const normalizedS = clamp(s, 0, 100) / 100
    const normalizedL = clamp(l, 0, 100) / 100

    const c = (1 - Math.abs(2 * normalizedL - 1)) * normalizedS
    const x = c * (1 - Math.abs(((normalizedH / 60) % 2) - 1))
    const m = normalizedL - c / 2

    let r: number
    let g: number
    let b: number

    if (normalizedH < 60) { r = c; g = x; b = 0 }
    else if (normalizedH < 120) { r = x; g = c; b = 0 }
    else if (normalizedH < 180) { r = 0; g = c; b = x }
    else if (normalizedH < 240) { r = 0; g = x; b = c }
    else if (normalizedH < 300) { r = x; g = 0; b = c }
    else { r = c; g = 0; b = x }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ]
}

export function parseColorChannels(color: ColorInput): [r: number, g: number, b: number, a: number] {
    if (typeof color === 'object' && color !== null) {
        if (
            !Number.isFinite(color.r) ||
            !Number.isFinite(color.g) ||
            !Number.isFinite(color.b) ||
            (color.a !== undefined && !Number.isFinite(color.a))
        ) {
            throw new Error(`Invalid color channels in object input: ${JSON.stringify(color)}`)
        }
        const r = clamp(Math.round(color.r), 0, 255)
        const g = clamp(Math.round(color.g), 0, 255)
        const b = clamp(Math.round(color.b), 0, 255)
        const a = color.a !== undefined ? clamp(color.a, 0, 1) : 1
        return [r, g, b, a]
    }

    if (typeof color !== 'string') {
        throw new TypeError(`Expected color to be a string or object, received ${typeof color}`)
    }

    const trimmed = color.trim()

    if (trimmed.startsWith('#')) {
        const shortMatch = trimmed.match(HEX_SHORT_RE)
        if (shortMatch) {
            const r = parseInt(shortMatch[1] + shortMatch[1], 16)
            const g = parseInt(shortMatch[2] + shortMatch[2], 16)
            const b = parseInt(shortMatch[3] + shortMatch[3], 16)
            const a = shortMatch[4] ? parseInt(shortMatch[4] + shortMatch[4], 16) / 255 : 1
            return [r, g, b, a]
        }

        const longMatch = trimmed.match(HEX_LONG_RE)
        if (longMatch) {
            const r = parseInt(longMatch[1], 16)
            const g = parseInt(longMatch[2], 16)
            const b = parseInt(longMatch[3], 16)
            const a = longMatch[4] ? parseInt(longMatch[4], 16) / 255 : 1
            return [r, g, b, a]
        }

        throw new Error(`Invalid hex color: ${color}`)
    }

    const rgbMatch = trimmed.match(RGB_RE)
    if (rgbMatch) {
        const r = clamp(parseInt(rgbMatch[1], 10), 0, 255)
        const g = clamp(parseInt(rgbMatch[2], 10), 0, 255)
        const b = clamp(parseInt(rgbMatch[3], 10), 0, 255)
        const parsedA = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
        if (!Number.isFinite(parsedA)) {
            throw new Error(`Invalid alpha channel in rgb/rgba color: ${color}`)
        }
        const a = clamp(parsedA, 0, 1)
        return [r, g, b, a]
    }

    const hslMatch = trimmed.match(HSL_RE)
    if (hslMatch) {
        const h = parseInt(hslMatch[1], 10)
        const s = parseFloat(hslMatch[2])
        const l = parseFloat(hslMatch[3])
        const parsedA = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1
        if (!Number.isFinite(parsedA)) {
            throw new Error(`Invalid alpha channel in hsl/hsla color: ${color}`)
        }
        const a = clamp(parsedA, 0, 1)
        const [r, g, b] = hslChannelsToRgb(h, s, l)
        return [r, g, b, a]
    }

    throw new Error(`Unsupported color format: ${color}`)
}

export function blendAlpha(
    fg: ColorInput,
    bg: ColorInput = '#ffffff',
    underlay: ColorInput = '#ffffff',
): [r: number, g: number, b: number] {
    const [fgR, fgG, fgB, fgA] = parseColorChannels(fg)
    let [bgR, bgG, bgB, bgA] = parseColorChannels(bg)

    // 若背景自身也是半透明色彩，先将背景与不透明底色（默认白色）进行预合成
    if (bgA < 1) {
        const [underR, underG, underB] = parseColorChannels(underlay)
        bgR = Math.round(bgA * bgR + (1 - bgA) * underR)
        bgG = Math.round(bgA * bgG + (1 - bgA) * underG)
        bgB = Math.round(bgA * bgB + (1 - bgA) * underB)
        bgA = 1
    }

    if (fgA >= 1) {
        return [fgR, fgG, fgB]
    }

    const r = Math.round(fgA * fgR + (1 - fgA) * bgR)
    const g = Math.round(fgA * fgG + (1 - fgA) * bgG)
    const b = Math.round(fgA * fgB + (1 - fgA) * bgB)

    return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)]
}

export function srgbToLinear(channel: number): number {
    const v = clamp(channel, 0, 255) / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

export function getRelativeLuminance(
    color: ColorInput,
    underlay: ColorInput = '#ffffff',
): number {
    const [r, g, b] = blendAlpha(color, underlay)
    const linR = srgbToLinear(r)
    const linG = srgbToLinear(g)
    const linB = srgbToLinear(b)
    return 0.2126 * linR + 0.7152 * linG + 0.0722 * linB
}

export function calculateContrastRatio(
    color1: ColorInput,
    color2: ColorInput,
    underlay: ColorInput = '#ffffff',
): number {
    const lum1 = getRelativeLuminance(color1, underlay)
    const lum2 = getRelativeLuminance(color2, underlay)
    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)
}

export const CONTRAST_RATIO_THRESHOLDS = {
    AA: 4.5,
    AAA: 7.0,
    'AA-large': 3.0,
} as const

export type ContrastLevel = keyof typeof CONTRAST_RATIO_THRESHOLDS

export function isContrastCompliant(
    ratio: number,
    level: ContrastLevel = 'AA',
): boolean {
    const threshold = CONTRAST_RATIO_THRESHOLDS[level]
    if (threshold === undefined) {
        throw new Error(`Unsupported contrast level "${String(level)}". Expected one of: ${Object.keys(CONTRAST_RATIO_THRESHOLDS).join(', ')}`)
    }
    return ratio >= threshold
}

