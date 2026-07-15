import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const {
    isDryRunEnvActive,
    isGlobalDryRun,
    setGlobalDryRun,
    mergeDryRun,
    resetGlobalDryRun,
    printDryRunAction,
} = await import('../src/lib/global-dry-run.js');

describe('global dry-run (P1-8)', () => {
    beforeEach(() => {
        resetGlobalDryRun();
        delete process.env.BRUTX_DRY_RUN;
    });

    afterEach(() => {
        resetGlobalDryRun();
        delete process.env.BRUTX_DRY_RUN;
    });

    describe('isDryRunEnvActive', () => {
        it('returns false when env var is not set', () => {
            expect(isDryRunEnvActive()).toBe(false);
        });

        it('returns true when BRUTX_DRY_RUN=1', () => {
            process.env.BRUTX_DRY_RUN = '1';
            expect(isDryRunEnvActive()).toBe(true);
        });

        it('returns false when BRUTX_DRY_RUN is not "1"', () => {
            process.env.BRUTX_DRY_RUN = '0';
            expect(isDryRunEnvActive()).toBe(false);

            process.env.BRUTX_DRY_RUN = 'true';
            expect(isDryRunEnvActive()).toBe(false);
        });
    });

    describe('isGlobalDryRun', () => {
        it('returns false by default', () => {
            expect(isGlobalDryRun()).toBe(false);
        });

        it('returns true after setGlobalDryRun(true)', () => {
            setGlobalDryRun(true);
            expect(isGlobalDryRun()).toBe(true);
        });

        it('returns true when env var is set even without setGlobalDryRun', () => {
            process.env.BRUTX_DRY_RUN = '1';
            expect(isGlobalDryRun()).toBe(true);
        });

        it('returns false after resetGlobalDryRun', () => {
            setGlobalDryRun(true);
            expect(isGlobalDryRun()).toBe(true);
            resetGlobalDryRun();
            expect(isGlobalDryRun()).toBe(false);
        });

        it('resetGlobalDryRun does not affect env var', () => {
            process.env.BRUTX_DRY_RUN = '1';
            resetGlobalDryRun();
            // 环境变量仍激活
            expect(isGlobalDryRun()).toBe(true);
        });
    });

    describe('mergeDryRun', () => {
        it('returns false when neither command nor global is set', () => {
            expect(mergeDryRun(false)).toBe(false);
            expect(mergeDryRun(undefined)).toBe(false);
        });

        it('returns true when command dry-run is true', () => {
            expect(mergeDryRun(true)).toBe(true);
        });

        it('returns true when global dry-run is set via setGlobalDryRun', () => {
            setGlobalDryRun(true);
            expect(mergeDryRun(false)).toBe(true);
            expect(mergeDryRun(undefined)).toBe(true);
        });

        it('returns true when global dry-run is set via env var', () => {
            process.env.BRUTX_DRY_RUN = '1';
            expect(mergeDryRun(false)).toBe(true);
        });

        it('command dry-run and global dry-run both true stays true', () => {
            setGlobalDryRun(true);
            expect(mergeDryRun(true)).toBe(true);
        });
    });

    describe('printDryRunAction', () => {
        it('prints dry-run action message without throwing', () => {
            // printDryRunAction 是 fire-and-forget（动态导入 logger），验证不抛错即可
            expect(() => printDryRunAction('create', '/fake/path')).not.toThrow();
        });
    });

    describe('setGlobalDryRun / resetGlobalDryRun isolation', () => {
        it('multiple set calls are idempotent', () => {
            setGlobalDryRun(true);
            setGlobalDryRun(true);
            expect(isGlobalDryRun()).toBe(true);
            setGlobalDryRun(false);
            expect(isGlobalDryRun()).toBe(false);
        });
    });
});
