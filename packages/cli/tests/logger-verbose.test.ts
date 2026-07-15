import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { Logger, VERBOSE_LEVEL_NONE, VERBOSE_LEVEL_STEP, VERBOSE_LEVEL_DETAIL, VERBOSE_LEVEL_TRACE } =
    await import('../src/lib/logger.js');

describe('Logger verbose levels (P1-8)', () => {
    let logSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        delete process.env.BRUTX_VERBOSE;
    });

    afterEach(() => {
        logSpy.mockRestore();
        delete process.env.BRUTX_VERBOSE;
    });

    describe('default behavior', () => {
        it('does not output verbose messages by default', () => {
            const logger = new Logger();
            logger.verbose(VERBOSE_LEVEL_STEP, 'step message');
            expect(logSpy).not.toHaveBeenCalled();
        });

        it('outputs normal log regardless of verbose level', () => {
            const logger = new Logger({ verboseLevel: VERBOSE_LEVEL_TRACE });
            logger.log('hello');
            expect(logSpy).toHaveBeenCalledWith('hello');
        });
    });

    describe('setVerboseLevel', () => {
        it('enables verbose output at the set level', () => {
            const logger = new Logger();
            logger.setVerboseLevel(VERBOSE_LEVEL_STEP);
            logger.verbose(VERBOSE_LEVEL_STEP, 'step');
            expect(logSpy).toHaveBeenCalled();
            const call = logSpy.mock.calls[0][0] as string;
            expect(call).toContain('[STEP]');
            expect(call).toContain('step');
        });

        it('does not output above the set level', () => {
            const logger = new Logger();
            logger.setVerboseLevel(VERBOSE_LEVEL_STEP);
            logger.verbose(VERBOSE_LEVEL_DETAIL, 'should not show');
            expect(logSpy).not.toHaveBeenCalled();
        });

        it('outputs at higher levels when set', () => {
            const logger = new Logger();
            logger.setVerboseLevel(VERBOSE_LEVEL_TRACE);
            logger.verbose(VERBOSE_LEVEL_STEP, 'step');
            logger.verbose(VERBOSE_LEVEL_DETAIL, 'detail');
            logger.verbose(VERBOSE_LEVEL_TRACE, 'trace');
            expect(logSpy).toHaveBeenCalledTimes(3);
        });

        it('clamps level above max to TRACE', () => {
            const logger = new Logger();
            logger.setVerboseLevel(99);
            expect(logger.getVerboseLevel()).toBe(VERBOSE_LEVEL_TRACE);
        });

        it('clamps level below zero to NONE', () => {
            const logger = new Logger();
            logger.setVerboseLevel(-5);
            expect(logger.getVerboseLevel()).toBe(VERBOSE_LEVEL_NONE);
        });
    });

    describe('prefix labels', () => {
        it('uses [STEP] prefix at level 1', () => {
            const logger = new Logger({ verboseLevel: VERBOSE_LEVEL_STEP });
            logger.verbose(VERBOSE_LEVEL_STEP, 'msg');
            expect(logSpy.mock.calls[0][0]).toContain('[STEP]');
        });

        it('uses [DETAIL] prefix at level 2', () => {
            const logger = new Logger({ verboseLevel: VERBOSE_LEVEL_DETAIL });
            logger.verbose(VERBOSE_LEVEL_DETAIL, 'msg');
            expect(logSpy.mock.calls[0][0]).toContain('[DETAIL]');
        });

        it('uses [TRACE] prefix at level 3', () => {
            const logger = new Logger({ verboseLevel: VERBOSE_LEVEL_TRACE });
            logger.verbose(VERBOSE_LEVEL_TRACE, 'msg');
            expect(logSpy.mock.calls[0][0]).toContain('[TRACE]');
        });
    });

    describe('environment variable', () => {
        it('reads verbose level from BRUTX_VERBOSE env', () => {
            process.env.BRUTX_VERBOSE = '2';
            const logger = new Logger();
            expect(logger.getVerboseLevel()).toBe(VERBOSE_LEVEL_DETAIL);
        });

        it('ignores non-numeric BRUTX_VERBOSE', () => {
            process.env.BRUTX_VERBOSE = 'abc';
            const logger = new Logger();
            expect(logger.getVerboseLevel()).toBe(VERBOSE_LEVEL_NONE);
        });

        it('clamps BRUTX_VERBOSE above max', () => {
            process.env.BRUTX_VERBOSE = '10';
            const logger = new Logger();
            expect(logger.getVerboseLevel()).toBe(VERBOSE_LEVEL_TRACE);
        });

        it('constructor verboseLevel option takes precedence over env', () => {
            process.env.BRUTX_VERBOSE = '1';
            const logger = new Logger({ verboseLevel: VERBOSE_LEVEL_TRACE });
            expect(logger.getVerboseLevel()).toBe(VERBOSE_LEVEL_TRACE);
        });
    });

    describe('silent mode', () => {
        it('does not output verbose when silent', () => {
            const logger = new Logger({ silent: true, verboseLevel: VERBOSE_LEVEL_TRACE });
            logger.verbose(VERBOSE_LEVEL_TRACE, 'should not show');
            expect(logSpy).not.toHaveBeenCalled();
        });
    });

    describe('getVerboseLevel', () => {
        it('returns the current level', () => {
            const logger = new Logger({ verboseLevel: VERBOSE_LEVEL_DETAIL });
            expect(logger.getVerboseLevel()).toBe(VERBOSE_LEVEL_DETAIL);
        });
    });

    describe('verbose level constants', () => {
        it('exports the four levels', () => {
            expect(VERBOSE_LEVEL_NONE).toBe(0);
            expect(VERBOSE_LEVEL_STEP).toBe(1);
            expect(VERBOSE_LEVEL_DETAIL).toBe(2);
            expect(VERBOSE_LEVEL_TRACE).toBe(3);
        });
    });
});
