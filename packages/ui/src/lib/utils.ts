import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const FOCUS_RING_CLASSES =
    'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brutal-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-brutal-black'

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}
