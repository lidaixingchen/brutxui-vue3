export type CollectionItemVariant = 'default' | 'primary' | 'secondary' | 'danger'

interface CollectionItemVariantOptions {
    variant?: CollectionItemVariant
}

const variantClasses: Record<CollectionItemVariant, string> = {
    default: [
        'data-[highlighted]:bg-brutal-item-highlight',
        'data-[highlighted]:text-brutal-item-highlight-foreground',
        'data-[highlighted]:focus-visible:ring-brutal-item-highlight-foreground',
        'data-[highlighted]:data-[focus-visible]:ring-brutal-item-highlight-foreground',
    ].join(' '),
    primary: [
        'data-[highlighted]:bg-brutal-primary',
        'data-[highlighted]:text-brutal-primary-foreground',
        'data-[highlighted]:focus-visible:ring-brutal-primary-foreground',
        'data-[highlighted]:data-[focus-visible]:ring-brutal-primary-foreground',
    ].join(' '),
    secondary: [
        'data-[highlighted]:bg-brutal-secondary',
        'data-[highlighted]:text-brutal-secondary-foreground',
        'data-[highlighted]:focus-visible:ring-brutal-secondary-foreground',
        'data-[highlighted]:data-[focus-visible]:ring-brutal-secondary-foreground',
    ].join(' '),
    danger: [
        'data-[highlighted]:bg-brutal-destructive',
        'data-[highlighted]:text-brutal-destructive-foreground',
        'data-[highlighted]:focus-visible:ring-brutal-destructive-foreground',
        'data-[highlighted]:data-[focus-visible]:ring-brutal-destructive-foreground',
    ].join(' '),
}

const focusClasses = [
    'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brutal-ring focus-visible:outline-hidden',
    'data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-brutal-ring data-[focus-visible]:outline-hidden',
    'forced-colors:focus-visible:outline-2 forced-colors:focus-visible:-outline-offset-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-[Highlight]',
    'forced-colors:data-[focus-visible]:outline-2 forced-colors:data-[focus-visible]:-outline-offset-2 forced-colors:data-[focus-visible]:outline-solid forced-colors:data-[focus-visible]:outline-[Highlight]',
].join(' ')

const stateClasses = [
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    'data-[disabled]:data-[highlighted]:bg-brutal-bg',
    'data-[disabled]:data-[highlighted]:text-brutal-muted-foreground',
    'forced-colors:data-[highlighted]:[background-color:Highlight]',
    'forced-colors:data-[highlighted]:[color:HighlightText]',
    'forced-colors:data-[highlighted]:forced-color-adjust-none',
    'forced-colors:[&_[role=checkbox]]:forced-color-adjust-auto',
    'forced-colors:[&_[role=radio]]:forced-color-adjust-auto',
    'forced-colors:data-[disabled]:data-[highlighted]:[background-color:Canvas]',
    'forced-colors:data-[disabled]:data-[highlighted]:[color:GrayText]',
    'forced-colors:focus-visible:[outline-color:Highlight]',
    'forced-colors:data-[focus-visible]:[outline-color:Highlight]',
    'forced-colors:data-[highlighted]:focus-visible:[outline-color:HighlightText]',
    'forced-colors:data-[highlighted]:data-[focus-visible]:[outline-color:HighlightText]',
].join(' ')

export function collectionItemVariants(
    { variant = 'default' }: CollectionItemVariantOptions = {}
): string {
    return [variantClasses[variant], focusClasses, stateClasses].join(' ')
}
