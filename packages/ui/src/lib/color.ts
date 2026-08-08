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
// alpha 与 hsl 的 s/l 数字组：排除单独的 "."（parseFloat 得 NaN），
// 但兼容 CSS 合法的无前导零小数（如 .5）与整数（如 1、1.5）
const RGB_RE = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*((?:\d*\.\d+|\d+))\s*)?\)$/i
// 色相组 (-?\d+)：CSS 允许任意整数色相（含负值），解析时统一按 360 取模
const HSL_RE = /^hsla?\(\s*(-?\d+)\s*,\s*((?:\d*\.\d+|\d+))%\s*,\s*((?:\d*\.\d+|\d+))%\s*(?:,\s*((?:\d*\.\d+|\d+))\s*)?\)$/i

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function toHex2(value: number): string {
    return clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')
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
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
        a: clamp(hsv.a, 0, 1),
    }
}

export function rgbToHsv(rgb: RGBColor): HSVColor {
    const r = clamp(rgb.r, 0, 255) / 255
    const g = clamp(rgb.g, 0, 255) / 255
    const b = clamp(rgb.b, 0, 255) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    const h = computeHue(r, g, b, max, delta)
    const s = max === 0 ? 0 : (delta / max) * 100
    const v = max * 100
    return {
        h: Math.round(h),
        s: Math.round(s * 10) / 10,
        v: Math.round(v * 10) / 10,
        a: clamp(rgb.a, 0, 1),
    }
}

export function rgbToHsl(rgb: RGBColor): HSLColor {
    const r = clamp(rgb.r, 0, 255) / 255
    const g = clamp(rgb.g, 0, 255) / 255
    const b = clamp(rgb.b, 0, 255) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    const h = computeHue(r, g, b, max, delta)
    const l = (max + min) / 2
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
    return {
        h: Math.round(h),
        s: Math.round(s * 1000) / 10,
        l: Math.round(l * 1000) / 10,
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
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
        a: clamp(hsl.a, 0, 1),
    }
}

export function hsvToHex(hsv: HSVColor): string {
    return hsvToHexAlpha({ ...hsv, a: 1 })
}

export function hsvToHexAlpha(hsv: HSVColor): string {
    const rgb = hsvToRgb(hsv)
    const alpha = clamp(hsv.a, 0, 1)
    const base = `#${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)}`
    if (alpha < 1) {
        return `${base}${toHex2(alpha * 255)}`
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
        const a = shortMatch[4] ? parseInt(shortMatch[4] + shortMatch[4], 16) / 255 : 1
        return { r, g, b, a }
    }
    const longMatch = trimmed.match(HEX_LONG_RE)
    if (longMatch) {
        const r = parseInt(longMatch[1], 16)
        const g = parseInt(longMatch[2], 16)
        const b = parseInt(longMatch[3], 16)
        const a = longMatch[4] ? parseInt(longMatch[4], 16) / 255 : 1
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
        const r = clamp(parseInt(rgbMatch[1], 10), 0, 255)
        const g = clamp(parseInt(rgbMatch[2], 10), 0, 255)
        const b = clamp(parseInt(rgbMatch[3], 10), 0, 255)
        const parsedA = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
        if (!Number.isFinite(parsedA)) return null
        const a = clamp(parsedA, 0, 1)
        return rgbToHsv({ r, g, b, a })
    }
    const hslMatch = trimmed.match(HSL_RE)
    if (hslMatch) {
        // CSS 语义：色相允许任意数值并按 360 取模（400deg ≡ 40deg），与 hslToRgb 保持一致
        const h = ((parseInt(hslMatch[1], 10) % 360) + 360) % 360
        const parsedS = parseFloat(hslMatch[2])
        const parsedL = parseFloat(hslMatch[3])
        if (!Number.isFinite(parsedS) || !Number.isFinite(parsedL)) return null
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
        if (showAlpha && hsv.a < 1) {
            return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.round(hsv.a * 100) / 100})`
        }
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    }
    const hsl = rgbToHsl(hsvToRgb(hsv))
    if (showAlpha && hsv.a < 1) {
        return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${Math.round(hsv.a * 100) / 100})`
    }
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
}

export function normalizeColor(color: string): string | null {
    const hsv = parseColor(color)
    if (!hsv) return null
    const hasAlpha = hsv.a < 1
    return formatColor(hsv, 'hex', hasAlpha)
}
