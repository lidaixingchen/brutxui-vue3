import * as React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface BrutalistHeroProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    primaryCtaText?: string;
    secondaryCtaText?: string;
    onPrimaryCtaClick?: () => void;
    onSecondaryCtaClick?: () => void;
}

export function BrutalistHero({
    title = 'Build Bold Interfaces Faster with BrutxUI',
    subtitle = 'A hyper-responsive, neo-brutalist component registry built with Radix UI and Tailwind CSS. Designed for devs who dare to be different.',
    primaryCtaText = 'Get Started Now',
    secondaryCtaText = 'View Component Registry',
    onPrimaryCtaClick,
    onSecondaryCtaClick,
    className,
    ...props
}: BrutalistHeroProps) {
    return (
        <section
            className={`w-full py-12 md:py-24 lg:py-32 bg-brutal-bg text-brutal-fg border-3 border-brutal rounded-none transition-colors duration-200 ${className || ''}`}
            {...props}
        >
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                    <div className="flex flex-col justify-center space-y-6 text-left">
                        <div className="inline-flex items-center space-x-2 bg-brutal-accent text-black px-3 py-1 border-3 border-brutal w-fit font-black text-sm uppercase tracking-wider rotate-[-1deg]">
                            <Sparkles className="h-4 w-4 stroke-[3]" />
                            <span>V0.2.1 Release</span>
                        </div>

                        <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
                            {title}
                        </h1>

                        <p className="max-w-[600px] text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                            {subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                size="lg"
                                variant="primary"
                                className="font-black text-lg gap-2"
                                onClick={onPrimaryCtaClick}
                            >
                                <span>{primaryCtaText}</span>
                                <ArrowRight className="h-5 w-5 stroke-[3]" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="font-black text-lg"
                                onClick={onSecondaryCtaClick}
                            >
                                {secondaryCtaText}
                            </Button>
                        </div>
                    </div>

                    <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none">
                        <div className="absolute inset-0 bg-brutal-secondary translate-x-3 translate-y-3 border-3 border-brutal rounded-none" />
                        <Card className="relative z-10 border-3 border-brutal bg-white dark:bg-gray-800 rounded-none shadow-none p-2">
                            <div className="flex items-center justify-between border-b-3 border-brutal pb-2 mb-4 bg-gray-100 dark:bg-gray-700 p-2">
                                <div className="flex space-x-2">
                                    <div className="w-3.5 h-3.5 rounded-full bg-brutal-destructive border-2 border-brutal" />
                                    <div className="w-3.5 h-3.5 rounded-full bg-brutal-accent border-2 border-brutal" />
                                    <div className="w-3.5 h-3.5 rounded-full bg-brutal-success border-2 border-brutal" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-wider opacity-60">brutx-terminal</span>
                            </div>
                            <CardContent className="font-mono text-sm space-y-3 text-black dark:text-white pt-2">
                                <p className="text-brutal-destructive font-black">~/projects/my-bold-saas</p>
                                <p className="flex items-center gap-2">
                                    <span className="text-brutal-secondary font-black">$</span>
                                    <span>npx brutx init</span>
                                </p>
                                <p className="text-gray-500 font-medium">Custom Tailwind design tokens configured</p>
                                <p className="text-gray-500 font-medium">Global CSS token layer synchronized</p>
                                <p className="flex items-center gap-2">
                                    <span className="text-brutal-secondary font-black">$</span>
                                    <span>npx brutx add hero pricing auth-card</span>
                                </p>
                                <p className="text-brutal-success font-black">Successfully added 3 blocks into /components/ui!</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}
