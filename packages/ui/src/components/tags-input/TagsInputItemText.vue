<script setup lang="ts">
import {
    TagsInputItemText as TagsInputItemTextPrimitive,
    type TagsInputItemTextProps,
    useForwardProps,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<TagsInputItemTextProps & { class?: string }>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props
    return delegated
})

const forwarded = useForwardProps(delegatedProps)

const classes = computed(() =>
    cn('text-xs font-black uppercase tracking-wide', props.class)
)
</script>

<template>
    <TagsInputItemTextPrimitive v-bind="forwarded" :class="classes">
        <slot />
    </TagsInputItemTextPrimitive>
</template>
