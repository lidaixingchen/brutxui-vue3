export interface PricingFeature {
    text: string
    included?: boolean
}

export interface BrutalistPricingPlan {
    name: string
    description: string
    price?: string
    priceMonthly?: string
    priceAnnually?: string
    features: Array<string | PricingFeature>
    ctaText?: string
    buttonText?: string
    popular?: boolean
    badge?: string
    variant?: 'default' | 'elevated' | 'flat' | 'interactive' | 'primary' | 'secondary'
    buttonVariant?: 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'
}

export interface PricingPlan {
    name: string
    description: string
    priceMonthly: string
    priceAnnually: string
    features: PricingFeature[]
    popular?: boolean
    buttonText: string
    buttonVariant?: 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'
}
