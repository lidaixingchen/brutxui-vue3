import { cva } from 'class-variance-authority'

export const pricingFeatureMarkerVariants = cva('shrink-0 font-mono text-sm font-black', {
    variants: {
        included: {
            true: 'inline-flex size-5 items-center justify-center rounded-brutal bg-brutal-success text-brutal-success-foreground',
            false: 'text-brutal-muted-foreground',
        },
    },
})
