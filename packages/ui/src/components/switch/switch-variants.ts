import { cva } from 'class-variance-authority'

export const switchRootVariants = cva(
    [
        'peer inline-flex shrink-0 cursor-pointer items-center',
        'border-3 border-brutal rounded-brutal shadow-brutal-sm',
        'transition-all duration-150',
        'hover:shadow-brutal hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
    ],
    {
        variants: {
            variant: {
                default: 'data-[state=checked]:bg-brutal-success data-[state=unchecked]:bg-brutal-bg',
                primary: 'data-[state=checked]:bg-brutal-primary data-[state=unchecked]:bg-brutal-bg',
                secondary: 'data-[state=checked]:bg-brutal-secondary data-[state=unchecked]:bg-brutal-bg',
                accent: 'data-[state=checked]:bg-brutal-accent data-[state=unchecked]:bg-brutal-bg',
                danger: 'data-[state=checked]:bg-brutal-destructive data-[state=unchecked]:bg-brutal-bg',
            },
            size: {
                sm: 'h-6 w-10',
                default: 'h-7 w-12',
                lg: 'h-9 w-16',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

export const switchThumbVariants = cva(
    [
        'pointer-events-none block bg-brutal-fg shadow-brutal-sm transition-transform duration-150 rounded-brutal',
    ],
    {
        variants: {
            size: {
                sm: 'h-4 w-4 data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0.5',
                default: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5',
                lg: 'h-7 w-7 data-[state=checked]:translate-x-[30px] data-[state=unchecked]:translate-x-0.5',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)
