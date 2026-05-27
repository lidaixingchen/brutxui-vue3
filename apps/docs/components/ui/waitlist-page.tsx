import * as React from 'react';
import { Sparkles, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface WaitlistPageProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    ctaText?: string;
    onWaitlistSubmit?: (e: React.FormEvent<HTMLFormElement>, email: string) => void;
}

export function WaitlistPage({
    title = 'Join the BrutxUI Waitlist Club',
    description = 'Get early developer keys to copy premium blocks, customized theme presets, and unlock deep registry CLI integrations before everyone else.',
    ctaText = 'Secure Priority Access',
    onWaitlistSubmit,
    className,
    ...props
}: WaitlistPageProps) {
    const [email, setEmail] = React.useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (onWaitlistSubmit) onWaitlistSubmit(e, email);
    };

    return (
        <section
            className={`w-full py-16 md:py-24 bg-brutal-bg text-brutal-fg border-3 border-brutal transition-colors duration-200 ${className || ''}`}
            {...props}
        >
            <div className="container px-4 md:px-6 mx-auto max-w-4xl">
                <div className="flex flex-col items-center justify-center text-center space-y-8">
                    <div className="inline-flex items-center space-x-2 bg-brutal-accent text-black px-4 py-1.5 border-3 border-brutal font-black text-xs uppercase tracking-wider rotate-[-1.5deg]">
                        <Sparkles className="h-4 w-4 stroke-[3] animate-spin" />
                        <span>Private Beta Access Open</span>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl leading-[1.05]">
                            {title}
                        </h1>
                        <p className="max-w-[640px] text-lg font-bold text-gray-700 dark:text-gray-300 mx-auto leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-md flex flex-col sm:flex-row gap-3 pt-2"
                    >
                        <Input
                            type="email"
                            placeholder="Enter your personal email..."
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-grow text-base py-6 bg-white dark:bg-gray-800"
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            className="font-black text-sm py-6 px-6 shrink-0"
                        >
                            {ctaText}
                        </Button>
                    </form>

                    <div className="w-full border-t-3 border-brutal pt-8 mt-6">
                        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 items-center justify-center max-w-2xl mx-auto">
                            <div className="flex items-center justify-center space-x-2 font-black text-sm">
                                <Users className="h-5 w-5 text-brutal-secondary stroke-[2.5]" />
                                <span>1,840+ Developers on waitlist</span>
                            </div>
                            <div className="flex items-center justify-center space-x-1 font-black text-sm">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-brutal-accent text-black stroke-[2.5]" />
                                ))}
                                <span className="pl-1">4.9/5 stars rating</span>
                            </div>
                            <div className="flex items-center justify-center space-x-2 font-black text-sm sm:col-span-2 md:col-span-1">
                                <span className="h-2 w-2 rounded-full bg-brutal-success animate-ping" />
                                <span>Beta Invites sent daily</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
