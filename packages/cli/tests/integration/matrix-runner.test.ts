import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import {
    createTestProject,
    localRegistry,
    readInstallLog,
    removeTestProject,
    runCli,
    type TestProject,
} from './helpers.js';
import {
    getIntegrationMatrixCases,
    getIntegrationMatrixCommands,
} from './matrix.js';

const runFullMatrix = process.env.BRUTX_RUN_FULL_INTEGRATION_MATRIX === '1';
const describeFullMatrix = runFullMatrix ? describe : describe.skip;

describeFullMatrix('brutx-vue full CLI integration matrix', { timeout: 120000 }, () => {
    const projects: TestProject[] = [];

    afterEach(async () => {
        while (projects.length > 0) {
            const project = projects.pop();
            if (project) {
                await removeTestProject(project);
            }
        }
    });

    async function collectDiagnostics(project: TestProject): Promise<string> {
        const installLog = await readInstallLog(project).catch(() => []);
        let packageJsonContent = '(unable to read)';
        try {
            packageJsonContent = JSON.stringify(await fs.readJson(path.join(project.root, 'package.json')), null, 2);
        } catch {
            // keep default
        }
        return [
            '=== DIAGNOSTICS ===',
            `Install log entries: ${installLog.length}`,
            ...installLog.map((entry) => `  ${JSON.stringify(entry)}`),
            `package.json:\n${packageJsonContent}`,
        ].join('\n');
    }

    it('runs every release matrix case against the local registry', async () => {
        const allOutputs: string[] = [];

        for (const item of getIntegrationMatrixCases({ includeHeavy: true })) {
            const project = await createTestProject({
                template: item.template,
            });
            projects.push(project);

            for (const command of getIntegrationMatrixCommands(item, {
                cwd: project.root,
                registry: localRegistry,
            })) {
                const result = await runCli(project, command.args);

                const output = [
                    `matrix case: ${item.name}`,
                    `command: ${command.label}`,
                    `exit code: ${result.code}`,
                    result.stdout,
                    result.stderr,
                ].filter(Boolean).join('\n');
                allOutputs.push(output);

                if (result.code !== 0) {
                    const diagnostics = await collectDiagnostics(project);
                    expect(
                        result.code,
                        [
                            diagnostics,
                            '',
                            '=== ALL COMMAND OUTPUTS ===',
                            ...allOutputs,
                        ].join('\n')
                    ).toBe(0);
                }
            }
        }
    });
});
