<script setup lang="ts">
import { computed } from 'vue'
import {
    DialogPortal as DialogPortalPrimitive,
    DialogContent as DialogContentPrimitive,
    DialogClose as DialogClosePrimitive,
} from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { X } from '@lucide/vue'
import { cn } from '../../lib/utils'
import DialogOverlay from './DialogOverlay.vue'
import { dialogContentVariants, dialogCloseVariants } from './dialog-variants'
import { iconSizeVariants } from '../../lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

type DialogContentVariantProps = VariantProps<typeof dialogContentVariants>

interface DialogContentProps {
    showCloseButton?: boolean
    size?: NonNullable<DialogContentVariantProps['size']>
    forceMount?: boolean
    class?: string
}

const props = withDefaults(defineProps<DialogContentProps>(), {
    showCloseButton: true,
    size: 'default',
    forceMount: undefined,
    class: undefined,
})

const { t } = useLocale()

const contentClasses = computed(() =>
    cn(dialogContentVariants({ size: props.size }), props.class)
)

const closeClasses = computed(() =>
    cn(dialogCloseVariants())
)

const closeIconClasses = cn(iconSizeVariants({ size: 'default' }), 'stroke-[3]')
</script>

<template>
    <DialogPortalPrimitive>
        <DialogOverlay />
        <DialogContentPrimitive :class="contentClasses" :force-mount="props.forceMount === true ? true : undefined">
            <slot />
            <DialogClosePrimitive v-if="showCloseButton" :class="closeClasses">
                <X :class="closeIconClasses" />
                <span class="sr-only">{{ t('dialog.close') }}</span>
            </DialogClosePrimitive>
        </DialogContentPrimitive>
    </DialogPortalPrimitive>
</template>
