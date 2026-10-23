<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch, type ComputedRef, type Ref, type CSSProperties, type VNode } from 'vue'
import { CollapsibleRoot, CollapsibleTrigger, CollapsibleContent, TooltipRoot, TooltipProvider, TooltipTrigger } from 'reka-ui'
import { cn, FOCUS_RING_CLASSES } from '@/lib/utils'
import { cancelAnimationFrame, getDocument, getResizeObserverCtor, requestAnimationFrame } from '@/lib/env'
import { useLocale } from '@/composables/useLocale'
import Button from '../button/Button.vue'
import Slider from '../slider/Slider.vue'
import TooltipContent from '../tooltip/TooltipContent.vue'
import { useChartInteraction } from './useChartInteraction'
import Table from '../table/Table.vue'
import TableCaption from '../table/TableCaption.vue'
import TableHeader from '../table/TableHeader.vue'
import TableHead from '../table/TableHead.vue'
import TableBody from '../table/TableBody.vue'
import TableRow from '../table/TableRow.vue'
import TableCell from '../table/TableCell.vue'
import { sketchyChartVariants } from './sketchy-chart-variants'
import { SKETCHY_CHART_DEFAULT_WIDTH_PX, SKETCHY_CHART_DEFAULT_HEIGHT_PX } from '@/lib/defaults'
import {
    createChartModel, createChartTicks, chartYPosition, createPieGeometry,
    CHART_PADDING, PIE_RADIUS_RATIO, PERCENTAGE_DECIMAL_PLACES, PERCENTAGE_MULTIPLIER,
    type ChartDataItem, type ChartDatum, type ChartModel, type ChartTick, type ChartType, type PieGeometry,
} from './sketchy-chart-data'

interface SketchyChartProps {
    type?: ChartType
    data?: ChartDataItem[]
    title?: string
    description?: string
    valueFormatter?: (value: number) => string
    interactive?: boolean
    sketchiness?: number
    grid?: boolean
    width?: number
    height?: number
    class?: string
}
interface ChartReading extends ChartDatum {
    formattedValue: string
    formattedPercentage: string
    color: string
}
interface PositionedTick extends ChartTick { y: number }
interface TooltipReading {
    index: number
    label: string
    value: number
    formattedValue: string
    percentage: number | undefined
    formattedPercentage: string | undefined
}
interface ChartPoint { x: number; y: number }
interface ChartLabelMetrics { yAxisWidth: number; categoryWidths: number[] }
defineSlots<{ tooltip?: (reading: TooltipReading) => VNode[] }>()

const DEFAULT_SKETCHINESS: number = 2
const BASE_FREQUENCY_FACTOR: number = 0.015
const CHART_STROKE_WIDTH: number = 3
const POINT_RADIUS: number = 6
const DASH_PATTERN: string = '4 4'
const LABEL_OFFSET: number = 4
const BAR_GAP_RATIO: number = 0.25
const MINIMUM_PLOT_SIZE: number = 1
const CATEGORY_LABEL_GAP_PX: number = 8
const AXIS_LABEL_FONT_SIZE_PX: number = 12
const AXIS_LABEL_GAP_PX: number = 12
const AXIS_LABEL_DESCENT_RATIO: number = 0.25
const X_AXIS_LABEL_OFFSET_PX: number = 8
const Y_AXIS_LABEL_OFFSET_PX: number = 2
const PLOT_EDGE_GUTTER_PX: number = 4
const EMPTY_STATE_FONT_SIZE_PX: number = 14
const NUMBER_SIGNIFICANT_DIGITS: number = 12
const HATCH_TILE_SIZE: number = 10
const PIE_COLORS: readonly string[] = [
    'var(--brutal-primary, #FF6B6B)', 'var(--brutal-secondary, #4ECDC4)',
    'var(--brutal-accent, #FFE66D)', 'var(--brutal-info, #4A90D9)',
    'var(--brutal-success, #7FB069)', 'var(--brutal-destructive, #EF476F)',
]
const TABLE_COLUMNS = [
    { field: 'label', title: 'sketchyChart.categoryHeader' },
    { field: 'formattedValue', title: 'sketchyChart.valueHeader' },
    { field: 'formattedPercentage', title: 'sketchyChart.percentageHeader' },
] as const
const props = withDefaults(defineProps<SketchyChartProps>(), {
    type: 'line', data: () => [], title: undefined, description: undefined, valueFormatter: undefined,
    sketchiness: DEFAULT_SKETCHINESS, grid: true, interactive: true,
    width: SKETCHY_CHART_DEFAULT_WIDTH_PX, height: SKETCHY_CHART_DEFAULT_HEIGHT_PX, class: undefined,
})
const uid: string = useId().replace(/:/g, '-')
const filterId: string = `brutal-sketch-filter-${uid}`
const hatchId: string = `hatch-pattern-${uid}`
const titleId: string = `chart-title-${uid}`
const descriptionId: string = `chart-description-${uid}`
const { t, locale } = useLocale()
const chartAriaLabel: ComputedRef<string> = computed((): string => {
    if (props.type === 'line') return t('sketchyChart.lineAriaLabel')
    if (props.type === 'bar') return t('sketchyChart.barAriaLabel')
    return t('sketchyChart.pieAriaLabel')
})
const chartTitle: ComputedRef<string> = computed((): string => props.title ?? chartAriaLabel.value)
const model: ComputedRef<ChartModel> = computed((): ChartModel => createChartModel(props.data, props.type))
const stateText: ComputedRef<string> = computed((): string => {
    if (model.value.state === 'invalid') return t('sketchyChart.invalidDataText')
    if (model.value.state === 'empty') return t('sketchyChart.emptyText')
    if (model.value.state === 'zero-total') return t('sketchyChart.zeroTotalText')
    return t('sketchyChart.dataCount', { count: model.value.items.length })
})
const chartDescription: ComputedRef<string> = computed((): string =>
    [props.description, chartAriaLabel.value, stateText.value].filter(Boolean).join(' · '))
const numberFormat: ComputedRef<Intl.NumberFormat> = computed((): Intl.NumberFormat =>
    new Intl.NumberFormat(locale.value.code ?? 'zh-CN', { maximumSignificantDigits: NUMBER_SIGNIFICANT_DIGITS }))
const percentageFormat: ComputedRef<Intl.NumberFormat> = computed((): Intl.NumberFormat =>
    new Intl.NumberFormat(locale.value.code ?? 'zh-CN', { style: 'percent', maximumFractionDigits: PERCENTAGE_DECIMAL_PLACES }))
function formatValue(value: number): string {
    return props.valueFormatter ? props.valueFormatter(value) : numberFormat.value.format(value)
}
const readings: ComputedRef<ChartReading[]> = computed((): ChartReading[] => model.value.items.map((item: ChartDatum): ChartReading => ({
    ...item,
    formattedValue: item.valid ? formatValue(item.value) : t('sketchyChart.invalidValueText'),
    formattedPercentage: item.percentage === undefined ? t('sketchyChart.unavailablePercentage') : percentageFormat.value.format(item.percentage),
    color: PIE_COLORS[item.index % PIE_COLORS.length]!,
})))
const tableColumns = computed(() => props.type === 'pie' ? TABLE_COLUMNS : TABLE_COLUMNS.slice(0, 2))
const hasRoundingDifference: ComputedRef<boolean> = computed((): boolean => {
    if (props.type !== 'pie' || model.value.state !== 'ready') return false
    const precision: number = PERCENTAGE_MULTIPLIER * 10 ** PERCENTAGE_DECIMAL_PLACES
    const total: number = readings.value.reduce((sum: number, item: ChartReading): number => sum + Math.round((item.percentage ?? 0) * precision), 0)
    return total !== precision
})
const processedData: ComputedRef<ChartDatum[]> = computed((): ChartDatum[] => model.value.state === 'ready' ? model.value.items : [])
const baseFrequency: ComputedRef<number> = computed((): number => props.sketchiness * BASE_FREQUENCY_FACTOR)
function safeDimension(value: number, fallback: number, padding: number): number {
    return Number.isFinite(value) && value > padding ? value : fallback
}
const graph: Ref<SVGSVGElement | null> = ref(null)
const chartWidth: ComputedRef<number> = computed((): number => safeDimension(props.width, SKETCHY_CHART_DEFAULT_WIDTH_PX, CHART_PADDING.left + CHART_PADDING.right))
const chartHeight: ComputedRef<number> = computed((): number => safeDimension(props.height, SKETCHY_CHART_DEFAULT_HEIGHT_PX, CHART_PADDING.top + CHART_PADDING.bottom))
const renderedGraphWidth: Ref<number> = ref(0)
const graphScale: ComputedRef<number> = computed((): number => renderedGraphWidth.value > 0 ? renderedGraphWidth.value / chartWidth.value : 1)
const axisLabelFontSize: ComputedRef<number> = computed((): number => AXIS_LABEL_FONT_SIZE_PX / graphScale.value)
const emptyStateFontSize: ComputedRef<number> = computed((): number => EMPTY_STATE_FONT_SIZE_PX / graphScale.value)
const labelMetrics: Ref<ChartLabelMetrics> = ref({ yAxisWidth: 0, categoryWidths: [] })
const chartLeftPadding: ComputedRef<number> = computed((): number => Math.max(
    CHART_PADDING.left,
    labelMetrics.value.yAxisWidth + (AXIS_LABEL_GAP_PX + PLOT_EDGE_GUTTER_PX) / graphScale.value,
))
const chartTopPadding: ComputedRef<number> = computed((): number => Math.max(
    CHART_PADDING.top,
    (AXIS_LABEL_FONT_SIZE_PX - Y_AXIS_LABEL_OFFSET_PX + PLOT_EDGE_GUTTER_PX) / graphScale.value,
))
const chartBottomPadding: ComputedRef<number> = computed((): number => Math.max(
    CHART_PADDING.bottom,
    (X_AXIS_LABEL_OFFSET_PX + AXIS_LABEL_FONT_SIZE_PX * AXIS_LABEL_DESCENT_RATIO + PLOT_EDGE_GUTTER_PX) / graphScale.value,
))
const categoryLabelGap: ComputedRef<number> = computed((): number => CATEGORY_LABEL_GAP_PX / graphScale.value)
const plotWidth: ComputedRef<number> = computed((): number => Math.max(MINIMUM_PLOT_SIZE, chartWidth.value - chartLeftPadding.value - CHART_PADDING.right))
const plotHeight: ComputedRef<number> = computed((): number => Math.max(MINIMUM_PLOT_SIZE, chartHeight.value - chartTopPadding.value - chartBottomPadding.value))
function dataToSvgX(index: number): number {
    const count: number = processedData.value.length
    const position: number = props.type === 'bar' ? (index + 0.5) / count : count <= 1 ? 0.5 : index / (count - 1)
    return chartLeftPadding.value + position * plotWidth.value
}
function dataToSvgY(value: number): number {
    return chartTopPadding.value + chartYPosition(value, model.value) * plotHeight.value
}
const zeroY: ComputedRef<number> = computed((): number => dataToSvgY(0))
const linePath: ComputedRef<string> = computed((): string => processedData.value
    .map((item: ChartDatum, index: number): string => `${index === 0 ? 'M' : 'L'} ${dataToSvgX(index)} ${dataToSvgY(item.value)}`).join(' '))
const lineAreaPath: ComputedRef<string> = computed((): string => processedData.value.length === 0 ? '' :
    `${linePath.value} L ${dataToSvgX(processedData.value.length - 1)} ${zeroY.value} L ${dataToSvgX(0)} ${zeroY.value} Z`)
const barWidth: ComputedRef<number> = computed((): number => processedData.value.length === 0 ? 0 : plotWidth.value / processedData.value.length * (1 - BAR_GAP_RATIO))
function getBarX(index: number): number {
    return dataToSvgX(index) - barWidth.value / 2
}
function categoryLabelX(item: ChartDatum): number {
    const dataPosition: number = dataToSvgX(item.index)
    const width: number = labelMetrics.value.categoryWidths[item.index] ?? 0
    const anchorOffset: number = item.index === 0 ? 0 : item.index === processedData.value.length - 1 ? width : width / 2
    const gutter: number = PLOT_EDGE_GUTTER_PX / graphScale.value
    return Math.min(chartWidth.value - gutter - width + anchorOffset, Math.max(gutter + anchorOffset, dataPosition))
}
const pieSlices: ComputedRef<Array<PieGeometry & { color: string }>> = computed((): Array<PieGeometry & { color: string }> =>
    createPieGeometry(model.value, chartWidth.value, chartHeight.value).map((slice: PieGeometry): PieGeometry & { color: string } => ({ ...slice, color: PIE_COLORS[slice.index % PIE_COLORS.length]! })))
const yTicks: ComputedRef<PositionedTick[]> = computed((): PositionedTick[] => model.value.state === 'invalid' || model.value.state === 'empty' ? [] :
    createChartTicks(model.value, formatValue).map((tick: ChartTick): PositionedTick => ({ ...tick, y: chartTopPadding.value + tick.position * plotHeight.value })))
const visibleCategories: ComputedRef<Set<number>> = computed((): Set<number> => {
    const items: ChartDatum[] = processedData.value
    const selected: Set<number> = new Set(items.slice(0, 1).map(item => item.index))
    if (items.length <= 1) return selected
    const widths: number[] = labelMetrics.value.categoryWidths
    if (widths.length !== items.length) return selected
    const first: ChartDatum = items[0]!
    const last: ChartDatum = items[items.length - 1]!
    let occupiedRight: number = categoryLabelX(first) + (widths[first.index] ?? 0)
    const lastLeft: number = categoryLabelX(last) - (widths[last.index] ?? 0)
    if (lastLeft < occupiedRight + categoryLabelGap.value) return selected

    for (const item of items.slice(1, -1)) {
        const center: number = categoryLabelX(item)
        const halfWidth: number = (widths[item.index] ?? 0) / 2
        const left: number = center - halfWidth
        const right: number = center + halfWidth
        if (left >= occupiedRight + categoryLabelGap.value && right <= lastLeft - categoryLabelGap.value) {
            selected.add(item.index)
            occupiedRight = right
        }
    }
    selected.add(last.index)
    return selected
})
const isEmpty: ComputedRef<boolean> = computed((): boolean => model.value.state !== 'ready')
const containerClasses: ComputedRef<string> = computed((): string => cn(sketchyChartVariants(), props.class))
const statusClasses: ComputedRef<string> = computed((): string => cn('rounded-brutal border-2 border-brutal p-3', FOCUS_RING_CLASSES))
const root: Ref<HTMLElement | null> = ref(null)
const explorer: Ref<HTMLElement | null> = ref(null)
const portalTarget: Ref<HTMLElement | undefined> = ref(undefined)
const explorerId: string = `chart-explorer-${uid}`
const instructionsId: string = `chart-instructions-${uid}`
const tooltipId: string = `chart-reading-${uid}`
const statusId: string = `chart-status-${uid}`
const FIRST_INDEX: number = 0
const INDEX_STEP: number = 1
const FULL_TURN: number = Math.PI * 2
const PIE_TOP_ANGLE: number = -Math.PI / 2
const ANCHOR_RADIUS_RATIO: number = 0.75
const validReadings: ComputedRef<boolean> = computed((): boolean => model.value.state === 'ready' || model.value.state === 'zero-total')
function isPieFractionInSlice(fraction: number, slice: PieGeometry): boolean {
    const candidate: number = fraction < slice.startFraction ? fraction + 1 : fraction
    return candidate >= slice.startFraction && candidate < slice.endFraction
}
function hit(event: PointerEvent): number | null {
    const matrix: DOMMatrix | null | undefined = graph.value?.getScreenCTM()
    if (!matrix || !validReadings.value) return null
    const point: DOMPoint = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    if (props.type === 'pie') {
        const dx: number = point.x - chartWidth.value / 2
        const dy: number = point.y - chartHeight.value / 2
        const radius: number = Math.min(chartWidth.value, chartHeight.value) / 2 * PIE_RADIUS_RATIO
        if (Math.hypot(dx, dy) > radius) return null
        const fraction: number = ((Math.atan2(dy, dx) - PIE_TOP_ANGLE + FULL_TURN) % FULL_TURN) / FULL_TURN
        for (const slice of pieSlices.value) {
            if (isPieFractionInSlice(fraction, slice)) return slice.index
        }
        return null
    }
    if (point.x < chartLeftPadding.value || point.x > chartWidth.value - CHART_PADDING.right || point.y < chartTopPadding.value || point.y > chartHeight.value - chartBottomPadding.value) return null
    const position: number = (point.x - chartLeftPadding.value) / plotWidth.value
    return props.type === 'line' ? Math.round(position * (readings.value.length - 1)) : Math.min(readings.value.length - 1, Math.floor(position * readings.value.length))
}
const interaction: ReturnType<typeof useChartInteraction> = useChartInteraction({
    data: (): ChartDataItem[] => props.data, type: (): ChartType => props.type,
    enabled: (): boolean => props.interactive, valid: (): boolean => validReadings.value,
    root, explorer, hit, tooltip: (): HTMLElement | null => root.value?.ownerDocument.getElementById(tooltipId) ?? null,
})
const { activeIndex, explorerIndex, open: tooltipOpen } = interaction
const activeReading: ComputedRef<ChartReading | undefined> = computed((): ChartReading | undefined => activeIndex.value === null ? undefined : readings.value[activeIndex.value])
const tooltipReading: ComputedRef<TooltipReading | undefined> = computed((): TooltipReading | undefined => {
    const item: ChartReading | undefined = activeReading.value
    return item ? { index: item.index, label: item.label, value: item.value, formattedValue: item.formattedValue,
        percentage: item.percentage, formattedPercentage: item.percentage === undefined ? undefined : item.formattedPercentage } : undefined
})
const activeSlice: ComputedRef<PieGeometry | undefined> = computed((): PieGeometry | undefined => pieSlices.value.find((slice: PieGeometry): boolean => slice.index === activeIndex.value))
const anchorInGraph: ComputedRef<boolean> = computed((): boolean => activeReading.value !== undefined && (props.type !== 'pie' || activeSlice.value !== undefined))
const activePoint: ComputedRef<ChartPoint> = computed((): ChartPoint => {
    const item: ChartReading | undefined = activeReading.value
    if (!item) return { x: 0, y: 0 }
    if (props.type !== 'pie') return { x: dataToSvgX(item.index), y: dataToSvgY(item.value) }
    const slice: PieGeometry | undefined = activeSlice.value
    if (!slice) return { x: 0, y: 0 }
    const angle: number = (slice.startFraction + slice.endFraction) / 2 * FULL_TURN + PIE_TOP_ANGLE
    const radius: number = Math.min(chartWidth.value, chartHeight.value) / 2 * PIE_RADIUS_RATIO * ANCHOR_RADIUS_RATIO
    return { x: chartWidth.value / 2 + Math.cos(angle) * radius, y: chartHeight.value / 2 + Math.sin(angle) * radius }
})
const anchorStyle: ComputedRef<CSSProperties> = computed((): CSSProperties => ({ left: `${activePoint.value.x / chartWidth.value * PERCENTAGE_MULTIPLIER}%`, top: `${activePoint.value.y / chartHeight.value * PERCENTAGE_MULTIPLIER}%` }))
function readingText(index: number): string {
    const item: ChartReading | undefined = readings.value[index]
    if (!item || !validReadings.value) return stateText.value
    return [item.label, item.formattedValue, props.type === 'pie' ? item.formattedPercentage : undefined,
        t('sketchyChart.positionText', { position: index + INDEX_STEP, count: readings.value.length })].filter(Boolean).join(' · ')
}
function updateLabelMetrics(): void {
    const svg: SVGSVGElement | null = graph.value
    if (!svg) return
    const yAxisWidth: number = Math.max(0, ...Array.from(svg.querySelectorAll<SVGTextElement>('[data-chart-y-tick]'), (label: SVGTextElement): number => label.getComputedTextLength()))
    const categoryWidths: number[] = Array.from(svg.querySelectorAll<SVGTextElement>('[data-chart-category]'), (label: SVGTextElement): number => label.getComputedTextLength())
    labelMetrics.value = { yAxisWidth, categoryWidths }
}
let labelMeasureFrame: number | null = null
function scheduleLabelMetrics(): void {
    if (!graph.value || labelMeasureFrame !== null) return
    labelMeasureFrame = requestAnimationFrame((): void => {
        labelMeasureFrame = null
        updateLabelMetrics()
    })
}
watch([yTicks, processedData, axisLabelFontSize], scheduleLabelMetrics, { flush: 'post' })
let graphResizeObserver: ResizeObserver | null = null
let chartFonts: FontFaceSet | null = null
onMounted((): void => {
    portalTarget.value = root.value?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? root.value?.ownerDocument.body
    const graphElement: SVGSVGElement | null = graph.value
    if (!graphElement) return
    const updateWidth = (): void => { renderedGraphWidth.value = graphElement.getBoundingClientRect().width }
    updateWidth()
    const ResizeObserverCtor = getResizeObserverCtor()
    if (ResizeObserverCtor) {
        graphResizeObserver = new ResizeObserverCtor(updateWidth)
        graphResizeObserver.observe(graphElement)
    }
    chartFonts = getDocument()?.fonts ?? null
    chartFonts?.addEventListener('loadingdone', scheduleLabelMetrics)
    void chartFonts?.ready.then(scheduleLabelMetrics)
})
onBeforeUnmount((): void => {
    graphResizeObserver?.disconnect()
    graphResizeObserver = null
    chartFonts?.removeEventListener('loadingdone', scheduleLabelMetrics)
    chartFonts = null
    if (labelMeasureFrame !== null) cancelAnimationFrame(labelMeasureFrame)
    labelMeasureFrame = null
})
</script>

<template>
    <div ref="root" :class="containerClasses" :data-chart-state="model.state" :data-active-index="activeIndex">
        <TooltipProvider :delay-duration="0">
        <TooltipRoot :open="tooltipOpen">
        <p :id="titleId" class="font-bold tracking-tight leading-snug">{{ chartTitle }}</p>
        <p :id="descriptionId" class="text-sm font-medium text-brutal-muted-foreground leading-relaxed">{{ chartDescription }}</p>
        <div class="relative">
        <svg
            ref="graph"
            data-chart-hit
            role="img"
            :aria-labelledby="titleId"
            :aria-describedby="descriptionId"
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            class="w-full h-auto overflow-visible select-none"
            @pointerenter="interaction.pointerEnter"
            @pointermove="interaction.pointerMove($event)"
            @pointerdown="interaction.pointerDown($event)"
            @pointerup="interaction.pointerUp($event)"
            @pointercancel="interaction.pointerCancel"
        >
            <title>{{ chartTitle }}</title>

            <defs>
                <!-- 手绘波动滤镜 -->
                <filter :id="filterId">
                    <feTurbulence
                        type="fractalNoise"
                        :baseFrequency="baseFrequency"
                        numOctaves="3"
                        result="noise"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        :scale="sketchiness"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>

                <!-- 斜向条纹 Hatch Fill -->
                <pattern
                    :id="hatchId"
                    patternUnits="userSpaceOnUse"
                    :width="HATCH_TILE_SIZE"
                    :height="HATCH_TILE_SIZE"
                    patternTransform="rotate(45)"
                >
                    <rect :width="HATCH_TILE_SIZE" :height="HATCH_TILE_SIZE" fill="var(--brutal-secondary, #4ECDC4)" />
                    <line
                        x1="0"
                        y1="0"
                        x2="0"
                        :y2="HATCH_TILE_SIZE"
                        stroke="var(--brutal-border-color, #000000)"
                        stroke-width="2"
                    />
                </pattern>
            </defs>

            <!-- 背景网格线 -->
            <g v-if="grid && type !== 'pie'" class="chart-grid">
                <line
                    v-for="tick in yTicks"
                    :key="'grid-' + tick.index"
                    :x1="chartLeftPadding"
                    :y1="tick.y"
                    :x2="chartWidth - CHART_PADDING.right"
                    :y2="tick.y"
                    stroke="var(--brutal-muted, #f3f4f6)"
                    stroke-width="1.5"
                    :stroke-dasharray="DASH_PATTERN"
                />
            </g>

            <!-- 坐标轴 -->
            <g v-if="type !== 'pie'" :filter="`url(#${filterId})`" class="chart-axes">
                <!-- Y 轴 -->
                <line
                    :x1="chartLeftPadding"
                    :y1="chartTopPadding"
                    :x2="chartLeftPadding"
                    :y2="chartHeight - chartBottomPadding"
                    stroke="var(--brutal-border-color, #000000)"
                    :stroke-width="CHART_STROKE_WIDTH"
                />
                <!-- X 轴 -->
                <line
                    :x1="chartLeftPadding"
                    :y1="zeroY"
                    :x2="chartWidth - CHART_PADDING.right"
                    :y2="zeroY"
                    stroke="var(--brutal-border-color, #000000)"
                    :stroke-width="CHART_STROKE_WIDTH"
                />
            </g>

            <!-- 数据图形展示 -->
            <g :filter="`url(#${filterId})`" class="chart-data">
                <!-- 1. 折线图 -->
                <template v-if="type === 'line' && processedData.length > 0">
                    <!-- 阴影填充区 -->
                    <path
                        :d="lineAreaPath"
                        :fill="`url(#${hatchId})`"
                        class="opacity-60"
                    />
                    <!-- 核心折线 -->
                    <path
                        :d="linePath"
                        fill="none"
                        stroke="var(--brutal-primary, #FF6B6B)"
                        stroke-width="4"
                    />
                    <!-- 折线拐点圆圈（Brutalist 粗黑边圆圈） -->
                    <circle
                        v-for="(d, i) in processedData"
                        :key="'dot-' + i"
                        :cx="dataToSvgX(i)"
                        :cy="dataToSvgY(d.value)"
                        :r="POINT_RADIUS"
                        fill="var(--brutal-accent, #FFE66D)"
                        stroke="var(--brutal-border-color, #000000)"
                        stroke-width="2.5"
                    />
                </template>

                <!-- 2. 柱状图 -->
                <template v-if="type === 'bar' && processedData.length > 0">
                    <g v-for="(d, i) in processedData" :key="'bar-' + i">
                        <!-- 柱体硬影子（Neobrutalist 偏移底色块） -->
                        <rect
                            :x="getBarX(i) + LABEL_OFFSET"
                            :y="Math.min(zeroY, dataToSvgY(d.value)) + LABEL_OFFSET"
                            :width="barWidth"
                            :height="Math.abs(zeroY - dataToSvgY(d.value))"
                            fill="var(--brutal-border-color, #000000)"
                        />
                        <!-- 柱体本体（Hatch 填充 + 粗黑边框） -->
                        <rect
                            :x="getBarX(i)"
                            :y="Math.min(zeroY, dataToSvgY(d.value))"
                            :width="barWidth"
                            :height="Math.abs(zeroY - dataToSvgY(d.value))"
                            :fill="`url(#${hatchId})`"
                            stroke="var(--brutal-border-color, #000000)"
                            :stroke-width="CHART_STROKE_WIDTH"
                        />
                    </g>
                </template>

                <!-- 3. 饼图 -->
                <template v-if="type === 'pie' && pieSlices.length > 0">
                    <g v-for="(slice, i) in pieSlices" :key="'pie-' + i">
                        <path
                            :d="slice.path"
                            :fill="slice.color"
                            stroke="var(--brutal-border-color, #000000)"
                            :stroke-width="CHART_STROKE_WIDTH"
                        />
                    </g>
                </template>
            </g>

            <!-- 坐标轴文本与刻度标签 -->
            <g v-if="type !== 'pie'" class="chart-labels" fill="var(--brutal-fg, #000000)" :font-size="axisLabelFontSize" font-weight="bold">
                <!-- Y 轴刻度标签 -->
                <text
                    v-for="tick in yTicks"
                    :key="'lbl-y-' + tick.index"
                    data-chart-y-tick
                    :x="chartLeftPadding - AXIS_LABEL_GAP_PX / graphScale"
                    :y="tick.y + Y_AXIS_LABEL_OFFSET_PX / graphScale"
                    text-anchor="end"
                >
                    {{ tick.text }}
                </text>

                <!-- X 轴刻度标签 -->
                <text
                    v-for="d in processedData"
                    :key="'lbl-x-' + d.index"
                    :x="categoryLabelX(d)"
                    :y="chartHeight - chartBottomPadding + X_AXIS_LABEL_OFFSET_PX / graphScale"
                    :data-chart-category="d.index"
                    :visibility="visibleCategories.has(d.index) ? undefined : 'hidden'"
                    :text-anchor="d.index === 0 ? 'start' : d.index === processedData.length - 1 ? 'end' : 'middle'"
                >
                    {{ d.label }}
                </text>
            </g>

            <!-- 暂无数据提示 (Empty State) -->
            <g v-if="isEmpty" :filter="`url(#${filterId})`" class="chart-empty-state">
                <circle
                    v-if="type === 'pie'"
                    :cx="chartWidth / 2"
                    :cy="chartHeight / 2"
                    :r="Math.min(chartWidth, chartHeight) / 2 * PIE_RADIUS_RATIO"
                    fill="var(--brutal-muted, #f3f4f6)"
                    stroke="var(--brutal-border-color, #000000)"
                    :stroke-width="CHART_STROKE_WIDTH"
                />
                <text
                    :x="chartWidth / 2"
                    :y="chartHeight / 2"
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill="var(--brutal-fg, #000000)"
                    :font-size="emptyStateFontSize"
                    font-weight="900"
                >
                    {{ stateText }}
                </text>
            </g>
            <g v-if="activeReading && anchorInGraph" aria-hidden="true" class="pointer-events-none" fill="none" stroke="currentColor" :stroke-width="CHART_STROKE_WIDTH">
                <circle v-if="type === 'line'" :cx="activePoint.x" :cy="activePoint.y" :r="POINT_RADIUS + CHART_STROKE_WIDTH" />
                <rect v-else-if="type === 'bar'" :x="getBarX(activeReading.index) - CHART_STROKE_WIDTH" :y="Math.min(zeroY, activePoint.y) - CHART_STROKE_WIDTH" :width="barWidth + CHART_STROKE_WIDTH * 2" :height="Math.abs(zeroY - activePoint.y) + CHART_STROKE_WIDTH * 2" />
                <path v-else-if="activeSlice" :d="activeSlice.path" :stroke-width="CHART_STROKE_WIDTH * 2" :stroke-dasharray="DASH_PATTERN" />
                <line v-if="type === 'bar' && activeReading.value === 0" :x1="getBarX(activeReading.index)" :x2="getBarX(activeReading.index) + barWidth" :y1="zeroY" :y2="zeroY" />
            </g>
        </svg>
        <TooltipTrigger v-if="anchorInGraph" as-child>
            <span aria-hidden="true" tabindex="-1" class="absolute pointer-events-none" :style="anchorStyle" />
        </TooltipTrigger>
        </div>
        <div
v-if="interactive" ref="explorer" class="relative mt-4 space-y-3" data-chart-hit
            @focusin="interaction.explorerFocus" @focusout="interaction.explorerBlur"
            @keydown.capture="interaction.explorerKeydown" @pointerdown.capture="interaction.explorerPointerDown"
>
            <p :id="explorerId" class="text-sm font-bold">{{ t('sketchyChart.browseData') }}</p>
            <p :id="instructionsId" class="text-sm text-brutal-muted-foreground">{{ t('sketchyChart.readingInstructions') }}</p>
            <Slider
v-if="validReadings && readings.length > INDEX_STEP"
                :model-value="[explorerIndex]" :min="FIRST_INDEX" :max="readings.length - INDEX_STEP" :step="INDEX_STEP"
                :aria-labelledby="`${titleId} ${explorerId}`" :aria-describedby="instructionsId" :get-value-text="readingText"
                @update:model-value="interaction.explorerUpdate"
/>
            <div
v-else tabindex="0" role="group" data-chart-status :aria-labelledby="`${titleId} ${explorerId}`" :aria-describedby="statusId"
                :class="statusClasses"
>
                <span :id="statusId">{{ readingText(FIRST_INDEX) }}</span>
            </div>
            <p v-if="validReadings && readings.length > INDEX_STEP" class="text-sm font-mono">{{ readingText(explorerIndex) }}</p>
            <TooltipTrigger v-if="!anchorInGraph" as-child>
                <span aria-hidden="true" tabindex="-1" class="absolute left-1/2 top-0 pointer-events-none" />
            </TooltipTrigger>
        </div>
        <TooltipContent
v-if="tooltipOpen && tooltipReading" :id="tooltipId" :to="portalTarget" aria-hidden="true"
            update-position-strategy="always" class="max-w-[min(24rem,calc(100vw-2rem))] break-words motion-reduce:animate-none motion-reduce:transition-none"
            @escape-key-down="interaction.escape" @pointer-down-outside="interaction.outside"
>
            <slot name="tooltip" v-bind="tooltipReading">
                <p class="font-bold">{{ tooltipReading.label }}</p>
                <p>{{ tooltipReading.formattedValue }}<template v-if="type === 'pie'"> · {{ activeReading?.formattedPercentage }}</template></p>
            </slot>
        </TooltipContent>
        <ul
            v-if="type === 'pie' && readings.length > 0"
            data-slot="pie-legend"
            class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
            <li
                v-for="slice in readings"
                :key="`pie-legend-${slice.index}`"
                data-chart-hit
                :data-active="activeIndex === slice.index ? '' : undefined"
                class="flex min-w-0 items-center gap-2 text-sm font-bold data-active:underline data-active:decoration-2"
                @pointerenter="interaction.pointerEnter"
                @pointermove="interaction.pointerMove($event, slice.index)"
                @pointerdown="interaction.pointerDown($event, slice.index)"
                @pointerup="interaction.pointerUp($event, slice.index)"
                @pointercancel="interaction.pointerCancel"
            >
                <span
                    data-slot="pie-legend-swatch"
                    aria-hidden="true"
                    class="h-3 w-3 flex-none rounded-brutal border-2 border-brutal"
                    :style="{ backgroundColor: slice.color }"
                />
                <span class="min-w-0 flex-1 break-words">{{ slice.label }}</span>
                <span class="shrink-0 font-mono">{{ slice.formattedValue }} ({{ slice.formattedPercentage }})</span>
            </li>
        </ul>
        <p v-if="hasRoundingDifference" class="mt-2 text-sm text-brutal-muted-foreground">{{ t('sketchyChart.roundingText') }}</p>
        <CollapsibleRoot v-slot="{ open }" class="mt-4">
            <CollapsibleTrigger as-child>
                <Button data-chart-table-trigger variant="outline" type="button">{{ open ? t('sketchyChart.hideTable') : t('sketchyChart.showTable') }}</Button>
            </CollapsibleTrigger>
            <CollapsibleContent class="mt-4">
                <Table>
                    <TableCaption>{{ t('sketchyChart.tableCaption', { title: chartTitle }) }}</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead v-for="column in tableColumns" :key="column.field" scope="col">{{ t(column.title) }}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow v-for="item in readings" :key="item.index" :data-active="activeIndex === item.index ? '' : undefined" class="data-active:underline data-active:decoration-2">
                            <TableCell v-for="column in tableColumns" :key="column.field">{{ item[column.field] }}</TableCell>
                        </TableRow>
                        <TableRow v-if="readings.length === 0">
                            <TableCell :colspan="tableColumns.length">{{ stateText }}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CollapsibleContent>
        </CollapsibleRoot>
        </TooltipRoot>
        </TooltipProvider>
    </div>
</template>

<style scoped>
@media (forced-colors: active) {
    svg {
        forced-color-adjust: none;
        color: CanvasText;
    }
    .chart-data, .chart-axes, .chart-empty-state {
        filter: none;
    }
    .chart-data path, .chart-data rect, .chart-data circle, .chart-empty-state circle {
        fill: Canvas;
        stroke: CanvasText;
    }
    .chart-axes line {
        stroke: CanvasText;
    }
    .chart-labels, .chart-empty-state text {
        fill: CanvasText;
    }
    .chart-grid line {
        stroke: GrayText;
    }
}
</style>
