import { cva } from 'class-variance-authority';

export const counterVariants = cva(
    [
        'inline-flex items-baseline tabular-nums whitespace-nowrap',
        'font-black',
        'max-w-full min-w-0',
    ],
    {
        variants: {
            variant: {
                default: 'text-brutal-fg',
                primary: 'text-brutal-primary',
                accent: 'text-brutal-accent',
                success: 'text-brutal-success',
                danger: 'text-brutal-destructive',
            },
            size: {
                sm: 'text-2xl',
                md: 'text-4xl',
                lg: 'text-6xl',
                xl: 'text-8xl',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);
