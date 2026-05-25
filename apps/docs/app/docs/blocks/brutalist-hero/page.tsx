'use client';

import { BrutalistHero } from '@/components/ui/brutalist-hero';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';
import { Badge } from '@/components/ui';

export default function BrutalistHeroDocPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Block
                </Badge>
                <h1 className="text-4xl font-black mb-2">Brutalist Hero</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A beautiful, responsive, and responsive hero landing page block structured with flat cards, active double offsets, and neon headings.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Interactive Preview</h2>
                <ComponentPreview>
                    <div className="w-full border-3 border-black p-1 bg-gray-50 dark:bg-gray-900">
                        <BrutalistHero 
                            primaryCtaText="Launch App Console"
                            secondaryCtaText="Read Documentation"
                        />
                    </div>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Registry Installation</h2>
                <InstallationTabs componentName="brutalist-hero" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage Examples</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { BrutalistHero } from "@/components/ui/brutalist-hero"

export default function Page() {
  return (
    <BrutalistHero
      title="Create the Future of Decentralized SaaS"
      subtitle="The ultimate high-performance workspace for modern indie hackers."
      primaryCtaText="Get Started"
      secondaryCtaText="View Demo"
      onPrimaryCtaClick={() => console.log('Primary click')}
    />
  )
}`}
                </pre>
            </section>
        </div>
    );
}
