<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { ListboxGroup, useId } from 'reka-ui'
import { cn } from '@/lib/utils'
import { injectCommandRootContext, provideCommandGroupContext } from './command-context'

interface CommandGroupProps {
    title?: string
    class?: string
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

onMounted(() => {
    if (!rootContext.allGroups.value.has(id))
        rootContext.allGroups.value.set(id, new Set())
})

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
