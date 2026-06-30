---
title: SaaS Pricing
description: SaaS pricing component, a compatible wrapper around PricingSection with billing cycle toggle and feature comparison.
translated: true
---

# SaaS Pricing

A Neo-Brutalism style SaaS pricing section that supports monthly/annual billing toggle and feature comparison. It is now a SaaS preset wrapper around `PricingSection`, preserving the original `SaaSPricing` API. If you need one-time pricing, auto-billing modes, or custom popular badges, use the [Pricing Section](/en/blocks/pricing-section).

- **Compatible wrapper**: Internally reuses `PricingSection`, suitable for continuing to use the existing `SaaSPricing` API
- **Billing toggle**: Switch between monthly and annual pricing
- **Popular badge**: Plans with `popular: true` receive a popular badge and highlight effect
- **Feature checkmarks**: Included features show a green checkmark; excluded features show a gray icon with strikethrough

## Demo

<ComponentPreview>
  <SaaSPricingDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="saas-pricing" />

The CLI automatically includes internal dependencies. When manually copying source files, copy both the `saas-pricing` and `pricing-section` directories.

## Usage

```vue
<script setup>
import { SaaSPricing } from 'brutx-ui-vue'

const plans = [
    {
        name: 'Starter',
        description: 'For side projects and experiments',
        priceMonthly: '$0',
        priceAnnually: '$0',
        features: [
            { text: '5 components', included: true },
            { text: 'Basic themes', included: true },
            { text: 'Community support', included: true },
            { text: 'Priority updates', included: false },
        ],
        buttonText: 'Get Started',
        buttonVariant: 'outline',
    },
    {
        name: 'Pro',
        description: 'For professional developers',
        priceMonthly: '$19',
        priceAnnually: '$15',
        features: [
            { text: 'All components', included: true },
            { text: 'All themes', included: true },
            { text: 'Priority support', included: true },
            { text: 'Priority updates', included: true },
        ],
        popular: true,
        buttonText: 'Go Pro',
        buttonVariant: 'primary',
    },
    {
        name: 'Enterprise',
        description: 'For teams and organizations',
        priceMonthly: '$49',
        priceAnnually: '$39',
        features: [
            { text: 'All components', included: true },
            { text: 'All themes', included: true },
            { text: 'Dedicated support', included: true },
            { text: 'Custom themes', included: true },
        ],
        buttonText: 'Contact Sales',
        buttonVariant: 'secondary',
    },
]
</script>

<template>
    <SaaSPricing
        title="Simple, Unapologetic Pricing"
        subtitle="Choose the plan that fits your needs"
        :plans="plans"
    />
</template>
```

## Data Types

```ts
interface PricingFeature {
    text: string
    included: boolean
}

interface PricingPlan {
    name: string
    description: string
    priceMonthly: string
    priceAnnually: string
    features: PricingFeature[]
    popular?: boolean
    buttonText: string
    buttonVariant?: 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `plans` | `PricingPlan[]` | 3 built-in plans | List of pricing plans; uses built-in defaults when not provided |
| `title` | `string` | `locale: saasPricing.title` | Title text |
| `subtitle` | `string` | `''` | Subtitle text |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `plan-select` | `planName: string` | Emitted when a plan is selected |

## Accessibility

- **Keyboard navigation**: Plan selection buttons support Tab key focus and Enter/Space key activation
- **ARIA attributes**: The billing cycle toggle automatically sets `aria-pressed` or `role="switch"` states
- **Semantic structure**: Uses semantic heading levels to display plan names and pricing information
- **Feature comparison**: Feature lists use clear visual indicators (checkmarks/strikethrough); it is recommended to pair with text descriptions to ensure information is conveyed
