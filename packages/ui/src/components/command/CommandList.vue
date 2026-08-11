<script setup lang="ts">
import { computed } from 'vue'
import { ListboxContent, type ListboxContentProps } from 'reka-ui'
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'

/**
 * 命令列表容器，基于 reka-ui 的 ListboxContent 构建。
 *
 * 依赖 ListboxRoot 提供的上下文（由 `<Command>` 包裹）：脱离 Command 单独使用时，
 * reka-ui 会在运行时抛出明确的注入错误。支持透传 `as` / `asChild` 自定义渲染元素。
 */
interface CommandListProps extends ListboxContentProps {
    class?: ClassValue
}

const props = defineProps<CommandListProps>()

// 剥离 class 后把其余 props（as / asChild 等）委派给 ListboxContent，
// 避免它们退化为根元素上的普通 DOM 属性
const delegatedProps = computed(() => {
    const { class: _, ...rest } = props
    return rest
})

const classes = computed(() =>
    cn(
        'max-h-80 overflow-x-hidden overflow-y-auto scroll-py-1',
        'p-2',
        props.class
    )
)
</script>

<template>
    <ListboxContent v-bind="delegatedProps" :class="classes" data-slot="command-list">
        <slot />
    </ListboxContent>
</template>
