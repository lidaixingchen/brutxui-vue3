import { cva } from 'class-variance-authority'

// 阴影偏移量（px）单一配置表：default 派生 DEFAULT_CARD3D_OFFSET_PX 作为组件回退值。
// 下方 shadow 变体的 arbitrary property 类因 Tailwind v4 只在源码中扫描字面量类名，
// 必须静态完整写出（运行时拼接的类名不会被识别），修改偏移量时需同步配置表与类名字面量。
export const CARD3D_SHADOW_OFFSETS = {
    default: 4,
    lg: 8,
    xl: 12,
} as const

export const DEFAULT_CARD3D_OFFSET_PX = CARD3D_SHADOW_OFFSETS.default

export const card3dVariants = cva(
    [
        'relative',
        'border-3 border-brutal',
        'rounded-brutal',
        'transition-transform duration-200 ease-out',
    ],
    {
        variants: {
            shadow: {
                default: '[--card3d-offset:4px]',
                lg: '[--card3d-offset:8px]',
                xl: '[--card3d-offset:12px]',
            },
            variant: {
                default: 'bg-brutal-bg text-brutal-fg',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                accent: 'bg-brutal-accent text-brutal-accent-foreground',
                muted: 'bg-brutal-muted text-brutal-muted-foreground',
            },
        },
        defaultVariants: {
            shadow: 'default',
            variant: 'default',
        },
    }
)

// pointer-events-none：阴影层仅作视觉底色，即使 z-index 控制被样式覆盖也不会拦截
// 卡片的 pointermove/click 事件
export const card3dShadowClasses =
    'absolute inset-0 border-3 border-brutal rounded-brutal bg-brutal-fg transition-transform duration-200 ease-out -z-10 pointer-events-none'
