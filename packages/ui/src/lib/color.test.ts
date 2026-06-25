import {
    formatColor,
    hexToHsv,
    hexToRgb,
    hslToRgb,
    hsvToHex,
    hsvToHexAlpha,
    hsvToRgb,
    isValidColor,
    normalizeColor,
    parseColor,
    rgbToHsl,
    rgbToHsv,
} from './color'

describe('color utils', () => {
    describe('hexToRgb', () => {
        it('parses 6-digit hex', () => {
            expect(hexToRgb('#FF6B6B')).toEqual({ r: 255, g: 107, b: 107, a: 1 })
        })
        it('parses 3-digit hex', () => {
            expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
        })
        it('parses 8-digit hex with alpha', () => {
            const result = hexToRgb('#FF6B6B80')
            expect(result).not.toBeNull()
            expect(result!.a).toBeCloseTo(0.5, 1)
        })
        it('returns null for invalid hex', () => {
            expect(hexToRgb('#GGG')).toBeNull()
            expect(hexToRgb('not-a-color')).toBeNull()
        })
    })

    describe('hsvToRgb / rgbToHsv round-trip', () => {
        it('converts red HSV to RGB', () => {
            expect(hsvToRgb({ h: 0, s: 100, v: 100, a: 1 })).toEqual({ r: 255, g: 0, b: 0, a: 1 })
        })
        it('converts green HSV to RGB', () => {
            expect(hsvToRgb({ h: 120, s: 100, v: 100, a: 1 })).toEqual({ r: 0, g: 255, b: 0, a: 1 })
        })
        it('converts blue HSV to RGB', () => {
            expect(hsvToRgb({ h: 240, s: 100, v: 100, a: 1 })).toEqual({ r: 0, g: 0, b: 255, a: 1 })
        })
        it('round-trips HSV <-> RGB', () => {
            const original = { h: 200, s: 80, v: 60, a: 1 }
            const rgb = hsvToRgb(original)
            const back = rgbToHsv(rgb)
            expect(back.h).toBe(original.h)
            expect(back.s).toBeCloseTo(original.s, 0)
            expect(back.v).toBeCloseTo(original.v, 0)
        })
    })

    describe('hslToRgb / rgbToHsl', () => {
        it('converts pure HSL red', () => {
            expect(hslToRgb({ h: 0, s: 100, l: 50, a: 1 })).toEqual({ r: 255, g: 0, b: 0, a: 1 })
        })
        it('round-trips through rgbToHsl', () => {
            const rgb = { r: 100, g: 150, b: 200, a: 1 }
            const hsl = rgbToHsl(rgb)
            const back = hslToRgb(hsl)
            expect(back.r).toBe(rgb.r)
            expect(back.g).toBe(rgb.g)
            expect(back.b).toBe(rgb.b)
        })
    })

    describe('hsvToHex / hsvToHexAlpha / hexToHsv', () => {
        it('converts HSV to hex', () => {
            expect(hsvToHex({ h: 0, s: 100, v: 100, a: 1 })).toBe('#ff0000')
        })
        it('converts HSV to hex with alpha', () => {
            const result = hsvToHexAlpha({ h: 0, s: 100, v: 100, a: 0.5 })
            expect(result).toHaveLength(9)
            expect(result.startsWith('#ff0000')).toBe(true)
        })
        it('omits alpha when fully opaque', () => {
            expect(hsvToHexAlpha({ h: 0, s: 100, v: 100, a: 1 })).toBe('#ff0000')
        })
        it('round-trips hex through HSV', () => {
            const hsv = hexToHsv('#ff6b6b')
            expect(hsv).not.toBeNull()
            const hex = hsvToHex(hsv!)
            expect(hex.toLowerCase()).toBe('#ff6b6b')
        })
    })

    describe('parseColor', () => {
        it('parses hex', () => {
            const result = parseColor('#ff0000')
            expect(result).not.toBeNull()
            expect(result!.h).toBe(0)
        })
        it('parses short hex', () => {
            const result = parseColor('#f00')
            expect(result).not.toBeNull()
            expect(result!.h).toBe(0)
        })
        it('parses rgb()', () => {
            const result = parseColor('rgb(255, 0, 0)')
            expect(result).not.toBeNull()
            expect(result!.h).toBe(0)
        })
        it('parses rgba() with alpha', () => {
            const result = parseColor('rgba(255, 0, 0, 0.5)')
            expect(result).not.toBeNull()
            expect(result!.a).toBeCloseTo(0.5, 1)
        })
        it('parses hsl()', () => {
            const result = parseColor('hsl(0, 100%, 50%)')
            expect(result).not.toBeNull()
            expect(result!.h).toBe(0)
        })
        it('parses hsla() with alpha', () => {
            const result = parseColor('hsla(120, 100%, 50%, 0.5)')
            expect(result).not.toBeNull()
            expect(result!.a).toBeCloseTo(0.5, 1)
        })
        it('returns null for invalid input', () => {
            expect(parseColor('not-a-color')).toBeNull()
            expect(parseColor('')).toBeNull()
        })
    })

    describe('isValidColor', () => {
        it('returns true for valid colors', () => {
            expect(isValidColor('#ff0000')).toBe(true)
            expect(isValidColor('rgb(0, 255, 0)')).toBe(true)
            expect(isValidColor('hsl(240, 100%, 50%)')).toBe(true)
        })
        it('returns false for invalid colors', () => {
            expect(isValidColor('nope')).toBe(false)
            expect(isValidColor('#zzz')).toBe(false)
        })
    })

    describe('formatColor', () => {
        it('formats as hex', () => {
            expect(formatColor({ h: 0, s: 100, v: 100, a: 1 }, 'hex')).toBe('#ff0000')
        })
        it('formats as rgb', () => {
            expect(formatColor({ h: 0, s: 100, v: 100, a: 1 }, 'rgb')).toBe('rgb(255, 0, 0)')
        })
        it('formats as rgba when alpha < 1 and showAlpha', () => {
            expect(formatColor({ h: 0, s: 100, v: 100, a: 0.5 }, 'rgb', true)).toBe('rgba(255, 0, 0, 0.5)')
        })
        it('formats as hsl', () => {
            expect(formatColor({ h: 120, s: 100, v: 100, a: 1 }, 'hsl')).toBe('hsl(120, 100%, 50%)')
        })
    })

    describe('normalizeColor', () => {
        it('normalizes rgb to hex', () => {
            expect(normalizeColor('rgb(255, 0, 0)')).toBe('#ff0000')
        })
        it('normalizes hsl to hex', () => {
            expect(normalizeColor('hsl(0, 100%, 50%)')).toBe('#ff0000')
        })
        it('preserves alpha as 8-digit hex', () => {
            const result = normalizeColor('rgba(255, 0, 0, 0.5)')
            expect(result).not.toBeNull()
            expect(result!.length).toBe(9)
        })
        it('returns null for invalid', () => {
            expect(normalizeColor('nope')).toBeNull()
        })
    })
})
