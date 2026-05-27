'use client';

import * as React from 'react';
import { Button } from './button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from './card';
import { Badge } from './badge';
import { Check, HelpCircle } from 'lucide-react';

export interface PricingFeature {
    text: string;
    included: boolean;
}

export interface PricingPlan {
    name: string;
    description: string;
    priceMonthly: number;
    priceAnnually: number;
    features: PricingFeature[];
    popular?: boolean;
    buttonText: string;
    buttonVariant?: 'default' | 'primary' | 'secondary' | 'accent' | 'outline';
}

const defaultPlans: PricingPlan[] = [
    {
        name: 'Starter',
        description: 'For builders, side-projects, and early prototypes.',
        priceMonthly: 19,
        priceAnnually: 15,
        buttonText: 'Start Free Trial',
        buttonVariant: 'outline',
        features: [
            { text: '3 active projects', included: true },
            { text: 'Basic analytics dashboard', included: true },
            { text: '10,000 monthly active users', included: true },
            { text: 'Community slack support', included: true },
            { text: 'API endpoints access', included: false },
            { text: 'Custom brand domains', included: false },
        ],
    },
    {
        name: 'Pro',
        description: 'The sweet spot for growing companies and SaaS products.',
        priceMonthly: 49,
        priceAnnually: 39,
        popular: true,
        buttonText: 'Upgrade to Pro',
        buttonVariant: 'primary',
        features: [
            { text: 'Unlimited active projects', included: true },
            { text: 'Advanced real-time analytics', included: true },
            { text: '100,000 monthly active users', included: true },
            { text: 'Priority 24/7 support email', included: true },
            { text: 'Full API access', included: true },
            { text: 'Custom brand domains', included: true },
        ],
    },
    {
        name: 'Enterprise',
        description: 'Bespoke security, unlimited scaling, and dedicated resources.',
        priceMonthly: 149,
        priceAnnually: 119,
        buttonText: 'Contact Sales',
        buttonVariant: 'secondary',
        features: [
            { text: 'Dedicated isolated server cluster', included: true },
            { text: 'Custom SLAs and data policies', included: true },
            { text: 'Unlimited active users', included: true },
            { text: 'Dedicated account success manager', included: true },
            { text: 'Full API access + custom webhooks', included: true },
            { text: 'White-label custom portal', included: true },
        ],
    },
];

export interface SaaSPricingProps extends React.HTMLAttributes<HTMLDivElement> {
    plans?: PricingPlan[];
    title?: string;
    subtitle?: string;
}

export function SaaSPricing({
    plans = defaultPlans,
    title = 'Simple, Unapologetic Pricing',
    subtitle = 'Choose the tier that fuels your app. No hidden fees, cancel anytime you want.',
    className,
    ...props
}: SaaSPricingProps) {
    const [billingPeriod, setBillingPeriod] = React.useState<'monthly' | 'annually'>('monthly');

    return (
        <section
            className={`w-full py-16 px-4 md:px-8 bg-white dark:bg-gray-950 text-black dark:text-white ${className || ''}`}
            {...props}
        >
            <div className="max-w-6xl mx-auto flex flex-col items-center">
                <div className="text-center max-w-3xl mb-12">
                    <Badge variant="accent" className="mb-4">
                        PRICING PLANS
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase">
                        {title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                        {subtitle}
                    </p>
                </div>

                <div className="flex items-center gap-4 mb-16 bg-gray-100 dark:bg-gray-900 p-2 border-3 border-brutal shadow-brutal-sm">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`px-4 py-2 font-black transition-all ${
                            billingPeriod === 'monthly'
                                ? 'bg-[#FFE66D] text-black border-2 border-black shadow-brutal-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                        }`}
                    >
                        Monthly Billing
                    </button>
                    <button
                        onClick={() => setBillingPeriod('annually')}
                        className={`px-4 py-2 font-black transition-all flex items-center gap-2 ${
                            billingPeriod === 'annually'
                                ? 'bg-[#FFE66D] text-black border-2 border-black shadow-brutal-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                        }`}
                    >
                        Annually (Save 20%)
                        <Badge variant="success" size="sm" className="hidden sm:inline-flex">
                            PROMO
                        </Badge>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-start">
                    {plans.map((plan) => {
                        const price = billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceAnnually;

                        return (
                            <Card
                                key={plan.name}
                                variant={plan.popular ? 'interactive' : 'default'}
                                className={`relative flex flex-col h-full bg-white dark:bg-gray-900 border-3 ${
                                    plan.popular
                                        ? 'border-brutal scale-100 md:scale-105 shadow-brutal-lg z-10'
                                        : 'border-brutal'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                        <Badge variant="primary" className="uppercase font-black text-xs border-2">
                                            MOST POPULAR
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="p-6">
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight">
                                        {plan.name}
                                    </CardTitle>
                                    <CardDescription className="min-h-[48px] mt-2">
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="p-6 pt-0 flex-grow">
                                    <div className="flex items-baseline gap-1 mb-6 border-b-3 border-brutal pb-6">
                                        <span className="text-5xl font-black tracking-tight">${price}</span>
                                        <span className="text-gray-600 dark:text-gray-400 font-bold">
                                            / month
                                        </span>
                                    </div>

                                    <ul className="space-y-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-3">
                                                <div
                                                    className={`p-1 border-2 border-brutal ${
                                                        feature.included
                                                            ? 'bg-[#7FB069] text-black'
                                                            : 'bg-gray-150 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                                                    }`}
                                                >
                                                    <Check className="h-3 w-3 stroke-[3]" />
                                                </div>
                                                <span
                                                    className={`text-sm font-bold ${
                                                        feature.included
                                                            ? 'text-black dark:text-white'
                                                            : 'text-gray-400 dark:text-gray-600 line-through'
                                                    }`}
                                                >
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter className="p-6 border-t-3 border-brutal">
                                    <Button
                                        variant={plan.buttonVariant || 'default'}
                                        className="w-full justify-center text-center font-black py-6 uppercase tracking-wider"
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-16 text-center flex flex-col sm:flex-row items-center gap-4 p-6 bg-white dark:bg-gray-900 border-3 border-brutal shadow-brutal">
                    <HelpCircle className="h-8 w-8 text-[#FF6B6B]" />
                    <p className="font-bold text-sm text-left">
                        <span className="font-black uppercase text-[#FF6B6B] block sm:inline mr-2">
                            No risk guarantee:
                        </span>
                        Try any tier completely free for 14 days. If you are not satisfied, we will issue a full refund within 30 seconds.
                    </p>
                </div>
            </div>
        </section>
    );
}
SaaSPricing.displayName = 'SaaSPricing';
