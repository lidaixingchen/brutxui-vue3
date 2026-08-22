import { describe, it, expect } from 'vitest'
import { SHAPE_NAMES, SHAPE_COUNT, isBrutalShapeName, renderShapeSvg, getShapeCategory, SHAPE_MIN_COUNT } from './shapes'

describe('shapes 图腾库', () => {
    it('图腾总量不少于规划下限', () => {
        expect(SHAPE_COUNT).toBeGreaterThanOrEqual(SHAPE_MIN_COUNT)
        expect(SHAPE_NAMES.length).toBe(SHAPE_COUNT)
    })

    it('名称无重复', () => {
        expect(new Set(SHAPE_NAMES).size).toBe(SHAPE_NAMES.length)
    })

    it('isBrutalShapeName 对已知与未知名称判定正确', () => {
        expect(isBrutalShapeName('star-8')).toBe(true)
        expect(isBrutalShapeName('lightning')).toBe(true)
        expect(isBrutalShapeName('nonexistent')).toBe(false)
    })

    it('renderShapeSvg 为全部图腾产出含图形元素的标记', () => {
        for (const name of SHAPE_NAMES) {
            const svg = renderShapeSvg(name)
            expect(svg, `图腾 ${name} 应有内容`).not.toBeNull()
            expect(svg!.length).toBeGreaterThan(0)
            expect(svg!).toMatch(/<(polygon|path|circle|rect|line)\b/)
            // 根注入 fill/stroke 继承：元素不得自带硬编码颜色
            expect(svg!, `图腾 ${name} 含硬编码色值`).not.toMatch(/(?:fill|stroke)="#[0-9a-fA-F]{3,8}"/)
        }
    })

    it('未知图腾返回 null', () => {
        expect(renderShapeSvg('nonexistent')).toBeNull()
    })

    it('五类分类均有归属且查询一致', () => {
        const categories = new Set(SHAPE_NAMES.map(name => getShapeCategory(name)))
        for (const expected of ['burst', 'seal', 'crosshair', 'pixel', 'glyph'] as const) {
            expect(categories.has(expected), `缺少分类 ${expected}`).toBe(true)
        }
    })
})
