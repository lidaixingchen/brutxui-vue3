<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { sectionFooterVariants } from '../../lib/modal-variants'

interface SheetFooterProps {
    class?: string
}

const props = defineProps<SheetFooterProps>()

const classes = computed(() => cn(sectionFooterVariants(), props.class))
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
