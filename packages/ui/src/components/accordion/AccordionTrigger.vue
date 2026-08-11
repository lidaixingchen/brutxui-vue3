<script setup lang="ts">
import { AccordionHeader, AccordionTrigger, type AccordionTriggerProps, useForwardProps } from 'reka-ui'
import { computed, inject } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { accordionTriggerVariants, accordionTriggerIconClasses } from './accordion-variants'
import { accordionItemKey, type AccordionItemVariantContext } from './accordion-key'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

const props = withDefaults(defineProps<AccordionTriggerProps & { class?: string; iconSize?: IconSize }>(), {
    iconSize: 'lg',
    class: undefined,
})

const defaultContext: AccordionItemVariantContext = { variant: computed(() => undefined) }
const context = inject(accordionItemKey, defaultContext)

const delegatedProps = computed(() => {
    const { class: _, iconSize: __, ...delegated } = props
    return delegated
})

const forwarded = useForwardProps(delegatedProps)

const classes = computed(() =>
    cn(
        accordionTriggerVariants({ variant: context.variant.value }),
        // 旋转/过渡统一施加在 [data-accordion-icon] 容器上：自定义 icon 槽传非 svg
        // 或包装组件时同样生效，且不会误伤默认槽标题中的 svg
        '[&[data-state=open]_[data-accordion-icon]]:rotate-180',
        props.class
    )
)

const iconClasses = computed(() => cn('inline-flex items-center justify-center', accordionTriggerIconClasses))

const defaultIconClasses = computed(() => iconSizeVariants({ size: props.iconSize }))
</script>

<template>
    <AccordionHeader class="flex !m-0">
        <AccordionTrigger v-bind="forwarded" :class="classes">
            <slot />
            <span data-accordion-icon :class="iconClasses">
                <slot name="icon">
                    <ChevronDown :class="defaultIconClasses" />
                </slot>
            </span>
        </AccordionTrigger>
    </AccordionHeader>
</template>
