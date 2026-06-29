<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { sectionFooterVariants } from '../../lib/modal-variants'

interface DialogFooterProps {
    class?: string
}

const props = defineProps<DialogFooterProps>()

const classes = computed(() => cn(sectionFooterVariants(), props.class))
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
