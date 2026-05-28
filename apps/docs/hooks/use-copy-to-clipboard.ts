'use client';

import * as React from 'react';

export function useCopyToClipboard(resetDelay = 2000) {
    const [copied, setCopied] = React.useState(false);

    const copy = React.useCallback(
        async (text: string) => {
            try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                window.setTimeout(() => setCopied(false), resetDelay);
                return true;
            } catch (error) {
                console.error('Failed to copy:', error);
                return false;
            }
        },
        [resetDelay]
    );

    return { copied, copy };
}
