import * as React from 'react';
import { Check } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

export interface BrutalistPricingPlan {
    name: string;
    price: string;
    description: string;
    features: string[];
    ctaText: string;
    popular?: boolean;
    variant: 'primary' | 'secondary' | 'accent' | 'default';
}

export interface PricingSectionProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    plans?: BrutalistPricingPlan[];
}

const defaultPlans: BrutalistPricingPlan[] = [
    {
        name: 'Indie Creator',
        price: '$9',
        description: 'For solo devs and side-project hackers building clean products.',
        features: [
            'Access to 24+ atomic components',
            'Full registry copying workflow',
            'Figma design assets',
            'Community Support Channel',
        ],
        ctaText: 'Start Building',
        variant: 'default',
    },
    {
        name: 'Pro Developer',
        price: '$29',
        description: 'For growing creators, SaaS platforms, and professional agencies.',
        features: [
            'Access to all 36+ components',
            'All copy-paste premium blocks',
            'Advanced customizable variables',
            '1 year of regular registry updates',
            'Priority GitHub issue support',
        ],
        ctaText: 'Unlock Pro Access',
        popular: true,
        variant: 'primary',
    },
    {
        name: 'Team Studio',
        price: '$99',
        description: 'For collaborative development groups and startups building scaled apps.',
        features: [
            'Unlimited user accounts',
            'Custom internal branding theme presets',
            'AI-ready prompts and generation guidelines',
            'Direct Slack developer console support',
            'SLA uptime assurance',
        ],
        ctaText: 'Contact Workspace Sales',
        variant: 'secondary',
    },
];

export function PricingSection({
    title = 'Simple, Transparent Brutalist Plans',
    subtitle = 'Choose the subscription tier that matches your current development workflow. No hidden fees, instant cancel.',
    plans = defaultPlans,
    className,
    ...props
}: PricingSectionProps) {
    return (
        <section
            className={`w-full py-12 md:py-24 bg-brutal-bg text-brutal-fg transition-colors duration-200 ${className || ''}`}
            {...props}
        >
            <div className="container px-4 md:px-6 mx-auto space-y-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-3xl mx-auto">
                    <div className="bg-brutal-secondary text-black px-3 py-1 border-3 border-brutal font-black text-xs uppercase tracking-wider rotate-[1.5deg]">
                        Flexible Pricing Plans
                    </div>
                    <h2 className="text-3xl font-black sm:text-4xl md:text-5xl tracking-tight leading-none">
                        {title}
                    </h2>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                        {subtitle}
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch max-w-6xl mx-auto pt-6">
                    {plans.map((plan, idx) => {
                        return (
                            <div key={idx} className="relative flex flex-col h-full">
                                {plan.popular && (
                                    <div className="absolute top-[-16px] left-[50%] translate-x-[-50%] z-20">
                                        <Badge variant="accent" className="text-xs font-black uppercase tracking-wider px-3 py-1 animate-pulse border-3 border-brutal">
                                            Most Popular Tier
                                        </Badge>
                                    </div>
                                )}

                                <Card className={`flex flex-col h-full border-3 border-brutal rounded-none shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg transition-all duration-150 ${plan.popular ? 'bg-yellow-50/20' : 'bg-white dark:bg-gray-800'}`}>
                                    <CardHeader className="space-y-2 pb-6 border-b-3 border-brutal">
                                        <CardTitle className="text-2xl font-black leading-none">{plan.name}</CardTitle>
                                        <div className="flex items-baseline space-x-1">
                                            <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">/ lifetime</span>
                                        </div>
                                        <CardDescription className="font-bold text-sm text-gray-600 dark:text-gray-300 pt-2 min-h-[48px]">
                                            {plan.description}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-grow pt-6 space-y-4">
                                        <p className="font-black text-xs uppercase tracking-wider text-gray-500">What's included:</p>
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, fIdx) => (
                                                <li key={fIdx} className="flex items-start space-x-3 text-sm font-bold">
                                                    <div className="h-5 w-5 shrink-0 rounded-full bg-brutal-success border-2 border-brutal flex items-center justify-center">
                                                        <Check className="h-3 w-3 stroke-[4] text-black" />
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300 leading-tight">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>

                                    <CardFooter className="pt-6 border-t-3 border-brutal mt-auto bg-gray-50 dark:bg-gray-900/50 p-6">
                                        <Button
                                            className="w-full font-black text-base py-6"
                                            variant={plan.variant}
                                        >
                                            {plan.ctaText}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
