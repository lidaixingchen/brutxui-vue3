export type ChartType = 'line' | 'bar' | 'pie'

export interface ChartDataItem {
    label: string
    value: number
}

export interface ChartDatum extends ChartDataItem {
    index: number
    valid: boolean
    percentage: number | undefined
}

export interface ChartModel {
    state: 'ready' | 'empty' | 'invalid' | 'zero-total'
    items: ChartDatum[]
    scale: number
    minimum: number
    maximum: number
}

export interface ChartTick {
    index: number
    position: number
    text: string
}

export interface PieGeometry {
    index: number
    path: string
}

export const CHART_PADDING: Readonly<{ top: number; right: number; bottom: number; left: number }> = {
    top: 30, right: 30, bottom: 40, left: 60,
}
export const PIE_RADIUS_RATIO: number = 0.7
export const PERCENTAGE_DECIMAL_PLACES: number = 1
export const PERCENTAGE_MULTIPLIER: number = 100
const DEGENERATE_DOMAIN_MIN: number = -1
const DEGENERATE_DOMAIN_MAX: number = 1
const DEFAULT_SCALE: number = 1
const TICK_INTERVALS: number = 4
const FULL_TURN: number = Math.PI * 2
const TOP_ANGLE: number = -Math.PI / 2

export function createChartModel(data: readonly ChartDataItem[], type: ChartType): ChartModel {
    const items: ChartDatum[] = data.map((item: ChartDataItem, index: number): ChartDatum => ({
        ...item, index,
        valid: Number.isFinite(item.value) && (type !== 'pie' || item.value >= 0),
        percentage: undefined,
    }))
    const invalid: boolean = items.some((item: ChartDatum): boolean => !item.valid)
    let scale: number = 0
    let minimum: number = 0
    let maximum: number = 0
    if (!invalid) {
        for (const item of items) scale = Math.max(scale, Math.abs(item.value))
    }
    const divisor: number = scale || DEFAULT_SCALE
    let total: number = 0
    if (!invalid) {
        for (const item of items) {
            const normalized: number = item.value / divisor
            minimum = Math.min(minimum, normalized)
            maximum = Math.max(maximum, normalized)
            if (type === 'pie') total += normalized
        }
        if (type === 'pie' && total > 0) {
            for (const item of items) item.percentage = (item.value / divisor) / total
        }
    }
    return {
        state: items.length === 0 ? 'empty' : invalid ? 'invalid' : type === 'pie' && scale === 0 ? 'zero-total' : 'ready',
        items,
        scale: divisor,
        minimum: minimum === maximum ? DEGENERATE_DOMAIN_MIN : minimum,
        maximum: minimum === maximum ? DEGENERATE_DOMAIN_MAX : maximum,
    }
}

export function chartYPosition(value: number, model: ChartModel): number {
    return (model.maximum - value / model.scale) / (model.maximum - model.minimum)
}

export function createChartTicks(model: ChartModel, formatter: (value: number) => string): ChartTick[] {
    const ticks: ChartTick[] = []
    const labels: Set<string> = new Set<string>()
    for (let index: number = 0; index <= TICK_INTERVALS; index++) {
        const fraction: number = index / TICK_INTERVALS
        const normalized: number = model.minimum * (1 - fraction) + model.maximum * fraction
        const value: number = normalized * model.scale
        const text: string = formatter(value === 0 ? 0 : value)
        if (!labels.has(text)) {
            ticks.push({ index, position: 1 - fraction, text })
            labels.add(text)
        }
    }
    return ticks
}

export function createPieGeometry(model: ChartModel, width: number, height: number): PieGeometry[] {
    if (model.state !== 'ready') return []
    const cx: number = width / 2
    const cy: number = height / 2
    const radius: number = Math.min(cx, cy) * PIE_RADIUS_RATIO
    const result: PieGeometry[] = []
    let angle: number = TOP_ANGLE
    for (const item of model.items) {
        const proportion: number = item.percentage ?? 0
        if (proportion <= 0) continue
        const start: number = angle
        angle += proportion * FULL_TURN
        const x1: number = cx + radius * Math.cos(start)
        const y1: number = cy + radius * Math.sin(start)
        const x2: number = cx + radius * Math.cos(angle)
        const y2: number = cy + radius * Math.sin(angle)
        // SVG 单段弧线无法表示起止点重合的完整圆。
        const arc: string = proportion === 1
            ? `A ${radius} ${radius} 0 0 1 ${cx - radius * Math.cos(start)} ${cy - radius * Math.sin(start)} A ${radius} ${radius} 0 0 1 ${x1} ${y1}`
            : `A ${radius} ${radius} 0 ${proportion > 0.5 ? 1 : 0} 1 ${x2} ${y2}`
        result.push({ index: item.index, path: `M ${cx} ${cy} L ${x1} ${y1} ${arc} Z` })
    }
    return result
}
