import { cva } from 'class-variance-authority';

export const stepperDotVariants = cva(
    [
        'flex-shrink-0 flex items-center justify-center',
        'border-3 border-brutal rounded-brutal font-black text-sm',
        'transition-all duration-200',
        'hover:shadow-brutal hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        'z-10 relative',
    ],
    {
        variants: {
            state: {
                completed: 'bg-brutal-success text-brutal-fg shadow-brutal w-8 h-8',
                active: 'bg-brutal-primary text-brutal-fg shadow-brutal-lg w-8 h-8',
                upcoming: 'bg-brutal-bg text-brutal-fg shadow-brutal-sm w-8 h-8 opacity-60',
            },
        },
        defaultVariants: {
            state: 'upcoming',
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
