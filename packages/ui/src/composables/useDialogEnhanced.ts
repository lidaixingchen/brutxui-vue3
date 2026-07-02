import { ref, computed, watch, onMounted, onBeforeUnmount, toValue, type Ref, type ComputedRef, type CSSProperties, type MaybeRefOrGetter } from 'vue'
import { hasDocument } from '@/lib/env'
import { DIALOG_MIN_WIDTH_PX, DIALOG_MIN_HEIGHT_PX } from '@/lib/defaults'
import type { ResizeCorner } from '@/types'

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

export interface UseDialogEnhancedOptions extends DraggableDialogOptions, ResizableDialogOptions {
    beforeClose?: ((done: () => void) => void) | (() => boolean | Promise<boolean>)
    onOpen?: () => void
    onClose?: () => void
    onUpdateOpen?: (value: boolean) => void
}

export interface UseDialogEnhancedReturn {
    contentRef: Ref<HTMLElement | null>
    isDragging: Ref<boolean>
    isResizing: Ref<boolean>
    position: Ref<{ x: number; y: number }>
    size: Ref<{ width: number; height: number }>
    contentStyle: Ref<CSSProperties>
    onDragStart: (e: MouseEvent) => void
    onResizeStart: (e: MouseEvent, corner: ResizeCorner) => void
    handleClose: () => Promise<void>
    initPosition: () => void
    initSize: () => void
}

/** Interactive HTML tags that should not trigger drag */
const INTERACTIVE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']

export function isInteractiveElement(target: HTMLElement): boolean {
    return INTERACTIVE_TAGS.includes(target.tagName) || target.isContentEditable
}

export function useDialogEnhanced(
    options: MaybeRefOrGetter<UseDialogEnhancedOptions>,
): UseDialogEnhancedReturn {
    // Reactive source: accepts either a plain object (static options) or a
    // getter function (reactive options that re-evaluate when tracked deps
    // change — typically `() => ({ draggable: props.draggable, ... })`).
    const optionsRef: ComputedRef<UseDialogEnhancedOptions> = computed(() => toValue(options) ?? {})

    // Getter proxy: every access reads the latest options object, so
    // closures (event handlers, watchers) always see up-to-date values.
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
        get beforeClose() { return optionsRef.value.beforeClose },
        get onOpen() { return optionsRef.value.onOpen },
        get onClose() { return optionsRef.value.onClose },
        get onUpdateOpen() { return optionsRef.value.onUpdateOpen },
    }

    const contentRef = ref<HTMLElement | null>(null)
    const isDragging = ref(false)
    const isResizing = ref(false)
    const position = ref({ x: 0, y: 0 })
    const size = ref({ width: 0, height: 0 })
    const dragStart = ref({ x: 0, y: 0 })
    const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, corner: 'se' })

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

    function constrainPosition(newX: number, newY: number): { x: number; y: number } {
        const rect = contentRef.value?.getBoundingClientRect()
        if (!rect) return { x: newX, y: newY }

        if (opt.bounds === 'viewport') {
            return {
                x: Math.max(-rect.width / 2, Math.min(newX, window.innerWidth - rect.width / 2)),
                y: Math.max(-rect.height / 2, Math.min(newY, window.innerHeight - rect.height / 2)),
            }
        } else if (opt.bounds === 'parent') {
            const parentRect = contentRef.value?.parentElement?.getBoundingClientRect()
            if (parentRect) {
                return {
                    x: Math.max(parentRect.left - rect.width / 2, Math.min(newX, parentRect.right - rect.width / 2)),
                    y: Math.max(parentRect.top - rect.height / 2, Math.min(newY, parentRect.bottom - rect.height / 2)),
                }
            }
        } else if (typeof opt.bounds === 'object') {
            return {
                x: Math.max(opt.bounds.left - rect.width / 2, Math.min(newX, opt.bounds.right - rect.width / 2)),
                y: Math.max(opt.bounds.top - rect.height / 2, Math.min(newY, opt.bounds.bottom - rect.height / 2)),
            }
        }

        return { x: newX, y: newY }
    }

    // ── Drag Handlers ──────────────────────────────────────────────

    function onDragStart(e: MouseEvent) {
        if (!hasDocument) return
        if (!opt.draggable) return

        const target = e.target
        if (!(target instanceof HTMLElement) || isInteractiveElement(target)) return

        const handle = getDragHandle()
        if (handle && !handle.contains(target)) return

        isDragging.value = true
        dragStart.value = {
            x: e.clientX - position.value.x,
            y: e.clientY - position.value.y,
        }

        document.addEventListener('mousemove', onDragMove)
        document.addEventListener('mouseup', onDragEnd)
        e.preventDefault()
    }

    function onDragMove(e: MouseEvent) {
        if (!isDragging.value) return

        const newX = e.clientX - dragStart.value.x
        const newY = e.clientY - dragStart.value.y
        const constrained = constrainPosition(newX, newY)
        position.value = constrained
    }

    function onDragEnd() {
        if (!hasDocument) return
        isDragging.value = false
        document.removeEventListener('mousemove', onDragMove)
        document.removeEventListener('mouseup', onDragEnd)
    }

    // ── Resize Handlers ────────────────────────────────────────────

    function onResizeStart(e: MouseEvent, corner: ResizeCorner) {
        if (!hasDocument) return
        if (!opt.resizable) return

        isResizing.value = true
        resizeStart.value = {
            x: e.clientX,
            y: e.clientY,
            width: size.value.width,
            height: size.value.height,
            corner,
        }

        document.addEventListener('mousemove', onResizeMove)
        document.addEventListener('mouseup', onResizeEnd)
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

        if (opt.minWidth) newWidth = Math.max(opt.minWidth, newWidth)
        if (opt.minHeight) newHeight = Math.max(opt.minHeight, newHeight)
        if (opt.maxWidth) newWidth = Math.min(opt.maxWidth, newWidth)
        if (opt.maxHeight) newHeight = Math.min(opt.maxHeight, newHeight)

        if (opt.aspectRatio) {
            newHeight = newWidth / opt.aspectRatio
            if (opt.minHeight) newHeight = Math.max(opt.minHeight, newHeight)
            if (opt.maxHeight) newHeight = Math.min(opt.maxHeight, newHeight)
        }

        size.value = { width: newWidth, height: newHeight }
    }

    function onResizeEnd() {
        if (!hasDocument) return
        isResizing.value = false
        document.removeEventListener('mousemove', onResizeMove)
        document.removeEventListener('mouseup', onResizeEnd)
    }

    // ── Close Handling ─────────────────────────────────────────────

    function performClose(): void {
        opt.onClose?.()
        opt.onUpdateOpen?.(false)
    }

    async function handleClose(): Promise<void> {
        if (!opt.beforeClose) {
            performClose()
            return
        }

        // Detect mode: callback mode (parameter length > 0) or Promise mode
        if (opt.beforeClose.length > 0) {
            // Callback mode
            (opt.beforeClose as (done: () => void) => void)(() => {
                performClose()
            })
        } else {
            // Promise mode
            const result = await (opt.beforeClose as () => boolean | Promise<boolean>)()
            if (result !== false) {
                performClose()
            }
        }
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

    function initSize(): void {
        if (contentRef.value) {
            sizeRafId = requestAnimationFrame(() => {
                const rect = contentRef.value?.getBoundingClientRect()
                if (rect && rect.width > 0 && rect.height > 0) {
                    size.value = { width: rect.width, height: rect.height }
                }
            })
        }
    }

    // ── Watchers & Lifecycle ───────────────────────────────────────

    // Reactive watcher: fires whenever optionsRef yields a new initialPosition
    // (works when the caller passes a getter that reads reactive props).
    watch(() => opt.initialPosition, (newPos) => {
        if (newPos) {
            position.value = { ...newPos }
        }
    })

    onMounted(() => {
        initPosition()
        initSize()
        opt.onOpen?.()
    })

    onBeforeUnmount(() => {
        if (sizeRafId !== null) {
            cancelAnimationFrame(sizeRafId)
        }
        if (!hasDocument) return
        document.removeEventListener('mousemove', onDragMove)
        document.removeEventListener('mouseup', onDragEnd)
        document.removeEventListener('mousemove', onResizeMove)
        document.removeEventListener('mouseup', onResizeEnd)
    })

    return {
        contentRef,
        isDragging,
        isResizing,
        position,
        size,
        contentStyle,
        onDragStart,
        onResizeStart,
        handleClose,
        initPosition,
        initSize,
    }
}
