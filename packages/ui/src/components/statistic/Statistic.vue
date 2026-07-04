<script setup lang="ts">
import { type Component, type CSSProperties } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import Counter from '../counter/Counter.vue'
import { counterVariants } from '../counter/counter-variants'
import { cn } from '@/lib/utils'

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
    <div
        :class="cn(
            'flex flex-col min-w-0',
            card && 'p-4 border-2 border-brutal-black dark:border-white bg-white dark:bg-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]',
            props.class
        )"
    >
        <span 
            v-if="title || $slots.title" 
            class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 select-none"
        >
            <slot name="title">{{ title }}</slot>
        </span>
        
        <div :style="valueStyle">
            <Counter
                :to="value"
                :decimals="precision"
                :separator="groupSeparator"
                :prefix="prefix"
                :suffix="suffix"
                :prefix-component="prefixComponent"
                :suffix-component="suffixComponent"
                :variant="variant"
                :size="size"
                class="!font-black text-inherit"
            />
        </div>
    </div>
</template>
