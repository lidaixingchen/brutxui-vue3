<script setup lang="ts">
import { computed } from 'vue'
import {
    DialogPortal as DialogPortalPrimitive,
    DialogContent as DialogContentPrimitive,
    DialogClose as DialogClosePrimitive,
} from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import DialogOverlay from './DialogOverlay.vue'
import { dialogContentVariants, dialogCloseVariants } from './dialog-variants'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

type DialogContentVariantProps = VariantProps<typeof dialogContentVariants>

interface DialogContentProps {
    showCloseButton?: boolean
    size?: NonNullable<DialogContentVariantProps['size']>
    /** 入场动效形态：fade-zoom 流体淡入 / shutter 百叶窗机械展开 */
    entrance?: NonNullable<DialogContentVariantProps['entrance']>
    forceMount?: boolean
    class?: string
}

const props = withDefaults(defineProps<DialogContentProps>(), {
    showCloseButton: true,
    size: 'default',
    entrance: 'fade-zoom',
    forceMount: undefined,
    class: undefined,
})

const { t } = useLocale()

const contentClasses = computed(() =>
    cn(dialogContentVariants({ size: props.size, entrance: props.entrance }), props.class)
)

// 无响应式依赖：普通常量（与 closeIconClasses 一致）
const closeClasses = cn(dialogCloseVariants())

const closeIconClasses = cn(iconSizeVariants({ size: 'md' }), 'stroke-[3]')
</script>

<template>
    <DialogPortalPrimitive>
        <DialogOverlay :force-mount="props.forceMount" />
        <DialogContentPrimitive :class="contentClasses" :force-mount="props.forceMount">
            <slot />
            <DialogClosePrimitive v-if="showCloseButton" :class="closeClasses">
                <X :class="closeIconClasses" aria-hidden="true" />
                <span class="sr-only">{{ t('dialog.close') }}</span>
            </DialogClosePrimitive>
        </DialogContentPrimitive>
    </DialogPortalPrimitive>
</template>
