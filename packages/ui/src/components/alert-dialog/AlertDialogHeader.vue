<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { alertDialogHeaderVariants } from './alert-dialog-variants'

interface AlertDialogHeaderProps {
    class?: string
}

const props = defineProps<AlertDialogHeaderProps>()

const classes = computed(() =>
    cn(alertDialogHeaderVariants(), props.class)
)
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
