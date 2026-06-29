<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { sectionHeaderVariants } from '../../lib/modal-variants'

interface DialogHeaderProps {
    class?: string
}

const props = defineProps<DialogHeaderProps>()

const classes = computed(() => cn(sectionHeaderVariants(), props.class))
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
