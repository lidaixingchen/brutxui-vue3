'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '../lib/utils';

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SliderPrimitive.Root
        ref={ref}
        className={cn(
            'relative flex w-full touch-none select-none items-center',
            className
        )}
        {...props}
    >
        <SliderPrimitive.Track
            className={cn(
                'relative h-5 w-full grow overflow-hidden rounded-full',
                'border-3 border-brutal bg-white dark:bg-gray-800',
                'shadow-brutal-sm'
            )}
        >
            <SliderPrimitive.Range className="absolute h-full bg-brutal-secondary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
            className={cn(
                'block h-6 w-6 rounded-full',
                'border-3 border-brutal bg-brutal-accent',
                'shadow-brutal-sm',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                'hover:scale-110 active:scale-95',
                'cursor-grab active:cursor-grabbing'
            )}
        />
    </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
