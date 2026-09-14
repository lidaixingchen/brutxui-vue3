<script setup lang="ts">
import { AccordionContent, type AccordionContentProps } from 'reka-ui'
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils'
import { accordionContentVariants } from './accordion-variants'
import { accordionItemKey, type AccordionItemVariantContext } from './accordion-key'

const props = defineProps<AccordionContentProps & { class?: string }>()

const defaultContext: AccordionItemVariantContext = { variant: computed(() => undefined) }
const context = inject(accordionItemKey, defaultContext)

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props
    return delegated
})

const contentClasses = computed(() =>
    cn(
        'overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        props.class,
    ),
)

const innerClasses = computed(() =>
    accordionContentVariants({ variant: context.variant.value }),
)
</script>

<template>
    <AccordionContent
        v-bind="delegatedProps"
        :class="contentClasses"
    >
        <div :class="innerClasses">
            <slot />
        </div>
    </AccordionContent>
</template>
