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
    value: number
    text: string
}

type CartesianChartType = Exclude<ChartType, 'pie'>
type MeasureChartText = (text: string) => number
type PrepareChartText = (texts: readonly string[]) => void
type TextAnchor = 'start' | 'middle' | 'end'

export interface CartesianLayoutInput {
    type: CartesianChartType
    width: number
    height: number
    scale: number
    items: readonly ChartDatum[]
    ticks: readonly ChartTick[]
    formatNumber: (value: number) => string
    scientificNumberFormats: ReadonlyArray<(value: number) => string>
}

export interface CartesianPlot {
    left: number
    right: number
    top: number
    bottom: number
    width: number
    height: number
}

interface CategoryLabel {
    index: number
    text: string
    x: number
    anchor: TextAnchor
    left: number
    right: number
    visible: boolean
}

export interface CartesianLayout {
    plot: CartesianPlot
    ticks: Array<ChartTick & { y: number }>
    categories: CategoryLabel[]
    axisLabelX: number
    categoryLabelY: number
    tickLabelOffset: number
}

export interface PieGeometry {
    index: number
    path: string
    startFraction: number
    endFraction: number
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
const MIN_PLOT_WIDTH_RATIO: number = 0.45
const MIN_PLOT_HEIGHT_RATIO: number = 0.5
const CATEGORY_LABEL_GAP_PX: number = 8
const AXIS_LABEL_FONT_SIZE_PX: number = 12
const AXIS_LABEL_GAP_PX: number = 12
const AXIS_LABEL_DESCENT_RATIO: number = 0.25
const X_AXIS_LABEL_OFFSET_PX: number = 8
const Y_AXIS_LABEL_OFFSET_PX: number = 2
const PLOT_EDGE_GUTTER_PX: number = 4
const POINTER_COORDINATE_TOLERANCE_PX: number = 1
const LABEL_ELLIPSIS: string = '…'
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const graphemeSegmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : undefined

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
    for (let index: number = 0; index <= TICK_INTERVALS; index++) {
        const fraction: number = index / TICK_INTERVALS
        const normalized: number = model.minimum * (1 - fraction) + model.maximum * fraction
        const scaledValue: number = normalized * model.scale
        const value: number = scaledValue === 0 ? 0 : scaledValue
        const text: string = formatter(value)
        ticks.push({ index, position: 1 - fraction, value, text })
    }
    return ticks
}

export function cartesianLabelFontSize(height: number, scale: number): number {
    return Math.min(AXIS_LABEL_FONT_SIZE_PX / scale, height * MIN_PLOT_HEIGHT_RATIO / TICK_INTERVALS)
}

export function cartesianX(plot: CartesianPlot, type: CartesianChartType, index: number, count: number): number {
    const position: number = type === 'bar' ? (index + 0.5) / count : count <= 1 ? 0.5 : index / (count - 1)
    return plot.left + position * plot.width
}

export function hitCartesianChart(plot: CartesianPlot, type: CartesianChartType, count: number, x: number, y: number, scale: number): number | null {
    // 指针坐标按 CSS 像素取整，给位于绘图区边缘的点留出取整余量。
    const tolerance: number = POINTER_COORDINATE_TOLERANCE_PX / scale
    if (count === 0 || x < plot.left - tolerance || x > plot.right + tolerance ||
        y < plot.top - tolerance || y > plot.bottom + tolerance) return null
    const position: number = Math.min(1, Math.max(0, (x - plot.left) / plot.width))
    return type === 'line' ? Math.round(position * (count - 1)) : Math.min(count - 1, Math.floor(position * count))
}

function fitLabel(text: string, maxWidth: number, measure: MeasureChartText): { text: string; width: number } {
    const width: number = measure(text)
    if (width <= maxWidth) return { text, width }
    const ellipsisWidth: number = measure(LABEL_ELLIPSIS)
    if (ellipsisWidth > maxWidth) return { text: '', width: 0 }
    const graphemes: string[] = graphemeSegmenter
        ? Array.from(graphemeSegmenter.segment(text), ({ segment }): string => segment)
        : Array.from(text)
    let left: number = 1
    let right: number = graphemes.length - 1
    let fitted = { text: LABEL_ELLIPSIS, width: ellipsisWidth }
    while (left <= right) {
        const middle: number = Math.floor((left + right) / 2)
        const candidate: string = graphemes.slice(0, middle).join('').trimEnd() + LABEL_ELLIPSIS
        const candidateWidth: number = measure(candidate)
        if (candidateWidth <= maxWidth) {
            fitted = { text: candidate, width: candidateWidth }
            left = middle + 1
        } else {
            right = middle - 1
        }
    }
    return fitted
}

function createCategoryLabels(
    input: CartesianLayoutInput,
    plot: CartesianPlot,
    gutter: number,
    gap: number,
    measure: MeasureChartText,
    measured: boolean,
    prepareText?: PrepareChartText,
): CategoryLabel[] {
    const { items, type, width } = input
    const lastIndex: number = items.length - 1
    function place(label: CategoryLabel, text: string, width: number, left: number, right: number): CategoryLabel {
        const offset: number = label.anchor === 'start' ? 0 : label.anchor === 'end' ? width : width / 2
        const x: number = Math.min(right - width + offset, Math.max(left + offset, label.x))
        return { ...label, text, x, left: x - offset, right: x - offset + width, visible: text.length > 0 }
    }

    const viewportRight: number = width - gutter
    const labels: CategoryLabel[] = items.map((item): CategoryLabel => {
        const x: number = cartesianX(plot, type, item.index, items.length)
        const anchor: TextAnchor = item.index === 0 ? 'start' : item.index === lastIndex ? 'end' : 'middle'
        return { index: item.index, text: item.label, x, anchor, left: x, right: x, visible: false }
    })
    const first: CategoryLabel | undefined = labels[0]
    if (!first) return labels
    function fitEndpoint(label: CategoryLabel, left: number, right: number): CategoryLabel {
        const fitted = fitLabel(label.text, right - left, measure)
        return place(label, fitted.text, fitted.width, left, right)
    }
    if (lastIndex === 0 || !measured) {
        labels[0] = fitEndpoint(first, gutter, viewportRight)
        return labels
    }

    const last: CategoryLabel = labels[lastIndex]!
    const firstWidth: number = measure(first.text)
    const lastWidth: number = measure(last.text)
    const viewportWidth: number = viewportRight - gutter
    const start: CategoryLabel = place(first, first.text, firstWidth, gutter, viewportRight)
    const end: CategoryLabel = place(last, last.text, lastWidth, gutter, viewportRight)
    if (firstWidth > viewportWidth || lastWidth > viewportWidth || (start.visible && end.visible && end.left < start.right + gap)) {
        const midpoint: number = (first.x + last.x) / 2
        labels[0] = fitEndpoint(first, gutter, end.visible ? Math.max(gutter, midpoint - gap / 2) : viewportRight)
        labels[lastIndex] = fitEndpoint(last, start.visible ? Math.min(viewportRight, midpoint + gap / 2) : gutter, viewportRight)
    } else {
        labels[0] = start
        labels[lastIndex] = end
    }

    let occupiedRight: number = labels[0]!.visible ? labels[0]!.right : gutter - gap
    const lastLeft: number = labels[lastIndex]!.visible ? labels[lastIndex]!.left : viewportRight + gap
    // 标签中心越过可用区间时，边界裁切也无法让标签留在两侧的可用间隔内。
    const canPlace = (label: CategoryLabel): boolean => label.text.length > 0 && label.x >= occupiedRight + gap && label.x <= lastLeft - gap
    prepareText?.(labels.slice(1, lastIndex).filter(canPlace).map(label => label.text))
    for (let index: number = 1; index < lastIndex; index++) {
        const label: CategoryLabel = labels[index]!
        if (!canPlace(label)) continue
        const labelWidth: number = measure(label.text)
        if (labelWidth > lastLeft - occupiedRight - gap * 2) continue
        const positioned: CategoryLabel = place(label, label.text, labelWidth, gutter, viewportRight)
        if (positioned.left >= occupiedRight + gap && positioned.right <= lastLeft - gap) {
            labels[index] = positioned
            occupiedRight = positioned.right
        }
    }
    return labels
}

export function createCartesianLayout(input: CartesianLayoutInput, measureText?: MeasureChartText, prepareText?: PrepareChartText): CartesianLayout {
    const { width, height, scale } = input
    const measuredWidths: Map<string, number> = new Map()
    const measure: MeasureChartText = (text: string): number => {
        const recorded: number | undefined = measuredWidths.get(text)
        if (recorded !== undefined) return recorded
        const width: number = measureText?.(text) ?? 0
        measuredWidths.set(text, width)
        return width
    }
    const gutter: number = Math.min(PLOT_EDGE_GUTTER_PX / scale, width / 2)
    const axisGap: number = AXIS_LABEL_GAP_PX / scale
    const right: number = width - CHART_PADDING.right
    const leftLimit: number = right - width * MIN_PLOT_WIDTH_RATIO
    const axisLabelBudget: number = Math.max(0, leftLimit - axisGap - gutter)
    let tickTexts: string[] = input.ticks.map((tick): string => tick.text)
    if (tickTexts.some((text): boolean => measure(text) > axisLabelBudget)) {
        tickTexts = input.ticks.map((tick): string => input.formatNumber(tick.value))
        for (const format of input.scientificNumberFormats) {
            if (tickTexts.every((text): boolean => measure(text) <= axisLabelBudget)) break
            tickTexts = input.ticks.map((tick): string => format(tick.value))
        }
    }
    const seenTicks: Set<string> = new Set()
    const tickLabels: Array<ChartTick & { textWidth: number }> = []
    for (const [index, tick] of input.ticks.entries()) {
        const text: string = tickTexts[index]!
        if (seenTicks.has(text)) continue
        seenTicks.add(text)
        const textWidth: number = measure(text)
        tickLabels.push(textWidth <= axisLabelBudget ? { ...tick, text, textWidth } : { ...tick, text: '', textWidth: 0 })
    }
    const axisWidth: number = Math.max(0, ...tickLabels.map((label): number => label.textWidth))
    const left: number = Math.min(leftLimit, Math.max(CHART_PADDING.left, axisWidth + axisGap + gutter))

    const fontSize: number = cartesianLabelFontSize(height, scale)
    const fontScale: number = fontSize / AXIS_LABEL_FONT_SIZE_PX
    const tickLabelOffset: number = Y_AXIS_LABEL_OFFSET_PX * fontScale
    const categoryLabelOffset: number = X_AXIS_LABEL_OFFSET_PX * fontScale
    const edgeInset: number = PLOT_EDGE_GUTTER_PX * fontScale
    const topPadding: number = Math.max(CHART_PADDING.top, fontSize - tickLabelOffset + edgeInset)
    const bottomPadding: number = Math.max(CHART_PADDING.bottom, categoryLabelOffset + fontSize * AXIS_LABEL_DESCENT_RATIO + edgeInset)
    const paddingScale: number = Math.min(1, height * (1 - MIN_PLOT_HEIGHT_RATIO) / (topPadding + bottomPadding))
    const top: number = topPadding * paddingScale
    const bottom: number = height - bottomPadding * paddingScale
    const plot: CartesianPlot = { left, right, top, bottom, width: right - left, height: bottom - top }
    return {
        plot,
        ticks: tickLabels.map(({ textWidth: _textWidth, ...tick }) => ({ ...tick, y: top + tick.position * plot.height })),
        categories: createCategoryLabels(input, plot, gutter, CATEGORY_LABEL_GAP_PX / scale, measure, measureText !== undefined, prepareText),
        axisLabelX: Math.max(0, left - axisGap),
        categoryLabelY: bottom + categoryLabelOffset,
        tickLabelOffset,
    }
}

export function measureCartesianLayout(input: CartesianLayoutInput, probe: SVGGElement): CartesianLayout {
    const document: Document = probe.ownerDocument
    const candidate: SVGTextElement = document.createElementNS(SVG_NAMESPACE, 'text')
    if (typeof candidate.getComputedTextLength !== 'function') return createCartesianLayout(input)
    // 同批挂载原始文本后读取宽度，后续只用独立节点测量省略和刻度回退候选。
    const widths = new Map<string, number>()
    function prepareText(texts: readonly string[]): void {
        const originals = new Map<string, SVGTextElement>()
        const batch: DocumentFragment = document.createDocumentFragment()
        for (const text of texts) {
            if (widths.has(text) || originals.has(text)) continue
            const label: SVGTextElement = document.createElementNS(SVG_NAMESPACE, 'text')
            label.textContent = text
            batch.append(label)
            originals.set(text, label)
        }
        if (originals.size === 0) return
        probe.append(batch)
        for (const [text, label] of originals) widths.set(text, label.getComputedTextLength())
        probe.replaceChildren(candidate)
    }
    probe.append(candidate)
    const endpoints: ChartDatum[] = [...input.items.slice(0, 1), ...input.items.slice(-1)]
    prepareText([...input.ticks.map(tick => tick.text), ...endpoints.map(item => item.label)])
    const layout: CartesianLayout = createCartesianLayout(input, (text: string): number => {
        const width: number | undefined = widths.get(text)
        if (width !== undefined) return width
        candidate.textContent = text
        return candidate.getComputedTextLength()
    }, prepareText)
    probe.replaceChildren()
    return layout
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
        const end: number = start + proportion * FULL_TURN
        if (end === start) continue
        angle = end
        const x1: number = cx + radius * Math.cos(start)
        const y1: number = cy + radius * Math.sin(start)
        const x2: number = cx + radius * Math.cos(angle)
        const y2: number = cy + radius * Math.sin(angle)
        // SVG 单段弧线无法表示起止点重合的完整圆。
        const arc: string = proportion === 1
            ? `A ${radius} ${radius} 0 0 1 ${cx - radius * Math.cos(start)} ${cy - radius * Math.sin(start)} A ${radius} ${radius} 0 0 1 ${x1} ${y1}`
            : `A ${radius} ${radius} 0 ${proportion > 0.5 ? 1 : 0} 1 ${x2} ${y2}`
        result.push({
            index: item.index,
            path: `M ${cx} ${cy} L ${x1} ${y1} ${arc} Z`,
            startFraction: (start - TOP_ANGLE) / FULL_TURN,
            endFraction: (angle - TOP_ANGLE) / FULL_TURN,
        })
    }
    return result
}
