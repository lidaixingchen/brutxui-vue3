<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { sectionHeaderVariants } from '../../lib/modal-variants'

interface AlertDialogHeaderProps {
    class?: string
}

const props = defineProps<AlertDialogHeaderProps>()

const classes = computed(() =>
    cn(sectionHeaderVariants(), props.class)
)
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
