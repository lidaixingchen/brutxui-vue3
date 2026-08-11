import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress, brutalPressedState } from '@/lib/brutal-interaction-variants'

export const copyToClipboardVariants = cva(
    [
        'inline-flex items-center justify-center gap-2 font-black tracking-wide',
        'border-3 border-brutal transition-all duration-150',
        'rounded-brutal shadow-brutal select-none cursor-pointer',
        'disabled:opacity-50 disabled:pointer-events-none',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-bg text-brutal-fg',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                outline: 'bg-transparent text-brutal-fg',
            },
            size: {
                sm: 'h-9 px-3 text-sm',
                default: 'h-11 px-5 text-base',
                lg: 'h-14 px-7 text-lg',
            },
            state: {
                idle: `hover:bg-brutal-muted ${brutalHoverLift} ${brutalPress}`,
                // transition-none：copied/failed 为「保持按下」的瞬时状态，配合 base 的
                // transition-all 会使状态切回时重放 2px 位移过渡（弹回残留）；twMerge 下
                // transition-none 与 transition-all 同组，后者被可靠移除
                copied: `bg-brutal-success text-brutal-fg ${brutalPressedState} transition-none`,
                failed: `bg-brutal-destructive text-brutal-destructive-foreground ${brutalPressedState} transition-none`,
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            state: 'idle',
        },
    }
)
