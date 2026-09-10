import type { VariantProps } from 'class-variance-authority'
import type { statisticVariants, statisticContentVariants } from './statistic-variants'

export type StatisticVariantProps = VariantProps<typeof statisticVariants>
export type StatisticContentVariantProps = VariantProps<typeof statisticContentVariants>

export type StatisticValue = number | string | bigint | null | undefined

export interface StatisticProps {
    value?: StatisticValue
    title?: string
    prefix?: string
    suffix?: string
    precision?: number
    decimalSeparator?: string
    groupSeparator?: string
    formatter?: (value: StatisticValue) => string
    placeholder?: string
    trend?: 'up' | 'down'
    trendPlacement?: 'start' | 'end'
    variant?: NonNullable<StatisticVariantProps['variant']>
    size?: NonNullable<StatisticContentVariantProps['size']>
    locale?: string
    class?: string
}

export interface FormatNumberOptions {
    locale?: string
    precision?: number
    decimalSeparator?: string
    groupSeparator?: string
    placeholder?: string
}
