'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';
import { Badge } from '@/components/ui';

export default function EmptyStateDocPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Block
                </Badge>
                <h1 className="text-4xl font-black mb-2">Empty State</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A centralized, clean illustration container to instruct users when workspaces or folders do not contain items.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Interactive Preview</h2>
                <ComponentPreview>
                    <div className="w-full flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 border-3 border-black">
                        <EmptyState
                            onActionClick={() => alert('Launching resource creation modal...')}
                        />
                    </div>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Registry Installation</h2>
                <InstallationTabs componentName="empty-state" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage Examples</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { EmptyState } from "@/components/ui/empty-state"
import { Database } from "lucide-react"

export default function Page() {
  return (
    <EmptyState
      title="No active databases"
      description="You haven't provisioned a database cluster yet. Create your first SQL node instantly."
      actionText="Create Database"
      icon={<Database className="h-8 w-8 stroke-[2.5]" />}
      onActionClick={() => createNode()}
    />
  )
}`}
                </pre>
            </section>
        </div>
    );
}
