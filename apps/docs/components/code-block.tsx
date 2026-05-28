'use client';

import * as React from 'react';
import { CopyButton } from '@/components/copy-button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
    children: string;
    language?: string;
    className?: string;
    preClassName?: string;
    copyButtonClassName?: string;
}

export function CodeBlock({
    children,
    language,
    className,
    preClassName,
    copyButtonClassName,
}: CodeBlockProps) {
    return (
        <div className={cn('relative group', className)}>
            <CopyButton
                text={children}
                className={cn(
                    'absolute top-2 right-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100',
                    'shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]',
                    copyButtonClassName
                )}
            />
            {language && (
                <span className="absolute top-2 left-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    {language}
                </span>
            )}
            <pre
                className={cn(
                    'bg-gray-900 text-gray-100 p-4 pt-8 border-3 border-black dark:border-white shadow-brutal overflow-x-auto font-mono text-sm',
                    preClassName
                )}
            >
                <code>{children}</code>
            </pre>
        </div>
    );
}

interface PackageManagerTabsProps {
    commands: {
        npm: string;
        pnpm: string;
        yarn: string;
        bun?: string;
    };
}

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export function PackageManagerTabs({ commands }: PackageManagerTabsProps) {
    const [activeManager, setActiveManager] = React.useState<PackageManager>('pnpm');

    const managers: PackageManager[] = commands.bun
        ? ['pnpm', 'npm', 'yarn', 'bun']
        : ['pnpm', 'npm', 'yarn'];

    return (
        <div className="space-y-0">
            <div className="flex border-3 border-b-0 border-black dark:border-white w-fit">
                {managers.map((pm, index) => (
                    <button
                        key={pm}
                        onClick={() => setActiveManager(pm)}
                        className={cn(
                            'px-4 py-2 text-sm font-bold transition-colors',
                            index > 0 && 'border-l-3 border-black dark:border-white',
                            activeManager === pm
                                ? 'bg-[#4ECDC4] text-black'
                                : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                        )}
                    >
                        {pm}
                    </button>
                ))}
            </div>

            <div className="relative group">
                <CopyButton
                    text={commands[activeManager] || ''}
                    className="absolute top-3 right-3 z-10 h-8 w-8"
                />
                <pre className="bg-gray-900 text-gray-100 p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto font-mono text-sm">
                    <code>{commands[activeManager]}</code>
                </pre>
            </div>
        </div>
    );
}
