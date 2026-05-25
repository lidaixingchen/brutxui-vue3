'use client';

import { PricingSection } from '@/components/ui/pricing-section';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';
import { Badge } from '@/components/ui';

export default function PricingSectionDocPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Block
                </Badge>
                <h1 className="text-4xl font-black mb-2">Pricing Section</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A gorgeous three-tier comparison pricing block with highlighted packages, feature check tags, and hover offsets.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Interactive Preview</h2>
                <ComponentPreview align="stretch">
                    <div className="w-full border-3 border-black p-1 bg-gray-50 dark:bg-gray-900">
                        <PricingSection />
                    </div>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Registry Installation</h2>
                <InstallationTabs componentName="pricing-section" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage Examples</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { PricingSection } from "@/components/ui/pricing-section"

export default function Page() {
  return (
    <PricingSection 
      title="Scale Your Workstation"
      subtitle="Unlock premium tools for high-intensity SaaS creation."
    />
  )
}`}
                </pre>
            </section>
        </div>
    );
}
