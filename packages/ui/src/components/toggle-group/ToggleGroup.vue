<script setup lang="ts">
import { computed, provide } from 'vue'
import { ToggleGroupRoot, VisuallyHidden } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { getFormValueEntries, useNativeFormReset, vNativeFormValue } from '@/lib/native-form-reset'
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

const initialValue = Array.isArray(props.defaultValue)
    ? [...props.defaultValue]
    : props.defaultValue ?? (props.type === 'multiple' ? [] : null)
const { value: selectedValue, resetValue, updateValue, bindFormReset, resetting } = useNativeFormReset(
    () => props.modelValue,
    initialValue,
)

function handleUpdateModelValue(val: unknown) {
    if (typeof val === 'string' || (Array.isArray(val) && val.every(v => typeof v === 'string'))) {
        updateValue(val)
        emit('update:modelValue', val)
    } else if (val === undefined || val === null) {
        const multiple = props.type === 'multiple'
        updateValue(multiple ? [] : null)
        emit('update:modelValue', multiple ? [] : '')
    }
}

const formEntries = computed(() => {
    if (!props.name) return []
    const current = new Map(getFormValueEntries(props.name, selectedValue.value, props.required))
    const initial = new Map(getFormValueEntries(props.name, resetValue.value, props.required))
    // 仅当前或仅初始选中的条目使用 checkbox，使浏览器能同时重置字段的存在和值。
    const names = new Set([...current.keys(), ...initial.keys()])
    return [...names].map(name => {
        const currentValue = current.get(name)
        const initialValue = initial.get(name)
        const isText = currentValue !== undefined && initialValue !== undefined
        return {
            name,
            type: isText ? 'text' : 'checkbox',
            value: currentValue ?? initialValue,
            checked: isText ? undefined : currentValue !== undefined,
            state: {
                current: isText ? currentValue : currentValue !== undefined,
                initial: isText ? initialValue : initialValue !== undefined,
                submittedValue: props.disabled ? undefined : currentValue,
                bubble: !resetting.value,
            },
        }
    })
})

function isValidSelection(value: typeof initialValue) {
    return hasSelectionValue(value) && (!props.name || !Array.isArray(value) || value.every(Boolean))
}

const classes = computed(() =>
    cn(
        'flex items-center justify-center gap-1.5',
        props.orientation === 'vertical' ? 'flex-col' : 'flex-wrap',
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
        :model-value="selectedValue"
        :disabled="disabled"
        :orientation="orientation"
        :name="undefined"
        :required="required"
        :class="classes"
        @update:model-value="handleUpdateModelValue"
        @vue:mounted="bindFormReset"
        @vue:updated="bindFormReset"
    >
        <slot />
        <VisuallyHidden
            v-for="field in formEntries"
            :key="field.name"
            v-native-form-value="field.state"
            as="input"
            feature="fully-hidden"
            :type="field.type"
            :form="$attrs.form"
            :name="field.name"
            :checked="field.checked"
            :value="field.value"
            :required="required && type === 'single' && field.type === 'text'"
            :disabled="disabled"
        />
        <VisuallyHidden
            v-if="required && (!name || type === 'multiple')"
            v-native-form-value="{ current: isValidSelection(selectedValue), initial: isValidSelection(resetValue) }"
            as="input"
            feature="fully-hidden"
            type="checkbox"
            :form="$attrs.form"
            :checked="isValidSelection(selectedValue)"
            required
            :disabled="disabled"
        />
    </ToggleGroupRoot>
</template>
