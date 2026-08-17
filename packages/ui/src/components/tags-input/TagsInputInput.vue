<script setup lang="ts">
import {
    TagsInputInput as TagsInputInputPrimitive,
    type TagsInputInputProps,
    useForwardProps,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<TagsInputInputProps & { class?: string }>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props
    return delegated
})

const forwarded = useForwardProps(delegatedProps)

const classes = computed(() =>
    cn(
        'flex-1 bg-transparent px-2 text-sm font-bold placeholder:text-brutal-placeholder placeholder:font-normal focus:outline-none disabled:cursor-not-allowed',
        props.class
    )
)
</script>

<template>
    <TagsInputInputPrimitive v-bind="forwarded" :class="classes" />
</template>
