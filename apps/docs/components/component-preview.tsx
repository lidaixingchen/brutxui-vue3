'use client';

import * as React from 'react';
import { Card, cn } from '@/components/ui';

interface ComponentPreviewProps {
    children: React.ReactNode;
    className?: string;
    align?: 'center' | 'start' | 'stretch';
}

export function ComponentPreview({ children, className, align = 'center' }: ComponentPreviewProps) {
    return (
        <Card
            className={cn(
                'p-4 sm:p-8 flex min-h-[150px] sm:min-h-[200px] bg-gray-50 dark:bg-gray-900 dark:border-white overflow-x-auto',
                align === 'center' ? 'items-center justify-center' : 'items-stretch justify-start',
                className
            )}
            variant="flat"
        >
            <div className={cn(
                "w-full gap-2 sm:gap-4",
                align === 'center'
                  ? "flex items-center justify-center flex-wrap"
                  : "flex flex-col items-stretch"
            )}>
                {children}
            </div>
        </Card>
    );
}

interface CodeBlockProps {
    children: string;
    language?: string;
}

export function CodeBlock({ children, language = 'tsx' }: CodeBlockProps) {
    return (
        <pre className="bg-gray-900 text-white p-3 sm:p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto my-4 text-xs sm:text-sm">
            <code className={`language-${language}`}>{children}</code>
        </pre>
    );
}
