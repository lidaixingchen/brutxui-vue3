<script setup lang="ts">
import { computed, watch } from 'vue'
import { cn } from '@/lib/utils'
import { DEFAULT_TOAST_MAX_VISIBLE, DEFAULT_TOAST_GAP_PX } from '@/lib/defaults'
import type { ToastPosition, ToastStackOptions } from '@/composables/useToast'
import { useLocale } from '@/composables/useLocale'
import { useToast } from '@/composables/useToast'

const { t } = useLocale()
const { toasts, removeToast } = useToast()

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
    'top-left': 'top-4 left-4 items-start',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'top-right': 'top-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-right': 'bottom-4 right-4 items-end',
}

const positionClasses = computed(() => {
    if (typeof props.position === 'string' && props.position in positionMap) {
        return positionMap[props.position]
    }
    return ''
})

const positionStyle = computed(() => {
    if (typeof props.position === 'object') {
        const { x, y, anchor = 'top-left' } = props.position
        const style: Record<string, string> = {}

        switch (anchor) {
            case 'top-left':
                style.left = `${x}px`
                style.top = `${y}px`
                break
            case 'top-right':
                style.right = `${x}px`
                style.top = `${y}px`
                break
            case 'bottom-left':
                style.left = `${x}px`
                style.bottom = `${y}px`
                break
            case 'bottom-right':
                style.right = `${x}px`
                style.bottom = `${y}px`
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

const classes = computed(() =>
    cn(
        'fixed z-50 flex flex-col pointer-events-none p-4',
        expandDirection.value === 'up' ? 'flex-col-reverse' : 'flex-col',
        positionClasses.value,
        props.class
    )
)

const gapStyle = computed(() => ({
    gap: `${gap.value}px`,
}))

const maxVisible = computed(() => {
    return Math.max(1, props.stack?.maxVisible ?? DEFAULT_TOAST_MAX_VISIBLE)
})

watch(
    [() => toasts.value.length, maxVisible],
    ([newLength, maxVal]) => {
        if (newLength > maxVal) {
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
        <slot />
    </div>
</template>
