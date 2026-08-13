import { cva } from 'class-variance-authority'
import { brutalHoverLiftSm, brutalPress, brutalPressedStateOn } from '@/lib/brutal-interaction-variants'
import { FOCUS_OUTLINE_CLASSES } from '@/lib/utils'

export const toggleVariants = cva(
    [
        'inline-flex items-center justify-center gap-2 text-sm font-black tracking-wide',
        'border-3 border-brutal rounded-brutal transition-all duration-150',
        FOCUS_OUTLINE_CLASSES,
        'disabled:pointer-events-none disabled:opacity-50',
        brutalPress,
    ],
    {
        variants: {
            variant: {
                default: [
                    'bg-brutal-bg text-brutal-fg shadow-brutal-sm',
                    `hover:bg-brutal-muted ${brutalHoverLiftSm}`,
                    // ON 态保持按下：位移+去影（复用 brutalPressedStateOn 共享变体，
                    // 与 brutalPress 同源派生，避免手抄 fallback 脱同步；translate-x-[阴影偏移] 覆盖 hoverLift 的 X 轴侧滑）
                    'data-[state=on]:bg-brutal-primary data-[state=on]:text-brutal-primary-foreground',
                    brutalPressedStateOn,
                ],
                outline: [
                    'bg-transparent text-brutal-fg border-3 border-brutal shadow-brutal-sm',
                    `hover:bg-brutal-muted ${brutalHoverLiftSm}`,
                    // 同上：ON 态保持按下复用共享变体
                    'data-[state=on]:bg-brutal-secondary data-[state=on]:text-brutal-secondary-foreground',
                    brutalPressedStateOn,
                ],
            },
            size: {
                default: 'h-10 px-3 min-w-10',
                sm: 'h-8 px-2 min-w-8 text-xs',
                lg: 'h-12 px-4 min-w-12',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
