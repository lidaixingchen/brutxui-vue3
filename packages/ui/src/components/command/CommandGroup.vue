<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { ListboxGroup, useId } from 'reka-ui'
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'
import { injectCommandRootContext, provideCommandGroupContext } from './command-context'

interface CommandGroupProps {
    title?: string
    class?: ClassValue
}

const props = defineProps<CommandGroupProps>()

const rootContext = injectCommandRootContext()
const id = useId(undefined, 'brutx-command-group')

const isRender = computed(() => {
    if (!rootContext.filterSearch.value) return true
    return rootContext.filterState.value.groups.has(id)
})

const classes = computed(() =>
    cn(
        'overflow-hidden p-1',
        props.class
    )
)

const headingClasses = computed(() =>
    cn(
        'px-3 py-2 text-xs font-black uppercase tracking-wider',
        'text-brutal-muted-foreground'
    )
)

provideCommandGroupContext({ id })

// 分组在 setup 阶段同步注册：父级 Command 的 provide 先于子级 setup 执行，allGroups 已就绪，
// 使首次渲染（含预置搜索词）即可基于已注册分组求值，消除 onMounted 晚于首渲造成的闪烁/水合不一致。
rootContext.allGroups.value.set(id, new Set())

// 分组保持 v-show 而非 v-if：分组隐藏时仍需渲染插槽，让子项 CommandItem 保持挂载并完成注册，
// 否则组级卸载会连带卸载条目、清空注册，过滤循环将永远无法再命中该分组（死锁）。
onBeforeUnmount(() => {
    rootContext.allGroups.value.delete(id)
})
</script>

<template>
    <ListboxGroup
        v-show="isRender"
        :id="id"
        :class="classes"
        data-slot="command-group"
        role="group"
    >
        <div v-if="title" :class="headingClasses" data-slot="command-group-heading">
            {{ title }}
        </div>
        <slot />
    </ListboxGroup>
</template>
