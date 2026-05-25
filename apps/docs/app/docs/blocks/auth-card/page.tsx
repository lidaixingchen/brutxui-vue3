'use client';

import { AuthCard } from '@/components/ui/auth-card';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';
import { Badge } from '@/components/ui';

export default function AuthCardDocPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Block
                </Badge>
                <h1 className="text-4xl font-black mb-2">Auth Card</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A secure, professional-grade sign-in block featuring email forms, password forgot hooks, and Google/GitHub identity OAuth integration.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Interactive Preview</h2>
                <ComponentPreview>
                    <div className="w-full flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-900 border-3 border-black">
                        <AuthCard 
                            onLoginSubmit={(e) => {
                                e.preventDefault();
                                alert('Credentials submitted successfully!');
                            }}
                        />
                    </div>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Registry Installation</h2>
                <InstallationTabs componentName="auth-card" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage Examples</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { AuthCard } from "@/components/ui/auth-card"

export default function Page() {
  return (
    <AuthCard
      title="Secure Admin Gateway"
      onLoginSubmit={(e) => {
        // Handle database authentication
      }}
    />
  )
}`}
                </pre>
            </section>
        </div>
    );
}
