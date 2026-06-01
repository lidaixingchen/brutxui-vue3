<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, HelpCircle } from 'lucide-vue-next'
import { cn } from '../../lib/utils'
import Button from '../button/Button.vue'
import Card from '../card/Card.vue'
import CardHeader from '../card/CardHeader.vue'
import CardContent from '../card/CardContent.vue'
import CardTitle from '../card/CardTitle.vue'
import CardDescription from '../card/CardDescription.vue'
import CardFooter from '../card/CardFooter.vue'
import Badge from '../badge/Badge.vue'

export interface PricingFeature {
    text: string
    included: boolean
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
    title: 'Simple, Unapologetic Pricing',
    subtitle: '',
    class: '',
})

const billing = ref<'monthly' | 'annually'>('monthly')

const rootClasses = computed(() => cn('w-full max-w-5xl mx-auto', props.class))

const monthlyBtnClasses = computed(() =>
    cn(
        'px-4 py-2 font-black text-sm transition-all',
        billing.value === 'monthly' ? 'bg-brutal-accent text-brutal-fg shadow-brutal-sm' : 'text-brutal-muted-foreground'
    )
)

const annuallyBtnClasses = computed(() =>
    cn(
        'px-4 py-2 font-black text-sm transition-all',
        billing.value === 'annually' ? 'bg-brutal-accent text-brutal-fg shadow-brutal-sm' : 'text-brutal-muted-foreground'
    )
)

function getPlanCardClasses(plan: PricingPlan) {
    return cn(plan.popular && 'scale-105 shadow-brutal-lg')
}

function getFeatureClasses(feature: PricingFeature) {
    return cn('text-sm font-medium', !feature.included && 'line-through text-brutal-muted-foreground')
}
</script>

<template>
    <div :class="rootClasses">
        <div class="text-center mb-10">
            <h2 class="text-3xl font-black tracking-tight">
{{ title }}
</h2>
            <p v-if="subtitle" class="mt-2 text-brutal-muted-foreground font-medium">
{{ subtitle }}
</p>
            <div class="mt-6 inline-flex items-center gap-3 border-3 border-brutal bg-brutal-muted p-1" role="tablist" aria-label="Billing period">
                <button
                    role="tab"
                    :aria-selected="billing === 'monthly'"
                    :class="monthlyBtnClasses"
                    @click="billing = 'monthly'"
                >
                    Monthly
                </button>
                <button
                    role="tab"
                    :aria-selected="billing === 'annually'"
                    :class="annuallyBtnClasses"
                    @click="billing = 'annually'"
                >
                    Annually
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div v-for="plan in plans" :key="plan.name" class="relative">
                <div v-if="plan.popular" class="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge variant="primary" class="animate-pulse">
MOST POPULAR
</Badge>
                </div>
                <Card :variant="plan.popular ? 'interactive' : 'default'" :class="getPlanCardClasses(plan)">
                    <CardHeader>
                        <CardTitle class="text-xl">
{{ plan.name }}
</CardTitle>
                        <CardDescription>{{ plan.description }}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div class="mb-6">
                            <span class="text-4xl font-black">{{ billing === 'monthly' ? plan.priceMonthly : plan.priceAnnually }}</span>
                            <span class="text-sm font-bold text-brutal-muted-foreground">/{{ billing === 'monthly' ? 'mo' : 'mo (billed annually)' }}</span>
                        </div>
                        <ul class="space-y-3">
                            <li v-for="feature in plan.features" :key="feature.text" class="flex items-center gap-2">
                                <div v-if="feature.included" class="flex h-5 w-5 items-center justify-center bg-brutal-success text-brutal-fg">
                                    <Check class="h-3 w-3 stroke-[3]" />
                                </div>
                                <div v-else class="flex h-5 w-5 items-center justify-center bg-brutal-muted text-brutal-muted-foreground">
                                    <HelpCircle class="h-3 w-3 stroke-[3]" />
                                </div>
                                <span :class="getFeatureClasses(feature)">{{ feature.text }}</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button :variant="plan.buttonVariant || 'default'" class="w-full">
{{ plan.buttonText }}
</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
</template>
