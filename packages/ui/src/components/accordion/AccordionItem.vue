<script setup lang="ts">
import { computed, provide, toRef } from 'vue'
import { AccordionItem, type AccordionItemProps as RekaAccordionItemProps, useForwardProps } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { accordionItemVariants } from './accordion-variants'
import { accordionItemKey } from './accordion-key'

type AccordionItemVariantProps = VariantProps<typeof accordionItemVariants>

interface AccordionItemProps extends RekaAccordionItemProps {
    variant?: NonNullable<AccordionItemVariantProps['variant']>
    class?: string
}

const props = withDefaults(defineProps<AccordionItemProps>(), {
    variant: 'default',
    class: undefined,
})

const delegatedProps = computed(() => {
    const { class: _, variant: __, ...delegated } = props
    return delegated
})

const forwardedProps = useForwardProps(delegatedProps)

const classes = computed(() =>
    cn(accordionItemVariants({ variant: props.variant }), props.class)
)

provide(accordionItemKey, { variant: toRef(props, 'variant') })
</script>

<template>
    <AccordionItem v-bind="forwardedProps" :class="classes">
        <slot />
    </AccordionItem>
</template>
