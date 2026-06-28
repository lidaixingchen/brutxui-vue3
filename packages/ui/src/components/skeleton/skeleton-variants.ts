import { cva, type VariantProps } from 'class-variance-authority'

export const skeletonVariants = cva(
    ['animate-pulse', 'border-3 border-brutal'],
    {
        variants: {
            variant: {
                default: 'bg-brutal-muted',
                primary: 'bg-brutal-primary/30',
                secondary: 'bg-brutal-secondary/30',
                accent: 'bg-brutal-accent/30',
            },
            size: {
                sm: 'h-8',
                default: 'h-10',
                lg: 'h-14',
                xl: 'h-20',
            },
            shape: {
                rect: 'rounded-brutal',
                circle: 'rounded-full',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            shape: 'rect',
        },
    }
)

export const skeletonCircleWidthVariants = {
    sm: 'w-8',
    default: 'w-10',
    lg: 'w-14',
    xl: 'w-20',
} as const

export type SkeletonVariantProps = VariantProps<typeof skeletonVariants>
