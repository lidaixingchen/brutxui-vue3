import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import {
    createDiagnosticReport,
} from '../src/lib/diagnostics/engine.js';
import {
    SarifReporter,
} from '../src/lib/diagnostics/reporters/index.js';
import type { CheckResult } from '../src/lib/diagnostics/types.js';

describe('OASIS SARIF 2.1.0 Reporter (Ticket 4: #98)', () => {
    const testDir = path.resolve(process.cwd(), 'tests/.tmp-sarif');

    beforeEach(async () => {
        await fs.ensureDir(testDir);
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    it('generates valid OASIS SARIF 2.1.0 schema structure', async () => {
        const checks: CheckResult[] = [
            {
                ruleId: 'custom.arch.no-store',
                name: 'No Global Store in Base UI',
                status: 'error',
                message: 'Forbidden store import in button.vue',
                helpUrl: 'https://internal.wiki/rules/arch',
                location: {
                    file: path.join(testDir, 'src/components/button.vue'),
                    line: 15,
                    column: 2,
                    endLine: 15,
                    endColumn: 30,
                },
            },
            {
                ruleId: 'config.schema',
                name: '$schema field present',
                status: 'warn',
                message: '$schema is missing',
            },
            {
                ruleId: 'env.node',
                name: 'Node Version',
                status: 'pass',
                message: 'Node is valid',
            },
        ];

        const report = createDiagnosticReport(checks);
        const reporter = new SarifReporter();
        const outputFile = path.join(testDir, 'results.sarif');
        const printed: string[] = [];

        await reporter.render(report, {
            cwd: testDir,
            outputFile,
            write: (msg: string) => printed.push(msg),
        });

        expect(await fs.pathExists(outputFile)).toBe(true);
        const sarif = await fs.readJson(outputFile);

        // 1. 顶层契约校验
        expect(sarif.version).toBe('2.1.0');
        expect(sarif.$schema).toContain('sarif-schema-2.1.0.json');
        expect(sarif.runs).toHaveLength(1);

        const run = sarif.runs[0];
        expect(run.tool.driver.name).toBe('brutx-vue doctor');

        // 2. driver.rules 字典校验
        expect(run.tool.driver.rules).toBeInstanceOf(Array);
        expect(run.tool.driver.rules.length).toBe(2); // error and warn only (pass 不计入 issue results)

        const rule0 = run.tool.driver.rules.find((r: { id: string }) => r.id === 'custom.arch.no-store');
        expect(rule0).toBeDefined();
        expect(rule0.name).toBe('No Global Store in Base UI');
        expect(rule0.helpUri).toBe('https://internal.wiki/rules/arch');

        // 3. results 项与 ruleIndex 映射校验
        expect(run.results).toHaveLength(2);
        const result0 = run.results.find((r: { ruleId: string }) => r.ruleId === 'custom.arch.no-store');
        expect(result0).toBeDefined();
        expect(result0.level).toBe('error');
        expect(result0.message.text).toBe('Forbidden store import in button.vue');
        expect(result0.ruleIndex).toBe(run.tool.driver.rules.indexOf(rule0));

        // 4. POSIX 相对路径校验（杜绝绝对路径与 Windows 反斜杠）
        expect(result0.locations).toHaveLength(1);
        const physLoc = result0.locations[0].physicalLocation;
        expect(physLoc.artifactLocation.uri).toBe('src/components/button.vue');
        expect(physLoc.region.startLine).toBe(15);
        expect(physLoc.region.startColumn).toBe(2);
        expect(physLoc.region.endLine).toBe(15);
        expect(physLoc.region.endColumn).toBe(30);

        // 5. 无 location 规则降级为无具体物理位置或纯 ruleId 结果
        const result1 = run.results.find((r: { ruleId: string }) => r.ruleId === 'config.schema');
        expect(result1).toBeDefined();
        expect(result1.level).toBe('warning');
    });
});
