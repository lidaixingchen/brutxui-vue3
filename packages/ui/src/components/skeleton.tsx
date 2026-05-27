'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const skeletonVariants = cva(['animate-pulse', 'border-3 border-brutal'], {
    variants: {
        variant: {
            default: 'bg-gray-200 dark:bg-gray-800',
            primary: 'bg-[#FF6B6B]/30',
            secondary: 'bg-[#4ECDC4]/30',
            accent: 'bg-[#FFE66D]/30',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

export interface SkeletonProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, variant, ...props }, ref) => {
        return (
            <div ref={ref} className={cn(skeletonVariants({ variant, className }))} {...props} />
        );
    }
);
Skeleton.displayName = 'Skeleton';

const SkeletonText = React.forwardRef<
    HTMLDivElement,
    SkeletonProps & { lines?: number; lastLineWidth?: string }
>(({ className, lines = 3, lastLineWidth = '60%', variant, ...props }, ref) => {
    return (
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    variant={variant}
                    className="h-4"
                    style={{
                        width: index === lines - 1 ? lastLineWidth : '100%',
                    }}
                />
            ))}
        </div>
    );
});
SkeletonText.displayName = 'SkeletonText';

const SkeletonAvatar = React.forwardRef<
    HTMLDivElement,
    SkeletonProps & { size?: 'sm' | 'default' | 'lg' | 'xl' }
>(({ className, size = 'default', variant, ...props }, ref) => {
    const sizeClasses = {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
    };

    return (
        <Skeleton
            ref={ref}
            variant={variant}
            className={cn(sizeClasses[size], className)}
            {...props}
        />
    );
});
SkeletonAvatar.displayName = 'SkeletonAvatar';

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, variant, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'p-4 border-3 border-brutal shadow-brutal',
                    'bg-white dark:bg-gray-900',
                    className
                )}
                {...props}
            >
                <div className="space-y-4">
                    <Skeleton variant={variant} className="h-32 w-full" />
                    <Skeleton variant={variant} className="h-6 w-3/4" />
                    <SkeletonText variant={variant} lines={2} />
                    <div className="flex gap-2">
                        <Skeleton variant={variant} className="h-10 w-24" />
                        <Skeleton variant={variant} className="h-10 w-24" />
                    </div>
                </div>
            </div>
        );
    }
);
SkeletonCard.displayName = 'SkeletonCard';

const SkeletonTable = React.forwardRef<
    HTMLDivElement,
    SkeletonProps & { rows?: number; columns?: number }
>(({ className, rows = 5, columns = 4, variant, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn('border-3 border-brutal overflow-hidden', className)}
            {...props}
        >
            <div className="flex bg-[#FFE66D] border-b-3 border-brutal">
                {Array.from({ length: columns }).map((_, index) => (
                    <div
                        key={`header-${index}`}
                        className={cn(
                            'flex-1 p-3',
                            index < columns - 1 && 'border-r-3 border-brutal'
                        )}
                    >
                        <Skeleton variant={variant} className="h-5 w-3/4 bg-black/20" />
                    </div>
                ))}
            </div>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={`row-${rowIndex}`}
                    className={cn(
                        'flex',
                        rowIndex < rows - 1 && 'border-b-3 border-brutal',
                        rowIndex % 2 === 1 && 'bg-gray-50 dark:bg-gray-800'
                    )}
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <div
                            key={`cell-${rowIndex}-${colIndex}`}
                            className={cn(
                                'flex-1 p-3',
                                colIndex < columns - 1 &&
                                    'border-r-3 border-brutal'
                            )}
                        >
                            <Skeleton
                                variant={variant}
                                className="h-4"
                                style={{ width: `${60 + Math.random() * 30}%` }}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
});
SkeletonTable.displayName = 'SkeletonTable';

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonTable, skeletonVariants };
