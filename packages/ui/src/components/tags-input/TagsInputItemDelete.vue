<script setup lang="ts">
import {
    TagsInputItemDelete as TagsInputItemDeletePrimitive,
    type TagsInputItemDeleteProps,
    useForwardProps,
} from 'reka-ui'
import { computed } from 'vue'
import { X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { brutalPress } from '@/lib/brutal-interaction-variants'
import { useLocale } from '@/composables/useLocale'

interface Props extends TagsInputItemDeleteProps {
    class?: string
    ariaLabel?: string
    type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(
    defineProps<Props>(),
    {
        class: undefined,
        ariaLabel: undefined,
        type: 'button',
    }
)

const { t } = useLocale()

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('tagsInput.delete'))

const delegatedProps = computed(() => {
    const { class: _, ariaLabel: _ariaLabel, type: _type, ...delegated } = props
    return delegated
})

const forwarded = useForwardProps(delegatedProps)

const classes = computed(() =>
    cn(
        'h-4 w-4 shrink-0 flex items-center justify-center border-3 border-brutal bg-brutal-bg text-brutal-fg shadow-brutal-sm transition-all hover:bg-brutal-destructive hover:text-brutal-destructive-foreground hover:-translate-y-0.5 rounded-brutal cursor-pointer data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:hover:bg-brutal-bg data-[disabled]:hover:text-brutal-fg data-[disabled]:hover:transform-none data-[disabled]:active:transform-none data-[disabled]:active:shadow-brutal-sm',
        brutalPress,
        props.class
    )
)
</script>

<template>
    <TagsInputItemDeletePrimitive
        v-bind="forwarded"
        :aria-label="resolvedAriaLabel"
        :type="type"
        :class="classes"
    >
        <slot>
            <X class="h-3.5 w-3.5 stroke-[3]" />
        </slot>
    </TagsInputItemDeletePrimitive>
</template>
