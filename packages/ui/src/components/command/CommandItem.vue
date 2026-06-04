<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type ComponentPublicInstance } from 'vue'
import { ListboxItem, useId } from 'reka-ui'
import { cn } from '../../lib/utils'
import { commandItemVariants } from './command-variants'
import { injectCommandRootContext, injectCommandGroupContext } from './command-context'

interface CommandItemProps {
    value: string
    disabled?: boolean
    class?: string
}

const props = defineProps<CommandItemProps>()

const emit = defineEmits<{ select: [value: string] }>()

const rootContext = injectCommandRootContext()
const groupContext = injectCommandGroupContext(null)
const id = useId(undefined, 'brutx-command-item')

const itemRef = ref<ComponentPublicInstance | null>(null)

const isRender = computed(() => {
    if (!rootContext.filterSearch.value) return true
    const filteredCurrentItem = rootContext.filterState.value.items.get(id)
    if (filteredCurrentItem === undefined) return true
    return filteredCurrentItem > 0
})

const classes = computed(() =>
    cn(commandItemVariants(), props.class)
)

onMounted(() => {
    const el = itemRef.value?.$el as HTMLElement | undefined
    rootContext.allItems.value.set(
        id,
        el?.textContent || el?.innerText || props.value
    )

    const groupId = groupContext?.id
    if (groupId) {
        if (!rootContext.allGroups.value.has(groupId)) {
            rootContext.allGroups.value.set(groupId, new Set([id]))
        }
        else {
            rootContext.allGroups.value.get(groupId)?.add(id)
        }
    }
})

onUnmounted(() => {
    rootContext.allItems.value.delete(id)
    const groupId = groupContext?.id
    if (groupId) {
        rootContext.allGroups.value.get(groupId)?.delete(id)
    }
})
</script>

<template>
    <ListboxItem
        v-show="isRender"
        :id="id"
        ref="itemRef"
        :value="value"
        :disabled="disabled"
        :class="classes"
        data-slot="command-item"
        @select="emit('select', value)"
    >
        <slot />
    </ListboxItem>
</template>
