import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    hedgedRace,
    createAggregatedSourceError,
} from '../../src/lib/resilience/hedged-race.js';
import { CliError } from '../../src/lib/error.js';

describe('hedgedRace', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns result of first source when it succeeds before hedgeDelay', async () => {
        const fetcher = vi.fn(async (source: string, _signal: AbortSignal) => {
            return `data-from-${source}`;
        });

        const racePromise = hedgedRace(
            ['https://source-1.com', 'https://source-2.com'],
            fetcher,
            { hedgeDelayMs: 600, sourceTimeoutMs: 5000 },
        );

        await vi.advanceTimersByTimeAsync(10);
        const result = await racePromise;

        expect(result).toEqual({
            result: 'data-from-https://source-1.com',
            winningSource: 'https://source-1.com',
            durationMs: expect.any(Number),
        });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('starts second source after hedgeDelayMs when first source is lagging, and cancels slow source on win', async () => {
        const fetcher = vi.fn((source: string, signal: AbortSignal) => {
            return new Promise<string>((resolve, reject) => {
                const abortHandler = () => {
                    const err = new Error('aborted');
                    err.name = 'AbortError';
                    reject(err);
                };
                signal.addEventListener('abort', abortHandler, { once: true });

                if (source === 'https://source-1.com') {
                    setTimeout(() => {
                        signal.removeEventListener('abort', abortHandler);
                        resolve('slow-data');
                    }, 1500);
                } else if (source === 'https://source-2.com') {
                    setTimeout(() => {
                        signal.removeEventListener('abort', abortHandler);
                        resolve('fast-data');
                    }, 100);
                }
            });
        });

        const racePromise = hedgedRace(
            ['https://source-1.com', 'https://source-2.com'],
            fetcher,
            { hedgeDelayMs: 600, sourceTimeoutMs: 5000 },
        );

        expect(fetcher).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(600);
        expect(fetcher).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(100);
        const result = await racePromise;

        expect(result.winningSource).toBe('https://source-2.com');
        expect(result.result).toBe('fast-data');
    });

    it('performs fast-fail bypass when first source fails early (0ms wait for second source)', async () => {
        const fetcher = vi.fn((source: string, _signal: AbortSignal) => {
            return new Promise<string>((resolve, reject) => {
                if (source === 'https://source-1.com') {
                    setTimeout(() => {
                        reject(new Error('ECONNREFUSED'));
                    }, 50);
                } else if (source === 'https://source-2.com') {
                    setTimeout(() => {
                        resolve('backup-data');
                    }, 100);
                }
            });
        });

        const racePromise = hedgedRace(
            ['https://source-1.com', 'https://source-2.com'],
            fetcher,
            { hedgeDelayMs: 600, sourceTimeoutMs: 5000 },
        );

        await vi.advanceTimersByTimeAsync(50);
        expect(fetcher).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(100);
        const result = await racePromise;

        expect(result.winningSource).toBe('https://source-2.com');
        expect(result.result).toBe('backup-data');
    });

    it('aggregates errors and throws when all sources fail', async () => {
        const fetcher = vi.fn((_source: string) => {
            return new Promise<string>((_resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('connection refused'));
                }, 10);
            });
        });

        const racePromise = hedgedRace(
            ['https://source-1.com', 'https://source-2.com'],
            fetcher,
            { hedgeDelayMs: 600, sourceTimeoutMs: 5000 },
        );

        const assertion = expect(racePromise).rejects.toMatchObject({
            code: 'REGISTRY_FETCH_FAILED',
        });

        await vi.advanceTimersByTimeAsync(100);
        await assertion;
    });

    it('cascades parent cancellation signal', async () => {
        const parentController = new AbortController();
        const fetcher = vi.fn((_source: string, signal: AbortSignal) => {
            return new Promise<string>((_resolve, reject) => {
                signal.addEventListener('abort', () => {
                    reject(new Error('aborted by parent'));
                });
            });
        });

        const racePromise = hedgedRace(
            ['https://source-1.com'],
            fetcher,
            { hedgeDelayMs: 600, sourceTimeoutMs: 5000, parentSignal: parentController.signal },
        );

        const assertion = expect(racePromise).rejects.toThrow('Request aborted');
        parentController.abort(new Error('User interrupted'));
        await vi.advanceTimersByTimeAsync(10);
        await assertion;
    });
});

describe('createAggregatedSourceError', () => {
    it('prioritizes REGISTRY_SIGNATURE_INVALID over all other errors', () => {
        const errors = [
            { source: 'https://a.com', error: new Error('timeout') },
            {
                source: 'https://b.com',
                error: new CliError('Signature mismatch', { code: 'REGISTRY_SIGNATURE_INVALID' }),
            },
            {
                source: 'https://c.com',
                error: new CliError('Hash mismatch', { code: 'REGISTRY_INTEGRITY_FAILED' }),
            },
        ];

        const aggregated = createAggregatedSourceError(errors);
        expect(aggregated.code).toBe('REGISTRY_SIGNATURE_INVALID');
    });

    it('prioritizes REGISTRY_INTEGRITY_FAILED when no signature error present', () => {
        const errors = [
            { source: 'https://a.com', error: new Error('network down') },
            {
                source: 'https://b.com',
                error: new CliError('Hash mismatch', { code: 'REGISTRY_INTEGRITY_FAILED' }),
            },
        ];

        const aggregated = createAggregatedSourceError(errors);
        expect(aggregated.code).toBe('REGISTRY_INTEGRITY_FAILED');
        expect(aggregated.message).toContain('consistency delay');
    });

    it('surfaces COMPONENT_NOT_FOUND only when all sources returned 404 not found', () => {
        const errorsAll404 = [
            {
                source: 'https://a.com',
                error: new CliError('Not found', { code: 'COMPONENT_NOT_FOUND' }),
            },
            {
                source: 'https://b.com',
                error: new CliError('Not found', { code: 'COMPONENT_NOT_FOUND' }),
            },
        ];

        const resultAll404 = createAggregatedSourceError(errorsAll404);
        expect(resultAll404.code).toBe('COMPONENT_NOT_FOUND');

        const errorsMixed = [
            {
                source: 'https://a.com',
                error: new CliError('Not found', { code: 'COMPONENT_NOT_FOUND' }),
            },
            {
                source: 'https://b.com',
                error: new Error('network error'),
            },
        ];

        const resultMixed = createAggregatedSourceError(errorsMixed);
        expect(resultMixed.code).toBe('REGISTRY_FETCH_FAILED');
    });
});
