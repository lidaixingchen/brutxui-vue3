<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { X } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { alertVariants } from './alert-variants'
import { iconSizeVariants } from '../../lib/icon-size-variants'
import Button from '../button/Button.vue'
import { useLocale } from '@/composables/useLocale'

type AlertVariantProps = VariantProps<typeof alertVariants>

interface AlertProps {
    variant?: NonNullable<AlertVariantProps['variant']>
    closable?: boolean
    class?: string
}

const props = withDefaults(defineProps<AlertProps>(), {
    variant: 'default',
    closable: false,
    class: undefined,
})

const emit = defineEmits<{ close: [] }>()

const { t } = useLocale()

const classes = computed(() =>
    cn(
        alertVariants({ variant: props.variant }),
        props.closable && 'pr-12',
        props.class
    )
)

const closeIconClasses = computed(() =>
    cn(iconSizeVariants({ size: 'default' }), 'stroke-[3]')
)
</script>

<template>
    <div role="alert" :class="classes">
        <slot />
        <div v-if="$slots.actions" class="mt-3 flex items-center gap-2">
            <slot name="actions" />
        </div>
        <Button
            v-if="closable"
            variant="ghost"
            size="icon"
            class="absolute right-3 top-3 h-8 w-8"
            :aria-label="t('alert.close')"
            @click="emit('close')"
        >
            <X :class="closeIconClasses" />
        </Button>
    </div>
</template>
