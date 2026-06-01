import { cva } from 'class-variance-authority'

export const breadcrumbListVariants = cva(
    'flex flex-wrap items-center gap-1.5 break-words text-sm font-black text-brutal-fg sm:gap-2.5'
)

export const breadcrumbItemVariants = cva(
    'inline-flex items-center gap-1.5'
)

export const breadcrumbLinkVariants = cva(
    'transition-colors hover:text-brutal-primary hover:underline cursor-pointer'
)

export const breadcrumbPageVariants = cva(
    'font-black text-brutal-fg bg-brutal-accent px-2 py-0.5 border-3 border-brutal rounded-brutal shadow-brutal-sm select-none'
)

export const breadcrumbSeparatorVariants = cva(
    '[&>svg]:w-3.5 [&>svg]:h-3.5 font-bold text-brutal-fg/60'
)

export const breadcrumbEllipsisVariants = cva(
    'flex h-7 w-7 items-center justify-center border-3 border-brutal bg-brutal-bg text-brutal-fg shadow-brutal-sm rounded-brutal transition-all hover:bg-brutal-muted active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none select-none cursor-pointer'
)
