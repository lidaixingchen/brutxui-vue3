import { cva } from 'class-variance-authority';

export const stepperDotVariants = cva(
    [
        'flex-shrink-0 flex items-center justify-center',
        'border-3 border-brutal rounded-brutal font-black',
        'transition-all duration-200',
        'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        'z-10 relative',
    ],
    {
        variants: {
            state: {
                completed: 'bg-brutal-success text-brutal-success-foreground shadow-brutal',
                active: 'shadow-brutal-lg',
                upcoming: 'bg-brutal-bg text-brutal-fg shadow-brutal-sm opacity-60',
            },
            size: {
                sm: 'w-6 h-6 text-xs',
                default: 'w-8 h-8 text-sm',
                lg: 'w-10 h-10 text-base',
            },
            variant: {
                default: 'bg-brutal-primary text-brutal-primary-foreground',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                accent: 'bg-brutal-accent text-brutal-accent-foreground',
            },
        },
        defaultVariants: {
            state: 'upcoming',
            size: 'default',
        },
    }
);

export const stepperConnectorVariants = cva(
    [
        'transition-all duration-300',
    ],
    {
        variants: {
            orientation: {
                horizontal: 'flex-1 h-[3px] mx-2',
                vertical: 'w-[var(--brutal-border-width,3px)] flex-1 my-2 ml-[calc(var(--brutal-border-width,3px)/2+1rem/2-3px/2)]',
            },
            completed: {
                true: 'bg-brutal-success',
                false: 'bg-brutal-fg opacity-20',
            },
        },
        defaultVariants: {
            orientation: 'horizontal',
            completed: false,
        },
    }
);
