<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import { Check, Minus } from '@lucide/vue'
import { checkboxVariants, checkboxIndicatorVariants } from './checkbox-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

type CheckboxVariantProps = VariantProps<typeof checkboxVariants>

interface CheckboxProps {
    class?: string
    checked?: boolean | 'indeterminate'
    disabled?: boolean
    variant?: NonNullable<CheckboxVariantProps['variant']>
    size?: NonNullable<CheckboxVariantProps['size']>
    /** 无障碍标签，未提供时使用 locale 默认值 */
    ariaLabel?: string
}

const props = withDefaults(defineProps<CheckboxProps>(), {
    disabled: false,
    checked: undefined,
    variant: 'default',
    size: 'default',
    class: undefined,
    ariaLabel: undefined,
})

const emit = defineEmits<{
    'update:checked': [value: boolean | 'indeterminate']
}>()

const { t } = useLocale()

const CHECKBOX_SIZE_TO_ICON: Record<NonNullable<CheckboxVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'default',
    lg: 'lg',
}

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('checkbox.check'))

const isIndeterminate = computed(() => props.checked === 'indeterminate')

const classes = computed(() =>
    cn(checkboxVariants({ variant: props.variant, size: props.size }), props.class)
)

const checkClasses = computed(() =>
    cn(
        checkboxIndicatorVariants(),
        iconSizeVariants({ size: CHECKBOX_SIZE_TO_ICON[props.size] })
    )
)
</script>

<template>
    <CheckboxRoot
        :class="classes"
        :model-value="checked"
        :disabled="disabled"
        :aria-label="resolvedAriaLabel"
        @update:model-value="(val: boolean | 'indeterminate') => emit('update:checked', val)"
    >
        <CheckboxIndicator :class="checkClasses">
            <Minus v-if="isIndeterminate" class="h-full w-full" />
            <Check v-else class="h-full w-full" />
        </CheckboxIndicator>
    </CheckboxRoot>
</template>
