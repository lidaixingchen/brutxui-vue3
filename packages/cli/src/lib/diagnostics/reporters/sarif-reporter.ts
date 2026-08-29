import fs from 'fs-extra';
import path from 'path';
import type { CheckResult, DiagnosticReport } from '../types.js';
import type { DiagnosticReporter, ReporterOptions } from './types.js';

interface SarifRule {
    id: string;
    name?: string;
    shortDescription?: { text: string };
    helpUri?: string;
}

interface SarifResultLocation {
    physicalLocation: {
        artifactLocation: {
            uri: string;
        };
        region?: {
            startLine?: number;
            startColumn?: number;
            endLine?: number;
            endColumn?: number;
        };
    };
}

interface SarifResult {
    ruleId: string;
    ruleIndex: number;
    level: 'error' | 'warning' | 'note';
    message: { text: string };
    locations?: SarifResultLocation[];
}

function toPosixRelativePath(cwd: string, filePath: string): string {
    const relative = path.isAbsolute(filePath)
        ? path.relative(cwd, filePath)
        : filePath;
    return relative.split(path.sep).join('/');
}

export class SarifReporter implements DiagnosticReporter {
    readonly name = 'sarif';

    async render(report: DiagnosticReport, options: ReporterOptions): Promise<void> {
        const issueChecks = report.checks.filter(c => c.status !== 'pass');

        // 1. 建立 driver.rules 字典
        const ruleMap = new Map<string, { rule: SarifRule; index: number }>();
        const rules: SarifRule[] = [];

        for (const check of issueChecks) {
            if (!ruleMap.has(check.ruleId)) {
                const sarifRule: SarifRule = {
                    id: check.ruleId,
                    name: check.name,
                    shortDescription: { text: check.name },
                };
                if (check.helpUrl) {
                    sarifRule.helpUri = check.helpUrl;
                }
                const index = rules.length;
                rules.push(sarifRule);
                ruleMap.set(check.ruleId, { rule: sarifRule, index });
            }
        }

        // 2. 构造 results 项
        const results: SarifResult[] = issueChecks.map((check: CheckResult) => {
            const ruleEntry = ruleMap.get(check.ruleId)!;
            const result: SarifResult = {
                ruleId: check.ruleId,
                ruleIndex: ruleEntry.index,
                level: check.status === 'error' ? 'error' : 'warning',
                message: { text: check.message },
            };

            if (check.location?.file) {
                const posixUri = toPosixRelativePath(options.cwd, check.location.file);
                const region: SarifResultLocation['physicalLocation']['region'] = {};
                if (check.location.line !== undefined) region.startLine = check.location.line;
                if (check.location.column !== undefined) region.startColumn = check.location.column;
                if (check.location.endLine !== undefined) region.endLine = check.location.endLine;
                if (check.location.endColumn !== undefined) region.endColumn = check.location.endColumn;

                result.locations = [
                    {
                        physicalLocation: {
                            artifactLocation: {
                                uri: posixUri,
                            },
                            ...(Object.keys(region).length > 0 ? { region } : {}),
                        },
                    },
                ];
            }

            return result;
        });

        // 3. 构造完整 OASIS SARIF 2.1.0 顶层对象
        const sarifPayload = {
            $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
            version: '2.1.0',
            runs: [
                {
                    tool: {
                        driver: {
                            name: 'brutx-vue doctor',
                            version: '0.11.1',
                            informationUri: 'https://github.com/lidaixingchen/brutxui-vue3',
                            rules,
                        },
                    },
                    results,
                },
            ],
        };

        const jsonString = JSON.stringify(sarifPayload, null, 2);

        if (options.outputFile) {
            const targetPath = path.resolve(options.cwd, options.outputFile);
            await fs.ensureDir(path.dirname(targetPath));
            await fs.writeFile(targetPath, jsonString + '\n', 'utf-8');
        }

        const write = options.write ?? ((msg: string) => process.stdout.write(msg + '\n'));
        write(jsonString);
    }
}
