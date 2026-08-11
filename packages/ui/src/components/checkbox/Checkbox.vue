<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { CheckboxRoot, CheckboxIndicator, type AcceptableValue } from 'reka-ui'
import { Check, Minus } from '@lucide/vue'
import { checkboxVariants, checkboxIndicatorVariants } from './checkbox-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

type CheckboxVariantProps = VariantProps<typeof checkboxVariants>

interface CheckboxProps {
    class?: string
    checked?: boolean | 'indeterminate'
    /**
     * 非受控模式下的初始选中状态；仅当 `checked` 为 undefined（未受控）时生效。
     * 显式传入 `checked` 后进入受控模式，`defaultValue` 不再起作用。
     */
    defaultValue?: boolean | 'indeterminate'
    disabled?: boolean
    variant?: NonNullable<CheckboxVariantProps['variant']>
    size?: NonNullable<CheckboxVariantProps['size']>
    /** 无障碍标签，未提供时使用 locale 默认值 */
    ariaLabel?: string
    /** 表单字段名；提供时渲染隐藏 input，随所属 form 以 name/value 提交 */
    name?: string
    /** 随 form 提交的值，默认 'on' */
    value?: AcceptableValue
    /** 原生表单必填标记 */
    required?: boolean
}

const props = withDefaults(defineProps<CheckboxProps>(), {
    disabled: false,
    checked: undefined,
    defaultValue: undefined,
    variant: 'default',
    size: 'default',
    class: undefined,
    ariaLabel: undefined,
    name: undefined,
    value: undefined,
    required: false,
})

const emit = defineEmits<{
    'update:checked': [value: boolean | 'indeterminate']
}>()

const { t } = useLocale()

const CHECKBOX_SIZE_TO_ICON: Record<NonNullable<CheckboxVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'md',
    lg: 'lg',
}

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('checkbox.check'))

const isIndeterminate = computed(() => props.checked === 'indeterminate')

const classes = computed(() =>
    cn(checkboxVariants({ variant: props.variant, size: props.size }), props.class)
)

// 运行时兜底 'md'：静态用法受 Record 类型约束，但消费者传动态 size（或变体新增 size 未同步映射）时
// 可能取到 undefined，回退到 iconSizeVariants 的默认中号，避免图标尺寸异常
const checkClasses = computed(() =>
    cn(
        checkboxIndicatorVariants(),
        iconSizeVariants({ size: CHECKBOX_SIZE_TO_ICON[props.size] ?? 'md' })
    )
)
</script>

<template>
    <CheckboxRoot
        :class="classes"
        :model-value="checked"
        :default-value="defaultValue"
        :disabled="disabled"
        :aria-label="resolvedAriaLabel"
        :name="name"
        :value="value"
        :required="required"
        @update:model-value="(val: boolean | 'indeterminate') => emit('update:checked', val)"
    >
        <CheckboxIndicator :class="checkClasses">
            <Minus v-if="isIndeterminate" class="h-full w-full" />
            <Check v-else class="h-full w-full" />
        </CheckboxIndicator>
    </CheckboxRoot>
</template>
