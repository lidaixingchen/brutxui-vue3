<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { X } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { badgeVariants } from './badge-variants'
import { iconSizeVariants } from '../../lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

type BadgeVariantProps = VariantProps<typeof badgeVariants>

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
        props.size === 'sm' ? 'h-1.5 w-1.5' : props.size === 'lg' ? 'h-2.5 w-2.5' : 'h-2 w-2',
        props.pulse && 'animate-brutal-pulse'
    )
)

const showDot = computed(() => props.dot || props.pulse)

function handleCloseClick(event: MouseEvent) {
    event.stopPropagation()
    emit('close')
}

const closeIconClasses = computed(() =>
    cn(
        iconSizeVariants({ size: props.size === 'lg' ? 'default' : 'sm' }),
        'stroke-[3]'
    )
)
</script>

<template>
    <span :class="classes">
        <span v-if="showDot" :class="dotClasses" aria-hidden="true" />
        <slot name="icon" />
        <slot />
        <button
            v-if="closable"
            type="button"
            class="ml-1 inline-flex items-center justify-center transition-colors hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-brutal-ring focus:ring-offset-2 rounded-brutal"
            :aria-label="t('badge.close')"
            @click="handleCloseClick"
        >
            <X :class="closeIconClasses" />
        </button>
    </span>
</template>
