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
import { cn } from '@/lib/utils'
import { brutalHoverLiftSm } from '@/lib/brutal-interaction-variants'
import { sheetVariants } from './sheet-variants'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { overlayVariants, CLOSE_BUTTON_BASE_CLASSES } from '@/lib/modal-variants'
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

const overlayClasses = computed(() => overlayVariants())

const contentClasses = computed(() =>
    cn(sheetVariants({ side: props.side }), props.class)
)

const closeClasses = computed(() =>
    cn(
        CLOSE_BUTTON_BASE_CLASSES,
        'absolute top-4',
        props.side === 'left' ? 'left-4' : 'right-4',
        brutalHoverLiftSm
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
