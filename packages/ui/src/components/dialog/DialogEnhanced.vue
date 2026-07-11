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

    if (props.fullscreen) {
        // Position/size in fullscreen comes from Tailwind classes (w-screen h-screen inset-0);
        // only strip the composable's fixed-center transform so the dialog snaps to edges.
        style.position = 'fixed'
        style.inset = '0'
        style.margin = '0'
    } else {
        Object.assign(style, composableContentStyle.value)
    }

    if (props.zIndex) {
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

const isSlotPresent = ref(!props.destroyOnClose || !!dialogContext?.open.value)
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
            isSlotPresent.value = !props.destroyOnClose
            return
        }
        if (open) {
            clearDestroySlotTimer()
            isSlotPresent.value = true
        } else if (props.destroyOnClose) {
            if (prevOpen === true) {
                clearDestroySlotTimer()
                destroySlotTimer = setTimeout(() => {
                    isSlotPresent.value = false
                    destroySlotTimer = null
                }, DEFAULT_DIALOG_TRANSITION_MS)
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
        <DialogOverlay />
        <DialogContentPrimitive
            ref="contentRef"
            :class="contentClasses"
            :style="contentStyle"
            :force-mount="props.forceMount === true ? true : undefined"
            @mousedown="onDragStart"
            @escape-key-down="handleEscapeKeyDown"
            @pointer-down-outside="handlePointerDownOutside"
        >
            <slot v-if="!destroyOnClose || isSlotPresent" />
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
                    @mousedown="(e: MouseEvent) => onResizeStart(e, 'se' as ResizeCorner)"
                />
                <div
                    class="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
                    @mousedown="(e: MouseEvent) => onResizeStart(e, 'sw' as ResizeCorner)"
                />
                <div
                    class="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
                    @mousedown="(e: MouseEvent) => onResizeStart(e, 'ne' as ResizeCorner)"
                />
                <div
                    class="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
                    @mousedown="(e: MouseEvent) => onResizeStart(e, 'nw' as ResizeCorner)"
                />
            </template>
        </DialogContentPrimitive>
    </DialogPortalPrimitive>
</template>
