export const buttonVariantOptions = [
    'default',
    'primary',
    'secondary',
    'accent',
    'danger',
    'success',
    'outline',
    'ghost',
    'link',
] as const

export const buttonSizeOptions = [
    'sm',
    'default',
    'lg',
    'xl',
    'icon',
] as const

export type ButtonVariant = (typeof buttonVariantOptions)[number]
export type ButtonSize = (typeof buttonSizeOptions)[number]

export const baseButtonVariants = {
    variants: {
        variant: {
            default: [
                'bg-brutal-bg text-brutal-fg',
                'shadow-brutal',
                'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
            ],
            primary: [
                'bg-brutal-primary text-brutal-primary-foreground',
                'shadow-brutal',
                'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
            ],
            secondary: [
                'bg-brutal-secondary text-brutal-secondary-foreground',
                'shadow-brutal',
                'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
            ],
            accent: [
                'bg-brutal-accent text-brutal-accent-foreground',
                'shadow-brutal',
                'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
            ],
            danger: [
                'bg-brutal-destructive text-brutal-destructive-foreground',
                'shadow-brutal',
                'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
            ],
            success: [
                'bg-brutal-success text-brutal-success-foreground',
                'shadow-brutal',
                'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
            ],
            outline: [
                'bg-transparent text-brutal-fg',
                'shadow-brutal',
                'hover:bg-brutal-fg hover:text-brutal-bg',
                'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
            ],
            ghost: [
                'bg-transparent text-brutal-fg border-transparent',
                'shadow-none',
                'hover:bg-brutal-muted hover:border-brutal',
            ],
            link: [
                'bg-transparent text-brutal-fg border-transparent',
                'shadow-none underline-offset-4',
                'hover:underline',
            ],
        },
        size: {
            sm: 'h-9 px-3 py-1 text-sm',
            default: 'h-11 px-5 py-2 text-base',
            lg: 'h-14 px-8 py-3 text-lg',
            xl: 'h-16 px-10 py-4 text-xl',
            icon: 'h-11 w-11 p-0',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    } as const,
}
