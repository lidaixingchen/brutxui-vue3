<script setup lang="ts">
import { computed, ref } from 'vue'
import { ListboxRoot, useFilter } from 'reka-ui'
import { cn } from '@/lib/utils'
import { provideCommandRootContext } from './command-context'

interface CommandProps {
    class?: string
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
        return {
            count: allItems.value.size,
            items: new Map(),
            groups: new Set(allGroups.value.keys()),
        }
    }

    let itemCount = 0
    const filteredItems = new Map<string, number>()
    const filteredGroups = new Set<string>()

    for (const [id, value] of allItems.value) {
        const score = contains(value, filterSearch.value)
        filteredItems.set(id, score ? 1 : 0)
        if (score)
            itemCount++
    }

    for (const [groupId, group] of allGroups.value) {
        for (const itemId of group) {
            if (filteredItems.get(itemId)! > 0) {
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
