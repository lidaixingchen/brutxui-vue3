<script setup lang="ts">
import { computed } from 'vue'
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'
import { sectionFooterVariants } from '@/lib/modal-variants'

interface AlertDialogFooterProps {
    class?: ClassValue
}

const props = defineProps<AlertDialogFooterProps>()

const classes = computed(() =>
    cn(sectionFooterVariants(), props.class)
)
</script>

<template>
    <div v-if="$slots.default" :class="classes">
        <slot />
    </div>
</template>
