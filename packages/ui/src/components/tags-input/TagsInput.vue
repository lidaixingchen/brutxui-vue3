<script setup lang="ts">
import { TagsInputRoot, type TagsInputRootProps, type TagsInputRootEmits, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { useLocale } from '../../composables/useLocale'

const props = defineProps<TagsInputRootProps & { class?: string; ariaLabel?: string }>()
const emits = defineEmits<TagsInputRootEmits>()

const { t } = useLocale()

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('tagsInput.label'))

const delegatedProps = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { class: _, ariaLabel: __, ...delegated } = props
    return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const classes = computed(() =>
    cn(
        'flex flex-wrap gap-2 items-center p-2 min-h-11 border-3 border-brutal bg-brutal-bg rounded-brutal shadow-brutal focus-within:ring-2 focus-within:ring-brutal-ring focus-within:ring-offset-2 transition-all duration-150',
        props.class
    )
)
</script>

<template>
    <TagsInputRoot v-bind="forwarded" :class="classes" :aria-label="resolvedAriaLabel">
        <slot />
    </TagsInputRoot>
</template>
