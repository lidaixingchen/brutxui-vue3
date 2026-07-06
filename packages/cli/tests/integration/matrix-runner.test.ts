import { afterEach, describe, expect, it } from 'vitest';
import {
    createTestProject,
    localRegistry,
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

    it('runs every release matrix case against the local registry', async () => {
        for (const item of getIntegrationMatrixCases({ includeHeavy: true })) {
            const project = await createTestProject({
                template: item.template,
                tailwindMajor: item.tailwindMajor,
            });
            projects.push(project);

            for (const command of getIntegrationMatrixCommands(item, {
                cwd: project.root,
                registry: localRegistry,
            })) {
                const result = await runCli(project, command.args);

                expect(
                    result.code,
                    [
                        `matrix case: ${item.name}`,
                        `command: ${command.label}`,
                        result.stdout,
                        result.stderr,
                    ].filter(Boolean).join('\n')
                ).toBe(0);
            }
        }
    });
});
