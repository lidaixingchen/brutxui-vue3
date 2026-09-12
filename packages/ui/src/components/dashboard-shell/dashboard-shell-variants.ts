import { cva, type VariantProps } from 'class-variance-authority'

export const dashboardShellVariants = cva(
    'relative isolate flex h-screen bg-brutal-bg text-brutal-fg'
)

export const dashboardSidebarVariants = cva(
    [
        'border-brutal bg-brutal-bg flex flex-col',
        'transition-all duration-200 ease-brutal-snap',
        'absolute inset-y-0 left-0 z-dialog md:relative md:inset-auto md:z-auto md:shrink-0',
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

export type DashboardSidebarVariants = VariantProps<typeof dashboardSidebarVariants>
export type DashboardSidebarVariantProps = DashboardSidebarVariants
export type DashboardShellVariants = DashboardSidebarVariants
