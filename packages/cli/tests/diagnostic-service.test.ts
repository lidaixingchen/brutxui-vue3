import { describe, it, expect } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { diagnose, DiagnosticEngine } from '../src/lib/services/diagnostic-service.js';
import { isNodeVersionSupported, nodeVersionRule, workspaceHintRule } from '../src/lib/diagnostics/rules/env-rules.js';
import type { DiagnosticRule } from '../src/lib/diagnostics/types.js';

describe('DiagnosticEngine & Env Rules (Ticket 1)', () => {
    describe('isNodeVersionSupported', () => {
        it('supports >= 22.5.0', () => {
            expect(isNodeVersionSupported('22.5.0')).toBe(true);
            expect(isNodeVersionSupported('22.5.1')).toBe(true);
            expect(isNodeVersionSupported('22.6.0')).toBe(true);
            expect(isNodeVersionSupported('23.0.0')).toBe(true);
            expect(isNodeVersionSupported('22.5.0-nightly')).toBe(true);
        });

        it('rejects < 22.5.0', () => {
            expect(isNodeVersionSupported('22.4.9')).toBe(false);
            expect(isNodeVersionSupported('20.10.0')).toBe(false);
            expect(isNodeVersionSupported('18.0.0')).toBe(false);
        });
    });

    describe('diagnose() in MemoryFileSystemAdapter', () => {
        it('produces pure data report with env rules on clean sandbox', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');

            const report = await diagnose({
                cwd: '/app',
                fs,
                categories: ['env'],
            });

            expect(report.summary.total).toBeGreaterThanOrEqual(1);
            expect(report.getByCategory('env').length).toBe(report.summary.total);
            expect(report.getByRuleId('env.node-version').length).toBe(1);
            expect(report.hasErrors).toBe(false);
        });

        it('supports filtering by ruleIds and categories', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');

            const report = await diagnose({
                cwd: '/app',
                fs,
                ruleIds: ['env.node-version'],
            });

            expect(report.summary.total).toBe(1);
            expect(report.checks[0].ruleId).toBe('env.node-version');
            expect(report.getByRuleId('env.node-version')).toHaveLength(1);
        });

        it('detects monorepo subpackages correctly', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/monorepo');
            await fs.writeFile('/monorepo/pnpm-workspace.yaml', 'packages:\n  - "packages/*"\n');
            await fs.ensureDir('/monorepo/packages/pkg-a');
            await fs.writeFile('/monorepo/packages/pkg-a/package.json', JSON.stringify({ name: 'pkg-a' }));

            const report = await diagnose({
                cwd: '/monorepo/packages/pkg-a',
                fs,
                ruleIds: ['env.workspace-hint'],
            });

            expect(report.summary.total).toBe(1);
            const hint = report.getByRuleId('env.workspace-hint')[0];
            expect(hint).toBeDefined();
            expect(hint.status).toBe('warn');
            expect(hint.message).toContain('Detected monorepo subpackage');
        });

        it('handles custom rules in DiagnosticEngine', async () => {
            const customRule: DiagnosticRule = {
                id: 'custom.test',
                category: 'integrity',
                name: 'Custom Test Rule',
                async check() {
                    return {
                        ruleId: 'custom.test',
                        category: 'integrity',
                        name: 'Custom Test Rule',
                        status: 'warn',
                        message: 'Custom warning message',
                    };
                },
            };

            const engine = new DiagnosticEngine([customRule]);
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');

            const report = await engine.diagnose({ cwd: '/app', fs });
            expect(report.summary.total).toBe(1);
            expect(report.hasWarnings).toBe(true);
            expect(report.getByStatus('warn')).toHaveLength(1);
            expect(report.getByCategory('integrity')).toHaveLength(1);
        });
    });
});
