'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
    [
        'inline-flex items-center',
        'border-2 border-brutal rounded-brutal',
        'font-bold tracking-wide',
        'transition-colors',
    ],
    {
        variants: {
            variant: {
                default: [
                    'bg-brutal-bg text-brutal-fg',
                    'shadow-brutal-sm',
                ],
                primary: [
                    'bg-brutal-primary text-brutal-fg',
                    'shadow-brutal-sm',
                ],
                secondary: [
                    'bg-brutal-secondary text-brutal-fg',
                    'shadow-brutal-sm',
                ],
                accent: [
                    'bg-brutal-accent text-brutal-fg',
                    'shadow-brutal-sm',
                ],
                danger: [
                    'bg-brutal-destructive text-brutal-fg',
                    'shadow-brutal-sm',
                ],
                success: [
                    'bg-brutal-success text-brutal-fg',
                    'shadow-brutal-sm',
                ],
                outline: 'bg-transparent text-brutal-fg',
            },
            size: {
                sm: 'px-2 py-0.5 text-xs',
                default: 'px-3 py-1 text-sm',
                lg: 'px-4 py-1.5 text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant, size, ...props }, ref) => (
        <div ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props} />
    )
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
