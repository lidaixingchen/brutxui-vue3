<script setup lang="ts">
import { type Component, type CSSProperties } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import Counter from '../counter/Counter.vue'
import { counterVariants } from '../counter/counter-variants'

type CounterVariantProps = VariantProps<typeof counterVariants>;

interface StatisticProps {
    value: number
    title?: string
    precision?: number
    decimalSeparator?: string
    groupSeparator?: string
    prefix?: string
    suffix?: string
    prefixComponent?: Component
    suffixComponent?: Component
    valueStyle?: CSSProperties
    class?: string
    card?: boolean
    variant?: NonNullable<CounterVariantProps['variant']>
    size?: NonNullable<CounterVariantProps['size']>
}

const props = withDefaults(defineProps<StatisticProps>(), {
    title: undefined,
    precision: 0,
    decimalSeparator: '.',
    groupSeparator: ',',
    prefix: '',
    suffix: '',
    prefixComponent: undefined,
    suffixComponent: undefined,
    valueStyle: undefined,
    class: undefined,
    card: false,
    variant: 'default',
    size: 'md',
})
</script>

<template>
    <Counter
        :to="value"
        :decimals="precision"
        :decimal-separator="decimalSeparator"
        :separator="groupSeparator"
        :prefix="prefix"
        :suffix="suffix"
        :prefix-component="prefixComponent"
        :suffix-component="suffixComponent"
        :variant="variant"
        :size="size"
        :title="title"
        :card="card"
        :value-style="valueStyle"
        :class="props.class"
    >
        <template v-if="$slots.title" #title>
            <slot name="title" />
        </template>
    </Counter>
</template>
