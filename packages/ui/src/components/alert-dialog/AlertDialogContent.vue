<script setup lang="ts">
import { computed } from 'vue'
import {
    AlertDialogPortal as AlertDialogPortalPrimitive,
    AlertDialogOverlay as AlertDialogOverlayPrimitive,
    AlertDialogContent as AlertDialogContentPrimitive,
} from 'reka-ui'
import { cn } from '../../lib/utils'
import { overlayVariants } from '../../lib/modal-variants'
import { alertDialogContentVariants } from './alert-dialog-variants'

interface AlertDialogContentProps {
    class?: string
}

const props = defineProps<AlertDialogContentProps>()

const overlayClasses = computed(() => overlayVariants())

const contentClasses = computed(() =>
    cn(alertDialogContentVariants(), props.class)
)
</script>

<template>
    <AlertDialogPortalPrimitive>
        <AlertDialogOverlayPrimitive :class="overlayClasses" />
        <AlertDialogContentPrimitive :class="contentClasses">
            <slot />
        </AlertDialogContentPrimitive>
    </AlertDialogPortalPrimitive>
</template>
