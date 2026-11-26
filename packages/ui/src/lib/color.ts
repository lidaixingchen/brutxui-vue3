export interface HSVColor {
    h: number
    s: number
    v: number
    a: number
}

export interface RGBColor {
    r: number
    g: number
    b: number
    a: number
}

export interface HSLColor {
    h: number
    s: number
    l: number
    a: number
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl'

const HEX_SHORT_RE = /^#([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i
const HEX_LONG_RE = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i
const CSS_NUMBER = String.raw`(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?`
const RGB_RE = new RegExp(
    String.raw`^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(${CSS_NUMBER})\s*)?\)$`, 'i',
)
const HSL_RE = new RegExp(
    String.raw`^hsla?\(\s*(-?${CSS_NUMBER})\s*,\s*(${CSS_NUMBER})%\s*,\s*(${CSS_NUMBER})%\s*(?:,\s*(${CSS_NUMBER})\s*)?\)$`, 'i',
)
const HSL_FORMAT_DECIMALS = 2
const RGB_CHANNEL_MAX = 255

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function toHex2(value: number): string {
    return clamp(Math.round(value), 0, RGB_CHANNEL_MAX).toString(16).padStart(2, '0')
}

/**
 * 计算 RGB 的色相（0-360），三通道须已归一化到 [0,1]。
 * rgbToHsv / rgbToHsl 共用六段色相分支，避免两处逻辑漂移。
 */
function computeHue(r: number, g: number, b: number, max: number, delta: number): number {
    let h = 0
    if (delta > 0) {
        if (max === r) h = 60 * (((g - b) / delta) % 6)
        else if (max === g) h = 60 * ((b - r) / delta + 2)
        else h = 60 * ((r - g) / delta + 4)
    }
    return h < 0 ? h + 360 : h
}

export function hsvToRgb(hsv: HSVColor): RGBColor {
    const h = ((hsv.h % 360) + 360) % 360
    const s = clamp(hsv.s, 0, 100) / 100
    const v = clamp(hsv.v, 0, 100) / 100
    const c = v * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v - c
    let r: number
    let g: number
    let b: number
    if (h < 60) { r = c; g = x; b = 0 }
    else if (h < 120) { r = x; g = c; b = 0 }
    else if (h < 180) { r = 0; g = c; b = x }
    else if (h < 240) { r = 0; g = x; b = c }
    else if (h < 300) { r = x; g = 0; b = c }
    else { r = c; g = 0; b = x }
    return {
        r: Math.round((r + m) * RGB_CHANNEL_MAX),
        g: Math.round((g + m) * RGB_CHANNEL_MAX),
        b: Math.round((b + m) * RGB_CHANNEL_MAX),
        a: clamp(hsv.a, 0, 1),
    }
}

export function rgbToHsv(rgb: RGBColor): HSVColor {
    const r = clamp(rgb.r, 0, RGB_CHANNEL_MAX) / RGB_CHANNEL_MAX
    const g = clamp(rgb.g, 0, RGB_CHANNEL_MAX) / RGB_CHANNEL_MAX
    const b = clamp(rgb.b, 0, RGB_CHANNEL_MAX) / RGB_CHANNEL_MAX
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    const h = computeHue(r, g, b, max, delta)
    const s = max === 0 ? 0 : (delta / max) * 100
    const v = max * 100
    return {
        h,
        s,
        v,
        a: clamp(rgb.a, 0, 1),
    }
}

export function rgbToHsl(rgb: RGBColor): HSLColor {
    const r = clamp(rgb.r, 0, RGB_CHANNEL_MAX) / RGB_CHANNEL_MAX
    const g = clamp(rgb.g, 0, RGB_CHANNEL_MAX) / RGB_CHANNEL_MAX
    const b = clamp(rgb.b, 0, RGB_CHANNEL_MAX) / RGB_CHANNEL_MAX
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    const h = computeHue(r, g, b, max, delta)
    const l = (max + min) / 2
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
    return {
        h,
        s: s * 100,
        l: l * 100,
        a: clamp(rgb.a, 0, 1),
    }
}

export function hslToRgb(hsl: HSLColor): RGBColor {
    const h = ((hsl.h % 360) + 360) % 360
    const s = clamp(hsl.s, 0, 100) / 100
    const l = clamp(hsl.l, 0, 100) / 100
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2
    let r: number
    let g: number
    let b: number
    if (h < 60) { r = c; g = x; b = 0 }
    else if (h < 120) { r = x; g = c; b = 0 }
    else if (h < 180) { r = 0; g = c; b = x }
    else if (h < 240) { r = 0; g = x; b = c }
    else if (h < 300) { r = x; g = 0; b = c }
    else { r = c; g = 0; b = x }
    return {
        r: Math.round((r + m) * RGB_CHANNEL_MAX),
        g: Math.round((g + m) * RGB_CHANNEL_MAX),
        b: Math.round((b + m) * RGB_CHANNEL_MAX),
        a: clamp(hsl.a, 0, 1),
    }
}

export function hsvToHex(hsv: HSVColor): string {
    return hsvToHexAlpha({ ...hsv, a: 1 })
}

export function hsvToHexAlpha(hsv: HSVColor): string {
    const rgb = hsvToRgb(hsv)
    const alpha = Math.round(rgb.a * RGB_CHANNEL_MAX)
    const base = `#${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)}`
    if (alpha < RGB_CHANNEL_MAX) {
        return `${base}${toHex2(alpha)}`
    }
    return base
}

export function hexToHsv(hex: string): HSVColor | null {
    const rgb = hexToRgb(hex)
    return rgb ? rgbToHsv(rgb) : null
}

export function hexToRgb(hex: string): RGBColor | null {
    const trimmed = hex.trim()
    const shortMatch = trimmed.match(HEX_SHORT_RE)
    if (shortMatch) {
        const r = parseInt(shortMatch[1] + shortMatch[1], 16)
        const g = parseInt(shortMatch[2] + shortMatch[2], 16)
        const b = parseInt(shortMatch[3] + shortMatch[3], 16)
        const a = shortMatch[4] ? parseInt(shortMatch[4] + shortMatch[4], 16) / RGB_CHANNEL_MAX : 1
        return { r, g, b, a }
    }
    const longMatch = trimmed.match(HEX_LONG_RE)
    if (longMatch) {
        const r = parseInt(longMatch[1], 16)
        const g = parseInt(longMatch[2], 16)
        const b = parseInt(longMatch[3], 16)
        const a = longMatch[4] ? parseInt(longMatch[4], 16) / RGB_CHANNEL_MAX : 1
        return { r, g, b, a }
    }
    return null
}

export function parseColor(color: string): HSVColor | null {
    if (!color || typeof color !== 'string') return null
    const trimmed = color.trim()
    if (trimmed.startsWith('#')) {
        return hexToHsv(trimmed)
    }
    const rgbMatch = trimmed.match(RGB_RE)
    if (rgbMatch) {
        const r = clamp(parseInt(rgbMatch[1], 10), 0, RGB_CHANNEL_MAX)
        const g = clamp(parseInt(rgbMatch[2], 10), 0, RGB_CHANNEL_MAX)
        const b = clamp(parseInt(rgbMatch[3], 10), 0, RGB_CHANNEL_MAX)
        const parsedA = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
        if (!Number.isFinite(parsedA)) return null
        const a = clamp(parsedA, 0, 1)
        return rgbToHsv({ r, g, b, a })
    }
    const hslMatch = trimmed.match(HSL_RE)
    if (hslMatch) {
        const h = parseFloat(hslMatch[1])
        const parsedS = parseFloat(hslMatch[2])
        const parsedL = parseFloat(hslMatch[3])
        if (!Number.isFinite(h) || !Number.isFinite(parsedS) || !Number.isFinite(parsedL)) return null
        const s = clamp(parsedS, 0, 100)
        const l = clamp(parsedL, 0, 100)
        const parsedA = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1
        if (!Number.isFinite(parsedA)) return null
        const a = clamp(parsedA, 0, 1)
        return rgbToHsv(hslToRgb({ h, s, l, a }))
    }
    return null
}

export function isValidColor(color: string): boolean {
    return parseColor(color) !== null
}

export function formatColor(hsv: HSVColor, format: ColorFormat, showAlpha = false): string {
    if (format === 'hex') {
        return showAlpha ? hsvToHexAlpha(hsv) : hsvToHex(hsv)
    }
    if (format === 'rgb') {
        const rgb = hsvToRgb(hsv)
        if (showAlpha && rgb.a < 1) {
            return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`
        }
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    }
    const hsl = rgbToHsl(hsvToRgb(hsv))
    // 两位小数足以在重新解析 HSL 时恢复 RGB 的 8 位通道。
    const channels = `${Number(hsl.h.toFixed(HSL_FORMAT_DECIMALS))}, ${Number(hsl.s.toFixed(HSL_FORMAT_DECIMALS))}%, ${Number(hsl.l.toFixed(HSL_FORMAT_DECIMALS))}%`
    if (showAlpha && hsl.a < 1) {
        return `hsla(${channels}, ${hsl.a})`
    }
    return `hsl(${channels})`
}

export function normalizeColor(color: string): string | null {
    const hsv = parseColor(color)
    if (!hsv) return null
    const hasAlpha = hsv.a < 1
    return formatColor(hsv, 'hex', hasAlpha)
}

