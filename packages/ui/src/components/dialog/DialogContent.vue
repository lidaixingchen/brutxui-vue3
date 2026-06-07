<script setup lang="ts">
import { computed } from 'vue'
import {
    DialogPortal as DialogPortalPrimitive,
    DialogContent as DialogContentPrimitive,
    DialogClose as DialogClosePrimitive,
} from 'reka-ui'
import { X } from '@lucide/vue'
import { cn } from '../../lib/utils'
import DialogOverlay from './DialogOverlay.vue'
import { dialogContentVariants, dialogCloseVariants } from './dialog-variants'
import { useLocale } from '@/composables/useLocale'

interface DialogContentProps {
    showCloseButton?: boolean
    forceMount?: boolean
    class?: string
}

const props = withDefaults(defineProps<DialogContentProps>(), {
    showCloseButton: true,
    forceMount: undefined,
    class: undefined,
})

const { t } = useLocale()

const contentClasses = computed(() =>
    cn(dialogContentVariants(), props.class)
)

const closeClasses = computed(() =>
    cn(dialogCloseVariants())
)
</script>

<template>
    <DialogPortalPrimitive>
        <DialogOverlay />
        <DialogContentPrimitive :class="contentClasses" :force-mount="props.forceMount === true ? true : undefined">
            <slot />
            <DialogClosePrimitive v-if="showCloseButton" :class="closeClasses">
                <X class="h-4 w-4 stroke-[3]" />
                <span class="sr-only">{{ t('dialog.close') }}</span>
            </DialogClosePrimitive>
        </DialogContentPrimitive>
    </DialogPortalPrimitive>
</template>
