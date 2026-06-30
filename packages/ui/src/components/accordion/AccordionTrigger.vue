<script setup lang="ts">
import { AccordionHeader, AccordionTrigger, type AccordionTriggerProps, useForwardProps } from 'reka-ui'
import { computed, inject } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { accordionTriggerVariants } from './accordion-variants'
import { accordionItemKey } from './accordion-key'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'

const props = withDefaults(defineProps<AccordionTriggerProps & { class?: string; iconSize?: IconSize }>(), {
    iconSize: 'lg',
})

const defaultContext = { variant: computed(() => undefined) }
const context = inject(accordionItemKey, defaultContext)

const delegatedProps = computed(() => {
    const { class: _, iconSize: __, ...delegated } = props
    return delegated
})

const forwarded = useForwardProps(delegatedProps)

const classes = computed(() =>
    cn(
        accordionTriggerVariants({ variant: context.variant.value }),
        '[&[data-state=open]>svg]:rotate-180',
        props.class
    )
)

const iconClasses = computed(() =>
    cn(
        iconSizeVariants({ size: props.iconSize }),
        'shrink-0 transition-transform duration-200 border-3 border-brutal rounded-brutal bg-brutal-bg p-0.5 shadow-brutal-sm'
    )
)
</script>

<template>
    <AccordionHeader class="flex">
        <AccordionTrigger v-bind="forwarded" :class="classes">
            <slot />
            <slot name="icon">
                <ChevronDown :class="iconClasses" />
            </slot>
        </AccordionTrigger>
    </AccordionHeader>
</template>
