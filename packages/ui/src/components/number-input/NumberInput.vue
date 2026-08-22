<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
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
import { useBrutalHaptics } from '@/composables/useBrutalHaptics'
import { useReducedMotion } from '@/composables/useReducedMotion'

interface NumberInputProps extends NumberFieldRootProps {
    layout?: 'split' | 'stacked'
    variant?: 'default' | 'error' | 'success'
    errorMessage?: string
    placeholder?: string
    class?: string
    iconSize?: IconSize
    /** 显式开启步进按键的机械 click 音效；默认静音 */
    sound?: boolean
}

const props = withDefaults(defineProps<NumberInputProps>(), {
    layout: 'split',
    variant: 'default',
    errorMessage: undefined,
    placeholder: undefined,
    class: undefined,
    iconSize: 'md',
    sound: false,
})

const emit = defineEmits<NumberFieldRootEmits>()

const { t } = useLocale()

const haptics = useBrutalHaptics({ sound: props.sound })
const prefersReducedMotion = useReducedMotion()

/** Drum Ticker：数值变化时输入框做滚轮翻页微动效（reduced-motion 环境瞬时切换） */
const isDrumming = ref(false)
watch(() => props.modelValue, () => {
    if (prefersReducedMotion.value) return
    isDrumming.value = true
})

const resolvedPlaceholder = computed(() => props.placeholder ?? t('numberInput.placeholder'))

const errorId = useId()
const errorTextId = computed(() =>
    props.variant === 'error' && props.errorMessage ? `number-input-error-${errorId}` : undefined
)

const DELEGATED_OMIT_KEYS = new Set([
    'class',
    'layout',
    'variant',
    'errorMessage',
    'placeholder',
    'iconSize',
])

const delegatedProps = computed(() => {
    const entries = Object.entries(props).filter(([key]) => !DELEGATED_OMIT_KEYS.has(key))
    return Object.fromEntries(entries) as Partial<NumberFieldRootProps>
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
    cn(
        numberInputFieldVariants({ layout: props.layout }),
        isDrumming.value && 'animate-brutal-drum',
    )
)

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <div class="w-full">
        <NumberFieldRoot v-bind="forwarded" :class="containerClasses">
            <template v-if="layout === 'split'">
                <NumberFieldDecrement :class="decrementClasses" @click="haptics.click()">
                    <Minus :class="iconClasses" />
                </NumberFieldDecrement>

                <NumberFieldInput
                    :placeholder="resolvedPlaceholder"
                    :aria-invalid="variant === 'error' ? true : undefined"
                    :aria-describedby="errorMessage ? errorTextId : undefined"
                    :class="fieldClasses"
                    @animationend="isDrumming = false"
                />

                <NumberFieldIncrement :class="incrementClasses" @click="haptics.click()">
                    <Plus :class="iconClasses" />
                </NumberFieldIncrement>
            </template>

            <template v-else>
                <NumberFieldInput
                    :placeholder="resolvedPlaceholder"
                    :aria-invalid="variant === 'error' ? true : undefined"
                    :aria-describedby="errorMessage ? errorTextId : undefined"
                    :class="fieldClasses"
                    @animationend="isDrumming = false"
                />

                <div class="flex flex-col border-l-3 border-brutal w-10 shrink-0">
                    <NumberFieldIncrement :class="incrementClasses" @click="haptics.click()">
                        <ChevronUp :class="iconClasses" />
                    </NumberFieldIncrement>
                    <NumberFieldDecrement :class="decrementClasses" @click="haptics.click()">
                        <ChevronDown :class="iconClasses" />
                    </NumberFieldDecrement>
                </div>
            </template>
        </NumberFieldRoot>
        <p
            v-if="variant === 'error' && errorMessage"
            :id="errorTextId"
            class="text-sm text-brutal-destructive mt-1"
            role="alert"
        >
            {{ errorMessage }}
        </p>
    </div>
</template>
