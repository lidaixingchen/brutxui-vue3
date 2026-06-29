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
    plans: undefined,
    title: undefined,
    subtitle: '',
    class: undefined,
})

const emit = defineEmits<{
    'plan-select': [planName: string]
}>()

const { t } = useLocale()

const resolvedTitle = computed(() => props.title ?? t('saasPricing.title'))

const defaultPlans = computed<PricingPlan[]>(() => [
    {
        name: t('saasPricing.planStarterName'),
        description: t('saasPricing.planStarterDescription'),
        priceMonthly: '$0',
        priceAnnually: '$0',
        features: [
            { text: t('saasPricing.feature5Components'), included: true },
            { text: t('saasPricing.featureBasicThemes'), included: true },
            { text: t('saasPricing.featureCommunitySupport'), included: true },
            { text: t('saasPricing.featurePriorityUpdates'), included: false },
            { text: t('saasPricing.featureCustomThemes'), included: false },
        ],
        buttonText: t('saasPricing.planStarterCta'),
        buttonVariant: 'outline' as const,
    },
    {
        name: t('saasPricing.planProName'),
        description: t('saasPricing.planProDescription'),
        priceMonthly: '$19',
        priceAnnually: '$15',
        features: [
            { text: t('saasPricing.featureAllComponents'), included: true },
            { text: t('saasPricing.featureAllThemes'), included: true },
            { text: t('saasPricing.featurePrioritySupport'), included: true },
            { text: t('saasPricing.featurePriorityUpdates'), included: true },
            { text: t('saasPricing.featureCustomThemes'), included: false },
        ],
        popular: true,
        buttonText: t('saasPricing.planProCta'),
        buttonVariant: 'primary' as const,
    },
    {
        name: t('saasPricing.planEnterpriseName'),
        description: t('saasPricing.planEnterpriseDescription'),
        priceMonthly: '$49',
        priceAnnually: '$39',
        features: [
            { text: t('saasPricing.featureAllComponents'), included: true },
            { text: t('saasPricing.featureAllThemes'), included: true },
            { text: t('saasPricing.featureDedicatedSupport'), included: true },
            { text: t('saasPricing.featurePriorityUpdates'), included: true },
            { text: t('saasPricing.featureCustomThemes'), included: true },
        ],
        buttonText: t('saasPricing.planEnterpriseCta'),
        buttonVariant: 'secondary' as const,
    },
])

const normalizedPlans = computed<BrutalistPricingPlan[]>(() => props.plans ?? defaultPlans.value)
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
