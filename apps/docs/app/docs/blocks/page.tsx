'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui';

const blocks = [
    {
        name: 'Brutalist Hero',
        slug: 'brutalist-hero',
        description: 'Bold above-the-fold hero layout featuring full-width headline grids, offset CTAs, and a visual card shell.',
    },
    {
        name: 'Pricing Section',
        slug: 'pricing-section',
        description: 'Interactive three-tier grid pricing comparison. Highlighting standard/popular plans and deep checks listings.',
    },
    {
        name: 'Auth Card',
        slug: 'auth-card',
        description: 'Comprehensive sign-in template supporting dynamic inputs, label icons, OAuth federated integrations, and passwords.',
    },
    {
        name: 'Dashboard Shell',
        slug: 'dashboard-shell',
        description: 'Complete operational admin panel combining navigation sidebars, statistics blocks, headers, and transactional database tables.',
    },
    {
        name: 'Empty State',
        slug: 'empty-state',
        description: 'Centralized empty workspace alert blocks guiding users to create resources or trigger positive workflows.',
    },
    {
        name: 'Waitlist Page',
        slug: 'waitlist-page',
        description: 'Full conversion-oriented subscription page containing user email submissions, social proof ratings, and status badges.',
    },
];

export default function BlocksIndexPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Templates
                </Badge>
                <h1 className="text-4xl font-black mb-2">Blocks & Templates</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    Pre-designed, fully responsive neo-brutalist sections and pages built on top of atomic BrutxUI components. Ready to copy-paste.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <div className="grid gap-6 sm:grid-cols-2">
                {blocks.map((block) => (
                    <Link
                        key={block.slug}
                        href={`/docs/blocks/${block.slug}`}
                        className="group flex flex-col justify-between p-6 border-3 border-black dark:border-white bg-white dark:bg-gray-800 shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg transition-all duration-150"
                    >
                        <div className="space-y-2">
                            <h3 className="text-xl font-black group-hover:text-brutal-primary transition-colors">
                                {block.name}
                            </h3>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {block.description}
                            </p>
                        </div>
                        <div className="pt-4 text-xs font-black uppercase tracking-wider text-brutal-primary group-hover:underline">
                            View details & code →
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
