<script setup lang="ts">
import { computed, provide } from 'vue'
import { ToggleGroupRoot } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { toggleVariants } from '../toggle/toggle-variants'
import { toggleGroupKey } from './toggle-group-key'

type ToggleVariantProps = VariantProps<typeof toggleVariants>

interface ToggleGroupProps {
    type?: 'single' | 'multiple'
    modelValue?: string | string[]
    variant?: NonNullable<ToggleVariantProps['variant']>
    size?: NonNullable<ToggleVariantProps['size']>
    orientation?: 'horizontal' | 'vertical'
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<ToggleGroupProps>(), {
    type: 'single',
    modelValue: undefined,
    variant: 'default',
    size: 'default',
    orientation: 'horizontal',
    disabled: false,
    class: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: string | string[]] }>()

/** 类型守卫：将 reka-ui 的 AcceptableValue 缩窄为 string | string[] */
function isStringOrStringArray(val: unknown): val is string | string[] {
    return typeof val === 'string' || (Array.isArray(val) && val.every(v => typeof v === 'string'))
}

const classes = computed(() =>
    cn(
        'flex items-center justify-center gap-1.5',
        props.orientation === 'vertical' && 'flex-col',
        props.class,
    ),
)

provide(toggleGroupKey, {
    variant: computed(() => props.variant),
    size: computed(() => props.size),
    disabled: computed(() => props.disabled),
})
</script>

<template>
    <ToggleGroupRoot
        :type="type"
        :model-value="modelValue"
        :disabled="disabled"
        :orientation="orientation"
        :class="classes"
        @update:model-value="(val) => { if (isStringOrStringArray(val)) emit('update:modelValue', val) }"
    >
        <slot />
    </ToggleGroupRoot>
</template>
