<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import type { ToastPosition, ToastStackOptions } from '../../composables/useToast'
import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()

interface ToastContainerProps {
    position?: ToastPosition
    stack?: ToastStackOptions
    class?: string
}

const props = withDefaults(defineProps<ToastContainerProps>(), {
    position: 'bottom-right',
    stack: () => ({
        maxVisible: 5,
        gap: 12,
        expandDirection: 'down',
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
    if (typeof props.position === 'string') {
        return positionMap[props.position as PositionKey] || ''
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

const gap = computed(() => Math.max(0, props.stack?.gap ?? 12))
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
</script>

<template>
    <div :class="classes" :style="{ ...positionStyle, ...gapStyle }" aria-live="polite" :aria-label="t('toast.container')">
        <slot />
    </div>
</template>
