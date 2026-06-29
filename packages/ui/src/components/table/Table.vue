<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { tableVariants } from './table-variants'

interface TableProps {
    class?: string
    /** 无障碍标签 */
    ariaLabel?: string
}

const props = defineProps<TableProps>()

const classes = computed(() =>
    cn(tableVariants(), props.class)
)
</script>

<template>
    <div class="relative w-full overflow-x-auto">
        <table :class="classes" :aria-label="ariaLabel">
            <slot />
        </table>
    </div>
</template>
