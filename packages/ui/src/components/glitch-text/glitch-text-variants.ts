import { cva } from 'class-variance-authority'

export const glitchTextVariants = cva(
    [
        'glitch-text',
        'relative inline-block',
        'font-black tracking-wide',
        'text-brutal-fg',
        'transition-all duration-150',
        'hover:shadow-brutal hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
    ],
    {
        variants: {
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
            speed: 'medium',
            direction: 'horizontal',
        },
    }
)
