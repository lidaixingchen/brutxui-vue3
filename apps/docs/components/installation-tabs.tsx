'use client';

import * as React from 'react';
import { CodeBlock } from '@/components/code-block';
import { cn } from '@/components/ui';
import { componentDependencies, componentImports } from '@/config/component-installation';
import { SITE_CONFIG } from '@/config/constants';
import { Github } from 'lucide-react';

interface InstallationTabsProps {
    componentName: string;
    dependencies?: string[];
    imports?: string[];
}

type TabType = 'cli' | 'manual';
type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export function InstallationTabs({
    componentName,
    dependencies: customDependencies,
    imports: customImports,
}: InstallationTabsProps) {
    const [activeTab, setActiveTab] = React.useState<TabType>('cli');
    const [packageManager, setPackageManager] = React.useState<PackageManager>('pnpm');

    const cliCommands: Record<PackageManager, string> = {
        pnpm: `pnpm dlx brutx@latest add ${componentName}`,
        npm: `npx brutx@latest add ${componentName}`,
        yarn: `yarn dlx brutx@latest add ${componentName}`,
        bun: `bunx brutx@latest add ${componentName}`,
    };

    const deps = customDependencies || componentDependencies[componentName] || [];
    const allDeps = ['clsx', 'tailwind-merge', ...deps];

    const dependencyCommands: Record<PackageManager, string> = {
        pnpm: `pnpm add ${allDeps.join(' ')}`,
        npm: `npm install ${allDeps.join(' ')}`,
        yarn: `yarn add ${allDeps.join(' ')}`,
        bun: `bun add ${allDeps.join(' ')}`,
    };

    const imports = customImports ||
        componentImports[componentName] || [
            componentName
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(''),
        ];

    const importStatement =
        imports.length > 3
            ? `import {\n  ${imports.join(',\n  ')},\n} from "@/components/ui/${componentName}"`
            : `import { ${imports.join(', ')} } from "@/components/ui/${componentName}"`;

    return (
        <div className="space-y-4">
            <div className="flex border-3 border-black dark:border-white w-fit">
                <button
                    onClick={() => setActiveTab('cli')}
                    className={cn(
                        'px-4 py-2 font-bold transition-colors',
                        activeTab === 'cli'
                            ? 'bg-[#FF6B6B] text-black'
                            : 'bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                >
                    CLI
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={cn(
                        'px-4 py-2 font-bold transition-colors border-l-3 border-black dark:border-white',
                        activeTab === 'manual'
                            ? 'bg-[#FF6B6B] text-black'
                            : 'bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                >
                    Manual
                </button>
            </div>

            <div className="flex border-3 border-black dark:border-white w-fit">
                {(['pnpm', 'npm', 'yarn', 'bun'] as PackageManager[]).map((pm, index) => (
                    <button
                        key={pm}
                        onClick={() => setPackageManager(pm)}
                        className={cn(
                            'px-3 py-1.5 text-sm font-bold transition-colors',
                            index > 0 && 'border-l-3 border-black dark:border-white',
                            packageManager === pm
                                ? 'bg-[#4ECDC4] text-black'
                                : 'bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                    >
                        {pm}
                    </button>
                ))}
            </div>

            {activeTab === 'cli' ? (
                <div className="space-y-4">
                    <CodeBlock preClassName="pr-12">{cliCommands[packageManager]}</CodeBlock>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-bold mb-2 text-gray-600 dark:text-gray-400">
                            1. Install dependencies:
                        </p>
                        <CodeBlock preClassName="pr-12">{dependencyCommands[packageManager]}</CodeBlock>
                    </div>

                    <div>
                        <p className="text-sm font-bold mb-2 text-gray-600 dark:text-gray-400">
                            2. Copy the component code from GitHub:
                        </p>
                        <a
                            href={`${SITE_CONFIG.github.componentBlobUrl}/${componentName}.tsx`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 font-bold border-3 border-black dark:border-white bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Github className="h-5 w-5 stroke-[2.5]" />
                            View {componentName}.tsx on GitHub
                        </a>
                    </div>

                    <div>
                        <p className="text-sm font-bold mb-2 text-gray-600 dark:text-gray-400">
                            3. Save to{' '}
                            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                                components/ui/{componentName}.tsx
                            </code>
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-bold mb-2 text-gray-600 dark:text-gray-400">
                            4. Import and use:
                        </p>
                        <CodeBlock preClassName="pr-12">{importStatement}</CodeBlock>
                    </div>
                </div>
            )}
        </div>
    );
}
