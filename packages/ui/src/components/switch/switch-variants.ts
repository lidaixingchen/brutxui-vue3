import { cva } from 'class-variance-authority'
import { formToggleForegroundColors, formToggleVariantColors } from '@/lib/form-toggle-base'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const switchRootVariants = cva(
    [
        'peer relative inline-flex shrink-0 cursor-pointer items-center',
        'rounded-brutal',
        '[--switch-track-duration:120ms] [--switch-thumb-duration:180ms]',
        '[--switch-thumb-gap:calc(var(--spacing)*0.5)]',
        '[--switch-thumb-size:calc(var(--switch-track-height)-var(--brutal-border-width)*2-var(--switch-thumb-gap)*2)]',
        'h-[var(--switch-track-height)] w-[var(--switch-track-width)]',
        'border-3 border-brutal shadow-brutal-sm',
        'transition-[background-color,color] duration-[var(--switch-track-duration)] ease-out motion-reduce:transition-none',
        'text-brutal-fg',
        FOCUS_RING_CLASSES,
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:select-none',
    ],
    {
        variants: {
            variant: {
                default: `${formToggleVariantColors.default} ${formToggleForegroundColors.default}`,
                primary: `${formToggleVariantColors.primary} ${formToggleForegroundColors.primary}`,
                secondary: `${formToggleVariantColors.secondary} ${formToggleForegroundColors.secondary}`,
                accent: `${formToggleVariantColors.accent} ${formToggleForegroundColors.accent}`,
                danger: `${formToggleVariantColors.danger} ${formToggleForegroundColors.danger}`,
            },
            size: {
                sm: '[--switch-track-height:calc(var(--spacing)*6)] [--switch-track-width:calc(var(--spacing)*11)]',
                default: '[--switch-track-height:calc(var(--spacing)*7.5)] [--switch-track-width:calc(var(--spacing)*14)]',
                lg: '[--switch-track-height:calc(var(--spacing)*9.5)] [--switch-track-width:calc(var(--spacing)*18)]',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

export const switchThumbVariants = cva(
    [
        'pointer-events-none flex items-center justify-center',
        'size-[var(--switch-thumb-size)] bg-current rounded-brutal',
        'data-[state=unchecked]:translate-x-[var(--switch-thumb-gap)]',
        'data-[state=checked]:translate-x-[calc(var(--switch-track-width)-var(--switch-thumb-size)-var(--brutal-border-width)*2-var(--switch-thumb-gap))]',
        'transition-[translate] duration-[var(--switch-thumb-duration)] ease-brutal-snap motion-reduce:transition-none',
    ],
)

export const switchLabelVariants = cva(
    'font-mono text-[10px] font-black leading-none',
    {
        variants: {
            variant: {
                unchecked: 'text-brutal-bg',
                default: 'text-brutal-success',
                primary: 'text-brutal-primary',
                secondary: 'text-brutal-secondary',
                accent: 'text-brutal-accent',
                danger: 'text-brutal-destructive',
            },
        },
        defaultVariants: { variant: 'unchecked' },
    },
)

