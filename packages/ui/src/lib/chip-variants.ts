export const chipBaseClasses = [
    'inline-flex items-center',
    'border-3 border-brutal',
    'rounded-brutal',
] as const

export const chipColorVariants = {
    default: 'bg-brutal-muted text-brutal-fg',
    primary: 'bg-brutal-primary text-brutal-primary-foreground',
    secondary: 'bg-brutal-secondary text-brutal-secondary-foreground',
    accent: 'bg-brutal-accent text-brutal-accent-foreground',
} as const
