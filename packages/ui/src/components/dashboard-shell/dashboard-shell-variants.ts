import { cva } from 'class-variance-authority'

export const dashboardShellVariants = cva(
    'flex h-screen bg-brutal-bg text-brutal-fg'
)

export const dashboardSidebarVariants = cva(
    [
        'border-r-3 border-brutal bg-brutal-bg p-4 flex flex-col',
        'transition-all duration-200 ease-brutal-snap',
    ],
    {
        variants: {
            open: {
                true: 'w-64',
                false: 'w-0 p-0 overflow-hidden md:w-64 md:p-4',
            },
        },
        defaultVariants: {
            open: true,
        },
    }
)

export const dashboardHeaderVariants = cva(
    'border-b-3 border-brutal bg-brutal-bg px-6 py-3 flex items-center justify-between'
)

export const dashboardMainVariants = cva(
    'flex-1 overflow-y-auto p-6'
)
