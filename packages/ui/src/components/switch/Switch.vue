<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { switchRootVariants, switchThumbVariants } from './switch-variants'
import { useLocale } from '@/composables/useLocale'

type SwitchRootVariantProps = VariantProps<typeof switchRootVariants>

interface SwitchProps {
    class?: string
    modelValue?: boolean
    disabled?: boolean
    variant?: NonNullable<SwitchRootVariantProps['variant']>
    size?: NonNullable<SwitchRootVariantProps['size']>
    /** 无障碍标签，未提供时使用 locale 默认值 */
    ariaLabel?: string
}

const props = withDefaults(defineProps<SwitchProps>(), {
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

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('switch.toggle'))

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
        :model-value="modelValue"
        :disabled="disabled"
        :aria-label="resolvedAriaLabel"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <SwitchThumb :class="thumbClasses" />
    </SwitchRoot>
</template>
