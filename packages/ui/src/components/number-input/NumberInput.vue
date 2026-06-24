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
import { useLocale } from '@/composables/useLocale'

interface NumberInputProps extends NumberFieldRootProps {
    layout?: 'split' | 'stacked'
    placeholder?: string
    class?: string
}

const props = withDefaults(defineProps<NumberInputProps>(), {
    layout: 'split',
    placeholder: undefined,
    class: undefined,
})

const emits = defineEmits<NumberFieldRootEmits>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('numberInput.placeholder'))

const delegatedProps = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { class: _, layout: __, placeholder: ___, ...delegated } = props
    return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

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
</script>

<template>
    <NumberFieldRoot v-bind="forwarded" :class="containerClasses">
        <template v-if="layout === 'split'">
            <NumberFieldDecrement :class="decrementClasses">
                <Minus class="h-4 w-4 stroke-[3]" />
            </NumberFieldDecrement>

            <NumberFieldInput
                :placeholder="resolvedPlaceholder"
                :class="fieldClasses"
            />

            <NumberFieldIncrement :class="incrementClasses">
                <Plus class="h-4 w-4 stroke-[3]" />
            </NumberFieldIncrement>
        </template>

        <template v-else>
            <NumberFieldInput
                :placeholder="resolvedPlaceholder"
                :class="fieldClasses"
            />

            <div class="flex flex-col border-l-3 border-brutal w-10 shrink-0">
                <NumberFieldIncrement :class="incrementClasses">
                    <ChevronUp class="h-4 w-4 stroke-[3]" />
                </NumberFieldIncrement>
                <NumberFieldDecrement :class="decrementClasses">
                    <ChevronDown class="h-4 w-4 stroke-[3]" />
                </NumberFieldDecrement>
            </div>
        </template>
    </NumberFieldRoot>
</template>
