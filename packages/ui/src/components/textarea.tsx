import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const textareaVariants = cva(
    [
        'flex min-h-[100px] w-full',
        'border-3 border-brutal rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'font-medium',
        'placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal',
        'transition-all duration-150',
        'focus:outline-none focus:shadow-brutal',
        'focus-visible:ring-2 focus-visible:ring-[var(--brutal-ring,#000)] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-brutal-muted',
        'resize-none',
    ],
    {
        variants: {
            variant: {
                default: '',
                error: 'border-[#EF476F] focus:shadow-[4px_4px_0px_0px_#EF476F]',
                success: 'border-[#7FB069] focus:shadow-[4px_4px_0px_0px_#7FB069]',
            },
            size: {
                sm: 'px-3 py-2 text-sm',
                default: 'px-4 py-3 text-base',
                lg: 'px-5 py-4 text-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface TextareaProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
        VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <textarea
                className={cn(textareaVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
