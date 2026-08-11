<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '@/lib/utils'

interface AlertTitleProps extends PrimitiveProps {
    class?: string
}

// 默认标题层级 h5（与 CardTitle 默认 h3 一致，均为硬编码默认值）。
// 调用方应根据实际文档大纲通过 as / asChild 调整层级，避免标题跳级。
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
