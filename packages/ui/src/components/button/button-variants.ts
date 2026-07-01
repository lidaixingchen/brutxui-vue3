import { cva } from 'class-variance-authority'
import { baseButtonVariants } from './shared-button-variants'

export const buttonVariants = cva(
    [
        'inline-flex items-center justify-center gap-2',
        'border-3 border-brutal',
        'rounded-brutal',
        'font-black tracking-wide',
        'transition-all duration-150',
        'focus:outline focus:outline-[3px] focus:outline-brutal-ring focus:outline-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
    ],
    baseButtonVariants
)
