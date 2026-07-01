---
title: Pricing Section
description: Unified pricing block supporting one-time pricing, monthly/annual toggle, multi-plan comparison, and popular plan highlighting.
translated: true
---

# Pricing Section

A Neo-Brutalist unified pricing section featuring feature lists, popular plan highlighting, and an optional monthly/annual toggle. It can display both one-time pricing and SaaS subscription pricing; pass `preset="saas"` to enable the built-in three-tier SaaS default data.

## Demo

<ComponentPreview>
  <PricingSectionDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="pricing-section" />

## Usage

```vue
<script setup>
import PricingSection from '@/components/ui/pricing-section/PricingSection.vue'

const plans = [
    {
        name: 'Starter',
        priceMonthly: '$0',
        priceAnnually: '$0',
        description: 'For individuals getting started',
        features: [
            { text: '5 components', included: true },
            { text: 'Classic theme', included: true },
            { text: 'Community support', included: true },
            { text: 'Priority updates', included: false },
        ],
        buttonText: 'Get Started',
        buttonVariant: 'outline',
        variant: 'default',
    },
    {
        name: 'Pro',
        priceMonthly: '$19',
        priceAnnually: '$15',
        description: 'For professional developers',
        features: [
            { text: 'All components', included: true },
            { text: 'All themes', included: true },
            { text: 'Priority support', included: true },
            { text: 'CLI tool access', included: true },
        ],
        buttonText: 'Go Pro',
        buttonVariant: 'primary',
        popular: true,
        variant: 'primary',
    },
    {
        name: 'Enterprise',
        priceMonthly: '$49',
        priceAnnually: '$39',
        description: 'For teams and organizations',
        features: [
            { text: 'All components', included: true },
            { text: 'All themes', included: true },
            { text: 'Dedicated support', included: true },
            { text: 'Custom themes', included: true },
            { text: 'SLA guarantee', included: true },
        ],
        buttonText: 'Contact Sales',
        buttonVariant: 'secondary',
        variant: 'secondary',
    },
]
</script>

<template>
    <PricingSection
        title="Unified Brutalist Pricing"
        subtitle="One component for lifetime offers or monthly and annual billing."
        :plans="plans"
        default-billing="monthly"
        popular-text="Best Value"
    />
</template>
```

## SaaS Preset

Pass `preset="saas"` to use the built-in three-tier SaaS default data (Starter / Pro / Enterprise) and automatically enable the monthly/annual billing toggle. In this mode:

- When `title` is not passed, falls back to `pricingSection.saasTitle` ("Simple, Unapologetic Pricing")
- When `popularText` is not passed, falls back to `pricingSection.saasMostPopular` ("MOST POPULAR")
- When `billingMode` is not passed, defaults to `'toggle'`
- When `plans` is not passed, uses the built-in three-tier default data; passing `plans` takes precedence

```vue
<script setup>
import PricingSection from '@/components/ui/pricing-section/PricingSection.vue'
</script>

<template>
    <PricingSection preset="saas" />
</template>
```

You can also override any field on top of the SaaS preset:

```vue
<template>
    <PricingSection
        preset="saas"
        title="Custom Title"
        subtitle="Override the default subtitle"
        :plans="customPlans"
    />
</template>
```

## Data Types

```ts
interface PricingFeature {
    text: string
    included?: boolean
}

interface BrutalistPricingPlan {
    name: string
    price?: string
    priceMonthly?: string
    priceAnnually?: string
    description: string
    features: Array<string | PricingFeature>
    ctaText?: string
    buttonText?: string
    popular?: boolean
    variant?: 'primary' | 'secondary' | 'default' | 'interactive' | 'elevated' | 'flat'
    buttonVariant?: 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'
}
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | locale: `pricingSection.defaultTitle` | Title text |
| `subtitle` | `string` | — | Subtitle text |
| `plans` | `BrutalistPricingPlan[]` | `[]` | Pricing plan list |
| `preset` | `'saas'` | — | Preset mode; pass `'saas'` to enable the built-in three-tier SaaS default data and fallback behavior |
| `billingMode` | `'auto' \| 'toggle' \| 'none'` | `'auto'` (`'toggle'` when `preset='saas'`) | Billing mode: `auto` for auto-detection, `toggle` to force display, `none` to hide |
| `modelValue` | `'monthly' \| 'annually'` | — | Currently selected billing cycle (v-model) |
| `defaultBilling` | `'monthly' \| 'annually'` | `'monthly'` | Default billing cycle |
| `popularText` | `string` | locale: `pricingSection.mostPopular` | Popular plan badge text |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
|------|------|------|
| `plan-select` | `planName: string` | Emitted when a plan is selected; parameter is the plan name |

## Accessibility

- **Keyboard**: Supports `Tab` to navigate between plan cards and buttons, `Enter` / `Space` to trigger button actions
- **ARIA**: Toggle button uses `aria-pressed` state; popular plan uses `aria-label` for indication
- **Focus Management**: Focus order follows the document flow; buttons display a visible focus indicator when focused
