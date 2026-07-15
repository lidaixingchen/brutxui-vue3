<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, HelpCircle } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import Button from '../button/Button.vue'
import Card from '../card/Card.vue'
import CardHeader from '../card/CardHeader.vue'
import CardContent from '../card/CardContent.vue'
import CardTitle from '../card/CardTitle.vue'
import CardDescription from '../card/CardDescription.vue'
import CardFooter from '../card/CardFooter.vue'
import Badge from '../badge/Badge.vue'
import Result from '../result/Result.vue'
import type { PricingFeature, PricingPlan, BrutalistPricingPlan } from './types'

export type { PricingFeature, PricingPlan, BrutalistPricingPlan };

type ButtonVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'
type CardVariant = 'default' | 'elevated' | 'flat' | 'interactive' | 'primary' | 'secondary'
type BillingPeriod = 'monthly' | 'annually'
type BillingMode = 'none' | 'toggle' | 'auto'
type Preset = 'saas'

interface PricingSectionProps {
    title?: string
    subtitle?: string
    plans?: BrutalistPricingPlan[]
    preset?: Preset
    billingMode?: BillingMode
    modelValue?: BillingPeriod
    defaultBilling?: BillingPeriod
    popularText?: string
    class?: string
}

const props = withDefaults(defineProps<PricingSectionProps>(), {
    title: undefined,
    subtitle: undefined,
    plans: undefined,
    preset: undefined,
    billingMode: undefined,
    modelValue: undefined,
    defaultBilling: 'monthly',
    popularText: undefined,
    class: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: BillingPeriod]
    'plan-select': [planName: string]
}>()

const { t } = useLocale()
const internalBilling = ref<BillingPeriod>(props.modelValue ?? props.defaultBilling)

watch(() => props.modelValue ?? props.defaultBilling, (val) => {
    if (val) internalBilling.value = val
})

const billing = computed<BillingPeriod>({
    get: () => internalBilling.value,
    set: (val) => {
        internalBilling.value = val
        emit('update:modelValue', val)
    },
})

const isSaasPreset = computed(() => props.preset === 'saas')

const saasDefaultPlans = computed<PricingPlan[]>(() => [
    {
        name: t('pricingSection.planStarterName'),
        description: t('pricingSection.planStarterDescription'),
        priceMonthly: '$0',
        priceAnnually: '$0',
        features: [
            { text: t('pricingSection.feature5Components'), included: true },
            { text: t('pricingSection.featureBasicThemes'), included: true },
            { text: t('pricingSection.featureCommunitySupport'), included: true },
            { text: t('pricingSection.featurePriorityUpdates'), included: false },
            { text: t('pricingSection.featureCustomThemes'), included: false },
        ],
        buttonText: t('pricingSection.planStarterCta'),
        buttonVariant: 'outline' as const,
    },
    {
        name: t('pricingSection.planProName'),
        description: t('pricingSection.planProDescription'),
        priceMonthly: '$19',
        priceAnnually: '$15',
        features: [
            { text: t('pricingSection.featureAllComponents'), included: true },
            { text: t('pricingSection.featureAllThemes'), included: true },
            { text: t('pricingSection.featurePrioritySupport'), included: true },
            { text: t('pricingSection.featurePriorityUpdates'), included: true },
            { text: t('pricingSection.featureCustomThemes'), included: false },
        ],
        popular: true,
        buttonText: t('pricingSection.planProCta'),
        buttonVariant: 'primary' as const,
    },
    {
        name: t('pricingSection.planEnterpriseName'),
        description: t('pricingSection.planEnterpriseDescription'),
        priceMonthly: '$49',
        priceAnnually: '$39',
        features: [
            { text: t('pricingSection.featureAllComponents'), included: true },
            { text: t('pricingSection.featureAllThemes'), included: true },
            { text: t('pricingSection.featureDedicatedSupport'), included: true },
            { text: t('pricingSection.featurePriorityUpdates'), included: true },
            { text: t('pricingSection.featureCustomThemes'), included: true },
        ],
        buttonText: t('pricingSection.planEnterpriseCta'),
        buttonVariant: 'secondary' as const,
    },
])

const resolvedPlans = computed<BrutalistPricingPlan[]>(() => {
    if (props.plans) return props.plans
    if (isSaasPreset.value) return saasDefaultPlans.value
    return []
})

const resolvedTitle = computed(() => {
    if (props.title) return props.title
    if (isSaasPreset.value) return t('pricingSection.saasTitle')
    return t('pricingSection.defaultTitle')
})

const resolvedSubtitle = computed(() => props.subtitle ?? '')

const resolvedPopularText = computed(() => {
    if (props.popularText) return props.popularText
    if (isSaasPreset.value) return t('pricingSection.saasMostPopular')
    return t('pricingSection.mostPopular')
})

const resolvedBillingMode = computed<BillingMode>(() => {
    if (props.billingMode) return props.billingMode
    if (isSaasPreset.value) return 'toggle'
    return 'auto'
})

const rootClasses = computed(() => cn('w-full max-w-5xl mx-auto', props.class))

const hasBillingPlans = computed(() =>
    resolvedPlans.value.some(plan => plan.priceMonthly !== undefined || plan.priceAnnually !== undefined)
)

const showBillingToggle = computed(() =>
    resolvedBillingMode.value === 'toggle' || (resolvedBillingMode.value === 'auto' && hasBillingPlans.value)
)

const monthlyBtnClasses = computed(() =>
    cn(
        'px-4 py-2 font-black text-sm transition-all active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        billing.value === 'monthly' ? 'bg-brutal-accent text-brutal-fg shadow-brutal-sm' : 'text-brutal-muted-foreground'
    )
)

const annuallyBtnClasses = computed(() =>
    cn(
        'px-4 py-2 font-black text-sm transition-all active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        billing.value === 'annually' ? 'bg-brutal-accent text-brutal-fg shadow-brutal-sm' : 'text-brutal-muted-foreground'
    )
)

const popularBadgeWrapClasses = computed(() =>
    cn('absolute -top-3 left-1/2 -translate-x-1/2 z-10', !showBillingToggle.value && 'rotate-[1.5deg]')
)

function getPlanCardClasses(plan: BrutalistPricingPlan) {
    return cn(showBillingToggle.value ? plan.popular && 'scale-105 shadow-brutal-lg' : plan.popular && 'bg-brutal-accent/20')
}

function getPlanCardVariant(plan: BrutalistPricingPlan): CardVariant {
    if (showBillingToggle.value && plan.popular) return 'interactive'
    return plan.variant ?? 'default'
}

function getPlanPrice(plan: BrutalistPricingPlan) {
    if (!showBillingToggle.value) return plan.price ?? plan.priceMonthly ?? plan.priceAnnually ?? ''
    if (billing.value === 'monthly') return plan.priceMonthly ?? plan.price ?? plan.priceAnnually ?? ''
    return plan.priceAnnually ?? plan.priceMonthly ?? plan.price ?? ''
}

function getPriceLabel(plan: BrutalistPricingPlan) {
    if (!showBillingToggle.value) return t('pricingSection.perLifetime')
    if (billing.value === 'monthly') return t('pricingSection.perMonth')
    return plan.priceAnnually !== undefined ? t('pricingSection.perMonthBilledAnnually') : t('pricingSection.perMonth')
}

function getFeatureText(feature: string | PricingFeature) {
    return typeof feature === 'string' ? feature : feature.text
}

function isFeatureIncluded(feature: string | PricingFeature) {
    return typeof feature === 'string' ? true : feature.included !== false
}

function getFeatureClasses(feature: string | PricingFeature) {
    return cn('text-sm font-medium', !isFeatureIncluded(feature) && 'line-through text-brutal-muted-foreground')
}

function getButtonText(plan: BrutalistPricingPlan) {
    return plan.buttonText ?? plan.ctaText ?? ''
}

function getButtonVariant(plan: BrutalistPricingPlan): ButtonVariant {
    if (plan.buttonVariant) return plan.buttonVariant
    if (plan.variant === 'default') return 'outline'
    if (plan.variant === 'primary' || plan.variant === 'secondary') return plan.variant
    return 'default'
}
</script>

<template>
    <div :class="rootClasses">
        <div class="text-center mb-10">
            <h2 class="text-3xl font-black tracking-tight">
{{ resolvedTitle }}
</h2>
            <p v-if="resolvedSubtitle" class="mt-2 text-brutal-muted-foreground font-medium">
{{ resolvedSubtitle }}
</p>
            <div
                v-if="showBillingToggle"
                class="mt-6 inline-flex items-center gap-3 border-3 border-brutal bg-brutal-muted p-1"
                role="tablist"
                :aria-label="t('pricingSection.billingPeriod')"
                @keydown.left.prevent="billing = 'monthly'"
                @keydown.right.prevent="billing = 'annually'"
                @keydown.home.prevent="billing = 'monthly'"
                @keydown.end.prevent="billing = 'annually'"
            >
                <button
                    role="tab"
                    :aria-selected="billing === 'monthly'"
                    :tabindex="billing === 'monthly' ? 0 : -1"
                    :class="monthlyBtnClasses"
                    @click="billing = 'monthly'"
                >
                    {{ t('pricingSection.monthly') }}
                </button>
                <button
                    role="tab"
                    :aria-selected="billing === 'annually'"
                    :tabindex="billing === 'annually' ? 0 : -1"
                    :class="annuallyBtnClasses"
                    @click="billing = 'annually'"
                >
                    {{ t('pricingSection.annually') }}
                </button>
            </div>
        </div>

        <template v-if="resolvedPlans.length > 0">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div v-for="plan in resolvedPlans" :key="plan.name" class="relative">
                    <div v-if="plan.popular" :class="popularBadgeWrapClasses">
                        <Badge variant="primary" class="animate-pulse">
{{ resolvedPopularText }}
</Badge>
                    </div>
                    <Card :variant="getPlanCardVariant(plan)" :class="getPlanCardClasses(plan)">
                        <CardHeader>
                            <CardTitle class="text-xl">
{{ plan.name }}
</CardTitle>
                            <CardDescription>{{ plan.description }}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div class="mb-6">
                                <span class="text-4xl font-black">{{ getPlanPrice(plan) }}</span>
                                <span class="text-sm font-bold text-brutal-muted-foreground">{{ getPriceLabel(plan) }}</span>
                            </div>
                            <ul class="space-y-3">
                                <li v-for="(feature, index) in plan.features" :key="index" class="flex items-center gap-2">
                                    <div v-if="isFeatureIncluded(feature)" class="flex h-5 w-5 items-center justify-center bg-brutal-success text-brutal-fg">
                                        <Check class="h-3 w-3 stroke-[3]" />
                                    </div>
                                    <div v-else class="flex h-5 w-5 items-center justify-center bg-brutal-muted text-brutal-muted-foreground">
                                        <HelpCircle class="h-3 w-3 stroke-[3]" />
                                    </div>
                                    <span :class="getFeatureClasses(feature)">{{ getFeatureText(feature) }}</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button :variant="getButtonVariant(plan)" class="w-full" @click="emit('plan-select', plan.name)">
{{ getButtonText(plan) }}
</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </template>
        <Result v-else status="empty" :title="t('pricingSection.emptyTitle')" />
    </div>
</template>
