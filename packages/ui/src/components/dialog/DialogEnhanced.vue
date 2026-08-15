<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import {
    DialogPortal as DialogPortalPrimitive,
    DialogContent as DialogContentPrimitive,
    DialogClose as DialogClosePrimitive,
    injectDialogRootContext,
} from 'reka-ui'
import { X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { DIALOG_MIN_WIDTH_PX, DIALOG_MIN_HEIGHT_PX, DEFAULT_DIALOG_TRANSITION_MS } from '@/lib/defaults'
import DialogOverlay from './DialogOverlay.vue'
import { dialogContentVariants, dialogCloseVariants } from './dialog-variants'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import { useDialogEnhanced, type ResizeCorner } from '@/composables/useDialogEnhanced'

interface DialogEnhancedProps {
    draggable?: boolean
    dragHandle?: string | HTMLElement
    bounds?: 'parent' | 'viewport' | { top: number; left: number; right: number; bottom: number }
    initialPosition?: { x: number; y: number }
    resizable?: boolean
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    aspectRatio?: number
    showCloseButton?: boolean
    forceMount?: boolean
    /** 真正全屏模式 */
    fullscreen?: boolean
    /** 关闭前钩子 */
    beforeClose?: () => boolean | Promise<boolean>
    /** 关闭后销毁内容 */
    destroyOnClose?: boolean
    /** 关闭后延迟销毁内容的时长（默认与关闭过渡时长一致） */
    destroyDelay?: number
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
    destroyDelay: DEFAULT_DIALOG_TRANSITION_MS,
    zIndex: undefined,
    class: undefined,
})

const emit = defineEmits<{
    'update:open': [value: boolean]
    open: []
    close: []
}>()

const { t } = useLocale()

const dialogContext = injectDialogRootContext(null)

const {
    contentRef,
    contentStyle: composableContentStyle,
    onDragStart,
    onResizeStart,
    handleClose,
} = useDialogEnhanced(() => ({
    draggable: props.draggable,
    dragHandle: props.dragHandle,
    bounds: props.bounds,
    initialPosition: props.initialPosition,
    resizable: props.resizable,
    minWidth: props.minWidth,
    minHeight: props.minHeight,
    maxWidth: props.maxWidth,
    maxHeight: props.maxHeight,
    aspectRatio: props.aspectRatio,
    beforeClose: props.beforeClose,
    onOpen: () => emit('open'),
    onClose: () => emit('close'),
    onUpdateOpen: (value) => emit('update:open', value),
}))

void contentRef

const contentClasses = computed(() =>
    cn(
        dialogContentVariants(),
        props.draggable && !props.fullscreen && 'cursor-move',
        // 触屏上若不加 touch-action: none，手指按下拖动会被浏览器判定为滚动手势，
        // 触发 pointercancel 打断 pointer 事件流（拖拽/缩放均依赖 pointer 事件）
        (props.draggable || props.resizable) && 'touch-none',
        props.resizable && 'overflow-hidden',
        props.fullscreen && 'w-screen h-screen max-w-none max-h-none rounded-none inset-0',
        props.class
    )
)

const closeClasses = cn(dialogCloseVariants())

const closeIconClasses = cn(iconSizeVariants({ size: 'md' }), 'stroke-[3]')

const contentStyle = computed(() => {
    const style: Record<string, string> = {}

    if (props.fullscreen) {
        // Position/size in fullscreen comes from Tailwind classes (w-screen h-screen inset-0);
        // only strip the composable's fixed-center transform so the dialog snaps to edges.
        style.position = 'fixed'
        style.inset = '0'
        style.margin = '0'
    } else {
        Object.assign(style, composableContentStyle.value)
    }

    if (props.zIndex !== undefined) {
        style.zIndex = String(props.zIndex)
    }

    return style
})

function handleEscapeKeyDown(event: KeyboardEvent) {
    event.preventDefault()
    handleClose()
}

function handlePointerDownOutside(event: Event) {
    event.preventDefault()
    handleClose()
}

// forceMount 优先于 destroyOnClose：forceMount 旨在保持内容挂载（如保留输入状态），
// destroyOnClose 的销毁语义与其冲突，二者同时启用时忽略 destroyOnClose
const isSlotPresent = ref(
    !props.destroyOnClose || props.forceMount || !!dialogContext?.open.value
)
let destroySlotTimer: ReturnType<typeof setTimeout> | null = null

function clearDestroySlotTimer() {
    if (destroySlotTimer) {
        clearTimeout(destroySlotTimer)
        destroySlotTimer = null
    }
}

watch(
    () => dialogContext?.open.value,
    (open, prevOpen) => {
        if (!dialogContext) {
            // 无 DialogRoot 上下文（如测试挂载路径）时与初始值保持同一优先级规则
            isSlotPresent.value = !props.destroyOnClose || props.forceMount === true
            return
        }
        if (open) {
            clearDestroySlotTimer()
            isSlotPresent.value = true
        } else if (props.destroyOnClose && !props.forceMount) {
            if (prevOpen === true) {
                clearDestroySlotTimer()
                destroySlotTimer = setTimeout(() => {
                    isSlotPresent.value = false
                    destroySlotTimer = null
                }, props.destroyDelay)
            } else {
                isSlotPresent.value = false
            }
        } else {
            isSlotPresent.value = true
        }
    },
    { immediate: true }
)

onBeforeUnmount(() => {
    clearDestroySlotTimer()
})
</script>

<template>
    <DialogPortalPrimitive>
        <DialogOverlay :force-mount="props.forceMount" />
        <DialogContentPrimitive
            ref="contentRef"
            :class="contentClasses"
            :style="contentStyle"
            :force-mount="props.forceMount"
            @pointerdown="onDragStart"
            @escape-key-down="handleEscapeKeyDown"
            @pointer-down-outside="handlePointerDownOutside"
        >
            <slot v-if="!destroyOnClose || isSlotPresent" />
            <DialogClosePrimitive
                v-if="showCloseButton"
                :class="closeClasses"
                @click.prevent="handleClose"
            >
                <X :class="closeIconClasses" aria-hidden="true" />
                <span class="sr-only">{{ t('dialog.close') }}</span>
            </DialogClosePrimitive>

            <!-- Resize Handles（全屏模式下缩放无效，隐藏手柄） -->
            <template v-if="resizable && !fullscreen">
                <div
                    class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    @pointerdown="(e: PointerEvent) => onResizeStart(e, 'se' as ResizeCorner)"
                />
                <div
                    class="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
                    @pointerdown="(e: PointerEvent) => onResizeStart(e, 'sw' as ResizeCorner)"
                />
                <div
                    class="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
                    @pointerdown="(e: PointerEvent) => onResizeStart(e, 'ne' as ResizeCorner)"
                />
                <div
                    class="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
                    @pointerdown="(e: PointerEvent) => onResizeStart(e, 'nw' as ResizeCorner)"
                />
            </template>
        </DialogContentPrimitive>
    </DialogPortalPrimitive>
</template>
