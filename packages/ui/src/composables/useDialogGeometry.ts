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
import type { ResizeCorner } from '@/types'
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

export interface UseDialogGeometryReturn {
    contentRef: Ref<HTMLElement | null>
    isDragging: Ref<boolean>
    isResizing: Ref<boolean>
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
    return INTERACTIVE_TAGS.includes(target.tagName) || target.isContentEditable
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
    const position = ref({ x: 0, y: 0 })
    const size = ref({ width: 0, height: 0 })
    const dragStart = ref({ x: 0, y: 0 })
    const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, corner: 'se', startX: 0, startY: 0 })
    let dragStartSize: { width: number; height: number } | null = null

    // ── Content Style ──────────────────────────────────────────────

    const contentStyle = computed<CSSProperties>(() => {
        const style: CSSProperties = {}

        if (opt.draggable) {
            style.transform = `translate(calc(-50% + ${position.value.x}px), calc(-50% + ${position.value.y}px))`
            style.position = 'fixed'
            style.top = '50%'
            style.left = '50%'
            style.margin = '0'
        }

        if (opt.resizable && size.value.width > 0 && size.value.height > 0) {
            style.width = `${size.value.width}px`
            style.height = `${size.value.height}px`
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

        if (opt.bounds === 'viewport') {
            const { width: vw, height: vh } = getViewportSize()
            return {
                x: clampAxis(newX, width / 2 - vw / 2, vw / 2 - width / 2),
                y: clampAxis(newY, height / 2 - vh / 2, vh / 2 - height / 2),
            }
        } else if (opt.bounds === 'parent') {
            const parentRect = contentRef.value?.parentElement?.getBoundingClientRect()
            if (parentRect) {
                const { width: vw, height: vh } = getViewportSize()
                return {
                    x: clampAxis(newX, parentRect.left - vw / 2 + width / 2, parentRect.right - vw / 2 - width / 2),
                    y: clampAxis(newY, parentRect.top - vh / 2 + height / 2, parentRect.bottom - vh / 2 - height / 2),
                }
            }
        } else if (typeof opt.bounds === 'object') {
            const { width: vw, height: vh } = getViewportSize()
            return {
                x: clampAxis(newX, opt.bounds.left - vw / 2 + width / 2, opt.bounds.right - vw / 2 - width / 2),
                y: clampAxis(newY, opt.bounds.top - vh / 2 + height / 2, opt.bounds.bottom - vh / 2 - height / 2),
            }
        }

        return { x: newX, y: newY }
    }

    // ── Size Constraints ──────────────────────────────────────────

    function constrainSize(width: number, height: number): { width: number; height: number } {
        let newWidth = width
        let newHeight = height
        if (opt.minWidth) newWidth = Math.max(opt.minWidth, newWidth)
        if (opt.minHeight) newHeight = Math.max(opt.minHeight, newHeight)
        if (opt.maxWidth) newWidth = Math.min(opt.maxWidth, newWidth)
        if (opt.maxHeight) newHeight = Math.min(opt.maxHeight, newHeight)

        if (opt.aspectRatio) {
            newHeight = newWidth / opt.aspectRatio
            if (opt.minHeight) newHeight = Math.max(opt.minHeight, newHeight)
            if (opt.maxHeight) newHeight = Math.min(opt.maxHeight, newHeight)
            newWidth = newHeight * opt.aspectRatio
            if (opt.minWidth) newWidth = Math.max(opt.minWidth, newWidth)
            if (opt.maxWidth) newWidth = Math.min(opt.maxWidth, newWidth)
        }
        return { width: newWidth, height: newHeight }
    }

    // ── Programmatic Setters ──────────────────────────────────────

    function setPosition(next: { x: number; y: number }): void {
        if (!Number.isFinite(next.x) || !Number.isFinite(next.y)) return
        position.value = { x: next.x, y: next.y }
    }

    function setSize(next: { width: number; height: number }): void {
        if (!Number.isFinite(next.width) || !Number.isFinite(next.height)) return
        size.value = { width: next.width, height: next.height }
    }

    // ── Drag Handlers ──────────────────────────────────────────────

    function onDragStart(e: MouseEvent) {
        const doc = getDocument()
        if (!doc) return
        if (!opt.draggable) return

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
        if (!doc) return
        if (!opt.resizable) return

        isResizing.value = true
        resizeStart.value = {
            x: e.clientX,
            y: e.clientY,
            width: size.value.width,
            height: size.value.height,
            corner,
            startX: position.value.x,
            startY: position.value.y,
        }

        doc.addEventListener('pointermove', onResizeMove)
        doc.addEventListener('pointerup', onResizeEnd)
        doc.addEventListener('pointercancel', onResizeEnd)
        e.preventDefault()
        e.stopPropagation()
    }

    function onResizeMove(e: MouseEvent) {
        if (!isResizing.value) return

        const deltaX = e.clientX - resizeStart.value.x
        const deltaY = e.clientY - resizeStart.value.y

        let newWidth = resizeStart.value.width
        let newHeight = resizeStart.value.height

        switch (resizeStart.value.corner) {
            case 'se':
                newWidth += deltaX
                newHeight += deltaY
                break
            case 'sw':
                newWidth -= deltaX
                newHeight += deltaY
                break
            case 'ne':
                newWidth += deltaX
                newHeight -= deltaY
                break
            case 'nw':
                newWidth -= deltaX
                newHeight -= deltaY
                break
        }

        const constrained = constrainSize(newWidth, newHeight)
        newWidth = constrained.width
        newHeight = constrained.height

        const deltaW = newWidth - resizeStart.value.width
        const deltaH = newHeight - resizeStart.value.height
        let newX = resizeStart.value.startX
        let newY = resizeStart.value.startY
        switch (resizeStart.value.corner) {
            case 'se':
                newX += deltaW / 2
                newY += deltaH / 2
                break
            case 'sw':
                newX -= deltaW / 2
                newY += deltaH / 2
                break
            case 'ne':
                newX += deltaW / 2
                newY -= deltaH / 2
                break
            case 'nw':
                newX -= deltaW / 2
                newY -= deltaH / 2
                break
        }
        position.value = constrainPosition(newX, newY, newWidth, newHeight)
        size.value = { width: newWidth, height: newHeight }
    }

    function onResizeEnd() {
        const doc = getDocument()
        if (!doc) return
        isResizing.value = false
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
                    size.value = { width: rect.width, height: rect.height }
                }
            })
        }
    }

    function setupSizeObserver(): void {
        resizeObserver?.disconnect()
        resizeObserver = null
        const Ctor = getResizeObserverCtor()
        const el = contentRef.value
        if (!Ctor || !el) return
        resizeObserver = new Ctor((entries) => {
            if (isResizing.value) return
            for (const entry of entries) {
                const borderBox = entry.borderBoxSize?.[0]
                const width = borderBox ? borderBox.inlineSize : entry.contentRect.width
                const height = borderBox ? borderBox.blockSize : entry.contentRect.height
                if (width > 0 && height > 0) {
                    size.value = { width, height }
                }
            }
        })
        resizeObserver.observe(el)
    }

    // ── Watchers & Lifecycle ───────────────────────────────────────

    watch(contentRef, (el) => {
        if (el) setupSizeObserver()
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
        onMounted(() => {
            initPosition()
            initSize()
            setupSizeObserver()
        })

        onBeforeUnmount(() => {
            if (sizeRafId !== null) {
                cancelAnimationFrame(sizeRafId)
            }
            resizeObserver?.disconnect()
            resizeObserver = null
            const doc = getDocument()
            if (!doc) return
            doc.removeEventListener('pointermove', onDragMove)
            doc.removeEventListener('pointerup', onDragEnd)
            doc.removeEventListener('pointercancel', onDragEnd)
            doc.removeEventListener('pointermove', onResizeMove)
            doc.removeEventListener('pointerup', onResizeEnd)
            doc.removeEventListener('pointercancel', onResizeEnd)
        })
    }

    return {
        contentRef,
        isDragging,
        isResizing,
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
