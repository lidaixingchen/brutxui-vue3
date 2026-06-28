<script setup lang="ts">
import { computed } from 'vue'
import {
    DialogPortal as DialogPortalPrimitive,
    DialogOverlay as DialogOverlayPrimitive,
    DialogContent as DialogContentPrimitive,
    DialogClose as DialogClosePrimitive,
} from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { X } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { sheetVariants } from './sheet-variants'
import { iconSizeVariants } from '../../lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

type SheetVariantProps = VariantProps<typeof sheetVariants>

interface SheetContentProps {
    side?: NonNullable<SheetVariantProps['side']>
    class?: string
}

const props = withDefaults(defineProps<SheetContentProps>(), {
    side: 'right',
    class: undefined,
})

const { t } = useLocale()

const overlayClasses = computed(() =>
    cn(
        'fixed inset-0 z-50 bg-brutal-overlay',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
    )
)

const contentClasses = computed(() =>
    cn(sheetVariants({ side: props.side }), props.class)
)

const closeClasses = computed(() =>
    cn(
        'absolute top-4',
        props.side === 'left' ? 'left-4' : 'right-4',
        'h-8 w-8 flex items-center justify-center',
        'border-3 border-brutal bg-brutal-bg text-brutal-fg',
        'shadow-brutal-sm',
        'transition-all duration-150',
        'hover:bg-brutal-destructive hover:text-brutal-fg',
        'hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        'focus:outline-none focus:ring-2 focus:ring-brutal-ring focus:ring-offset-2'
    )
)

const closeIconClasses = cn(iconSizeVariants({ size: 'default' }), 'stroke-[3]')
</script>

<template>
    <DialogPortalPrimitive>
        <DialogOverlayPrimitive :class="overlayClasses" />
        <DialogContentPrimitive :class="contentClasses">
            <slot />
            <DialogClosePrimitive :class="closeClasses">
                <X :class="closeIconClasses" />
                <span class="sr-only">{{ t('sheet.close') }}</span>
            </DialogClosePrimitive>
        </DialogContentPrimitive>
    </DialogPortalPrimitive>
</template>
