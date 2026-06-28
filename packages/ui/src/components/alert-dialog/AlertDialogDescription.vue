<script setup lang="ts">
import { computed } from 'vue'
import { AlertDialogDescription as AlertDialogDescriptionPrimitive } from 'reka-ui'
import { cn } from '../../lib/utils'
import { alertDialogDescriptionVariants } from './alert-dialog-variants'

interface AlertDialogDescriptionProps {
    class?: string
}

const props = defineProps<AlertDialogDescriptionProps>()

const classes = computed(() =>
    cn(alertDialogDescriptionVariants(), props.class)
)
</script>

<template>
    <AlertDialogDescriptionPrimitive :class="classes">
        <slot />
    </AlertDialogDescriptionPrimitive>
</template>
