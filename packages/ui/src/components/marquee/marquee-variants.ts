import { cva } from 'class-variance-authority'

export const marqueeContainerVariants = cva(
    [
        'relative flex overflow-hidden w-full',
        'border-y-3 border-brutal',
        'font-black uppercase select-none',
    ],
    {
        variants: {
            fade: {
                true: '[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]',
            },
            variant: {
                default: 'bg-brutal-bg text-brutal-fg',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                accent: 'bg-brutal-accent text-brutal-accent-foreground',
                muted: 'bg-brutal-muted text-brutal-muted-foreground',
            },
            size: {
                sm: 'py-2 text-sm tracking-wider',
                default: 'py-4 text-xl tracking-widest',
                lg: 'py-6 text-2xl tracking-widest',
            },
        },
        defaultVariants: {
            fade: false,
            variant: 'default',
            size: 'default',
        },
    }
)

export const marqueeTrackVariants = cva(
    [
        'flex min-w-full shrink-0 items-center justify-around gap-4',
    ],
    {
        variants: {
            direction: {
                left: 'animate-marquee-left',
                right: 'animate-marquee-right',
            },
            pauseOnHover: {
                true: 'hover:[animation-play-state:paused]',
            },
        },
        defaultVariants: {
            direction: 'left',
            pauseOnHover: false,
        },
    }
)
