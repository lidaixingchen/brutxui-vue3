<script setup lang="ts">
import { computed } from 'vue'
import {
    NumberFieldRoot,
    type NumberFieldRootProps,
    type NumberFieldRootEmits,
    NumberFieldInput,
    NumberFieldIncrement,
    NumberFieldDecrement,
    useForwardPropsEmits
} from 'reka-ui'
import { Plus, Minus, ChevronUp, ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { numberInputRootVariants, numberInputButtonVariants, numberInputFieldVariants } from './number-input-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

interface NumberInputProps extends NumberFieldRootProps {
    layout?: 'split' | 'stacked'
    variant?: 'default' | 'error' | 'success'
    errorMessage?: string
    placeholder?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<NumberInputProps>(), {
    layout: 'split',
    variant: 'default',
    errorMessage: undefined,
    placeholder: undefined,
    class: undefined,
    iconSize: 'default',
})

const emit = defineEmits<NumberFieldRootEmits>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('numberInput.placeholder'))

const delegatedProps = computed(() => {
    const { class: _, layout: __, variant: ___, errorMessage: ____, placeholder: _____, iconSize: ______, ...delegated } = props
    return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emit)

const containerClasses = computed(() =>
    cn(numberInputRootVariants({ layout: props.layout, variant: props.variant }), props.class)
)

const decrementClasses = computed(() =>
    cn(numberInputButtonVariants({ position: 'decrement', layout: props.layout }))
)

const incrementClasses = computed(() =>
    cn(numberInputButtonVariants({ position: 'increment', layout: props.layout }))
)

const fieldClasses = computed(() =>
    cn(numberInputFieldVariants({ layout: props.layout }))
)

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <div class="w-full">
        <NumberFieldRoot v-bind="forwarded" :class="containerClasses">
            <template v-if="layout === 'split'">
                <NumberFieldDecrement :class="decrementClasses">
                    <Minus :class="iconClasses" />
                </NumberFieldDecrement>

                <NumberFieldInput
                    :placeholder="resolvedPlaceholder"
                    :class="fieldClasses"
                />

                <NumberFieldIncrement :class="incrementClasses">
                    <Plus :class="iconClasses" />
                </NumberFieldIncrement>
            </template>

            <template v-else>
                <NumberFieldInput
                    :placeholder="resolvedPlaceholder"
                    :class="fieldClasses"
                />

                <div class="flex flex-col border-l-3 border-brutal w-10 shrink-0">
                    <NumberFieldIncrement :class="incrementClasses">
                        <ChevronUp :class="iconClasses" />
                    </NumberFieldIncrement>
                    <NumberFieldDecrement :class="decrementClasses">
                        <ChevronDown :class="iconClasses" />
                    </NumberFieldDecrement>
                </div>
            </template>
        </NumberFieldRoot>
        <p
            v-if="variant === 'error' && errorMessage"
            class="text-sm text-brutal-destructive mt-1"
            role="alert"
        >
            {{ errorMessage }}
        </p>
    </div>
</template>
