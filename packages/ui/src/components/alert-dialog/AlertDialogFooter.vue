<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { alertDialogFooterVariants } from './alert-dialog-variants'

interface AlertDialogFooterProps {
    class?: string
}

const props = defineProps<AlertDialogFooterProps>()

const classes = computed(() =>
    cn(alertDialogFooterVariants(), props.class)
)
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
