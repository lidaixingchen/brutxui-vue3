<script setup lang="ts">
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { breadcrumbLinkClasses } from './breadcrumb-variants'

interface BreadcrumbLinkProps extends PrimitiveProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbLinkProps>(), {
    as: 'a',
    class: undefined,
})

const classes = computed(() =>
    cn(breadcrumbLinkClasses, props.class)
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
