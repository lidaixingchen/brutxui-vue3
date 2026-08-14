import { cva } from 'class-variance-authority'

export const dashboardShellVariants = cva(
    'flex h-screen bg-brutal-bg text-brutal-fg'
)

export const dashboardSidebarVariants = cva(
    [
        'border-brutal bg-brutal-bg flex flex-col',
        'transition-all duration-200 ease-brutal-snap',
    ],
    {
        variants: {
            open: {
                true: 'w-64 p-4 border-r-3',
                false: 'w-0 p-0 overflow-hidden border-r-0 md:w-64 md:p-4 md:border-r-3',
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
