import { describe, it, expect, beforeEach } from 'vitest';
import { RegistrySourceTracker } from '../../src/lib/resilience/source-tracker.js';

describe('RegistrySourceTracker', () => {
    let tracker: RegistrySourceTracker;

    beforeEach(() => {
        tracker = new RegistrySourceTracker();
    });

    it('ranks untested sources equally in original order', () => {
        const sources = ['https://source-a.com', 'https://source-b.com', 'https://source-c.com'];
        expect(tracker.rankSources(sources)).toEqual(sources);
    });

    it('prioritizes healthy fast sources over untested and slower sources', () => {
        tracker.recordSuccess('https://source-b.com', 80);
        tracker.recordSuccess('https://source-a.com', 400);

        const ranked = tracker.rankSources(['https://source-a.com', 'https://source-b.com', 'https://source-c.com']);
        // source-b (RTT 80ms) should be first, source-a (RTT 400ms) second, untested source-c third
        expect(ranked).toEqual([
            'https://source-b.com',
            'https://source-a.com',
            'https://source-c.com',
        ]);
    });

    it('downgrades failed sources to DEGRADED and then DOWN', () => {
        const primary = 'https://primary.com';
        const backup = 'https://backup.com';

        // 1st failure -> DEGRADED, should fall behind untested backup
        tracker.recordFailure(primary);
        expect(tracker.rankSources([primary, backup])).toEqual([backup, primary]);

        // 2nd failure -> DOWN
        tracker.recordFailure(primary);
        expect(tracker.rankSources([primary, backup])).toEqual([backup, primary]);

        // Recover primary on success
        tracker.recordSuccess(primary, 50);
        expect(tracker.rankSources([primary, backup])).toEqual([primary, backup]);
    });

    it('does not increment failure count on recordCanceledByWinner, keeping source healthy', () => {
        const primary = 'https://primary.com';
        const backup = 'https://backup.com';

        tracker.recordSuccess(primary, 200);
        // Cancel primary because backup won
        tracker.recordCanceledByWinner(primary, 600);

        // Primary should still be HEALTHY, not DEGRADED or DOWN
        const ranked = tracker.rankSources([primary, backup]);
        expect(ranked[0]).toBe(primary);
    });

    it('resets all tracked metrics on reset()', () => {
        tracker.recordSuccess('https://source-a.com', 100);
        tracker.recordFailure('https://source-b.com');
        tracker.reset();

        expect(tracker.rankSources(['https://source-b.com', 'https://source-a.com'])).toEqual([
            'https://source-b.com',
            'https://source-a.com',
        ]);
    });
});
