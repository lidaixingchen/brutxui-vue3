import { describe, it, expect } from 'vitest';
import {
    calculateBoundedJitterDelay,
    parseRetryAfterDelayMs,
    isRetryableHttpStatus,
    isTerminalHttpStatus,
    DEFAULT_BACKOFF_OPTIONS,
    MAX_RETRY_AFTER_CAP_MS,
} from '../../src/lib/resilience/backoff.js';

describe('calculateBoundedJitterDelay', () => {
    it('returns value within [minDelayMs, cap] for given attempt', () => {
        // base = 500, min = 200, max = 5000
        // attempt 1: cap = min(5000, 500 * 2^0) = 500 -> range [200, 500]
        const delay1 = calculateBoundedJitterDelay(1, DEFAULT_BACKOFF_OPTIONS);
        expect(delay1).toBeGreaterThanOrEqual(200);
        expect(delay1).toBeLessThanOrEqual(500);

        // attempt 3: cap = min(5000, 500 * 2^2) = 2000 -> range [200, 2000]
        const delay3 = calculateBoundedJitterDelay(3, DEFAULT_BACKOFF_OPTIONS);
        expect(delay3).toBeGreaterThanOrEqual(200);
        expect(delay3).toBeLessThanOrEqual(2000);
    });

    it('respects injected randomFn for deterministic testing', () => {
        // random = 0 -> returns minDelayMs
        const minVal = calculateBoundedJitterDelay(2, {
            ...DEFAULT_BACKOFF_OPTIONS,
            randomFn: () => 0,
        });
        expect(minVal).toBe(200);

        // random = 1 -> returns cap (500 * 2^1 = 1000)
        const maxVal = calculateBoundedJitterDelay(2, {
            ...DEFAULT_BACKOFF_OPTIONS,
            randomFn: () => 1,
        });
        expect(maxVal).toBe(1000);

        // random = 0.5 -> floor(200 + 0.5 * (1000 - 200)) = 600
        const midVal = calculateBoundedJitterDelay(2, {
            ...DEFAULT_BACKOFF_OPTIONS,
            randomFn: () => 0.5,
        });
        expect(midVal).toBe(600);
    });

    it('caps delay at maxDelayMs regardless of how large attempt is', () => {
        const cappedVal = calculateBoundedJitterDelay(100, {
            ...DEFAULT_BACKOFF_OPTIONS,
            randomFn: () => 1,
        });
        expect(cappedVal).toBe(5000);
    });

    it('handles attempt <= 0 safely by treating as attempt 1', () => {
        const delay0 = calculateBoundedJitterDelay(0, {
            ...DEFAULT_BACKOFF_OPTIONS,
            randomFn: () => 0,
        });
        expect(delay0).toBe(200);
    });
});

describe('parseRetryAfterDelayMs', () => {
    it('returns null for empty, undefined, null or whitespace strings', () => {
        expect(parseRetryAfterDelayMs(null)).toBeNull();
        expect(parseRetryAfterDelayMs(undefined)).toBeNull();
        expect(parseRetryAfterDelayMs('')).toBeNull();
        expect(parseRetryAfterDelayMs('   ')).toBeNull();
    });

    it('parses valid integer seconds and applies jitter', () => {
        const result = parseRetryAfterDelayMs('5');
        expect(result).not.toBeNull();
        // 5s = 5000ms with +-10% jitter -> [4500, 5500]
        expect(result).toBeGreaterThanOrEqual(4500);
        expect(result).toBeLessThanOrEqual(5500);
    });

    it('parses valid HTTP-Date format and applies jitter', () => {
        const now = 1700000000000;
        const targetDate = new Date(now + 6000).toUTCString(); // +6s
        const result = parseRetryAfterDelayMs(targetDate, now);
        expect(result).not.toBeNull();
        // 6s = 6000ms with +-10% jitter -> [5400, 6600]
        expect(result).toBeGreaterThanOrEqual(5400);
        expect(result).toBeLessThanOrEqual(6600);
    });

    it('caps delay at MAX_RETRY_AFTER_CAP_MS (15000ms)', () => {
        const result = parseRetryAfterDelayMs('120'); // 120s
        expect(result).toBe(MAX_RETRY_AFTER_CAP_MS);
    });

    it('returns null for unparseable strings', () => {
        expect(parseRetryAfterDelayMs('invalid-string')).toBeNull();
        expect(parseRetryAfterDelayMs('not a date')).toBeNull();
    });
});

describe('HTTP Status Code Classifiers', () => {
    it('identifies retryable HTTP status codes', () => {
        expect(isRetryableHttpStatus(408)).toBe(true);
        expect(isRetryableHttpStatus(429)).toBe(true);
        expect(isRetryableHttpStatus(500)).toBe(true);
        expect(isRetryableHttpStatus(502)).toBe(true);
        expect(isRetryableHttpStatus(503)).toBe(true);
        expect(isRetryableHttpStatus(504)).toBe(true);

        expect(isRetryableHttpStatus(200)).toBe(false);
        expect(isRetryableHttpStatus(404)).toBe(false);
        expect(isRetryableHttpStatus(401)).toBe(false);
    });

    it('identifies terminal HTTP status codes', () => {
        expect(isTerminalHttpStatus(400)).toBe(true);
        expect(isTerminalHttpStatus(401)).toBe(true);
        expect(isTerminalHttpStatus(403)).toBe(true);
        expect(isTerminalHttpStatus(404)).toBe(true);
        expect(isTerminalHttpStatus(422)).toBe(true);

        expect(isTerminalHttpStatus(200)).toBe(false);
        expect(isTerminalHttpStatus(500)).toBe(false);
        expect(isTerminalHttpStatus(429)).toBe(false);
    });
});
