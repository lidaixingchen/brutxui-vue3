import { describe, expect, it } from 'vitest'
import {
    parseColorChannels,
    blendAlpha,
    srgbToLinear,
    getRelativeLuminance,
    calculateContrastRatio,
    isContrastCompliant,
    CONTRAST_RATIO_THRESHOLDS,
} from '../src/color-contrast.js'

describe('color-contrast 模块', () => {
    describe('parseColorChannels', () => {
        it('正确解析 3 位与 6 位 Hex 颜色', () => {
            expect(parseColorChannels('#fff')).toEqual([255, 255, 255, 1])
            expect(parseColorChannels('#000')).toEqual([0, 0, 0, 1])
            expect(parseColorChannels('#f00')).toEqual([255, 0, 0, 1])
            expect(parseColorChannels('#ffffff')).toEqual([255, 255, 255, 1])
            expect(parseColorChannels('#000000')).toEqual([0, 0, 0, 1])
            expect(parseColorChannels('#3b82f6')).toEqual([59, 130, 246, 1])
        })

        it('正确解析 4 位与 8 位含 Alpha 的 Hex 颜色', () => {
            const [r1, g1, b1, a1] = parseColorChannels('#fff8')
            expect(r1).toBe(255)
            expect(g1).toBe(255)
            expect(b1).toBe(255)
            expect(a1).toBeCloseTo(0.533, 2)

            const [r2, g2, b2, a2] = parseColorChannels('#00000080')
            expect(r2).toBe(0)
            expect(g2).toBe(0)
            expect(b2).toBe(0)
            expect(a2).toBeCloseTo(0.502, 2)
        })

        it('正确解析 rgb 与 rgba 字符串', () => {
            expect(parseColorChannels('rgb(255, 0, 128)')).toEqual([255, 0, 128, 1])
            expect(parseColorChannels('rgba(255, 0, 128, 0.5)')).toEqual([255, 0, 128, 0.5])
            expect(parseColorChannels('rgba(0, 0, 0, .8)')).toEqual([0, 0, 0, 0.8])
        })

        it('正确解析 hsl 与 hsla 字符串', () => {
            expect(parseColorChannels('hsl(0, 100%, 50%)')).toEqual([255, 0, 0, 1])
            expect(parseColorChannels('hsl(120, 100%, 50%)')).toEqual([0, 255, 0, 1])
            expect(parseColorChannels('hsl(240, 100%, 50%)')).toEqual([0, 0, 255, 1])
            expect(parseColorChannels('hsla(0, 100%, 50%, 0.5)')).toEqual([255, 0, 0, 0.5])
        })

        it('正确解析 RGBColor 对象', () => {
            expect(parseColorChannels({ r: 10, g: 20, b: 30 })).toEqual([10, 20, 30, 1])
            expect(parseColorChannels({ r: 10, g: 20, b: 30, a: 0.4 })).toEqual([10, 20, 30, 0.4])
        })

        it('对非法颜色格式抛出 Error', () => {
            expect(() => parseColorChannels('not-a-color')).toThrow()
            expect(() => parseColorChannels('#12345')).toThrow()
        })
    })

    describe('blendAlpha', () => {
        it('完全不透明的前景色混合后保持原值', () => {
            expect(blendAlpha('#ff0000', '#ffffff')).toEqual([255, 0, 0])
        })

        it('50% 黑色在白底上混合得到灰色', () => {
            const [r, g, b] = blendAlpha('rgba(0, 0, 0, 0.5)', '#ffffff')
            expect(r).toBe(128)
            expect(g).toBe(128)
            expect(b).toBe(128)
        })

        it('50% 白色在黑底上混合得到灰色', () => {
            const [r, g, b] = blendAlpha('rgba(255, 255, 255, 0.5)', '#000000')
            expect(r).toBe(128)
            expect(g).toBe(128)
            expect(b).toBe(128)
        })
    })

    describe('srgbToLinear 与 getRelativeLuminance', () => {
        it('纯黑相对亮度为 0，纯白相对亮度为 1', () => {
            expect(srgbToLinear(0)).toBe(0)
            expect(srgbToLinear(255)).toBe(1)
            expect(getRelativeLuminance('#000000')).toBe(0)
            expect(getRelativeLuminance('#ffffff')).toBe(1)
        })

        it('支持带 Alpha 通道色彩与底色混合计算亮度', () => {
            const lumWithoutUnderlay = getRelativeLuminance('rgba(0, 0, 0, 0.5)', '#ffffff')
            const lumExplicit = getRelativeLuminance('rgb(128, 128, 128)')
            expect(lumWithoutUnderlay).toBeCloseTo(lumExplicit, 2)
        })
    })

    describe('calculateContrastRatio 与 isContrastCompliant', () => {
        it('黑白对比度为 21:1，相同颜色对比度为 1:1', () => {
            expect(calculateContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
            expect(calculateContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1)
            expect(calculateContrastRatio('#3b82f6', '#3b82f6')).toBeCloseTo(1, 1)
        })

        it('满足 WCAG 2.1 AA 与 AAA 阈值判定', () => {
            expect(CONTRAST_RATIO_THRESHOLDS.AA).toBe(4.5)
            expect(CONTRAST_RATIO_THRESHOLDS.AAA).toBe(7.0)
            expect(CONTRAST_RATIO_THRESHOLDS['AA-large']).toBe(3.0)

            const highRatio = calculateContrastRatio('#000000', '#ffffff')
            expect(isContrastCompliant(highRatio, 'AA')).toBe(true)
            expect(isContrastCompliant(highRatio, 'AAA')).toBe(true)

            // 4.5:1 边缘
            expect(isContrastCompliant(4.5, 'AA')).toBe(true)
            expect(isContrastCompliant(4.49, 'AA')).toBe(false)
            expect(isContrastCompliant(7.0, 'AAA')).toBe(true)
            expect(isContrastCompliant(6.99, 'AAA')).toBe(false)
        })
    })
})
