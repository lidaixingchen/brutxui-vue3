---
title: SaaS Pricing
description: SaaS style pricing block, wrapping PricingSection to support monthly/annual billing toggles and plan comparisons.
---

# SaaS Pricing

A Neo-Brutalist styled SaaS pricing section featuring monthly/annual subscription toggling, popular plan highlighting, and custom feature list bullet points. This block is a compatible wrapper built around `PricingSection`. 

New projects can also choose to use [Pricing Section](/en/blocks/pricing-section) directly to achieve the exact same set of visual features.

## Preview

<ComponentPreview>
  <SaaSPricingDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="saas-pricing" />

The CLI automatically includes `pricing-section` as a dependency. If manually copying the source code, please duplicate both the `saas-pricing` and `pricing-section` directories into your project components folder.

## Usage

```vue
<script setup>
import SaaSPricing from '@/components/ui/saas-pricing/SaaSPricing.vue'

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
|------|------|--------|------|
| `title` | `string` | locale: `saasPricing.title` | Main title of the pricing section. |
| `subtitle` | `string` | — | Subtitle description of the pricing section. |
| `plans` | `PricingPlan[]` | 3 built-in plans | Array of pricing plans data. |
| `class` | `string` | — | Custom CSS styling classes. |

## Events

| Event | Arguments | Description |
|------|------|------|
| `plan-select` | `[planName: string]` | Emitted when a plan's action button is clicked, returning the selected plan name. |

## Accessibility

- **Keyboard Navigation**: Supports standard `Tab` focus boundaries for plan cards and CTA buttons, and triggers via `Enter` / `Space`.
- **ARIA Attributes**: The monthly/annual subscription toggle button utilizes `aria-pressed` or `role="switch"` to toggle states.
- **Focus Management**: Cards display distinct border focus outlines when navigated via keyboard.
