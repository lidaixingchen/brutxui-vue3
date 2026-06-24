<script setup lang="ts">
import { AccordionRoot, type AccordionRootProps, type AccordionRootEmits, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '../../lib/utils'

const props = defineProps<AccordionRootProps & { class?: string }>()
const emits = defineEmits<AccordionRootEmits>()

const delegatedProps = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { class: _, ...delegated } = props
    return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const classes = computed(() => cn(props.class))
</script>

<template>
    <AccordionRoot v-bind="forwarded" :class="classes">
        <slot />
    </AccordionRoot>
</template>
