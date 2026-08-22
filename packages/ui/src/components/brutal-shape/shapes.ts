/** 图腾分类：爆炸多角星 / 复古工业图章 / HUD 标定十字 / 8-Bit 像素图腾 / 符号图腾 */
export type ShapeCategory = 'burst' | 'seal' | 'crosshair' | 'pixel' | 'glyph'

export interface ShapeDefinition {
    category: ShapeCategory
    /** viewBox 100 坐标系下的 SVG 内部标记；fill/stroke 由组件根注入继承，元素自带硬编码色值视为违例 */
    svg: string
}

/** 统一视窗边长（组件以等比 size 渲染） */
const VIEW_BOX_SIZE = 100
const SHAPE_CENTER = VIEW_BOX_SIZE / 2
/** 多角星外接半径：预留描边余量避免触边裁切 */
const BURST_OUTER_RADIUS = SHAPE_CENTER - 2

/** 生成中心对称多角星的 polygon points：外内半径交替、默认起始角朝正上 */
function burstStarPoints(spikes: number, innerRadiusRatio: number): string {
    const innerRadius = BURST_OUTER_RADIUS * innerRadiusRatio
    const points: string[] = []
    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? BURST_OUTER_RADIUS : innerRadius
        const angle = (Math.PI * i) / spikes - Math.PI / 2
        points.push(`${(SHAPE_CENTER + radius * Math.cos(angle)).toFixed(2)},${(SHAPE_CENTER + radius * Math.sin(angle)).toFixed(2)}`)
    }
    return points.join(' ')
}

/** 花瓣图章：主圆 + 沿外环均匀分布的花瓣小圆（外缘 36+11=47 < 48，预留描边余量防裁切） */
function scallopElements(petals: number): string {
    const coreRadius = 30
    const petalRadius = 11
    const orbitRadius = 36
    const elements = [`<circle cx="${SHAPE_CENTER}" cy="${SHAPE_CENTER}" r="${coreRadius}"/>`]
    for (let i = 0; i < petals; i++) {
        const angle = (Math.PI * 2 * i) / petals - Math.PI / 2
        const cx = (SHAPE_CENTER + orbitRadius * Math.cos(angle)).toFixed(2)
        const cy = (SHAPE_CENTER + orbitRadius * Math.sin(angle)).toFixed(2)
        elements.push(`<circle cx="${cx}" cy="${cy}" r="${petalRadius}"/>`)
    }
    return elements.join('')
}

const SHAPES: Record<string, ShapeDefinition> = {
    // ── 爆炸多角星 (Burst Stars) ──
    'star-4': { category: 'burst', svg: `<polygon points="${burstStarPoints(4, 0.32)}"/>` },
    'star-5': { category: 'burst', svg: `<polygon points="${burstStarPoints(5, 0.42)}"/>` },
    'star-6': { category: 'burst', svg: `<polygon points="${burstStarPoints(6, 0.55)}"/>` },
    'star-8': { category: 'burst', svg: `<polygon points="${burstStarPoints(8, 0.62)}"/>` },
    'star-12': { category: 'burst', svg: `<polygon points="${burstStarPoints(12, 0.72)}"/>` },
    'star-16': { category: 'burst', svg: `<polygon points="${burstStarPoints(16, 0.8)}"/>` },

    // ── 复古工业图章 (Industrial Seals) ──
    'seal-saw-16': { category: 'seal', svg: `<polygon points="${burstStarPoints(16, 0.86)}"/>` },
    'seal-cog-8': { category: 'seal', svg: `<polygon points="${burstStarPoints(8, 0.74)}"/><circle cx="50" cy="50" r="14" fill="none"/>` },
    'seal-scallop-8': { category: 'seal', svg: scallopElements(8) },
    'seal-badge': { category: 'seal', svg: `<polygon points="${burstStarPoints(12, 0.78)}"/><circle cx="50" cy="50" r="24" fill="none"/>` },

    // ── HUD 标定十字 (Crosshairs) ──
    'crosshair-plus': { category: 'crosshair', svg: `<path d="M50 2 V98 M2 50 H98" fill="none"/>` },
    'crosshair-target': { category: 'crosshair', svg: `<circle cx="50" cy="50" r="28" fill="none"/><path d="M50 2 V22 M50 78 V98 M2 50 H22 M78 50 H98" fill="none"/>` },
    'crosshair-corner': { category: 'crosshair', svg: `<path d="M4 32 V4 H32 M68 4 H96 V32 M96 68 V96 H68 M32 96 H4 V68" fill="none"/>` },

    // ── 8-Bit 像素图腾 (Pixel Icons) ──
    'pixel-burst': { category: 'pixel', svg: `<polygon points="40,10 60,10 60,30 80,30 80,20 90,20 90,40 70,40 70,50 90,50 90,60 80,60 80,80 60,80 60,90 40,90 40,80 20,80 20,60 10,60 10,50 30,50 30,40 10,40 10,20 20,20 20,30 40,30"/>` },
    'pixel-heart': { category: 'pixel', svg: `<polygon points="20,10 40,10 40,20 60,20 60,10 80,10 80,30 70,30 70,40 60,40 60,50 50,50 50,60 40,50 30,50 30,40 20,40 20,30"/>` },
    'pixel-spark': { category: 'pixel', svg: `<polygon points="40,10 60,10 60,40 90,40 90,60 60,60 60,90 40,90 40,60 10,60 10,40 40,40"/>` },

    // ── 符号图腾 (Glyphs) ──
    lightning: { category: 'glyph', svg: `<polygon points="58,2 18,54 44,54 38,98 82,40 54,40 66,2"/>` },
    heart: { category: 'glyph', svg: `<path d="M50 90 C18 66 6 45 13 29 C18 16 36 13 46 25 L50 31 L54 25 C64 13 82 16 87 29 C94 45 82 66 50 90 Z"/>` },
    skull: { category: 'glyph', svg: `<path fill-rule="evenodd" d="M50 6 C26 6 10 22 10 42 C10 56 18 66 30 71 L30 84 C30 90 34 94 40 94 L60 94 C66 94 70 90 70 84 L70 71 C82 66 90 56 90 42 C90 22 74 6 50 6 Z M27 42 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z M55 42 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z M50 52 L43 66 L57 66 Z"/>` },
    thumb: { category: 'glyph', svg: `<path d="M12 56 C12 50 17 46 23 46 H32 V92 H23 C17 92 12 88 12 82 Z M40 92 H72 C78 92 83 88 84 82 L90 54 C91 47 86 40 79 40 H58 L61 22 C62 14 57 8 50 8 C47 8 45 10 44 12 L40 46 Z"/>` },
    diamond: { category: 'glyph', svg: `<polygon points="50,5 95,50 50,95 5,50"/>` },
}

/** 规划下限：五类合计不少于该数量 */
export const SHAPE_MIN_COUNT = 20

/** 全部图腾名（字母序，供枚举与文档） */
export const SHAPE_NAMES: readonly string[] = Object.keys(SHAPES).sort()

/** 图腾总量 */
export const SHAPE_COUNT = SHAPE_NAMES.length

export function isBrutalShapeName(name: string): boolean {
    return Object.hasOwn(SHAPES, name)
}

export function getShapeCategory(name: string): ShapeCategory | null {
    return isBrutalShapeName(name) ? SHAPES[name].category : null
}

/** 返回图腾内部 SVG 标记；未知名称返回 null */
export function renderShapeSvg(name: string): string | null {
    if (!isBrutalShapeName(name)) return null
    return SHAPES[name].svg
}
