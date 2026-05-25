'use client';

import { DashboardShell } from '@/components/ui/dashboard-shell';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';
import { Badge } from '@/components/ui';

export default function DashboardShellDocPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Block
                </Badge>
                <h1 className="text-4xl font-black mb-2">Dashboard Shell</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A robust responsive layout structure complete with nav sidebar, responsive header menu controls, stats, and database transaction tables.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Interactive Preview</h2>
                <ComponentPreview>
                    <div className="w-full bg-gray-100 dark:bg-gray-900 p-1 border-3 border-black">
                        <DashboardShell 
                            onSignOutClick={() => alert('Signing out of console...')}
                        />
                    </div>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Registry Installation</h2>
                <InstallationTabs componentName="dashboard-shell" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage Examples</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { DashboardShell } from "@/components/ui/dashboard-shell"

export default function Page() {
  return (
    <DashboardShell
      userEmail="admin@my-company.com"
      onSignOutClick={() => logout()}
    />
  )
}`}
                </pre>
            </section>
        </div>
    );
}
