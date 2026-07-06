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

    it('suggests doctor fix and force init for invalid config errors', () => {
        const advice = getCliErrorAdvice(new CliError('Invalid config', {
            code: 'CONFIG_INVALID',
        }));

        expect(advice.join('\n')).toContain('brutx-vue doctor --fix');
        expect(advice.join('\n')).toContain('brutx-vue init --force');
    });

    it('suggests cache bypass and registry validation for integrity failures', () => {
        const advice = getCliErrorAdvice(new CliError('Integrity mismatch', {
            code: 'REGISTRY_INTEGRITY_FAILED',
        }));

        expect(advice.join('\n')).toContain('--no-cache');
        expect(advice.join('\n')).toContain('rebuild and validate');
    });

    it('suggests path and alias checks for unsafe paths', () => {
        const advice = getCliErrorAdvice(new CliError('Unsafe path', {
            code: 'PATH_UNSAFE',
        }));

        expect(advice.join('\n')).toContain('components.json');
        expect(advice.join('\n')).toContain('outside the project directory');
    });

    it('suggests file permission checks for write failures', () => {
        const advice = getCliErrorAdvice(new CliError('Write failed', {
            code: 'WRITE_FAILED',
        }));

        expect(advice.join('\n')).toContain('file permissions');
        expect(advice.join('\n')).toContain('brutx-vue doctor --fix');
    });

    it('falls back to doctor advice for unknown errors', () => {
        const advice = getCliErrorAdvice(new CliError('Unknown'));

        expect(advice).toEqual([
            'Try running brutx-vue doctor to diagnose project issues.',
        ]);
    });
});
