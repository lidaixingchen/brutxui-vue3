import {
    ref,
    readonly,
    computed,
    watch,
    onMounted,
    onBeforeUnmount,
    getCurrentInstance,
    toValue,
    type Ref,
    type ComputedRef,
    type DeepReadonly,
    type CSSProperties,
    type MaybeRefOrGetter,
} from 'vue'
import {
    getViewportSize,
    getDocument,
    requestAnimationFrame,
    cancelAnimationFrame,
    getResizeObserverCtor,
} from '@/lib/env'
import { DIALOG_MIN_WIDTH_PX, DIALOG_MIN_HEIGHT_PX } from '@/lib/defaults'
import type { ResizeCorner } from '@/types/common'
export type { ResizeCorner }

export interface DraggableDialogOptions {
    draggable?: boolean
    dragHandle?: string | HTMLElement
    bounds?: 'parent' | 'viewport' | { top: number; left: number; right: number; bottom: number }
    initialPosition?: { x: number; y: number }
}

export interface ResizableDialogOptions {
    resizable?: boolean
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    aspectRatio?: number
}

export interface UseDialogGeometryOptions extends DraggableDialogOptions, ResizableDialogOptions {}

interface DialogSize {
    width: number
    height: number
}

interface ResizeStart extends DialogSize {
    x: number
    y: number
    anchorX: number
    anchorY: number
    directionX: 1 | -1
    directionY: 1 | -1
}

export interface UseDialogGeometryReturn {
    contentRef: Ref<HTMLElement | null>
    isDragging: Readonly<Ref<boolean>>
    isResizing: Readonly<Ref<boolean>>
    /** 只读视图：修改请经 setPosition */
    position: DeepReadonly<Ref<{ x: number; y: number }>>
    /** 只读视图：修改请经 setSize */
    size: DeepReadonly<Ref<{ width: number; height: number }>>
    contentStyle: ComputedRef<CSSProperties>
    setPosition: (position: { x: number; y: number }) => void
    setSize: (size: { width: number; height: number }) => void
    onDragStart: (e: MouseEvent) => void
    onResizeStart: (e: MouseEvent, corner: ResizeCorner) => void
    initPosition: () => void
    initSize: () => void
}

/** Interactive HTML tags that should not trigger drag */
const INTERACTIVE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']

export function isInteractiveElement(target: HTMLElement): boolean {
    const selector = INTERACTIVE_TAGS.join(',').toLowerCase()
    return !!target.closest(selector) || target.isContentEditable
}

export function useDialogGeometry(
    options?: MaybeRefOrGetter<UseDialogGeometryOptions>,
): UseDialogGeometryReturn {
    const optionsRef: ComputedRef<UseDialogGeometryOptions> = computed(() => toValue(options) ?? {})

    const opt = {
        get draggable() { return optionsRef.value.draggable ?? false },
        get dragHandle() { return optionsRef.value.dragHandle },
        get bounds() { return optionsRef.value.bounds ?? 'viewport' },
        get initialPosition() { return optionsRef.value.initialPosition },
        get resizable() { return optionsRef.value.resizable ?? false },
        get minWidth() { return optionsRef.value.minWidth ?? DIALOG_MIN_WIDTH_PX },
        get minHeight() { return optionsRef.value.minHeight ?? DIALOG_MIN_HEIGHT_PX },
        get maxWidth() { return optionsRef.value.maxWidth },
        get maxHeight() { return optionsRef.value.maxHeight },
        get aspectRatio() { return optionsRef.value.aspectRatio },
    }

    const contentRef = ref<HTMLElement | null>(null)
    const isDragging = ref(false)
    const isResizing = ref(false)
    const position = ref(opt.initialPosition ? { ...opt.initialPosition } : { x: 0, y: 0 })
    const measuredSize = ref({ width: 0, height: 0 })
    const appliedSize = ref<DialogSize | null>(null)
    const size = computed(() => appliedSize.value ?? measuredSize.value)
    const dragStart = ref({ x: 0, y: 0 })
    let resizeStart: ResizeStart | undefined
    let dragStartSize: { width: number; height: number } | null = null

    // ── Content Style ──────────────────────────────────────────────

    const contentStyle = computed<CSSProperties>(() => {
        const style: CSSProperties = {}

        if (opt.draggable || (opt.resizable && (appliedSize.value || opt.initialPosition))) {
            style.transform = `translate(calc(-50% + ${position.value.x}px), calc(-50% + ${position.value.y}px))`
            style.position = 'fixed'
            style.top = '50%'
            style.left = '50%'
            style.margin = '0'
        }

        if (opt.resizable && appliedSize.value && appliedSize.value.width > 0 && appliedSize.value.height > 0) {
            style.width = `${appliedSize.value.width}px`
            style.height = `${appliedSize.value.height}px`
        }

        return style
    })

    // ── Drag Handle Resolution ─────────────────────────────────────

    function getDragHandle(): HTMLElement | null {
        if (!opt.draggable) return null
        if (typeof opt.dragHandle === 'string') {
            return contentRef.value?.querySelector(opt.dragHandle) ?? null
        }
        if (opt.dragHandle instanceof HTMLElement) {
            return opt.dragHandle
        }
        return contentRef.value
    }

    // ── Position Constraints ───────────────────────────────────────

    function getPositionBounds(viewport: DialogSize) {
        if (opt.bounds === 'viewport') {
            return { top: 0, left: 0, right: viewport.width, bottom: viewport.height }
        }
        if (opt.bounds === 'parent') {
            return contentRef.value?.parentElement?.getBoundingClientRect()
        }
        return opt.bounds
    }

    function constrainPosition(
        newX: number,
        newY: number,
        targetWidth?: number,
        targetHeight?: number,
    ): { x: number; y: number } {
        const rect = contentRef.value?.getBoundingClientRect()
        if (!rect) return { x: newX, y: newY }

        const width = targetWidth ?? rect.width
        const height = targetHeight ?? rect.height

        const clampAxis = (value: number, lower: number, upper: number): number =>
            lower <= upper ? Math.max(lower, Math.min(value, upper)) : 0

        const viewport = getViewportSize()
        const bounds = getPositionBounds(viewport)
        if (!bounds) return { x: newX, y: newY }
        return {
            x: clampAxis(newX, bounds.left - viewport.width / 2 + width / 2, bounds.right - viewport.width / 2 - width / 2),
            y: clampAxis(newY, bounds.top - viewport.height / 2 + height / 2, bounds.bottom - viewport.height / 2 - height / 2),
        }
    }

    // ── Size Constraints ──────────────────────────────────────────

    function constrainSize(width: number, height: number, space: DialogSize): DialogSize {
        const maxWidth = Math.min(space.width, opt.maxWidth || Infinity)
        const maxHeight = Math.min(space.height, opt.maxHeight || Infinity)
        const ratio = opt.aspectRatio
        if (ratio) {
            const min = Math.max(opt.minWidth, opt.minHeight * ratio)
            const max = Math.min(maxWidth, maxHeight * ratio)
            const adjustedWidth = Math.min(max, Math.max(min, width))
            return { width: adjustedWidth, height: adjustedWidth / ratio }
        }
        return {
            width: Math.min(maxWidth, Math.max(opt.minWidth, width)),
            height: Math.min(maxHeight, Math.max(opt.minHeight, height)),
        }
    }

    // ── Programmatic Setters ──────────────────────────────────────

    function setPosition(next: { x: number; y: number }): void {
        if (!Number.isFinite(next.x) || !Number.isFinite(next.y)) return
        position.value = { x: next.x, y: next.y }
    }

    function setSize(next: { width: number; height: number }): void {
        if (!Number.isFinite(next.width) || !Number.isFinite(next.height)) return
        appliedSize.value = { width: next.width, height: next.height }
    }

    // ── Drag Handlers ──────────────────────────────────────────────

    function onDragStart(e: MouseEvent) {
        const doc = getDocument()
        if (!doc) return
        if (!opt.draggable) return
        if (e.button !== 0) return

        const target = e.target
        if (!(target instanceof HTMLElement) || isInteractiveElement(target)) return

        const handle = getDragHandle()
        if (!handle || !handle.contains(target)) return

        isDragging.value = true
        dragStart.value = {
            x: e.clientX - position.value.x,
            y: e.clientY - position.value.y,
        }
        const rect = contentRef.value?.getBoundingClientRect()
        dragStartSize = rect ? { width: rect.width, height: rect.height } : null

        doc.addEventListener('pointermove', onDragMove)
        doc.addEventListener('pointerup', onDragEnd)
        doc.addEventListener('pointercancel', onDragEnd)
        e.preventDefault()
    }

    function onDragMove(e: MouseEvent) {
        if (!isDragging.value) return

        const newX = e.clientX - dragStart.value.x
        const newY = e.clientY - dragStart.value.y
        const constrained = dragStartSize
            ? constrainPosition(newX, newY, dragStartSize.width, dragStartSize.height)
            : constrainPosition(newX, newY)
        position.value = constrained
    }

    function onDragEnd() {
        const doc = getDocument()
        if (!doc) return
        isDragging.value = false
        dragStartSize = null
        doc.removeEventListener('pointermove', onDragMove)
        doc.removeEventListener('pointerup', onDragEnd)
        doc.removeEventListener('pointercancel', onDragEnd)
    }

    // ── Resize Handlers ────────────────────────────────────────────

    function onResizeStart(e: MouseEvent, corner: ResizeCorner) {
        const doc = getDocument()
        if (!doc || !opt.resizable || e.button !== 0) return

        const rect = contentRef.value?.getBoundingClientRect()
        const viewport = getViewportSize()
        const width = rect?.width || size.value.width
        const height = rect?.height || size.value.height
        const centerX = rect?.width ? rect.left + width / 2 : viewport.width / 2 + position.value.x
        const centerY = rect?.height ? rect.top + height / 2 : viewport.height / 2 + position.value.y
        const directionX = corner.endsWith('e') ? 1 : -1
        const directionY = corner.startsWith('s') ? 1 : -1
        isResizing.value = true
        resizeStart = {
            x: e.clientX,
            y: e.clientY,
            width,
            height,
            anchorX: centerX - directionX * width / 2,
            anchorY: centerY - directionY * height / 2,
            directionX,
            directionY,
        }

        doc.addEventListener('pointermove', onResizeMove)
        doc.addEventListener('pointerup', onResizeEnd)
        doc.addEventListener('pointercancel', onResizeEnd)
        e.preventDefault()
        e.stopPropagation()
    }

    function onResizeMove(e: MouseEvent) {
        if (!resizeStart) return
        const { x, y, width, height, anchorX, anchorY, directionX, directionY } = resizeStart
        const deltaX = e.clientX - x
        const deltaY = e.clientY - y
        if (!appliedSize.value && deltaX === 0 && deltaY === 0) return

        const viewport = getViewportSize()
        const bounds = getPositionBounds(viewport)
        // 以固定对角到边界的距离限制尺寸，使活动边碰到边界时对角保持原位。
        const space = bounds ? {
            width: directionX > 0 ? bounds.right - anchorX : anchorX - bounds.left,
            height: directionY > 0 ? bounds.bottom - anchorY : anchorY - bounds.top,
        } : { width: Infinity, height: Infinity }
        const next = constrainSize(width + directionX * deltaX, height + directionY * deltaY, space)
        if (next.width <= 0 || next.height <= 0) return
        if (!appliedSize.value && next.width === width && next.height === height) return

        setSize(next)
        position.value = {
            x: anchorX + directionX * next.width / 2 - viewport.width / 2,
            y: anchorY + directionY * next.height / 2 - viewport.height / 2,
        }
    }

    function onResizeEnd() {
        const doc = getDocument()
        if (!doc) return
        isResizing.value = false
        resizeStart = undefined
        doc.removeEventListener('pointermove', onResizeMove)
        doc.removeEventListener('pointerup', onResizeEnd)
        doc.removeEventListener('pointercancel', onResizeEnd)
    }

    // ── Initialization ─────────────────────────────────────────────

    function initPosition(): void {
        if (opt.initialPosition) {
            position.value = { ...opt.initialPosition }
        } else {
            position.value = { x: 0, y: 0 }
        }
    }

    let sizeRafId: number | null = null
    let resizeObserver: ResizeObserver | null = null

    function initSize(): void {
        if (sizeRafId !== null) {
            cancelAnimationFrame(sizeRafId)
            sizeRafId = null
        }
        if (contentRef.value) {
            sizeRafId = requestAnimationFrame(() => {
                sizeRafId = null
                const rect = contentRef.value?.getBoundingClientRect()
                if (rect && rect.width > 0 && rect.height > 0) {
                    measuredSize.value = { width: rect.width, height: rect.height }
                }
            })
        }
    }

    function setupSizeObserver(el: HTMLElement): void {
        const Ctor = getResizeObserverCtor()
        if (!Ctor) return
        resizeObserver = new Ctor((entries) => {
            if (contentRef.value !== el || isResizing.value) return
            for (const entry of entries) {
                const borderBox = entry.borderBoxSize?.[0]
                const width = borderBox ? borderBox.inlineSize : entry.contentRect.width
                const height = borderBox ? borderBox.blockSize : entry.contentRect.height
                if (width > 0 && height > 0) {
                    measuredSize.value = { width, height }
                }
            }
        })
        resizeObserver.observe(el)
    }

    // ── Watchers & Lifecycle ───────────────────────────────────────

    watch(contentRef, (el, previous) => {
        if (previous) {
            onDragEnd()
            onResizeEnd()
        }
        resizeObserver?.disconnect()
        resizeObserver = null
        initSize()
        if (el) setupSizeObserver(el)
    })

    watch(
        [() => opt.initialPosition?.x, () => opt.initialPosition?.y],
        () => {
            if (opt.initialPosition) {
                position.value = { ...opt.initialPosition }
            }
        }
    )

    if (getCurrentInstance()) {
        onMounted(initPosition)

        onBeforeUnmount(() => {
            if (sizeRafId !== null) {
                cancelAnimationFrame(sizeRafId)
                sizeRafId = null
            }
            resizeObserver?.disconnect()
            resizeObserver = null
            onDragEnd()
            onResizeEnd()
        })
    }

    return {
        contentRef,
        isDragging: readonly(isDragging),
        isResizing: readonly(isResizing),
        position: readonly(position),
        size: readonly(size),
        contentStyle,
        setPosition,
        setSize,
        onDragStart,
        onResizeStart,
        initPosition,
        initSize,
    }
}
