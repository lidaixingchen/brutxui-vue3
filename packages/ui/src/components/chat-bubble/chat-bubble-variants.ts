import { cva } from 'class-variance-authority';

export const chatBubbleVariants = cva(
    [
        'relative max-w-[75%]',
        'border-3 border-brutal rounded-brutal',
        'font-medium leading-relaxed',
        'shadow-brutal',
    ],
    {
        variants: {
            variant: {
                sent: 'bg-brutal-primary text-brutal-primary-foreground ml-auto',
                received: 'bg-brutal-bg text-brutal-fg mr-auto',
                system: 'bg-brutal-muted text-brutal-fg mx-auto text-center italic border-dashed shadow-none',
            },
            color: {
                default: '',
                primary: '',
                accent: '',
            },
            size: {
                sm: 'px-3 py-1.5 text-xs',
                default: 'px-4 py-2.5 text-sm',
                lg: 'px-5 py-3.5 text-base',
            },
        },
        compoundVariants: [
            {
                variant: 'sent',
                color: 'accent',
                class: 'bg-brutal-accent text-brutal-accent-foreground',
            },
            {
                variant: 'system',
                class: 'text-xs',
            },
        ],
        defaultVariants: {
            variant: 'received',
            color: 'default',
            size: 'default',
        },
    }
);

export const chatAvatarVariants = cva(
    [
        'flex-shrink-0 rounded-brutal border-3 border-brutal',
        'flex items-center justify-center font-bold',
        'bg-brutal-secondary text-brutal-secondary-foreground',
    ],
    {
        variants: {
            size: {
                sm: 'w-6 h-6 text-[10px]',
                default: 'w-8 h-8 text-xs',
                lg: 'w-10 h-10 text-sm',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
);
