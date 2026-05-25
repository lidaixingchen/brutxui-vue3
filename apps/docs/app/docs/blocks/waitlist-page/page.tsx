'use client';

import { WaitlistPage } from '@/components/ui/waitlist-page';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';
import { Badge } from '@/components/ui';

export default function WaitlistPageDocPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Block
                </Badge>
                <h1 className="text-4xl font-black mb-2">Waitlist Page</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A gorgeous full conversion registration template with input fields, CTA action mappings, and developer metrics social proofs.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Interactive Preview</h2>
                <ComponentPreview>
                    <div className="w-full border-3 border-black p-1 bg-gray-50 dark:bg-gray-900">
                        <WaitlistPage 
                            onWaitlistSubmit={(e, email) => {
                                e.preventDefault();
                                alert(`Joined priority list with email: ${email}`);
                            }}
                        />
                    </div>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Registry Installation</h2>
                <InstallationTabs componentName="waitlist-page" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage Examples</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { WaitlistPage } from "@/components/ui/waitlist-page"

export default function Page() {
  return (
    <WaitlistPage
      title="Secure early builder access to Brutx"
      onWaitlistSubmit={(e, email) => {
        // Post email to subscriber DB
      }}
    />
  )
}`}
                </pre>
            </section>
        </div>
    );
}
