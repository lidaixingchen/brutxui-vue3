import { cn } from '@/lib/utils';
import { carouselButtonVariants } from './carousel-variants';

export const dotActiveClasses = cn(
    'w-3 h-3 border-3 border-brutal rounded-brutal cursor-pointer transition-all duration-150',
    'bg-brutal-primary shadow-brutal',
    'hover:shadow-brutal-lg hover:-translate-y-0.5',
    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'
);

export const dotInactiveClasses = cn(
    'w-3 h-3 border-3 border-brutal rounded-brutal cursor-pointer transition-all duration-150',
    'bg-brutal-bg hover:bg-brutal-muted',
    'hover:shadow-brutal hover:-translate-y-0.5',
    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'
);

export const prevButtonClasses = cn(carouselButtonVariants({ direction: 'prev' }));

export const nextButtonClasses = cn(carouselButtonVariants({ direction: 'next' }));
