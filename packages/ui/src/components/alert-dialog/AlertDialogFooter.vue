<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { sectionFooterVariants } from '../../lib/modal-variants'

interface AlertDialogFooterProps {
    class?: string
}

const props = defineProps<AlertDialogFooterProps>()

const classes = computed(() =>
    cn(sectionFooterVariants(), props.class)
)
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
