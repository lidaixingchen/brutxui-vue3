import { appendFile } from 'node:fs/promises';
import type { DiagnosticReport } from '../types.js';
import type { DiagnosticReporter, ReporterOptions } from './types.js';
import { escapeGithubData, escapeGithubProperty } from './escape.js';

const MAX_SUMMARY_ISSUES = 50;

export class GithubReporter implements DiagnosticReporter {
    readonly name = 'github';

    async render(report: DiagnosticReport, options: ReporterOptions): Promise<void> {
        const write = options.write ?? ((msg: string) => process.stdout.write(msg + '\n'));

        // 1. 输出 Workflow Commands (Annotations)
        for (const check of report.checks) {
            if (check.status === 'pass') {
                continue;
            }

            const command = check.status === 'error' ? 'error' : 'warning';
            const title = escapeGithubProperty(check.name);
            const message = escapeGithubData(check.message);

            if (check.location?.file) {
                const file = escapeGithubProperty(check.location.file);
                const line = check.location.line ?? 1;
                const col = check.location.column ?? 1;
                let range = '';
                if (check.location.endLine !== undefined) {
                    range = `,endLine=${check.location.endLine}`;
                    if (check.location.endColumn !== undefined) {
                        range += `,endColumn=${check.location.endColumn}`;
                    }
                }
                write(`::${command} file=${file},line=${line},col=${col}${range},title=${title}::${message}`);
            } else {
                write(`::${command} title=${title}::${message}`);
            }
        }

        // 2. 追加 Step Summary 看板（若环境提供且未被显式禁用）
        const summaryPath = options.stepSummaryPath === false
            ? undefined
            : (options.stepSummaryPath ?? process.env.GITHUB_STEP_SUMMARY);
        if (summaryPath) {
            await this.writeStepSummary(summaryPath, report);
        }
    }

    private async writeStepSummary(summaryPath: string, report: DiagnosticReport): Promise<void> {
        const { passed, warnings, errors, fixable } = report.summary;
        const lines: string[] = [
            '',
            '## 🎨 Brutx-Vue Doctor Report',
            '',
            '| 规则指标 | 状态 | 数量 |',
            '| :--- | :--- | :--- |',
            `| ✅ Passed | 正常 | ${passed} |`,
            `| ⚠️ Warnings | 警告 | ${warnings} |`,
            `| ❌ Errors | 失败 | ${errors} |`,
            `| 🔧 Fixable | 可自愈 | ${fixable} |`,
            '',
        ];

        const issueChecks = report.checks.filter(c => c.status !== 'pass');
        if (issueChecks.length > 0) {
            lines.push('### ❌ 待解决问题', '');

            const displayedIssues = issueChecks.slice(0, MAX_SUMMARY_ISSUES);
            for (const issue of displayedIssues) {
                const locStr = issue.location?.file
                    ? ` (\`${issue.location.file}${issue.location.line !== undefined ? `:${issue.location.line}` : ''}\`)`
                    : '';
                lines.push(`- **${issue.name}**${locStr}`);
                lines.push(`  - 规则 ID: \`${issue.ruleId}\``);
                lines.push(`  - 详情: ${issue.message}`);
                if (issue.fixDescription) {
                    lines.push(`  - 修复建议: ${issue.fixDescription}`);
                }
            }

            if (issueChecks.length > MAX_SUMMARY_ISSUES) {
                const omitted = issueChecks.length - MAX_SUMMARY_ISSUES;
                lines.push('', `*... 还有 ${omitted} 项问题被省略，请在完整日志中查看。*`);
            }
            lines.push('');
        }

        try {
            await appendFile(summaryPath, lines.join('\n'), 'utf-8');
        } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            process.stderr.write(`[github-reporter] failed to append step summary: ${reason}\n`);
        }
    }
}
