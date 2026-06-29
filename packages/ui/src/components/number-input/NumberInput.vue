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
import { cn } from '../../lib/utils'
import { numberInputRootVariants, numberInputButtonVariants, numberInputFieldVariants } from './number-input-variants'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

interface NumberInputProps extends NumberFieldRootProps {
    layout?: 'split' | 'stacked'
    placeholder?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<NumberInputProps>(), {
    layout: 'split',
    placeholder: undefined,
    class: undefined,
    iconSize: 'default',
})

const emit = defineEmits<NumberFieldRootEmits>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('numberInput.placeholder'))

const delegatedProps = computed(() => {
    const { class: _, layout: __, placeholder: ___, iconSize: ____, ...delegated } = props
    return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emit)

const containerClasses = computed(() =>
    cn(numberInputRootVariants({ layout: props.layout }), props.class)
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
</template>
