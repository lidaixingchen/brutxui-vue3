<script setup lang="ts">
import { computed, provide, toRef } from 'vue'
import { AccordionItem, type AccordionItemProps as RekaAccordionItemProps, useForwardProps } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
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

// 只读取真正需要转发的 key：variant/class 变化无需触发转发链重算
const forwardedKeys = Object.keys(props).filter((key) => key !== 'class' && key !== 'variant')

const delegatedProps = computed(() =>
    Object.fromEntries(
        forwardedKeys.map((key) => [key, props[key as keyof typeof props]])
    ) as Omit<AccordionItemProps, 'class' | 'variant'>
)

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
