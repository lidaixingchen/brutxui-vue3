<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '@/lib/utils'

interface AlertTitleProps extends PrimitiveProps {
    class?: string
}

const props = withDefaults(defineProps<AlertTitleProps>(), {
    as: 'h5',
    asChild: undefined,
    class: undefined,
})

const classes = computed(() =>
    cn('mb-1 font-black tracking-tight leading-none', props.class)
)
</script>

<template>
    <Primitive :as="props.as" :as-child="props.asChild" :class="classes">
        <slot />
    </Primitive>
</template>
