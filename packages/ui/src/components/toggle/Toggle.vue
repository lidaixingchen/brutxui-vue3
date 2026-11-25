<script setup lang="ts">
import { computed } from 'vue'
import { Toggle as TogglePrimitive, VisuallyHidden } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { Loader2 } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useNativeFormReset, vNativeFormValue } from '@/lib/native-form-reset'
import { toggleVariants } from './toggle-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

type ToggleVariantProps = VariantProps<typeof toggleVariants>

interface ToggleProps {
    modelValue?: boolean
    defaultValue?: boolean
    variant?: NonNullable<ToggleVariantProps['variant']>
    size?: NonNullable<ToggleVariantProps['size']>
    disabled?: boolean
    loading?: boolean
    class?: string
    /** 无障碍标签 */
    ariaLabel?: string
    /** 表单字段名；仅在按下且未禁用时提交。 */
    name?: string
    /** 要求此切换处于按下状态。 */
    required?: boolean
}

const props = withDefaults(defineProps<ToggleProps>(), {
    modelValue: undefined,
    defaultValue: false,
    variant: 'default',
    size: 'default',
    disabled: false,
    loading: false,
    class: undefined,
    ariaLabel: undefined,
    name: undefined,
    required: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { value: pressed, resetValue, updateValue, bindFormReset } = useNativeFormReset(
    () => props.modelValue,
    props.defaultValue,
)

function onUserToggle(next: boolean) {
    updateValue(next)
    emit('update:modelValue', next)
}

const TOGGLE_SIZE_TO_ICON: Record<NonNullable<ToggleVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'md',
    lg: 'lg',
}

const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() =>
    cn(
        toggleVariants({ variant: props.variant, size: props.size }),
        props.loading && 'relative',
        isDisabled.value && 'pointer-events-none',
        props.class,
    )
)

const loaderClasses = computed(() =>
    cn(
        iconSizeVariants({ size: TOGGLE_SIZE_TO_ICON[props.size] }),
        'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin motion-reduce:animate-none'
    )
)
</script>

<template>
    <TogglePrimitive
        :model-value="pressed"
        :disabled="isDisabled"
        :name="undefined"
        :required="false"
        :class="classes"
        :aria-label="ariaLabel"
        :aria-busy="loading || undefined"
        @update:model-value="onUserToggle"
        @vue:mounted="bindFormReset"
        @vue:updated="bindFormReset"
    >
        <span v-if="loading" class="inline-flex items-center gap-2 opacity-0">
            <slot />
        </span>
        <slot v-else />
        <Loader2 v-if="loading" :class="loaderClasses" aria-hidden="true" />
        <VisuallyHidden
            v-if="name || required"
            v-native-form-value="{ current: pressed, initial: resetValue }"
            as="input"
            feature="fully-hidden"
            type="checkbox"
            :form="$attrs.form"
            :name="name"
            :checked="pressed"
            value="true"
            :required="required"
            :disabled="isDisabled"
        />
    </TogglePrimitive>
</template>
