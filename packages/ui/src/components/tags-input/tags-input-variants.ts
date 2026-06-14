import { cva } from 'class-variance-authority'

export const tagsInputItemVariants = cva(
    [
        'flex items-center gap-1.5 px-2.5 py-1',
        'border-3 border-brutal font-black text-sm rounded-brutal shadow-brutal-sm transition-all',
        'data-[state=active]:ring-2 data-[state=active]:ring-brutal-ring data-[state=active]:ring-offset-1',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-bg text-brutal-fg',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                secondary: 'bg-brutal-secondary text-brutal-secondary-foreground',
                accent: 'bg-brutal-accent text-brutal-accent-foreground',
                danger: 'bg-brutal-destructive text-brutal-destructive-foreground',
                success: 'bg-brutal-success text-brutal-success-foreground',
            },
        },
        defaultVariants: {
            variant: 'primary',
        },
    }
)
