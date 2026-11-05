<script setup lang="ts">
import { computed, provide } from 'vue'
import { ToggleGroupRoot, VisuallyHidden } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { hasSelectionValue } from '@/lib/selection-value'
import { toggleVariants } from '../toggle/toggle-variants'
import { toggleGroupKey } from './toggle-group-key'

type ToggleVariantProps = VariantProps<typeof toggleVariants>

interface ToggleGroupProps {
    type?: 'single' | 'multiple'
    modelValue?: string | string[]
    defaultValue?: string | string[]
    variant?: NonNullable<ToggleVariantProps['variant']>
    size?: NonNullable<ToggleVariantProps['size']>
    orientation?: 'horizontal' | 'vertical'
    disabled?: boolean
    class?: string
    /** 表单字段名；禁用时不提交。 */
    name?: string
    /** 要求组内至少选择一个值。 */
    required?: boolean
}

const props = withDefaults(defineProps<ToggleGroupProps>(), {
    type: 'single',
    modelValue: undefined,
    defaultValue: undefined,
    variant: 'default',
    size: 'default',
    orientation: 'horizontal',
    disabled: false,
    class: undefined,
    name: undefined,
    required: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string | string[]] }>()

function handleUpdateModelValue(val: unknown) {
    if (typeof val === 'string') {
        emit('update:modelValue', val)
    } else if (Array.isArray(val) && val.every(v => typeof v === 'string')) {
        emit('update:modelValue', val)
    } else if (val === undefined || val === null) {
        emit('update:modelValue', props.type === 'multiple' ? [] : '')
    }
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
        v-slot="{ modelValue: selectedValue }"
        :type="type"
        :model-value="modelValue"
        :default-value="defaultValue"
        :disabled="disabled"
        :orientation="orientation"
        :name="disabled ? undefined : name"
        :required="required"
        :class="classes"
        @update:model-value="handleUpdateModelValue"
    >
        <slot />
        <VisuallyHidden
            v-if="required && !name"
            as="input"
            feature="fully-hidden"
            type="checkbox"
            :checked="hasSelectionValue(selectedValue)"
            required
            :disabled="disabled"
        />
    </ToggleGroupRoot>
</template>
