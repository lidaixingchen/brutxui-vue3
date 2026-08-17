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
import { sheetVariants } from './sheet-variants'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { modalCloseButtonVariants, overlayVariants } from '@/lib/modal-variants'
import { useLocale } from '@/composables/useLocale'

defineOptions({
    inheritAttrs: false,
})

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

const CLOSE_BUTTON_PLACEMENT_MAP: Record<NonNullable<SheetVariantProps['side']>, 'sheet-left' | 'sheet-right'> = {
    left: 'sheet-left',
    right: 'sheet-right',
    top: 'sheet-right',
    bottom: 'sheet-right',
}

const overlayClasses = computed(() => overlayVariants())

const contentClasses = computed(() =>
    cn(sheetVariants({ side: props.side }), props.class)
)

const closeClasses = computed(() =>
    modalCloseButtonVariants({
        placement: CLOSE_BUTTON_PLACEMENT_MAP[props.side],
        motion: 'sm',
    })
)

const closeIconClasses = cn(iconSizeVariants({ size: 'md' }), 'stroke-[3]')
</script>

<template>
    <DialogPortalPrimitive>
        <DialogOverlayPrimitive :class="overlayClasses" />
        <DialogContentPrimitive :class="contentClasses" v-bind="$attrs">
            <slot />
            <DialogClosePrimitive :class="closeClasses">
                <X :class="closeIconClasses" />
                <span class="sr-only">{{ t('sheet.close') }}</span>
            </DialogClosePrimitive>
        </DialogContentPrimitive>
    </DialogPortalPrimitive>
</template>
