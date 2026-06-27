<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, HelpCircle } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import Button from '../button/Button.vue'
import Card from '../card/Card.vue'
import CardHeader from '../card/CardHeader.vue'
import CardContent from '../card/CardContent.vue'
import CardTitle from '../card/CardTitle.vue'
import CardDescription from '../card/CardDescription.vue'
import CardFooter from '../card/CardFooter.vue'
import Badge from '../badge/Badge.vue'
import EmptyState from '../empty-state/EmptyState.vue'

type ButtonVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'
type CardVariant = 'default' | 'elevated' | 'flat' | 'interactive' | 'primary' | 'secondary'
type BillingPeriod = 'monthly' | 'annually'
type BillingMode = 'none' | 'toggle' | 'auto'

export interface PricingFeature {
    text: string
    included?: boolean
}

export interface BrutalistPricingPlan {
    name: string
    price?: string
    priceMonthly?: string
    priceAnnually?: string
    description: string
    features: Array<string | PricingFeature>
    ctaText?: string
    buttonText?: string
    popular?: boolean
    variant?: Extract<CardVariant, 'primary' | 'secondary' | 'default' | 'interactive' | 'elevated' | 'flat'>
    buttonVariant?: ButtonVariant
}

interface PricingSectionProps {
    title?: string
    subtitle?: string
    plans?: BrutalistPricingPlan[]
    billingMode?: BillingMode
    defaultBilling?: BillingPeriod
    popularText?: string
    class?: string
}

const props = withDefaults(defineProps<PricingSectionProps>(), {
    title: undefined,
    subtitle: undefined,
    plans: () => [],
    billingMode: 'auto',
    defaultBilling: 'monthly',
    popularText: undefined,
    class: undefined,
})

const emit = defineEmits<{
    'plan-select': [planName: string]
}>()

const { t } = useLocale()
const billing = ref<BillingPeriod>(props.defaultBilling)

watch(() => props.defaultBilling, (val) => { billing.value = val })

const resolvedTitle = computed(() => props.title ?? t('pricingSection.defaultTitle'))
const resolvedSubtitle = computed(() => props.subtitle ?? '')
const resolvedPopularText = computed(() => props.popularText ?? t('pricingSection.mostPopular'))

const rootClasses = computed(() => cn('w-full max-w-5xl mx-auto', props.class))

const hasBillingPlans = computed(() =>
    props.plans.some(plan => plan.priceMonthly !== undefined || plan.priceAnnually !== undefined)
)

const showBillingToggle = computed(() =>
    props.billingMode === 'toggle' || (props.billingMode === 'auto' && hasBillingPlans.value)
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
    if (billing.value === 'monthly') return t('saasPricing.perMonth')
    return plan.priceAnnually !== undefined ? t('saasPricing.perMonthBilledAnnually') : t('saasPricing.perMonth')
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
                :aria-label="t('saasPricing.billingPeriod')"
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
                    {{ t('saasPricing.monthly') }}
                </button>
                <button
                    role="tab"
                    :aria-selected="billing === 'annually'"
                    :tabindex="billing === 'annually' ? 0 : -1"
                    :class="annuallyBtnClasses"
                    @click="billing = 'annually'"
                >
                    {{ t('saasPricing.annually') }}
                </button>
            </div>
        </div>

        <template v-if="plans.length > 0">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div v-for="plan in plans" :key="plan.name" class="relative">
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
        <EmptyState v-else :title="t('pricingSection.emptyTitle')" />
    </div>
</template>
