import { cva } from 'class-variance-authority'

export const progressRootVariants = cva(
    [
        'relative w-full overflow-hidden rounded-brutal',
        'border-3 border-brutal bg-brutal-bg',
        // 轨道底槽内嵌凹槽：进度条深陷外壳的机械物理关系
        'shadow-brutal-inset',
    ],
    {
        variants: {
            size: {
                sm: 'h-3',
                default: 'h-6',
                lg: 'h-8',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const progressIndicatorVariants = cva(
    [
        'h-full w-full transition-all duration-300 ease-out',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-primary',
                secondary: 'bg-brutal-secondary',
                accent: 'bg-brutal-accent',
                success: 'bg-brutal-success',
                danger: 'bg-brutal-destructive',
            },
            /* 填充纹理：LED 电池格分段 / 警戒斜纹动画，与色系正交叠加 */
            pattern: {
                none: '',
                segmented:
                    'bg-[image:repeating-linear-gradient(90deg,transparent_0px,transparent_6px,var(--brutal-bg,#ffffff)_6px,var(--brutal-bg,#ffffff)_10px)]',
                hazard: 'bg-pattern-hazard animate-brutal-hazard',
            },
        },
        defaultVariants: {
            variant: 'default',
            pattern: 'none',
        },
    }
)
