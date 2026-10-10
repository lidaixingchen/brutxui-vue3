import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FOCUS_RING_CLASSES } from '../src/lib/utils';

const cliConstants = readFileSync(resolve(process.cwd(), '../cli/src/lib/constants.ts'), 'utf8');

describe('FOCUS_RING_CLASSES', () => {
    it('keeps the current focus-visible ring contract', () => {
        expect(FOCUS_RING_CLASSES.split(/\s+/)).toEqual([
            'focus-visible:ring-2',
            'focus-visible:ring-brutal-ring',
            'focus-visible:ring-offset-2',
            'focus-visible:ring-offset-brutal-bg',
            'focus-visible:outline-hidden',
        ]);
    });

    it('keeps both generated CLI utils templates aligned with the UI constant', () => {
        const cliFocusRingClasses = [...cliConstants.matchAll(/export const FOCUS_RING_CLASSES =\s+"([^"]+)";/g)]
            .map((match) => match[1]);

        expect(cliFocusRingClasses).toEqual([FOCUS_RING_CLASSES, FOCUS_RING_CLASSES]);
    });
});
