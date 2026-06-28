import { cva } from 'class-variance-authority'

const avatarColorVariants = {
    default: 'bg-brutal-muted',
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
