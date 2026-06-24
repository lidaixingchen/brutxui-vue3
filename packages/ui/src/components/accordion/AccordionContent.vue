<script setup lang="ts">
import { AccordionContent, type AccordionContentProps } from 'reka-ui'
import { computed, inject } from 'vue'
import { cn } from '../../lib/utils'
import { accordionContentVariants } from './accordion-variants'
import { accordionItemKey } from './accordion-key'

const props = defineProps<AccordionContentProps & { class?: string }>()

const context = inject(accordionItemKey, { variant: computed(() => undefined) })

const delegatedProps = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { class: _, ...delegated } = props
    return delegated
})

const classes = computed(() =>
    cn(accordionContentVariants({ variant: context.variant.value }), props.class)
)
</script>

<template>
    <AccordionContent
        v-bind="delegatedProps"
        class="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    >
        <div :class="classes">
            <slot />
        </div>
    </AccordionContent>
</template>
