import { cva } from 'class-variance-authority'

export const alertVariants = cva(
    [
        'relative w-full p-4',
        'border-3 border-brutal',
        'rounded-brutal',
        'shadow-brutal',
        '[&>svg~*]:pl-8 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
        '[&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-bg text-brutal-fg',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                secondary: 'bg-brutal-secondary text-brutal-secondary-foreground',
                success: 'bg-brutal-success text-brutal-success-foreground',
                // warning 语义复用 accent 令牌：--color-brutal-warning 别名 token 已按 ui-styles 决策删除，
                // 全库（含 message）统一以 accent 表达警示语义，勿改回独立 warning 令牌
                warning: 'bg-brutal-accent text-brutal-accent-foreground',
                danger: 'bg-brutal-destructive text-brutal-destructive-foreground',
                info: 'bg-brutal-info text-brutal-info-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
