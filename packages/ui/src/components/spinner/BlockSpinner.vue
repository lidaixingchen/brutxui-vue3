<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { blockSpinnerVariants, getSpinnerColorClasses } from './spinner-variants'

type BlockSpinnerSize = NonNullable<VariantProps<typeof blockSpinnerVariants>['size']>

interface BlockSpinnerProps {
    size?: BlockSpinnerSize
    color?: 'default' | 'primary' | 'secondary' | 'accent' | 'mixed'
    label?: string
    class?: string
}

const props = withDefaults(defineProps<BlockSpinnerProps>(), {
    size: 'default',
    color: 'default',
    label: undefined,
    class: undefined,
})

const { t } = useLocale()

const resolvedLabel = computed(() => props.label ?? t('spinner.loading'))

const BLOCK_ANIMATION_DELAY_INCREMENT_MS = 150
const BLOCK_ANIMATION_DURATION_MS = 600
const BLOCK_COUNT = 4

const classes = computed(() =>
    cn(blockSpinnerVariants({ size: props.size }), props.class)
)

const blockClasses = computed(() =>
    getSpinnerColorClasses(props.color, BLOCK_COUNT).map(blockColor =>
        cn('border-3 border-brutal', blockColor, 'animate-pulse')
    )
)
</script>

<template>
    <div :class="classes" role="status" :aria-label="resolvedLabel">
        <div
            v-for="(blockClass, i) in blockClasses"
            :key="i"
            :class="blockClass"
            :style="{ animationDelay: `${i * BLOCK_ANIMATION_DELAY_INCREMENT_MS}ms`, animationDuration: `${BLOCK_ANIMATION_DURATION_MS}ms` }"
        />
        <span class="sr-only">{{ resolvedLabel }}</span>
    </div>
</template>
