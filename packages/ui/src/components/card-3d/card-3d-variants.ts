import { cva } from 'class-variance-authority'

// 阴影偏移量（px）：仅 default 派生 DEFAULT_CARD3D_OFFSET_PX，作为组件读取
// --card3d-offset 失败时的 JS 回退值。lg/xl 不在此配置，由下方 shadow 变体的
// arbitrary property 类名（静态字面量）单独定义——Tailwind v4 只在源码中扫描
// 完整类名，运行时拼接无法识别，故配置表只维护 default 的 JS 回退关系。
export const CARD3D_SHADOW_OFFSETS = {
    default: 4,
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
