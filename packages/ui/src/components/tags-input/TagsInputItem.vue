<script setup lang="ts">
import {
    TagsInputItem as TagsInputItemPrimitive,
    type TagsInputItemProps as RekaTagsInputItemProps,
    useForwardProps,
} from 'reka-ui'
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { tagsInputItemVariants } from './tags-input-variants'

type TagsInputItemVariantProps = VariantProps<typeof tagsInputItemVariants>

interface TagsInputItemProps extends RekaTagsInputItemProps {
    variant?: NonNullable<TagsInputItemVariantProps['variant']>
    class?: string
}

const props = withDefaults(defineProps<TagsInputItemProps>(), {
    variant: 'primary',
    class: undefined,
})

const delegatedProps = computed(() => {
    const { class: _, variant: __, ...delegated } = props
    return delegated
})

const forwarded = useForwardProps(delegatedProps)

const classes = computed(() =>
    cn(tagsInputItemVariants({ variant: props.variant }), props.class)
)
</script>

<template>
    <TagsInputItemPrimitive v-bind="forwarded" :class="classes">
        <slot />
    </TagsInputItemPrimitive>
</template>
