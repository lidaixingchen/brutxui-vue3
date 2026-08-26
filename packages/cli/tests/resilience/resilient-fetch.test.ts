import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resilientFetch } from '../../src/lib/resilience/resilient-fetch.js';

describe('resilientFetch', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('returns response immediately on HTTP 200 / 304', async () => {
        const mockResponse = { ok: true, status: 200, statusText: 'OK' } as unknown as Response;
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

        const fetchPromise = resilientFetch('https://example.com/test.json');
        await vi.advanceTimersByTimeAsync(10);
        const res = await fetchPromise;

        expect(res.status).toBe(200);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('returns terminal HTTP status (e.g. 404, 401) immediately without retry', async () => {
        const mock404 = { ok: false, status: 404, statusText: 'Not Found' } as unknown as Response;
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mock404));

        const fetchPromise = resilientFetch('https://example.com/missing.json', { maxRetries: 3 });
        await vi.advanceTimersByTimeAsync(10);
        const res = await fetchPromise;

        expect(res.status).toBe(404);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable HTTP status (503) and succeeds on subsequent attempt', async () => {
        const mock503 = {
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'retry-after': '1' }),
        } as unknown as Response;
        const mock200 = { ok: true, status: 200, statusText: 'OK' } as unknown as Response;

        const fetchMock = vi.fn()
            .mockResolvedValueOnce(mock503)
            .mockResolvedValueOnce(mock200);
        vi.stubGlobal('fetch', fetchMock);

        const fetchPromise = resilientFetch('https://example.com/service.json', { maxRetries: 2 });

        // First attempt returns 503, waits ~1000ms
        await vi.advanceTimersByTimeAsync(100);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1200);
        expect(fetchMock).toHaveBeenCalledTimes(2);

        const res = await fetchPromise;
        expect(res.status).toBe(200);
    });

    it('throws REGISTRY_FETCH_FAILED after exhausting maxRetries on network errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

        const fetchPromise = resilientFetch('https://example.com/network-down.json', { maxRetries: 2 });

        // Let all retries elapse
        const runPromise = (async () => {
            await vi.advanceTimersByTimeAsync(10000);
        })();

        await expect(Promise.all([fetchPromise, runPromise])).rejects.toMatchObject({
            code: 'REGISTRY_FETCH_FAILED',
        });
    });
});
