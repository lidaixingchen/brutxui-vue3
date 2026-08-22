import { cva } from 'class-variance-authority'
import { brutalHoverLift } from '@/lib/brutal-interaction-variants'

/** 相框根容器：实体边框与硬投影承载拍立得实体感，悬浮上浮遵循 R5 */
export const imageCardVariants = cva(
    [
        'border-3 border-brutal',
        'rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'shadow-brutal',
        'overflow-hidden',
        'transition-all duration-150',
        brutalHoverLift,
    ],
    {
        variants: {},
        defaultVariants: {},
    },
)

/** 图片展示区：固定宽高比锁定相框几何 */
export const imageCardImageVariants = cva(['block w-full object-cover'], {
    variants: {
        aspect: {
            '4/3': 'aspect-4/3',
            video: 'aspect-video',
            square: 'aspect-square',
        },
    },
    defaultVariants: {
        aspect: '4/3',
    },
})

/** 标签描述底栏：实体粗黑线隔断 + 高对比主题色底，accent 决定底栏色族 */
export const imageCardFooterVariants = cva(['border-t-3 border-brutal', 'p-4'], {
    variants: {
        accent: {
            primary: 'bg-brutal-primary text-brutal-primary-foreground',
            secondary: 'bg-brutal-secondary text-brutal-secondary-foreground',
            accent: 'bg-brutal-accent text-brutal-accent-foreground',
            destructive: 'bg-brutal-destructive text-brutal-destructive-foreground',
            success: 'bg-brutal-success text-brutal-success-foreground',
            info: 'bg-brutal-info text-brutal-info-foreground',
            muted: 'bg-brutal-muted text-brutal-muted-foreground',
        },
    },
    defaultVariants: {
        accent: 'primary',
    },
})
