import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import {
    createDiagnosticReport,
} from '../src/lib/diagnostics/engine.js';
import {
    PrettyReporter,
    GithubReporter,
    JsonReporter,
    JunitReporter,
    escapeGithubProperty,
    escapeGithubData,
} from '../src/lib/diagnostics/reporters/index.js';
import type { CheckResult } from '../src/lib/diagnostics/types.js';

describe('Multi-Reporter Matrix & GitHub CI Native Support (Ticket 3: #97)', () => {
    const testDir = path.resolve(process.cwd(), 'tests/.tmp-reporters');

    beforeEach(async () => {
        await fs.ensureDir(testDir);
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    describe('GitHub Actions Escape RFC Helpers', () => {
        it('escapes property characters (% \\r \\n : ,)', () => {
            const raw = 'Title: with, commas % and\nnewlines\r';
            const escaped = escapeGithubProperty(raw);
            expect(escaped).toBe('Title%3A with%2C commas %25 and%0Anewlines%0D');
        });

        it('escapes data message characters (% \\r \\n)', () => {
            const raw = 'Error message with % and\nmulti\nlines\r';
            const escaped = escapeGithubData(raw);
            expect(escaped).toBe('Error message with %25 and%0Amulti%0Alines%0D');
        });
    });

    describe('PrettyReporter', () => {
        it('renders summary and checks without errors', async () => {
            const checks: CheckResult[] = [
                { ruleId: 'env.node', name: 'Node Version', status: 'pass', message: 'Node is valid' },
                { ruleId: 'config.schema', name: 'Schema', status: 'warn', message: 'Schema missing', fixDescription: 'Add $schema' },
                { ruleId: 'tailwind.tokens', name: 'Tokens', status: 'error', message: 'Missing tokens' },
            ];
            const report = createDiagnosticReport(checks);
            const reporter = new PrettyReporter();

            const outputs: string[] = [];
            await reporter.render(report, {
                cwd: '/project',
                write: (msg: string) => outputs.push(msg),
            });

            const combined = outputs.join('\n');
            expect(combined).toContain('Node Version');
            expect(combined).toContain('Schema missing');
            expect(combined).toContain('Missing tokens');
            expect(combined).toContain('1 passed');
            expect(combined).toContain('1 warning');
            expect(combined).toContain('1 error');
        });
    });

    describe('GithubReporter', () => {
        it('outputs ::error and ::warning workflow commands with location and escaping', async () => {
            const checks: CheckResult[] = [
                {
                    ruleId: 'custom.arch',
                    name: 'Architecture Rule: No Global Store',
                    status: 'error',
                    message: 'Component imported global store:\nstores/user.ts',
                    location: {
                        file: 'src/components/button.vue',
                        line: 12,
                        column: 3,
                    },
                },
                {
                    ruleId: 'config.version',
                    name: 'Config Version, Outdated',
                    status: 'warn',
                    message: 'Version is outdated',
                },
                {
                    ruleId: 'env.node',
                    name: 'Node Version',
                    status: 'pass',
                    message: 'Node OK',
                },
            ];

            const report = createDiagnosticReport(checks);
            const reporter = new GithubReporter();
            const commands: string[] = [];

            await reporter.render(report, {
                cwd: '/project',
                write: (msg: string) => commands.push(msg),
            });

            const commandStr = commands.join('\n');
            expect(commandStr).toContain('::error file=src/components/button.vue,line=12,col=3,title=Architecture Rule%3A No Global Store::Component imported global store:%0Astores/user.ts');
            expect(commandStr).toContain('::warning title=Config Version%2C Outdated::Version is outdated');
            expect(commandStr).not.toContain('::notice title=Node Version');
        });

        it('appends Markdown summary to $GITHUB_STEP_SUMMARY with truncation protection', async () => {
            const summaryFile = path.join(testDir, 'step_summary.md');
            await fs.writeFile(summaryFile, '# Initial Step Content\n', 'utf-8');

            const previousEnv = process.env.GITHUB_STEP_SUMMARY;
            process.env.GITHUB_STEP_SUMMARY = summaryFile;

            try {
                // 生成超过 50 个错误项以测试截断保护
                const checks: CheckResult[] = [];
                for (let i = 1; i <= 60; i++) {
                    checks.push({
                        ruleId: `custom.rule-${i}`,
                        name: `Check ${i}`,
                        status: 'error',
                        message: `Error description for rule ${i}`,
                        location: { file: `src/file-${i}.ts`, line: i },
                    });
                }

                const report = createDiagnosticReport(checks);
                const reporter = new GithubReporter();

                await reporter.render(report, {
                    cwd: testDir,
                    write: () => {},
                });

                const summaryContent = await fs.readFile(summaryFile, 'utf-8');
                // 必须保留原有前置内容（追加写入）
                expect(summaryContent).toContain('# Initial Step Content');
                expect(summaryContent).toContain('## 🎨 Brutx-Vue Doctor Report');
                expect(summaryContent).toContain('| ❌ Errors | 失败 | 60 |');
                expect(summaryContent).toContain('Check 1');
                expect(summaryContent).toContain('Check 50');
                // 超过 50 项应当截断并提示剩余项
                expect(summaryContent).toContain('还有 10 项问题被省略');
                expect(summaryContent).not.toContain('Check 55');
            } finally {
                process.env.GITHUB_STEP_SUMMARY = previousEnv;
            }
        });
    });

    describe('JsonReporter', () => {
        it('outputs structured JSON and writes to file if requested', async () => {
            const checks: CheckResult[] = [
                { ruleId: 'env.node', name: 'Node Version', status: 'pass', message: 'Node OK' },
                { ruleId: 'config.schema', name: 'Schema', status: 'warn', message: 'Missing schema' },
            ];
            const report = createDiagnosticReport(checks);
            const outputFile = path.join(testDir, 'doctor-report.json');

            const reporter = new JsonReporter();
            const printed: string[] = [];

            await reporter.render(report, {
                cwd: testDir,
                outputFile,
                write: (msg: string) => printed.push(msg),
            });

            expect(await fs.pathExists(outputFile)).toBe(true);
            const savedData = await fs.readJson(outputFile);
            expect(savedData).toHaveLength(2);
            expect(savedData[0].ruleId).toBe('env.node');
            expect(savedData[1].status).toBe('warn');

            const stdoutJson = JSON.parse(printed.join(''));
            expect(stdoutJson).toHaveLength(2);
        });
    });

    describe('JunitReporter', () => {
        it('outputs JUnit XML format and writes to file if requested', async () => {
            const checks: CheckResult[] = [
                { ruleId: 'env.node', name: 'Node Version', status: 'pass', message: 'Node OK' },
                { ruleId: 'config.schema', name: 'Schema', status: 'warn', message: 'Missing schema' },
                { ruleId: 'tailwind.tokens', name: 'Tokens', status: 'error', message: 'Missing CSS tokens' },
            ];
            const report = createDiagnosticReport(checks);
            const outputFile = path.join(testDir, 'junit-report.xml');

            const reporter = new JunitReporter();
            const printed: string[] = [];

            await reporter.render(report, {
                cwd: testDir,
                outputFile,
                write: (msg: string) => printed.push(msg),
            });

            expect(await fs.pathExists(outputFile)).toBe(true);
            const xmlContent = await fs.readFile(outputFile, 'utf-8');
            expect(xmlContent).toContain('<testsuites');
            expect(xmlContent).toContain('name="Brutx-Vue Doctor"');
            expect(xmlContent).toContain('name="Node Version"');
            expect(xmlContent).toContain('name="Tokens"');
            expect(xmlContent).toContain('<failure message="Missing CSS tokens"');
        });
    });
});
