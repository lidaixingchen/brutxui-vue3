import { cva } from 'class-variance-authority';

export const kbdVariants = cva(
    [
        'inline-flex items-center justify-center',
        'font-mono font-black',
        'border-3 border-brutal rounded-brutal',
        'shadow-brutal-sm',
        'select-none whitespace-nowrap',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-muted text-brutal-fg',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                secondary: 'bg-brutal-secondary text-brutal-secondary-foreground',
                accent: 'bg-brutal-accent text-brutal-accent-foreground',
            },
            size: {
                sm: 'px-1.5 py-0.5 text-xs min-w-[1.25rem]',
                md: 'px-2 py-1 text-sm min-w-[1.75rem]',
                lg: 'px-3 py-1.5 text-base min-w-[2.25rem]',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);
