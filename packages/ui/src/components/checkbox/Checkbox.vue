<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { checkboxVariants, checkboxIndicatorVariants } from './checkbox-variants'

type CheckboxVariantProps = VariantProps<typeof checkboxVariants>

interface CheckboxProps {
    class?: string
    checked?: boolean
    defaultChecked?: boolean
    disabled?: boolean
    variant?: NonNullable<CheckboxVariantProps['variant']>
    size?: NonNullable<CheckboxVariantProps['size']>
}

const props = withDefaults(defineProps<CheckboxProps>(), {
    disabled: false,
    variant: 'default',
    size: 'default',
})

const emit = defineEmits<{
    'update:checked': [value: boolean]
}>()

const classes = computed(() =>
    cn(checkboxVariants({ variant: props.variant, size: props.size }), props.class)
)

const checkClasses = computed(() =>
    cn(checkboxIndicatorVariants({ size: props.size }))
)
</script>

<template>
    <CheckboxRoot
        :class="classes"
        :checked="checked"
        :default-checked="defaultChecked"
        :disabled="disabled"
        @update:checked="emit('update:checked', $event)"
    >
        <CheckboxIndicator :class="checkClasses">
            <Check class="h-full w-full" />
        </CheckboxIndicator>
    </CheckboxRoot>
</template>
