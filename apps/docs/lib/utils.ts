import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getVariantClass(
    variants: Record<string, string>,
    variant: string,
    fallback: string = ''
): string {
    return variants[variant] || fallback;
}

export const brutalismClasses = {
    base: 'nb-border nb-shadow nb-font nb-no-radius nb-transition',
    interactive: 'nb-hover nb-active nb-focus nb-disabled',
    button: 'nb-btn',
    card: 'nb-card',
    input: 'nb-input',
} as const;
