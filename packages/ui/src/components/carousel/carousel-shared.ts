import { cn } from '@/lib/utils';
import { brutalHoverLiftNoX, brutalHoverLiftSmNoX, brutalPress } from '@/lib/brutal-interaction-variants';
import { carouselButtonVariants } from './carousel-variants';

export const dotActiveClasses = cn(
    'w-3 h-3 border-3 border-brutal rounded-brutal cursor-pointer transition-all duration-150',
    'bg-brutal-primary shadow-brutal',
    brutalHoverLiftNoX,
    brutalPress
);

export const dotInactiveClasses = cn(
    'w-3 h-3 border-3 border-brutal rounded-brutal cursor-pointer transition-all duration-150',
    'bg-brutal-bg hover:bg-brutal-muted',
    brutalHoverLiftSmNoX,
    brutalPress
);

export const prevButtonClasses = cn(carouselButtonVariants({ direction: 'prev' }));

export const nextButtonClasses = cn(carouselButtonVariants({ direction: 'next' }));
