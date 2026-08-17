<script setup lang="ts">
import { computed, ref } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { switchRootVariants, switchThumbVariants } from './switch-variants'
import { useLocale } from '@/composables/useLocale'

type SwitchRootVariantProps = VariantProps<typeof switchRootVariants>

interface SwitchProps {
    class?: string
    modelValue?: boolean | null
    defaultValue?: boolean
    defaultChecked?: boolean
    disabled?: boolean
    variant?: NonNullable<SwitchRootVariantProps['variant']>
    size?: NonNullable<SwitchRootVariantProps['size']>
    /** 无障碍标签，未提供时使用 locale 默认值 */
    ariaLabel?: string
}

const props = withDefaults(defineProps<SwitchProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    defaultChecked: undefined,
    disabled: false,
    variant: 'default',
    size: 'default',
    class: undefined,
    ariaLabel: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const { t } = useLocale()

const resolvedAriaLabel = computed(() => props.ariaLabel?.trim() || t('switch.toggle'))

const internalValue = ref(props.defaultValue ?? props.defaultChecked ?? false)
const isControlled = computed(() => props.modelValue !== undefined && props.modelValue !== null)
const currentValue = computed({
    get: () => (isControlled.value ? Boolean(props.modelValue) : internalValue.value),
    set: (val: boolean) => {
        if (!isControlled.value) {
            internalValue.value = val
        }
        emit('update:modelValue', val)
    },
})

const classes = computed(() =>
    cn(switchRootVariants({ variant: props.variant, size: props.size }), props.class)
)

const thumbClasses = computed(() =>
    cn(switchThumbVariants({ size: props.size }))
)
</script>

<template>
    <SwitchRoot
        :class="classes"
        :model-value="currentValue"
        :disabled="disabled"
        :aria-label="resolvedAriaLabel"
        @update:model-value="currentValue = $event"
    >
        <SwitchThumb :class="thumbClasses" />
    </SwitchRoot>
</template>
