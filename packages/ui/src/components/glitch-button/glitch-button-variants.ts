import { cva } from 'class-variance-authority'
import { baseButtonVariants } from '../button/shared-button-variants'

export const glitchButtonVariants = cva(
    [
        'glitch-button',
        'relative inline-flex items-center justify-center gap-2',
        'border-3 border-brutal',
        'font-black tracking-wide',
        'transition-all duration-150',
        'focus:outline focus:outline-[3px] focus:outline-brutal-ring focus:outline-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
    ],
    {
        variants: {
            ...baseButtonVariants.variants,
            speed: {
                slow: '[--glitch-duration:800ms]',
                medium: '[--glitch-duration:300ms]',
                fast: '[--glitch-duration:100ms]',
            },
            direction: {
                horizontal: 'glitch-horizontal',
                vertical: 'glitch-vertical',
                both: 'glitch-both',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            speed: 'medium',
            direction: 'horizontal',
        },
    }
)
