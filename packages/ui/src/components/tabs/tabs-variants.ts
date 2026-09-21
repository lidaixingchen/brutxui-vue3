import { cva, type VariantProps } from 'class-variance-authority'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const tabsListVariants = cva(
    [
        'inline-flex justify-center p-1 gap-1',
        'bg-brutal-bg border-3 border-brutal shadow-brutal-sm rounded-brutal',
    ],
    {
        variants: {
            size: {
                sm: '',
                default: '',
                lg: '',
            },
            orientation: {
                horizontal: 'items-center max-w-full overflow-x-auto',
                vertical: 'flex-col items-stretch w-fit max-w-full overflow-x-auto',
            },
        },
        compoundVariants: [
            { size: 'sm', orientation: 'horizontal', class: 'h-9' },
            { size: 'default', orientation: 'horizontal', class: 'h-11' },
            { size: 'lg', orientation: 'horizontal', class: 'h-14' },
            { size: 'sm', orientation: 'vertical', class: 'min-w-28' },
            { size: 'default', orientation: 'vertical', class: 'min-w-36' },
            { size: 'lg', orientation: 'vertical', class: 'min-w-44' },
        ],
        defaultVariants: {
            size: 'default',
            orientation: 'horizontal',
        },
    }
)

export const tabsTriggerVariants = cva(
    [
        'inline-flex items-center justify-center whitespace-nowrap px-3 h-full',
        'font-bold text-sm tracking-wide',
        'border-3 border-transparent',
        'rounded-brutal',
        'transition-all duration-150 motion-reduce:transition-none',
        FOCUS_RING_CLASSES,
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:border-brutal data-[state=active]:shadow-none',
        'data-[state=inactive]:text-brutal-fg data-[state=inactive]:hover:bg-brutal-muted data-[state=inactive]:shadow-none',
    ],
    {
        variants: {
            variant: {
                default: 'data-[state=active]:bg-brutal-primary data-[state=active]:text-brutal-primary-foreground',
                primary: 'data-[state=active]:bg-brutal-primary data-[state=active]:text-brutal-primary-foreground',
                secondary: 'data-[state=active]:bg-brutal-secondary data-[state=active]:text-brutal-secondary-foreground',
                accent: 'data-[state=active]:bg-brutal-accent data-[state=active]:text-brutal-accent-foreground',
                success: 'data-[state=active]:bg-brutal-success data-[state=active]:text-brutal-success-foreground',
                /* 打卡机插片：等宽大写标签，激活时上移插入槽位、底边厚线锁定 */
                slots: [
                    'font-mono text-xs uppercase tracking-widest px-2',
                    'border-b-4 border-b-transparent rounded-none',
                    'data-[state=active]:bg-brutal-bg data-[state=active]:text-brutal-primary',
                    'data-[state=active]:border-b-brutal-primary data-[state=active]:shadow-none',
                    'data-[state=active]:-translate-y-0.5',
                    'data-[state=inactive]:shadow-none data-[state=inactive]:border-b-4 data-[state=inactive]:border-b-transparent',
                ],
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const tabsContentVariants = cva(
    [
        'mt-3',
        FOCUS_RING_CLASSES,
    ],
    {
        variants: {
            surface: {
                plain: 'p-0',
                panel: 'p-6 bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal rounded-brutal',
            },
        },
        defaultVariants: {
            surface: 'plain',
        },
    }
)

export type TabsContentVariantProps = VariantProps<typeof tabsContentVariants>
export type TabsContentSurface = NonNullable<TabsContentVariantProps['surface']>
