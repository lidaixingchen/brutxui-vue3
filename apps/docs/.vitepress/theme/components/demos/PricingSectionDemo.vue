<script setup lang="ts">
import { PricingSection } from 'brutx-ui-vue'
import type { BrutalistPricingPlan } from 'brutx-ui-vue'

const plans: BrutalistPricingPlan[] = [
    {
        name: 'Starter',
        price: '$0',
        description: 'For individuals getting started',
        features: [
            '5 components',
            'Classic theme',
            'Community support',
        ],
        ctaText: 'Get Started',
        variant: 'default',
    },
    {
        name: 'Pro',
        price: '$29',
        description: 'For professional developers',
        features: [
            'All components',
            'All themes',
            'Priority support',
            'CLI tool access',
        ],
        ctaText: 'Go Pro',
        popular: true,
        variant: 'primary',
    },
    {
        name: 'Enterprise',
        price: '$99',
        description: 'For teams and organizations',
        features: [
            'All components',
            'All themes',
            'Dedicated support',
            'Custom themes',
            'SLA guarantee',
        ],
        ctaText: 'Contact Sales',
        variant: 'secondary',
    },
]
</script>

<template>
    <div class="w-full overflow-x-auto">
        <PricingSection
            title="Simple, Transparent Brutalist Plans"
            subtitle="One-time payment. Lifetime access."
            :plans="plans"
        />
    </div>
</template>
