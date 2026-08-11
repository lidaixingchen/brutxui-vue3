import { cva } from 'class-variance-authority'
import { baseButtonVariants } from './shared-button-variants'
import { brutalPress } from '@/lib/brutal-interaction-variants'

export const buttonVariants = cva(
    [
        'inline-flex items-center justify-center gap-2',
        'border-3 border-brutal',
        'rounded-brutal',
        'font-black tracking-wide',
        'transition-all duration-150',
        'focus:outline focus:outline-[3px] focus:outline-brutal-ring focus:outline-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        brutalPress,
    ],
    {
        variants: {
            ...baseButtonVariants.variants,
            effect: {
                none: '',
                glitch: 'glitch-button relative',
            },
            glitchSpeed: {
                slow: '[--glitch-duration:800ms]',
                medium: '[--glitch-duration:300ms]',
                fast: '[--glitch-duration:100ms]',
            },
            glitchDirection: {
                horizontal: 'glitch-horizontal',
                vertical: 'glitch-vertical',
                both: 'glitch-both',
            },
        },
        // glitchSpeed/glitchDirection 不设无条件默认值：否则所有按钮（含 effect: 'none'）都会被
        // 注入 glitch-horizontal / [--glitch-duration:...] 类造成 DOM 污染。
        // 由 Button.vue 仅在 effect === 'glitch' 时透传这两个变体，普通按钮不再输出任何 glitch 类。
        defaultVariants: {
            ...baseButtonVariants.defaultVariants,
            effect: 'none',
        },
    }
)
