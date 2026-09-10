import type { VariantProps } from 'class-variance-authority'
import type { countdownVariants } from './countdown-variants'
import type { StatisticContentVariantProps } from '../statistic/types'

export type CountdownVariantProps = VariantProps<typeof countdownVariants>

export type CountdownValue = number | string | Date | null | undefined

export interface CountdownProps {
    value?: CountdownValue
    format?: string
    title?: string
    prefix?: string
    suffix?: string
    placeholder?: string
    variant?: NonNullable<CountdownVariantProps['variant']>
    size?: NonNullable<StatisticContentVariantProps['size']>
    class?: string
}

export interface CountdownEmits {
    finish: []
    change: [remaining: number]
}
