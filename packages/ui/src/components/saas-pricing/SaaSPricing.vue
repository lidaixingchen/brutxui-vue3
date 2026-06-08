<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import PricingSection, { type BrutalistPricingPlan, type PricingFeature } from '../pricing-section/PricingSection.vue'

export type { PricingFeature }

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

interface SaaSPricingProps {
    plans?: PricingPlan[]
    title?: string
    subtitle?: string
    class?: string
}

const props = withDefaults(defineProps<SaaSPricingProps>(), {
    plans: () => [
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
                { text: 'Custom themes', included: false },
            ],
            buttonText: 'Get Started',
            buttonVariant: 'outline' as const,
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
                { text: 'Custom themes', included: false },
            ],
            popular: true,
            buttonText: 'Go Pro',
            buttonVariant: 'primary' as const,
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
                { text: 'Priority updates', included: true },
                { text: 'Custom themes', included: true },
            ],
            buttonText: 'Contact Sales',
            buttonVariant: 'secondary' as const,
        },
    ],
    title: undefined,
    subtitle: '',
    class: undefined,
})

const emit = defineEmits<{
    'plan-select': [planName: string]
}>()

const { t } = useLocale()

const resolvedTitle = computed(() => props.title ?? t('saasPricing.title'))
const normalizedPlans = computed<BrutalistPricingPlan[]>(() => props.plans)
</script>

<template>
    <PricingSection
        :title="resolvedTitle"
        :subtitle="subtitle"
        :plans="normalizedPlans"
        billing-mode="toggle"
        :popular-text="t('saasPricing.mostPopular')"
        :class="props.class"
        @plan-select="emit('plan-select', $event)"
    />
</template>
