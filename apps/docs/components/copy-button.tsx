'use client';

import type * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text: string;
    iconSize?: number;
}

export function CopyButton({ text, iconSize = 16, className, ...props }: CopyButtonProps) {
    const { copied, copy } = useCopyToClipboard();
    const Icon = copied ? Check : Copy;

    return (
        <button
            type="button"
            onClick={() => copy(text)}
            className={cn(
                'inline-flex items-center justify-center border-2 font-bold text-xs transition-all duration-200',
                copied
                    ? 'border-black bg-[#4ECDC4] text-black'
                    : 'border-white bg-gray-800 text-gray-100 hover:border-black hover:bg-[#4ECDC4] hover:text-black',
                className
            )}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            {...props}
        >
            <Icon style={{ width: iconSize, height: iconSize }} strokeWidth={2.5} />
        </button>
    );
}
