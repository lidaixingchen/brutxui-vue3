import { ref, readonly, computed, watch, onMounted, onBeforeUnmount, toValue, type Ref, type ComputedRef, type DeepReadonly, type CSSProperties, type MaybeRefOrGetter } from 'vue'
import { getViewportSize, getDocument, requestAnimationFrame, cancelAnimationFrame, getResizeObserverCtor } from '@/lib/env'
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

export interface UseDialogEnhancedOptions extends DraggableDialogOptions, ResizableDialogOptions {
    beforeClose?: () => boolean | Promise<boolean>
    onOpen?: () => void
    onClose?: () => void
    onUpdateOpen?: (value: boolean) => void
}

export interface UseDialogEnhancedReturn {
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
    options?: MaybeRefOrGetter<UseDialogEnhancedOptions>,
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
    const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, corner: 'se', startX: 0, startY: 0 })
    // 拖拽起点尺寸缓存：onDragStart 读取一次布局，onDragMove 复用，避免每帧 getBoundingClientRect 强制 reflow。
    // null 表示起点无法测量（contentRef 不存在），此时 constrainPosition 回退到实时读取（返回原始坐标）
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

        // 对话框中心锚定（left:50% + translate(calc(-50% + x))），position.x/y 是相对视口中心的偏移，
        // 实际左上角坐标 = viewport/2 + x - width/2，边界约束必须叠加 50% 基准修正，否则内容会被大幅拖出边界
        const width = targetWidth ?? rect.width
        const height = targetHeight ?? rect.height

        // 尺寸超出约束边界（如对话框宽于视口）时下界 > 上界，直接 Math.max/min 会锁死到一侧；
        // 统一用 clampAxis 处理：区间无效时固定到居中位置
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
            // 高度被 min/maxHeight 裁剪后按比例反推宽度，并重新应用 min/maxWidth，
            // 避免宽高比失真（如 aspectRatio=2 且 maxHeight 生效时高度被压上限而宽度不变）
            newWidth = newHeight * opt.aspectRatio
            if (opt.minWidth) newWidth = Math.max(opt.minWidth, newWidth)
            if (opt.maxWidth) newWidth = Math.min(opt.maxWidth, newWidth)
        }
        return { width: newWidth, height: newHeight }
    }

    // ── Programmatic Setters ──────────────────────────────────────

    function setPosition(next: { x: number; y: number }): void {
        // 程序化精确设置：与 initPosition 一致不强制 clamp，
        // bounds 约束仅作用于拖拽交互路径（onDragMove）；拒绝 NaN/Infinity 污染内部状态
        if (!Number.isFinite(next.x) || !Number.isFinite(next.y)) return
        position.value = { x: next.x, y: next.y }
    }

    function setSize(next: { width: number; height: number }): void {
        // 程序化精确设置：与 initSize 一致不强制 clamp（如 0 尺寸表示隐藏），
        // min/max/aspectRatio 约束仅作用于缩放交互路径（onResizeMove）；拒绝 NaN/Infinity
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

        // dragHandle 选择器未命中（返回 null）时安全降级为禁止拖动，而不是静默放开整个对话框；
        // 与「未指定 dragHandle → 全区域可拖」的默认行为区分开
        const handle = getDragHandle()
        if (!handle || !handle.contains(target)) return

        isDragging.value = true
        dragStart.value = {
            x: e.clientX - position.value.x,
            y: e.clientY - position.value.y,
        }
        // 缓存起点尺寸供 onDragMove 约束计算，避免每帧读取布局（拖动期间宽高不变，仅 transform 变化）
        const rect = contentRef.value?.getBoundingClientRect()
        dragStartSize = rect ? { width: rect.width, height: rect.height } : null

        // 使用 pointer 事件以兼容触屏/触控笔/鼠标；PointerEvent 是 MouseEvent 子类，参数类型不变
        doc.addEventListener('pointermove', onDragMove)
        doc.addEventListener('pointerup', onDragEnd)
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
            // 记录起始位置，供 resize 补偿以起始点为基准计算，避免每帧叠加已计入的偏移
            startX: position.value.x,
            startY: position.value.y,
        }

        doc.addEventListener('pointermove', onResizeMove)
        doc.addEventListener('pointerup', onResizeEnd)
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

        // 对话框中心锚定，仅改尺寸会围绕中心对称缩放（拖 'sw' 角时右侧对边会移动）。
        // 按最终 clamp 后的尺寸差 deltaW/2、deltaH/2 补偿各角对应的位置，使被拖拽边缘跟随光标、对边保持不动
        const deltaW = newWidth - resizeStart.value.width
        const deltaH = newHeight - resizeStart.value.height
        // 以 resize 起始位置为基准计算补偿，避免每帧基于已补偿位置叠加造成对边二次漂移
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
    }

    // ── Close Handling ─────────────────────────────────────────────

    function performClose(): void {
        opt.onClose?.()
        opt.onUpdateOpen?.(false)
    }

    // 并发锁：防止用户快速触发关闭（如双击关闭按钮）导致 beforeClose 并发执行
    // 产生重复 API 调用或状态紊乱
    let isClosing = false

    async function handleClose(): Promise<void> {
        if (isClosing) return
        if (!opt.beforeClose) {
            performClose()
            return
        }

        isClosing = true
        try {
            const result = await opt.beforeClose()
            if (result !== false) {
                performClose()
            }
        } catch (error) {
            // beforeClose 抛出/拒绝时记录错误并给出控制台反馈，避免 unhandled promise rejection
            console.error('[useDialogEnhanced] beforeClose 执行失败:', error)
        } finally {
            isClosing = false
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
    let resizeObserver: ResizeObserver | null = null

    function initSize(): void {
        // 取消前一个未触发的 rAF，避免 contentRef 变化时多个 rAF 堆积
        // 导致过期回调读取到错误的 bounding rect
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

    // 挂载时 contentRef 可能处于隐藏/零尺寸（display:none、异步内容未就绪），rAF 一次性测量会得到 0
    // 且之后不再重测。ResizeObserver 持续观察内容尺寸，可见后自动恢复实际尺寸。
    function setupSizeObserver(): void {
        resizeObserver?.disconnect()
        resizeObserver = null
        const Ctor = getResizeObserverCtor()
        const el = contentRef.value
        if (!Ctor || !el) return
        resizeObserver = new Ctor((entries) => {
            // 缩放交互期间由 onResizeMove 直接写 size，observer 仅作兜底恢复测量，避免相互覆盖
            if (isResizing.value) return
            for (const entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    size.value = { width: entry.contentRect.width, height: entry.contentRect.height }
                }
            }
        })
        resizeObserver.observe(el)
    }

    // ── Watchers & Lifecycle ───────────────────────────────────────

    // Watch x/y values (not the object reference) so that re-renders with an
    // inline object prop of the same values don't clobber the user's drag offset.
    watch(
        [() => opt.initialPosition?.x, () => opt.initialPosition?.y],
        () => {
            if (opt.initialPosition) {
                position.value = { ...opt.initialPosition }
            }
        }
    )

    onMounted(() => {
        initPosition()
        initSize()
        setupSizeObserver()
        opt.onOpen?.()
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
        doc.removeEventListener('pointermove', onResizeMove)
        doc.removeEventListener('pointerup', onResizeEnd)
    })

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
        handleClose,
        initPosition,
        initSize,
    }
}
