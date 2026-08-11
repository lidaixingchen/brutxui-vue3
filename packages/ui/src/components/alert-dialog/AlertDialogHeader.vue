<script setup lang="ts">
import { computed } from 'vue'
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'
import { sectionHeaderVariants } from '@/lib/modal-variants'

interface AlertDialogHeaderProps {
    class?: ClassValue
}

const props = defineProps<AlertDialogHeaderProps>()

const classes = computed(() =>
    cn(sectionHeaderVariants(), props.class)
)
</script>

<template>
    <header :class="classes">
        <slot />
    </header>
</template>
