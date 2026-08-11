<script setup lang="ts">
import { computed, ref } from 'vue'
import { ListboxRoot, useFilter } from 'reka-ui'
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'
import { provideCommandRootContext } from './command-context'

interface CommandProps {
    class?: ClassValue
    disableFilter?: boolean
}

const props = withDefaults(defineProps<CommandProps>(), {
    class: undefined,
    disableFilter: false,
})

const allItems = ref<Map<string, string>>(new Map())
const allGroups = ref<Map<string, Set<string>>>(new Map())
const filterSearch = ref('')

const { contains } = useFilter({ sensitivity: 'base' })

const filterState = computed<{
    count: number
    items: Map<string, number>
    groups: Set<string>
}>(() => {
    if (props.disableFilter || !filterSearch.value) {
        // 未过滤分支同样把全部条目写入 items（值为 1），统一「score > 0 即可见」的语义：
        // 下游无需再靠 filterSearch 空值兜底即可区分「未启用过滤」与「无匹配结果」
        const allItemsMap = new Map<string, number>()
        for (const id of allItems.value.keys()) {
            allItemsMap.set(id, 1)
        }
        return {
            count: allItems.value.size,
            items: allItemsMap,
            groups: new Set(allGroups.value.keys()),
        }
    }

    let itemCount = 0
    const filteredItems = new Map<string, number>()
    const filteredGroups = new Set<string>()

    for (const [id, value] of allItems.value) {
        // contains 只返回 0/1，此处作为「命中标记」（1=可见 0=隐藏），非相关度分数
        const score = contains(value, filterSearch.value)
        filteredItems.set(id, score ? 1 : 0)
        if (score)
            itemCount++
    }

    for (const [groupId, group] of allGroups.value) {
        for (const itemId of group) {
            // 组内条目可能晚于分组注册，get 返回 undefined 时按未命中处理
            if ((filteredItems.get(itemId) ?? 0) > 0) {
                filteredGroups.add(groupId)
                break
            }
        }
    }

    return {
        count: itemCount,
        items: filteredItems,
        groups: filteredGroups,
    }
})

provideCommandRootContext({
    allItems,
    allGroups,
    filterSearch,
    filterState,
})

defineExpose({ filterSearch })

const classes = computed(() =>
    cn(
        'flex h-full w-full flex-col overflow-hidden',
        'bg-brutal-bg text-brutal-fg',
        props.class
    )
)
</script>

<template>
    <ListboxRoot
        :class="classes"
        :highlight-on-hover="true"
        as="div"
    >
        <slot />
    </ListboxRoot>
</template>
