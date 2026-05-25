'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
    [
        'inline-flex items-center justify-center gap-2',
        'border-3 border-brutal rounded-brutal',
        'font-black tracking-wide',
        'transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brutal-ring focus:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
    ],
    {
        variants: {
            variant: {
                default: [
                    'bg-brutal-bg text-brutal-fg',
                    'shadow-brutal',
                    'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
                    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
                ],
                primary: [
                    'bg-brutal-primary text-brutal-fg',
                    'shadow-brutal',
                    'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
                    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
                ],
                secondary: [
                    'bg-brutal-secondary text-brutal-fg',
                    'shadow-brutal',
                    'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
                    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
                ],
                accent: [
                    'bg-brutal-accent text-brutal-fg',
                    'shadow-brutal',
                    'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
                    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
                ],
                danger: [
                    'bg-brutal-destructive text-brutal-fg',
                    'shadow-brutal',
                    'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
                    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
                ],
                success: [
                    'bg-brutal-success text-brutal-fg',
                    'shadow-brutal',
                    'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
                    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
                ],
                outline: [
                    'bg-transparent text-brutal-fg',
                    'shadow-brutal',
                    'hover:bg-brutal-fg hover:text-brutal-bg',
                    'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
                    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
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
                lg: 'h-12 px-8 py-3 text-lg',
                xl: 'h-16 px-10 py-4 text-xl',
                icon: 'h-11 w-11 p-0',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            loading = false,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const Comp = asChild ? Slot : 'button';
        const isDisabled = disabled || loading;

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={isDisabled}
                {...props}
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {children}
                    </>
                ) : (
                    children
                )}
            </Comp>
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
