import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { BrutalistConfig } from '../src/lib/types.js';
import { doctor, resolveDoctorReporter, determineExitCode } from '../src/commands/doctor.js';
import { createDiagnosticReport } from '../src/lib/diagnostics/engine.js';
import type { CheckResult } from '../src/lib/diagnostics/types.js';

describe('Doctor CI Mode & Exit Code Strategy', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-doctor-ci-'));
        const config: BrutalistConfig = {
            $schema: 'https://lidaixingchen.github.io/brutxui-vue3/schema.json',
            $version: 1,
            style: 'brutalism',
            tailwind: { config: '', css: 'src/main.css' },
            aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
        };
        await fs.writeJson(path.join(tmpDir, 'components.json'), config);
        await fs.ensureDir(path.join(tmpDir, 'src'));
        await fs.writeFile(path.join(tmpDir, 'src/main.css'), '/* css */');
    });

    afterEach(async () => {
        await fs.remove(tmpDir);
    });

    describe('resolveDoctorReporter Priority Matrix', () => {
        it('prioritizes explicit --reporter over --json and env vars', () => {
            expect(resolveDoctorReporter({ reporter: 'sarif', json: true, ci: true })).toBe('sarif');
            expect(resolveDoctorReporter({ reporter: 'junit', json: true })).toBe('junit');
            expect(resolveDoctorReporter({ reporter: 'github' })).toBe('github');
        });

        it('falls back to json if --json is passed without --reporter', () => {
            expect(resolveDoctorReporter({ json: true, ci: true })).toBe('json');
        });

        it('auto-detects CI environment when --ci or GITHUB_ACTIONS is present', () => {
            expect(resolveDoctorReporter({ ci: true })).toBe('github');

            const prevGA = process.env.GITHUB_ACTIONS;
            try {
                process.env.GITHUB_ACTIONS = 'true';
                expect(resolveDoctorReporter({})).toBe('github');
            } finally {
                process.env.GITHUB_ACTIONS = prevGA;
            }
        });

        it('defaults to pretty in local terminal environment', () => {
            const prevGA = process.env.GITHUB_ACTIONS;
            const prevCI = process.env.CI;
            delete process.env.GITHUB_ACTIONS;
            delete process.env.CI;

            try {
                expect(resolveDoctorReporter({})).toBe('pretty');
            } finally {
                process.env.GITHUB_ACTIONS = prevGA;
                process.env.CI = prevCI;
            }
        });
    });

    describe('determineExitCode Policy', () => {
        const passCheck: CheckResult = { ruleId: 'env.node', name: 'Node', status: 'pass', message: 'OK' };
        const warnCheck: CheckResult = { ruleId: 'config.ver', name: 'Ver', status: 'warn', message: 'Warn', category: 'config' };
        const driftCheck: CheckResult = { ruleId: 'integrity.drift', name: 'Drift', status: 'warn', message: 'Drifted', category: 'integrity' };
        const errorCheck: CheckResult = { ruleId: 'tailwind.tokens', name: 'Tokens', status: 'error', message: 'Err' };

        it('fails on error by default (failOn = "error")', () => {
            const warnReport = createDiagnosticReport([passCheck, warnCheck]);
            expect(determineExitCode(warnReport, 'error')).toBe(0);

            const errReport = createDiagnosticReport([passCheck, errorCheck]);
            expect(determineExitCode(errReport, 'error')).toBe(1);
        });

        it('fails on warnings when failOn = "warn"', () => {
            const passReport = createDiagnosticReport([passCheck]);
            expect(determineExitCode(passReport, 'warn')).toBe(0);

            const warnReport = createDiagnosticReport([passCheck, warnCheck]);
            expect(determineExitCode(warnReport, 'warn')).toBe(1);
        });

        it('fails on integrity hash drift when failOn = "drift"', () => {
            const warnReport = createDiagnosticReport([passCheck, warnCheck]);
            expect(determineExitCode(warnReport, 'drift')).toBe(0);

            const driftReport = createDiagnosticReport([passCheck, driftCheck]);
            expect(determineExitCode(driftReport, 'drift')).toBe(1);
        });
    });

    describe('doctor command integration with reporters', () => {
        it('writes output to --output-file when specified', async () => {
            const outputFile = path.join(tmpDir, 'sarif-out.json');
            try {
                await doctor({
                    cwd: tmpDir,
                    reporter: 'sarif',
                    outputFile,
                });
            } catch {
                // Ignore exitCode error since we test report disk output
            }

            expect(await fs.pathExists(outputFile)).toBe(true);
            const content = await fs.readJson(outputFile);
            expect(content.version).toBe('2.1.0');
        });
    });
});
