<script setup lang="ts">
import { AccordionHeader, AccordionTrigger, type AccordionTriggerProps } from 'reka-ui'
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '../../lib/utils'

const props = defineProps<AccordionTriggerProps & { class?: string }>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props
    return delegated
})

const classes = computed(() =>
    cn(
        'flex flex-1 items-center justify-between py-4 px-6 text-left font-black tracking-wide transition-all hover:bg-brutal-muted [&[data-state=open]>svg]:rotate-180',
        props.class
    )
)
</script>

<template>
    <AccordionHeader class="flex">
        <AccordionTrigger v-bind="delegatedProps" :class="classes">
            <slot />
            <slot name="icon">
                <ChevronDown
                    class="h-5 w-5 shrink-0 transition-transform duration-200 border-3 border-brutal rounded-brutal bg-brutal-bg p-0.5 shadow-brutal-sm"
                />
            </slot>
        </AccordionTrigger>
    </AccordionHeader>
</template>
