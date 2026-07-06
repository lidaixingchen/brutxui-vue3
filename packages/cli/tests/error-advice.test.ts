import { describe, expect, it } from 'vitest';
import { CliError } from '../src/lib/error.js';
import { getCliErrorAdvice } from '../src/lib/error-advice.js';

describe('getCliErrorAdvice', () => {
    it('suggests init and doctor for missing config errors', () => {
        const advice = getCliErrorAdvice(new CliError('Missing config', {
            code: 'CONFIG_NOT_FOUND',
        }));

        expect(advice.join('\n')).toContain('brutx-vue init');
        expect(advice.join('\n')).toContain('brutx-vue doctor');
    });

    it('suggests registry recovery for fetch failures', () => {
        const advice = getCliErrorAdvice(new CliError('Fetch failed', {
            code: 'REGISTRY_FETCH_FAILED',
        }));

        expect(advice.join('\n')).toContain('--registry');
        expect(advice.join('\n')).toContain('--no-cache');
    });

    it('suggests path and alias checks for unsafe paths', () => {
        const advice = getCliErrorAdvice(new CliError('Unsafe path', {
            code: 'PATH_UNSAFE',
        }));

        expect(advice.join('\n')).toContain('components.json');
        expect(advice.join('\n')).toContain('outside the project directory');
    });

    it('falls back to doctor advice for unknown errors', () => {
        const advice = getCliErrorAdvice(new CliError('Unknown'));

        expect(advice).toEqual([
            'Try running brutx-vue doctor to diagnose project issues.',
        ]);
    });
});
