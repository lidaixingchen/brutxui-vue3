import { cva } from 'class-variance-authority'

// 容器底色统一为半透明（/20）：作为图片加载瞬间、fallback 延迟显示或直接放置 slot 内容时的
// 柔和底色，透出外层背景。完整不透明背景由 avatarFallbackVariants 在内容层提供，因此
// 无图 + fallback 铺满的默认组合下，容器底色会被 fallback 覆盖——此为设计预期，勿误删。
const avatarColorVariants = {
    default: 'bg-brutal-muted/20',
    primary: 'bg-brutal-primary/20',
    secondary: 'bg-brutal-secondary/20',
    accent: 'bg-brutal-accent/20',
}

export const avatarVariants = cva(
    ['relative flex shrink-0 overflow-hidden', 'border-3 border-brutal'],
    {
        variants: {
            variant: avatarColorVariants,
            size: {
                sm: 'h-8 w-8',
                default: 'h-10 w-10',
                lg: 'h-14 w-14',
                xl: 'h-20 w-20',
            },
            shape: {
                square: '',
                rounded: 'rounded-brutal',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            shape: 'square',
        },
    }
)

// fallback 以 h-full w-full 铺满容器并提供完整不透明背景 + 前景色，保证文字对比度；
// 与容器半透明底色（avatarColorVariants）叠加时，最终配色由 fallback 层决定。
const avatarFallbackColorVariants = {
    default: 'bg-brutal-muted text-brutal-muted-foreground',
    primary: 'bg-brutal-primary text-brutal-primary-foreground',
    secondary: 'bg-brutal-secondary text-brutal-secondary-foreground',
    accent: 'bg-brutal-accent text-brutal-accent-foreground',
}

export const avatarFallbackVariants = cva(
    ['flex h-full w-full items-center justify-center font-bold'],
    {
        variants: {
            variant: avatarFallbackColorVariants,
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
