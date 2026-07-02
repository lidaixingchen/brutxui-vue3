import { cva } from 'class-variance-authority'
import { brutalHoverLiftSm, brutalPress } from '@/lib/brutal-interaction-variants'

export const toggleVariants = cva(
    [
        'inline-flex items-center justify-center gap-2 text-sm font-black tracking-wide',
        'border-3 border-brutal rounded-brutal transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        brutalPress,
    ],
    {
        variants: {
            variant: {
                default: [
                    'bg-brutal-bg text-brutal-fg shadow-brutal-sm',
                    `hover:bg-brutal-muted ${brutalHoverLiftSm}`,
                    'data-[state=on]:bg-brutal-primary data-[state=on]:text-brutal-primary-foreground data-[state=on]:shadow-none data-[state=on]:translate-y-[var(--brutal-pressed-offset,2px)]',
                ],
                outline: [
                    'bg-transparent text-brutal-fg border-3 border-brutal shadow-brutal-sm',
                    `hover:bg-brutal-muted ${brutalHoverLiftSm}`,
                    'data-[state=on]:bg-brutal-secondary data-[state=on]:text-brutal-secondary-foreground data-[state=on]:shadow-none data-[state=on]:translate-y-[var(--brutal-pressed-offset,2px)]',
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
