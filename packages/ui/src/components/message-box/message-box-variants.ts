import { cva, type VariantProps } from 'class-variance-authority'

export const messageBoxCardVariants = cva(
    'relative z-dialog w-full max-w-md bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal p-6 flex flex-col gap-4 focus:outline-none select-none',
    {
        variants: {
            size: {
                sm: 'max-w-sm p-4 text-sm',
                default: 'max-w-md p-6 text-base',
                lg: 'max-w-lg p-8 text-lg',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const messageBoxIconVariants = cva(
    'inline-flex items-center justify-center shrink-0 w-10 h-10 border-2 border-brutal font-black',
    {
        variants: {
            type: {
                info: 'bg-brutal-info text-brutal-info-foreground',
                success: 'bg-brutal-success text-brutal-success-foreground',
                warning: 'bg-brutal-accent text-brutal-accent-foreground',
                error: 'bg-brutal-destructive text-brutal-destructive-foreground',
            },
        },
        defaultVariants: {
            type: 'info',
        },
    }
)

export type MessageBoxCardVariantProps = VariantProps<typeof messageBoxCardVariants>
export type MessageBoxIconVariantProps = VariantProps<typeof messageBoxIconVariants>
export type MessageBoxType = NonNullable<MessageBoxIconVariantProps['type']>
