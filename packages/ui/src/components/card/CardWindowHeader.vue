<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { cn } from '@/lib/utils'
import { cardWindowHeaderVariants } from './card-window-header-variants'

interface CardWindowHeaderProps {
    /** 窗口标题（以等宽大写工控排版呈现） */
    title: string
    /** 是否渲染右侧 ASCII 风格窗口控制符（纯装饰） */
    showControls?: boolean
    /** 自定义 CSS 类名 */
    class?: string
}

const props = withDefaults(defineProps<CardWindowHeaderProps>(), {
    showControls: true,
    class: undefined,
})

const slots = useSlots()

/** 右侧存在自定义控制插槽时，替换默认 ASCII 控制符 */
const hasCustomActions = computed(() => Boolean(slots.actions))

const headerClasses = computed(() =>
    cn(cardWindowHeaderVariants(), props.class),
)

const lampColors = [
    'bg-brutal-destructive',
    'bg-brutal-accent',
    'bg-brutal-status-success',
] as const
</script>

<template>
    <div :class="headerClasses">
        <span class="flex shrink-0 items-center gap-1.5" aria-hidden="true">
            <i v-for="lamp in lampColors" :key="lamp" class="size-3 border-2 border-brutal" :class="lamp" />
        </span>
        <span class="min-w-0 flex-1 truncate text-center font-mono text-xs font-bold uppercase tracking-widest text-brutal-fg">
            {{ props.title }}
        </span>
        <span v-if="hasCustomActions" class="shrink-0"><slot name="actions" /></span>
        <span
            v-else-if="props.showControls"
            class="shrink-0 font-mono text-xs font-bold uppercase text-brutal-fg"
            aria-hidden="true"
        >[ _ ] [ X ]</span>
    </div>
</template>
