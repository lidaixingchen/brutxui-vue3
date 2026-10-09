import { computed, nextTick, onBeforeUnmount, readonly, ref, watch, type ComputedRef, type DeepReadonly, type Ref } from 'vue'
import type { PointerDownOutsideEvent } from 'reka-ui'
import type { ChartDataItem, ChartType } from './sketchy-chart-data'

type InputSource = 'mouse' | 'keyboard' | 'touch' | null
interface Point { x: number; y: number }
interface TouchGesture { id: number; start: Point; index: number; moved: boolean }
interface ChartInteractionOptions {
    data: () => readonly ChartDataItem[]
    type: () => ChartType
    enabled: () => boolean
    valid: () => boolean
    root: Ref<HTMLElement | null>
    explorer: Ref<HTMLElement | null>
    tooltip: () => HTMLElement | null
    hit: (event: PointerEvent) => number | null
}
interface ChartInteraction {
    activeIndex: DeepReadonly<Ref<number | null>>
    explorerIndex: DeepReadonly<Ref<number>>
    source: DeepReadonly<Ref<InputSource>>
    open: ComputedRef<boolean>
    select: (index: number, input: InputSource) => void
    dismiss: () => void
    escape: (event: KeyboardEvent) => void
    outside: (event: PointerDownOutsideEvent) => void
    pointerMove: (event: PointerEvent, index?: number) => void
    pointerEnter: () => void
    pointerDown: (event: PointerEvent, index?: number) => void
    pointerUp: (event: PointerEvent, index?: number) => void
    pointerCancel: () => void
    explorerFocus: (event: FocusEvent) => void
    explorerBlur: (event: FocusEvent) => void
    explorerKeydown: (event: KeyboardEvent) => void
    explorerPointerDown: (event: PointerEvent) => void
    explorerUpdate: (values: number[]) => void
}

const TOUCH_MOVE_TOLERANCE: number = 8
const READ_KEYS: readonly string[] = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']

function containsPoint(rect: DOMRect, point: Point): boolean {
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
}
function cross(a: Point, b: Point, c: Point): number {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}
function inTriangle(point: Point, a: Point, b: Point, c: Point): boolean {
    if (cross(a, b, c) === 0) return false
    const ab: number = cross(a, b, point)
    const bc: number = cross(b, c, point)
    const ca: number = cross(c, a, point)
    return (ab >= 0 && bc >= 0 && ca >= 0) || (ab <= 0 && bc <= 0 && ca <= 0)
}
function inCorridor(point: Point, origin: Point, rect: DOMRect): boolean {
    const corners: Point[] = [
        { x: rect.left, y: rect.top }, { x: rect.right, y: rect.top },
        { x: rect.right, y: rect.bottom }, { x: rect.left, y: rect.bottom },
    ]
    return containsPoint(rect, point) || corners.some((corner: Point, index: number): boolean =>
        inTriangle(point, origin, corner, corners[(index + 1) % corners.length]!))
}

export function useChartInteraction(options: ChartInteractionOptions): ChartInteraction {
    const activeIndex: Ref<number | null> = ref(null)
    const explorerIndex: Ref<number> = ref(0)
    const source: Ref<InputSource> = ref(null)
    const open: ComputedRef<boolean> = computed((): boolean => activeIndex.value !== null && options.enabled() && options.valid())
    let suppressedIndex: number | null = null
    let lastPointer: Point | null = null
    let corridorOrigin: Point | null = null
    let gesture: TouchGesture | null = null
    let explorerSource: InputSource = 'keyboard'
    let restoringFocus: boolean = false

    function dismiss(): void {
        activeIndex.value = null
        source.value = null
        corridorOrigin = null
    }
    function select(index: number, input: InputSource): void {
        if (!options.enabled() || !options.valid() || index < 0 || index >= options.data().length) return
        if (input === 'mouse' && index === suppressedIndex) return
        suppressedIndex = null
        activeIndex.value = index
        source.value = input
    }
    function escape(event: KeyboardEvent): void {
        event.preventDefault()
        suppressedIndex = activeIndex.value
        dismiss()
    }
    function isTrigger(target: EventTarget | null): boolean {
        return target instanceof Element && Boolean(target.closest('[data-chart-hit]') && options.root.value?.contains(target))
    }
    function isMouseTrigger(target: EventTarget | null): boolean {
        return isTrigger(target) && !(target instanceof Element && options.explorer.value?.contains(target))
    }
    function outside(event: PointerDownOutsideEvent): void {
        if (isTrigger(event.target)) event.preventDefault()
        else dismiss()
    }
    function safeCorridor(point: Point): boolean {
        const tooltip: HTMLElement | null = options.tooltip()
        return tooltip !== null && corridorOrigin !== null && inCorridor(point, corridorOrigin, tooltip.getBoundingClientRect())
    }
    function pointerMove(event: PointerEvent, index?: number): void {
        if (event.pointerType === 'touch') {
            if (gesture && Math.hypot(event.clientX - gesture.start.x, event.clientY - gesture.start.y) > TOUCH_MOVE_TOLERANCE) gesture.moved = true
            return
        }
        const point: Point = { x: event.clientX, y: event.clientY }
        if (lastPointer && lastPointer.x === point.x && lastPointer.y === point.y) return
        lastPointer = point
        if (source.value === 'mouse' && safeCorridor(point)) return
        const nextIndex: number | null = index ?? options.hit(event)
        if (nextIndex === null) {
            if (source.value === 'mouse') dismiss()
            return
        }
        select(nextIndex, 'mouse')
        if (source.value === 'mouse') corridorOrigin = point
    }
    function trackPointer(event: PointerEvent): void {
        if (event.pointerType === 'touch') return
        lastPointer = { x: event.clientX, y: event.clientY }
        if (source.value !== 'mouse') return
        if (isMouseTrigger(event.target) || options.tooltip()?.contains(event.target as Node)) return
        if (!safeCorridor({ x: event.clientX, y: event.clientY })) dismiss()
    }
    function pointerEnter(): void { suppressedIndex = null }
    function pointerDown(event: PointerEvent, index?: number): void {
        if (event.pointerType !== 'touch' || !options.enabled() || !options.valid()) return
        const hit: number | null = index ?? options.hit(event)
        gesture = hit === null ? null : { id: event.pointerId, start: { x: event.clientX, y: event.clientY }, index: hit, moved: false }
    }
    function pointerCancel(): void { gesture = null }
    function pointerUp(event: PointerEvent, index?: number): void {
        const pending: TouchGesture | null = gesture
        gesture = null
        if (!pending || pending.id !== event.pointerId || pending.moved || Math.hypot(event.clientX - pending.start.x, event.clientY - pending.start.y) > TOUCH_MOVE_TOLERANCE) return
        const hit: number | null = index ?? options.hit(event)
        if (hit !== pending.index) return
        if (activeIndex.value === hit && source.value === 'touch') dismiss()
        else select(hit, 'touch')
    }
    function explorerFocus(event: FocusEvent): void {
        if (restoringFocus) return
        if (event.target instanceof Element && event.target.matches(':focus-visible')) {
            explorerSource = 'keyboard'
            select(explorerIndex.value, 'keyboard')
        }
    }
    function explorerBlur(event: FocusEvent): void {
        if (event.relatedTarget instanceof Node && options.explorer.value?.contains(event.relatedTarget)) return
        if (source.value === 'keyboard') dismiss()
    }
    function explorerKeydown(event: KeyboardEvent): void {
        if (!READ_KEYS.includes(event.key)) return
        explorerSource = 'keyboard'
        select(explorerIndex.value, 'keyboard')
    }
    function explorerPointerDown(event: PointerEvent): void {
        explorerSource = event.pointerType === 'touch' ? 'touch' : 'mouse'
    }
    function explorerUpdate(values: number[]): void {
        explorerIndex.value = values[0] ?? 0
        select(explorerIndex.value, explorerSource)
    }
    watch(
        (): [readonly ChartDataItem[], ChartType, boolean, [string, number][]] => {
            const data: readonly ChartDataItem[] = options.data()
            const itemValues: [string, number][] = data.map((item: ChartDataItem): [string, number] => [item.label, item.value])
            return [data, options.type(), options.enabled(), itemValues]
        },
        (): void => {
            const owner: Document | undefined = options.root.value?.ownerDocument
            const focused: boolean = Boolean(owner && options.explorer.value?.contains(owner.activeElement))
            dismiss()
            explorerIndex.value = 0
            suppressedIndex = null
            gesture = null
            if (focused) {
                void nextTick((): void => {
                    const target: HTMLElement | null | undefined = options.enabled()
                        ? options.explorer.value?.querySelector<HTMLElement>('[role="slider"], [data-chart-status]')
                        : options.root.value?.querySelector<HTMLElement>('[data-chart-table-trigger]')
                    if (target && target !== owner?.activeElement) {
                        restoringFocus = true
                        target.focus({ preventScroll: true })
                        restoringFocus = false
                    }
                })
            }
        },
    )
    watch(open, (visible: boolean, _: boolean, cleanup: (fn: () => void) => void): void => {
        if (!visible) return
        const owner: Document | undefined = options.root.value?.ownerDocument
        owner?.addEventListener('pointermove', trackPointer)
        cleanup((): void => owner?.removeEventListener('pointermove', trackPointer))
    })
    onBeforeUnmount(pointerCancel)
    return {
        activeIndex: readonly(activeIndex), explorerIndex: readonly(explorerIndex), source: readonly(source), open,
        select, dismiss, escape, outside, pointerMove, pointerEnter, pointerDown, pointerUp, pointerCancel,
        explorerFocus, explorerBlur, explorerKeydown, explorerPointerDown, explorerUpdate,
    }
}
