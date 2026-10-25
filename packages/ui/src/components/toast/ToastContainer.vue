<script setup lang="ts">
import { computed, watch } from 'vue'
import { cn } from '@/lib/utils'
import { DEFAULT_TOAST_MAX_VISIBLE, DEFAULT_TOAST_GAP_PX } from '@/lib/defaults'
import type { ToastPosition, ToastStackOptions } from '@/composables/useToast'
import { useLocale } from '@/composables/useLocale'
import { useToast } from '@/composables/useToast'
import Toast from './Toast.vue'

const { t } = useLocale()
const { toasts, removeToast } = useToast()

// 当用户未提供 default slot 时，自动渲染 Toast 列表并连接 @close 事件。
// 这使 <ToastContainer /> 简化用法可用：useToast.addToast 后 toast 自动显示，
// 离场动画由 Toast.vue 内部定时器驱动，动画完成后 emit('close') 触发 removeToast。
// 用户仍可通过 <ToastContainer><Toast v-for @close="removeToast" /></ToastContainer>
// 完全自定义渲染。

const DEFAULT_EXPAND_DIRECTION: ToastStackOptions['expandDirection'] = 'down'

interface ToastContainerProps {
    position?: ToastPosition
    stack?: ToastStackOptions
    class?: string
}

const props = withDefaults(defineProps<ToastContainerProps>(), {
    position: 'bottom-right',
    stack: () => ({
        maxVisible: DEFAULT_TOAST_MAX_VISIBLE,
        gap: DEFAULT_TOAST_GAP_PX,
        expandDirection: DEFAULT_EXPAND_DIRECTION,
    }),
    class: undefined,
})

type PositionKey = NonNullable<Extract<ToastPosition, string>>

const positionMap: Record<PositionKey, string> = {
    'top-left': 'top-2 left-2 md:top-4 md:left-4 items-start',
    'top-center': 'top-2 md:top-4 left-1/2 -translate-x-1/2 items-center',
    'top-right': 'top-2 right-2 md:top-4 md:right-4 items-end',
    'bottom-left': 'bottom-2 left-2 md:bottom-4 md:left-4 items-start',
    'bottom-center': 'bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-right': 'bottom-2 right-2 md:bottom-4 md:right-4 items-end',
}

const positionClasses = computed(() => {
    if (typeof props.position === 'string' && props.position in positionMap) {
        return positionMap[props.position]
    }
    return ''
})

const positionStyle = computed(() => {
    if (props.position && typeof props.position === 'object') {
        const { x, y, anchor = 'top-left' } = props.position
        const style: Record<string, string> = {}
        const validX = Number.isFinite(x) ? `${x}px` : '0px'
        const validY = Number.isFinite(y) ? `${y}px` : '0px'

        switch (anchor) {
            case 'top-left':
                style.left = validX
                style.top = validY
                break
            case 'top-right':
                style.right = validX
                style.top = validY
                break
            case 'bottom-left':
                style.left = validX
                style.bottom = validY
                break
            case 'bottom-right':
                style.right = validX
                style.bottom = validY
                break
        }

        return style
    }
    return {}
})

const gap = computed(() => Math.max(0, props.stack?.gap ?? DEFAULT_TOAST_GAP_PX))
const expandDirection = computed(() => {
    const value = props.stack?.expandDirection ?? 'down'
    return ['up', 'down'].includes(value) ? value : 'down'
})

const layoutClasses = computed(() => typeof props.position === 'object'
    ? 'p-4 max-h-[calc(100dvh-2rem)]'
    : 'p-2 md:p-4 max-h-[calc(100dvh-1rem)] md:max-h-[calc(100dvh-2rem)]')

const classes = computed(() =>
    cn(
        'fixed z-toast flex flex-col pointer-events-none overflow-x-hidden overflow-y-auto',
        layoutClasses.value,
        expandDirection.value === 'up' ? 'flex-col-reverse' : 'flex-col',
        positionClasses.value,
        props.class
    )
)

const gapStyle = computed(() => ({
    gap: `${gap.value}px`,
}))

const maxVisible = computed(() => {
    const configured = props.stack?.maxVisible
    if (typeof configured === 'number' && Number.isFinite(configured)) {
        return Math.max(1, Math.floor(configured))
    }
    return DEFAULT_TOAST_MAX_VISIBLE
})

watch(
    [() => toasts.value.length, maxVisible],
    ([newLength, maxVal]) => {
        if (maxVal > 0 && newLength > maxVal) {
            const overflowCount = newLength - maxVal
            const toRemove = toasts.value.slice(0, overflowCount)
            toRemove.forEach((toast) => {
                removeToast(toast.id)
            })
        }
    },
    { immediate: true }
)
</script>

<template>
    <div :class="classes" :style="{ ...positionStyle, ...gapStyle }" aria-live="polite" :aria-label="t('toast.container')">
        <slot>
            <Toast
                v-for="toast in toasts"
                :key="`${toast.id}:${toast.count}`"
                :variant="toast.variant"
                :size="toast.size"
                :title="toast.title"
                :description="toast.description"
                :duration="toast.duration"
                :count="toast.count"
                @close="removeToast(toast.id)"
            />
        </slot>
    </div>
</template>
