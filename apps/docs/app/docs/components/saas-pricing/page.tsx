'use client';

import { SaaSPricing, Badge } from '@/components/ui';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';

export default function SaasPricingPage() {
    return (
        <div>
            <Badge variant="primary" className="mb-4">
                Block Component
            </Badge>
            <h1>SaaS Pricing</h1>

            <p>Premium SaaS pricing plans, features matrix, and billing frequency toggles with stark Neo-Brutalist design.</p>

            <h2>Preview</h2>
            <ComponentPreview align="stretch">
                <SaaSPricing />
            </ComponentPreview>

            <h2>Installation</h2>
            <InstallationTabs componentName="saas-pricing" />

            <h2>Usage</h2>
            <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
                {`import { SaaSPricing } from "@/components/ui/saas-pricing"

// Basic Usage
<SaaSPricing />

// Custom Plans Usage
const customPlans = [
  {
    name: "Hobby",
    description: "For simple personal projects.",
    priceMonthly: 9,
    priceAnnually: 7,
    buttonText: "Start Hobby Plan",
    buttonVariant: "outline" as const,
    features: [
      { text: "1 active project", included: true },
      { text: "Basic support", included: true },
      { text: "Custom domains", included: false }
    ]
  },
  {
    name: "Growth",
    description: "For commercial operations and scaling teams.",
    priceMonthly: 29,
    priceAnnually: 23,
    popular: true,
    buttonText: "Upgrade to Growth",
    buttonVariant: "primary" as const,
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Priority support", included: true },
      { text: "Custom domains", included: true }
    ]
  }
];

<SaaSPricing 
  plans={customPlans} 
  title="Choose Your Power" 
  subtitle="Start scaling with Neo-Brutalist confidence today."
/>`}
            </pre>
        </div>
    );
}
