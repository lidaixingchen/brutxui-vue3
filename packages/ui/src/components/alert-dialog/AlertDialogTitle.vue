<script setup lang="ts">
import { computed } from 'vue'
import { AlertDialogTitle as AlertDialogTitlePrimitive } from 'reka-ui'
import { cn } from '../../lib/utils'
import { alertDialogTitleVariants } from './alert-dialog-variants'

interface AlertDialogTitleProps {
    class?: string
}

const props = defineProps<AlertDialogTitleProps>()

const classes = computed(() =>
    cn(alertDialogTitleVariants(), props.class)
)
</script>

<template>
    <AlertDialogTitlePrimitive :class="classes">
        <slot />
    </AlertDialogTitlePrimitive>
</template>
