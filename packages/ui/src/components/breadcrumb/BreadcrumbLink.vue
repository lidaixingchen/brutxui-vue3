<script setup lang="ts">
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '../../lib/utils'

interface BreadcrumbLinkProps extends PrimitiveProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbLinkProps>(), {
    as: 'a',
    class: '',
})

const classes = computed(() =>
    cn('transition-colors hover:text-brutal-primary hover:underline cursor-pointer', props.class)
)
</script>

<template>
    <Primitive
        :as="props.as"
        :as-child="props.asChild"
        :class="classes"
    >
        <slot />
    </Primitive>
</template>
