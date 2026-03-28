'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const avatarVariants = cva(
    [
        'relative flex shrink-0 overflow-hidden',
        'border-3 border-black dark:border-white',
    ],
    {
        variants: {
            size: {
                sm: 'h-8 w-8',
                default: 'h-10 w-10',
                lg: 'h-14 w-14',
                xl: 'h-20 w-20',
            },
            shape: {
                square: '',
                rounded: 'rounded-lg',
            },
        },
        defaultVariants: {
            size: 'default',
            shape: 'square',
        },
    }
);

export interface AvatarProps
    extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
        VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
    ({ className, size, shape, ...props }, ref) => (
        <AvatarPrimitive.Root
            ref={ref}
            className={cn(avatarVariants({ size, shape }), className)}
            {...props}
        />
    )
);
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Image>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
        ref={ref}
        className={cn('aspect-square h-full w-full object-cover', className)}
        {...props}
    />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Fallback>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
            'flex h-full w-full items-center justify-center',
            'bg-gray-200 dark:bg-gray-700',
            'font-bold text-black dark:text-white',
            className
        )}
        {...props}
    />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback, avatarVariants };
