<script setup lang="ts">
import { PricingSection } from 'brutx-ui-vue'
import type { BrutalistPricingPlan } from 'brutx-ui-vue'

const plans: BrutalistPricingPlan[] = [
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
    <div class="w-full overflow-x-auto">
        <PricingSection
            title="Unified Brutalist Pricing"
            subtitle="One component for lifetime offers or monthly and annual billing."
            :plans="plans"
            default-billing="monthly"
            popular-text="Best Value"
        />
    </div>
</template>
