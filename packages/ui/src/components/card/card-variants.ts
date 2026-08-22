import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'

export const cardVariants = cva(
    [
        'border-3 border-brutal',
        'rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'transition-all duration-150',
    ],
    {
        variants: {
            variant: {
                default: 'shadow-brutal',
                elevated: 'shadow-brutal-lg',
                flat: 'shadow-none',
                interactive: [
                    'shadow-brutal',
                    brutalHoverLift,
                    brutalPress,
                    'cursor-pointer',
                ],
                primary: 'shadow-brutal-primary border-brutal-primary',
                secondary: 'shadow-brutal-secondary border-brutal-secondary',
                'primary-subtle': 'bg-brutal-primary-subtle shadow-brutal',
                'secondary-subtle': 'bg-brutal-secondary-subtle shadow-brutal',
                'accent-subtle': 'bg-brutal-accent-subtle shadow-brutal',
                'destructive-subtle': 'bg-brutal-destructive-subtle shadow-brutal',
                'success-subtle': 'bg-brutal-success-subtle shadow-brutal',
                'info-subtle': 'bg-brutal-info-subtle shadow-brutal',
            },
            padding: {
                none: 'p-0',
                sm: 'p-3',
                default: 'p-5',
                lg: 'p-8',
            },
            /* 背景纹理：与底色叠加，仅装饰容器使用（正文主卡默认保持干净纯色） */
            texture: {
                none: '',
                grid: 'bg-pattern-grid',
                dots: 'bg-pattern-dots',
            },
            /* HUD 装饰形态：四角十字准星（工业仪器标定感），纯装饰层 */
            deco: {
                none: '',
                hud: 'hud-crosshairs',
            },
        },
        defaultVariants: {
            variant: 'default',
            padding: 'default',
            texture: 'none',
            deco: 'none',
        },
    }
)
