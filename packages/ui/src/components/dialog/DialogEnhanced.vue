<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { hasDocument } from '@/lib/env'
import {
    DialogPortal as DialogPortalPrimitive,
    DialogContent as DialogContentPrimitive,
    DialogClose as DialogClosePrimitive,
    injectDialogRootContext,
} from 'reka-ui'
import { X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { DIALOG_MIN_WIDTH_PX, DIALOG_MIN_HEIGHT_PX } from '@/lib/defaults'
import DialogOverlay from './DialogOverlay.vue'
import { dialogContentVariants, dialogCloseVariants } from './dialog-variants'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

interface DraggableDialogProps {
    draggable?: boolean
    dragHandle?: string | HTMLElement
    bounds?: 'parent' | 'viewport' | { top: number; left: number; right: number; bottom: number }
    initialPosition?: { x: number; y: number }
}

interface ResizableDialogProps {
    resizable?: boolean
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    aspectRatio?: number
}

interface DialogEnhancedProps extends DraggableDialogProps, ResizableDialogProps {
    showCloseButton?: boolean
    forceMount?: boolean
    /** 真正全屏模式 */
    fullscreen?: boolean
    /** 关闭前钩子（支持回调模式和 Promise 模式） */
    beforeClose?: ((done: () => void) => void) | (() => boolean | Promise<boolean>)
    /** 关闭后销毁内容 */
    destroyOnClose?: boolean
    /** 自定义层级 */
    zIndex?: number
    class?: string
}

const props = withDefaults(defineProps<DialogEnhancedProps>(), {
    draggable: false,
    dragHandle: undefined,
    bounds: 'viewport',
    initialPosition: undefined,
    resizable: false,
    minWidth: DIALOG_MIN_WIDTH_PX,
    minHeight: DIALOG_MIN_HEIGHT_PX,
    maxWidth: undefined,
    maxHeight: undefined,
    aspectRatio: undefined,
    showCloseButton: true,
    forceMount: undefined,
    fullscreen: false,
    beforeClose: undefined,
    destroyOnClose: false,
    zIndex: undefined,
    class: undefined,
})

const emit = defineEmits<{
    'update:open': [value: boolean]
    open: []
    opened: []
    close: []
    closed: []
}>()

const { t } = useLocale()

const contentRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const position = ref({ x: 0, y: 0 })
const size = ref({ width: 0, height: 0 })
const dragStart = ref({ x: 0, y: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, corner: 'se' })

const dialogContext = injectDialogRootContext(null)

const contentClasses = computed(() =>
    cn(
        dialogContentVariants(),
        props.draggable && 'cursor-move',
        props.resizable && 'overflow-hidden',
        props.fullscreen && 'w-screen h-screen max-w-none max-h-none rounded-none inset-0',
        props.class
    )
)

const closeClasses = computed(() =>
    cn(dialogCloseVariants())
)

const closeIconClasses = cn(iconSizeVariants({ size: 'default' }), 'stroke-[3]')

const contentStyle = computed(() => {
    const style: Record<string, string> = {}

    if (props.draggable && !props.fullscreen) {
        style.transform = `translate(calc(-50% + ${position.value.x}px), calc(-50% + ${position.value.y}px))`
        style.position = 'fixed'
        style.top = '50%'
        style.left = '50%'
        style.margin = '0'
    }

    if (props.resizable && size.value.width > 0 && size.value.height > 0 && !props.fullscreen) {
        style.width = `${size.value.width}px`
        style.height = `${size.value.height}px`
    }

    if (props.zIndex) {
        style.zIndex = String(props.zIndex)
    }

    return style
})

function getDragHandle(): HTMLElement | null {
    if (!props.draggable) return null
    if (typeof props.dragHandle === 'string') {
        return contentRef.value?.querySelector(props.dragHandle) ?? null
    }
    if (props.dragHandle instanceof HTMLElement) {
        return props.dragHandle
    }
    return contentRef.value
}

function isInteractiveElement(target: HTMLElement): boolean {
    const interactiveTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']
    return interactiveTags.includes(target.tagName) || target.isContentEditable
}

function constrainPosition(newX: number, newY: number): { x: number; y: number } {
    const rect = contentRef.value?.getBoundingClientRect()
    if (!rect) return { x: newX, y: newY }

    if (props.bounds === 'viewport') {
        return {
            x: Math.max(-rect.width / 2, Math.min(newX, window.innerWidth - rect.width / 2)),
            y: Math.max(-rect.height / 2, Math.min(newY, window.innerHeight - rect.height / 2)),
        }
    } else if (props.bounds === 'parent') {
        const parentRect = contentRef.value?.parentElement?.getBoundingClientRect()
        if (parentRect) {
            return {
                x: Math.max(parentRect.left - rect.width / 2, Math.min(newX, parentRect.right - rect.width / 2)),
                y: Math.max(parentRect.top - rect.height / 2, Math.min(newY, parentRect.bottom - rect.height / 2)),
            }
        }
    } else if (typeof props.bounds === 'object') {
        return {
            x: Math.max(props.bounds.left - rect.width / 2, Math.min(newX, props.bounds.right - rect.width / 2)),
            y: Math.max(props.bounds.top - rect.height / 2, Math.min(newY, props.bounds.bottom - rect.height / 2)),
        }
    }

    return { x: newX, y: newY }
}

function onDragStart(e: MouseEvent) {
    if (!hasDocument) return
    if (!props.draggable) return

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

function onResizeStart(e: MouseEvent, corner: string) {
    if (!hasDocument) return
    if (!props.resizable) return

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

    if (props.minWidth) newWidth = Math.max(props.minWidth, newWidth)
    if (props.minHeight) newHeight = Math.max(props.minHeight, newHeight)
    if (props.maxWidth) newWidth = Math.min(props.maxWidth, newWidth)
    if (props.maxHeight) newHeight = Math.min(props.maxHeight, newHeight)

    if (props.aspectRatio) {
        newHeight = newWidth / props.aspectRatio
        if (props.minHeight) newHeight = Math.max(props.minHeight, newHeight)
        if (props.maxHeight) newHeight = Math.min(props.maxHeight, newHeight)
    }

    size.value = { width: newWidth, height: newHeight }
}

function onResizeEnd() {
    if (!hasDocument) return
    isResizing.value = false
    document.removeEventListener('mousemove', onResizeMove)
    document.removeEventListener('mouseup', onResizeEnd)
}

function initPosition() {
    if (props.initialPosition) {
        position.value = { ...props.initialPosition }
    } else {
        position.value = { x: 0, y: 0 }
    }
}

function initSize() {
    if (contentRef.value) {
        requestAnimationFrame(() => {
            const rect = contentRef.value?.getBoundingClientRect()
            if (rect && rect.width > 0 && rect.height > 0) {
                size.value = { width: rect.width, height: rect.height }
            }
        })
    }
}

watch(() => props.initialPosition, (newPos) => {
    if (newPos) {
        position.value = { ...newPos }
    }
})

// 处理关闭
async function handleClose() {
    if (!props.beforeClose) {
        performClose()
        return
    }

    // 检测模式：回调模式（参数长度 > 0）或 Promise 模式
    if (props.beforeClose.length > 0) {
        // 回调模式
        (props.beforeClose as (done: () => void) => void)(() => {
            performClose()
        })
    } else {
        // Promise 模式
        const result = await (props.beforeClose as () => boolean | Promise<boolean>)()
        if (result !== false) {
            performClose()
        }
    }
}

function performClose() {
    emit('close')
    emit('update:open', false)
}

onMounted(() => {
    initPosition()
    initSize()
    emit('open')
})

onBeforeUnmount(() => {
    if (!hasDocument) return
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    document.removeEventListener('mousemove', onResizeMove)
    document.removeEventListener('mouseup', onResizeEnd)
})
</script>

<template>
    <DialogPortalPrimitive>
        <DialogOverlay />
        <DialogContentPrimitive
            ref="contentRef"
            :class="contentClasses"
            :style="contentStyle"
            :force-mount="props.forceMount === true ? true : undefined"
            @mousedown="onDragStart"
        >
            <slot v-if="!destroyOnClose || dialogContext?.open.value" />
            <DialogClosePrimitive
                v-if="showCloseButton"
                :class="closeClasses"
                @click.prevent="handleClose"
            >
                <X :class="closeIconClasses" />
                <span class="sr-only">{{ t('dialog.close') }}</span>
            </DialogClosePrimitive>

            <!-- Resize Handles -->
            <template v-if="resizable">
                <div
                    class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    @mousedown="(e: MouseEvent) => onResizeStart(e, 'se')"
                />
                <div
                    class="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
                    @mousedown="(e: MouseEvent) => onResizeStart(e, 'sw')"
                />
                <div
                    class="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
                    @mousedown="(e: MouseEvent) => onResizeStart(e, 'ne')"
                />
                <div
                    class="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
                    @mousedown="(e: MouseEvent) => onResizeStart(e, 'nw')"
                />
            </template>
        </DialogContentPrimitive>
    </DialogPortalPrimitive>
</template>
