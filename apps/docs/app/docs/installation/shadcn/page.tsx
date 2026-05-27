import { Badge } from '@/components/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'shadcn/ui CLI Integration - Brutx',
    description: 'Learn how to install and customize BrutxUI components using the official shadcn/ui command-line tool.',
    keywords: [
        'shadcn integration',
        'shadcn registry url',
        'brutx shadcn',
        'neo-brutalist shadcn components',
        'shadcn add component',
    ],
    openGraph: {
        title: 'shadcn/ui CLI Integration - Brutx',
        description: 'Learn how to install and customize BrutxUI components using the official shadcn/ui command-line tool.',
        url: 'https://brutxui.site/docs/installation/shadcn',
    },
    alternates: {
        canonical: 'https://brutxui.site/docs/installation/shadcn',
    },
};

export default function ShadcnIntegrationPage() {
    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <Badge variant="accent" className="mb-4">
                    Alternative Workflow
                </Badge>
                <h1 className="text-4xl font-black mb-2">shadcn/ui CLI Integration</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    BrutxUI features standard shadcn/ui-compatible registry JSON schemas.
                    This allows you to copy-paste or install Brutx components directly into your codebase using the official <code>shadcn</code> CLI in addition to our native <code>brutx</code> CLI tool.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white my-6" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">1. How it works</h2>
                <p>
                    Each component in BrutxUI maps to a standalone, self-describing JSON file containing all source code files, npm packages, tailwind styles, and CSS custom variables.
                    When you run the <code>shadcn add</code> command pointing to our hosted registry, the shadcn CLI will:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Automatically resolve and install any required npm dependencies (e.g. <code>@radix-ui/react-slot</code>, <code>lucide-react</code>).</li>
                    <li>Download the component file directly to your <code>components/ui/</code> folder.</li>
                    <li>Merge the required Brutx tailwind extensions and custom HSL/CSS variables directly into your local <code>tailwind.config.js</code> and global CSS stylesheet automatically.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">2. Basic Commands</h2>
                <p>
                    You can install any component from BrutxUI by supplying the direct URL to the component's registry schema. Below are several examples:
                </p>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold mb-1 text-sm text-[#FF6B6B] uppercase">Native Brutx CLI Workflow</h4>
                        <pre className="bg-black text-white p-3 text-xs font-mono overflow-x-auto border-2 border-black">
{`npx brutx add button card`}
                        </pre>
                    </div>

                    <div>
                        <h4 className="font-bold mb-1 text-sm text-[#4ECDC4] uppercase">Installing via shadcn CLI</h4>
                        <p className="text-sm mb-2 text-gray-600 dark:text-gray-400">
                            Simply target the component's absolute JSON endpoint on our registry host:
                        </p>
                        <pre className="bg-black text-[#FFE66D] p-3 text-xs font-mono overflow-x-auto border-2 border-black space-y-1">
{`# Add the Button component
npx shadcn@latest add https://brutxui.site/registry/button.json

# Add the Card component
npx shadcn@latest add https://brutxui.site/registry/card.json

# Add complex dashboard stats block
npx shadcn@latest add https://brutxui.site/registry/dashboard-stats.json`}
                        </pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">3. Local Development, Publishing & Updates</h2>
                <p>
                    For contributors modifying or publishing changes to registry components, the workspace offers a automated compile-and-validation suite.
                </p>

                <div className="border-3 border-black dark:border-white p-5 bg-white dark:bg-gray-900 space-y-4">
                    <h3 className="font-black text-lg">Registry Build Pipeline</h3>

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-[#FF6B6B] mb-1">Step 1: Edit Component Source</h4>
                        <p className="text-sm">
                            Make changes directly inside the core typescript components folder: <code>packages/ui/src/components/*.tsx</code>.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-[#4ECDC4] mb-1">Step 2: Re-generate Registry Files</h4>
                        <p className="text-sm mb-2">
                            Run the compiler script to automatically parse, strip local references, and generate matching JSON payloads.
                        </p>
                        <pre className="bg-black text-white p-3 text-xs font-mono overflow-x-auto">
{`pnpm --filter brutx-registry build`}
                        </pre>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-[#FFE66D] mb-1">Step 3: Validate registry items</h4>
                        <p className="text-sm mb-2">
                            Confirm that the newly compiled schemas strictly comply with standard registry expectations and have valid file content and schema formats.
                        </p>
                        <pre className="bg-black text-white p-3 text-xs font-mono overflow-x-auto">
{`pnpm --filter brutx-registry validate`}
                        </pre>
                    </div>
                </div>
            </section>
        </div>
    );
}
