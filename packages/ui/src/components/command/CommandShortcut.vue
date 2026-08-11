<script setup lang="ts">
import { computed } from 'vue'
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'

interface CommandShortcutProps {
    class?: ClassValue
}

const props = defineProps<CommandShortcutProps>()

const classes = computed(() =>
    cn(
        // inline-flex 自带正确行盒模型：py-1 / border-3 / bg 参与行高计算，脱离 flex 容器也能正确渲染；
        // ms-auto 兼容 RTL，在 CommandItem 的 flex 容器内保持右侧对齐
        'ms-auto inline-flex items-center text-xs font-black tracking-wider',
        'px-2 py-1',
        'bg-brutal-muted',
        'border-3 border-brutal',
        'text-brutal-muted-foreground',
        props.class
    )
)
</script>

<template>
    <span :class="classes" data-slot="command-shortcut">
        <slot />
    </span>
</template>
