<script setup lang="ts">
import { computed } from 'vue'
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'

interface CommandSeparatorProps {
    class?: ClassValue
}

const props = defineProps<CommandSeparatorProps>()

// 原生 <hr> 自带 separator 语义；data-slot 遵循本目录 `command-*` 约定，供 CommandDialog 等通过选择器统一定位。
// 注意：注释不可放在模板根层级（会破坏单根结构，使 wrapper.element 变成占位 DIV）。
const classes = computed(() =>
    cn('-mx-1 my-2 h-[3px] bg-brutal-fg border-0', props.class)
)
</script>

<template>
    <hr
        :class="classes"
        data-slot="command-separator"
        role="separator"
        aria-orientation="horizontal"
    >
</template>
