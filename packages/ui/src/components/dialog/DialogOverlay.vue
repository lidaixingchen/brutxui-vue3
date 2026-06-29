<script setup lang="ts">
import { computed } from 'vue'
import { DialogOverlay as DialogOverlayPrimitive } from 'reka-ui'
import { cn } from '../../lib/utils'
import { overlayVariants } from '../../lib/modal-variants'

interface DialogOverlayProps {
    class?: string
}

const props = defineProps<DialogOverlayProps>()

const classes = computed(() => cn(overlayVariants(), props.class))
</script>

<template>
    <DialogOverlayPrimitive :class="classes" />
</template>
