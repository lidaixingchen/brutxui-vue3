<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { switchRootVariants, switchThumbVariants } from './switch-variants'

type SwitchRootVariantProps = VariantProps<typeof switchRootVariants>

interface SwitchProps {
    class?: string
    modelValue?: boolean
    defaultValue?: boolean
    disabled?: boolean
    variant?: NonNullable<SwitchRootVariantProps['variant']>
    size?: NonNullable<SwitchRootVariantProps['size']>
}

const props = withDefaults(defineProps<SwitchProps>(), {
    disabled: false,
    variant: 'default',
    size: 'default',
    class: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

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
        v-bind="modelValue !== undefined ? { 'model-value': modelValue } : { 'default-value': defaultValue }"
        :disabled="disabled"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <SwitchThumb :class="thumbClasses" />
    </SwitchRoot>
</template>
