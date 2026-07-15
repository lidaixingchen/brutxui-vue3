import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const {
    isRequireSignatureEnvActive,
    isRequireSignature,
    setRequireSignature,
    resetRequireSignature,
} = await import('../src/lib/signature-mode.js');

describe('signature strict mode (P1-6)', () => {
    beforeEach(() => {
        resetRequireSignature();
        delete process.env.BRUTX_REQUIRE_SIGNATURE;
    });

    afterEach(() => {
        resetRequireSignature();
        delete process.env.BRUTX_REQUIRE_SIGNATURE;
    });

    describe('isRequireSignatureEnvActive', () => {
        it('returns false when env var is not set', () => {
            expect(isRequireSignatureEnvActive()).toBe(false);
        });

        it('returns true when BRUTX_REQUIRE_SIGNATURE=1', () => {
            process.env.BRUTX_REQUIRE_SIGNATURE = '1';
            expect(isRequireSignatureEnvActive()).toBe(true);
        });

        it('returns false when BRUTX_REQUIRE_SIGNATURE is not "1"', () => {
            process.env.BRUTX_REQUIRE_SIGNATURE = '0';
            expect(isRequireSignatureEnvActive()).toBe(false);

            process.env.BRUTX_REQUIRE_SIGNATURE = 'true';
            expect(isRequireSignatureEnvActive()).toBe(false);
        });
    });

    describe('isRequireSignature', () => {
        it('returns false by default', () => {
            expect(isRequireSignature()).toBe(false);
        });

        it('returns true after setRequireSignature(true)', () => {
            setRequireSignature(true);
            expect(isRequireSignature()).toBe(true);
        });

        it('returns true when env var is set even without setRequireSignature', () => {
            process.env.BRUTX_REQUIRE_SIGNATURE = '1';
            expect(isRequireSignature()).toBe(true);
        });

        it('returns false after resetRequireSignature', () => {
            setRequireSignature(true);
            expect(isRequireSignature()).toBe(true);
            resetRequireSignature();
            expect(isRequireSignature()).toBe(false);
        });

        it('resetRequireSignature does not affect env var', () => {
            process.env.BRUTX_REQUIRE_SIGNATURE = '1';
            resetRequireSignature();
            // 环境变量仍激活
            expect(isRequireSignature()).toBe(true);
        });
    });

    describe('setRequireSignature / resetRequireSignature isolation', () => {
        it('multiple set calls are idempotent', () => {
            setRequireSignature(true);
            setRequireSignature(true);
            expect(isRequireSignature()).toBe(true);
            setRequireSignature(false);
            expect(isRequireSignature()).toBe(false);
        });

        it('resetRequireSignature always clears global flag regardless of env', () => {
            setRequireSignature(true);
            resetRequireSignature();
            // 无 env 时为 false
            expect(isRequireSignature()).toBe(false);

            // 有 env 时 reset 仅清全局，env 仍生效
            process.env.BRUTX_REQUIRE_SIGNATURE = '1';
            setRequireSignature(true);
            resetRequireSignature();
            expect(isRequireSignature()).toBe(true);
        });
    });
});
