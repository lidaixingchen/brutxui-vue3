import { cva } from 'class-variance-authority'

export const DEFAULT_CARD3D_OFFSET_PX = 4

export const card3dVariants = cva(
    [
        'relative',
        'border-3 border-brutal',
        'rounded-brutal',
        'transition-transform duration-200 ease-out',
    ],
    {
        variants: {
            shadow: {
                default: `[--card3d-offset:${DEFAULT_CARD3D_OFFSET_PX}px]`,
                lg: '[--card3d-offset:8px]',
                xl: '[--card3d-offset:12px]',
            },
            variant: {
                default: 'bg-brutal-bg text-brutal-fg',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                accent: 'bg-brutal-accent text-brutal-accent-foreground',
                muted: 'bg-brutal-muted text-brutal-muted-foreground',
            },
        },
        defaultVariants: {
            shadow: 'default',
            variant: 'default',
        },
    }
)

export const card3dShadowClasses =
    'absolute inset-0 border-3 border-brutal rounded-brutal bg-brutal-fg transition-transform duration-200 ease-out -z-10'
