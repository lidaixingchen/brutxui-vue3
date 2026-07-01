export const formToggleBaseClasses = [
    'border-3 border-brutal',
    'transition-all duration-150',
    'shadow-brutal-sm',
    'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
] as const

export const formToggleVariantColors = {
    default: 'data-[state=checked]:bg-brutal-success',
    primary: 'data-[state=checked]:bg-brutal-primary',
    secondary: 'data-[state=checked]:bg-brutal-secondary',
    accent: 'data-[state=checked]:bg-brutal-accent',
    danger: 'data-[state=checked]:bg-brutal-destructive',
} as const
