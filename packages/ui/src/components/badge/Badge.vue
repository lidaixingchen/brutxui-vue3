<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { badgeVariants } from './badge-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

type BadgeVariantProps = VariantProps<typeof badgeVariants>

// 关闭按钮图标尺寸显式映射表（保持现有视觉：sm/default 共用 12px，lg 用 16px）
const closeIconSizeMap: Record<NonNullable<BadgeVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'sm',
    lg: 'md',
}

interface BadgeProps {
    variant?: NonNullable<BadgeVariantProps['variant']>
    size?: NonNullable<BadgeVariantProps['size']>
    closable?: boolean
    dot?: boolean
    pulse?: boolean
    class?: string
}

const props = withDefaults(defineProps<BadgeProps>(), {
    variant: 'default',
    size: 'default',
    closable: false,
    dot: false,
    pulse: false,
    class: undefined,
})

const emit = defineEmits<{ close: [] }>()

const { t } = useLocale()

const classes = computed(() =>
    cn(badgeVariants({ variant: props.variant, size: props.size }), props.class)
)

const dotClasses = computed(() =>
    cn(
        'rounded-full bg-current',
        props.size === 'sm' ? 'h-1.5 w-1.5 mr-1' : props.size === 'lg' ? 'h-2.5 w-2.5 mr-2' : 'h-2 w-2 mr-1.5',
        props.pulse && 'animate-brutal-badge-pulse'
    )
)

const showDot = computed(() => props.dot || props.pulse)

function handleCloseClick(event: MouseEvent) {
    event.stopPropagation()
    emit('close')
}

const closeIconClasses = computed(() =>
    cn(
        iconSizeVariants({ size: closeIconSizeMap[props.size] }),
        'stroke-[3]'
    )
)

const iconClasses = computed(() =>
    cn(
        'inline-flex items-center justify-center',
        props.size === 'sm' ? 'mr-1' : props.size === 'lg' ? 'mr-2' : 'mr-1.5'
    )
)
</script>

<template>
    <span :class="classes">
        <span v-if="showDot" :class="dotClasses" aria-hidden="true" />
        <span v-if="$slots.icon" :class="iconClasses">
            <slot name="icon" />
        </span>
        <slot />
        <!-- 与 lib/utils FOCUS_OUTLINE_CLASSES 保持一致 -->
        <button
            v-if="closable"
            type="button"
            class="ml-1 inline-flex items-center justify-center transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-brutal-ring focus-visible:outline-offset-2 rounded-brutal"
            :aria-label="t('badge.close')"
            @click="handleCloseClick"
        >
            <X :class="closeIconClasses" aria-hidden="true" />
        </button>
    </span>
</template>
