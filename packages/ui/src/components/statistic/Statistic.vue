<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import type { StatisticProps, StatisticValue } from './types'
import {
    statisticVariants,
    statisticTitleVariants,
    statisticContentVariants,
    statisticValueVariants,
    statisticTrendVariants,
} from './statistic-variants'
import { formatStatisticValue } from './statistic-format'

const props = withDefaults(defineProps<StatisticProps>(), {
    value: undefined,
    title: undefined,
    prefix: undefined,
    suffix: undefined,
    precision: undefined,
    decimalSeparator: undefined,
    groupSeparator: undefined,
    formatter: undefined,
    placeholder: undefined,
    trend: undefined,
    trendPlacement: 'end',
    variant: 'default',
    size: 'default',
    locale: undefined,
    class: undefined,
})

defineSlots<{
    title?: (props: { title?: string }) => unknown
    prefix?: (props: { prefix?: string }) => unknown
    suffix?: (props: { suffix?: string }) => unknown
    trend?: (props: { trend: 'up' | 'down'; label: string }) => unknown
    default?: (props: { value: StatisticValue; formattedValue: string }) => unknown
}>()

const { locale: currentLocale, t } = useLocale()

const resolvedLocale = computed(() => {
    if (props.locale) return props.locale
    if (currentLocale.value.code) return currentLocale.value.code
    return 'zh-CN'
})

const resolvedPlaceholder = computed(() => props.placeholder ?? '-')

const formattedValue = computed(() => {
    if (props.formatter) {
        return props.formatter(props.value)
    }
    return formatStatisticValue(props.value, {
        locale: resolvedLocale.value,
        precision: props.precision,
        decimalSeparator: props.decimalSeparator,
        groupSeparator: props.groupSeparator,
        placeholder: resolvedPlaceholder.value,
    })
})

const trendLabel = computed(() => {
    if (props.trend === 'up') return t('statistic.up')
    if (props.trend === 'down') return t('statistic.down')
    return ''
})

const trendIcon = computed(() => (props.trend === 'up' ? ArrowUp : ArrowDown))

const iconSize = computed(() => {
    if (props.size === 'sm') return 'sm'
    if (props.size === 'lg') return 'lg'
    return 'md'
})

const classes = computed(() =>
    cn(statisticVariants({ variant: props.variant }), props.class)
)

const titleClasses = computed(() =>
    cn(statisticTitleVariants({ size: props.size }))
)

const contentClasses = computed(() =>
    cn(statisticContentVariants({ size: props.size }))
)

const valueClasses = computed(() =>
    cn(statisticValueVariants({ size: props.size }))
)

const trendClasses = computed(() =>
    cn(statisticTrendVariants({ trend: props.trend, size: props.size }))
)

const trendIconClasses = computed(() =>
    cn(iconSizeVariants({ size: iconSize.value }), 'stroke-[3]')
)

const prefixClasses = computed(() =>
    cn('text-brutal-muted-foreground font-bold', props.size === 'sm' ? 'text-sm' : props.size === 'lg' ? 'text-xl' : 'text-base')
)

const suffixClasses = computed(() =>
    cn('text-brutal-muted-foreground font-bold', props.size === 'sm' ? 'text-sm' : props.size === 'lg' ? 'text-xl' : 'text-base')
)
</script>

<template>
    <div :class="classes">
        <div v-if="title || $slots.title" :class="titleClasses">
            <slot name="title" :title="title">{{ title }}</slot>
        </div>
        <div :class="contentClasses">
            <span v-if="prefix || $slots.prefix" :class="prefixClasses">
                <slot name="prefix" :prefix="prefix">{{ prefix }}</slot>
            </span>
            <span v-if="trend && trendPlacement === 'start'" :class="trendClasses">
                <slot name="trend" :trend="trend" :label="trendLabel">
                    <component :is="trendIcon" :class="trendIconClasses" aria-hidden="true" />
                    <span class="sr-only">{{ trendLabel }}</span>
                </slot>
            </span>
            <span :class="valueClasses">
                <slot :value="value" :formatted-value="formattedValue">
                    {{ formattedValue }}
                </slot>
            </span>
            <span v-if="trend && trendPlacement === 'end'" :class="trendClasses">
                <slot name="trend" :trend="trend" :label="trendLabel">
                    <component :is="trendIcon" :class="trendIconClasses" aria-hidden="true" />
                    <span class="sr-only">{{ trendLabel }}</span>
                </slot>
            </span>
            <span v-if="suffix || $slots.suffix" :class="suffixClasses">
                <slot name="suffix" :suffix="suffix">{{ suffix }}</slot>
            </span>
        </div>
    </div>
</template>
