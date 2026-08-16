<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Label as LabelRoot } from 'reka-ui'
import { labelVariants } from './label-variants'

type LabelVariantProps = VariantProps<typeof labelVariants>

interface LabelProps {
    variant?: NonNullable<LabelVariantProps['variant']>
    size?: NonNullable<LabelVariantProps['size']>
    required?: boolean
    for?: string
    class?: string
}

// 必填语义由关联控件承担（原生 required / aria-required）：
// label 角色不支持 aria-required，读屏会忽略；此处仅渲染视觉星号（aria-hidden）
// for/class 的 undefined 默认值为 vue/require-default-prop 规则要求，与全库约定一致
const props = withDefaults(defineProps<LabelProps>(), {
    variant: 'default',
    size: 'default',
    required: false,
    for: undefined,
    class: undefined,
})

const classes = computed(() =>
    cn(labelVariants({ variant: props.variant, size: props.size }), props.class)
)
</script>

<template>
    <LabelRoot :class="classes" :for="props.for">
        <slot />
        <span v-if="required" class="text-brutal-destructive ml-0.5" aria-hidden="true">*</span>
    </LabelRoot>
</template>
