import fs from 'fs-extra';
import path from 'path';
import type { DiagnosticReport } from '../types.js';
import type { DiagnosticReporter, ReporterOptions } from './types.js';

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export class JunitReporter implements DiagnosticReporter {
    readonly name = 'junit';

    async render(report: DiagnosticReport, options: ReporterOptions): Promise<void> {
        const { total, errors, warnings } = report.summary;
        const testcases: string[] = [];

        for (const check of report.checks) {
            const classname = escapeXml(check.category ?? 'diagnostics');
            const name = escapeXml(check.name);

            if (check.status === 'pass') {
                testcases.push(`    <testcase classname="${classname}" name="${name}" time="0" />`);
            } else if (check.status === 'error') {
                const msg = escapeXml(check.message);
                testcases.push(
                    `    <testcase classname="${classname}" name="${name}" time="0">\n` +
                    `      <failure message="${msg}" type="DiagnosticError">${msg}</failure>\n` +
                    `    </testcase>`
                );
            } else {
                const msg = escapeXml(check.message);
                testcases.push(
                    `    <testcase classname="${classname}" name="${name}" time="0">\n` +
                    `      <system-out>Warning: ${msg}</system-out>\n` +
                    `    </testcase>`
                );
            }
        }

        const xmlContent =
            `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<testsuites name="Brutx-Vue Doctor" tests="${total}" failures="${errors}" errors="0" time="0">\n` +
            `  <testsuite name="DoctorDiagnostics" tests="${total}" failures="${errors}" warnings="${warnings}" time="0">\n` +
            testcases.join('\n') +
            `\n  </testsuite>\n` +
            `</testsuites>\n`;

        if (options.outputFile) {
            const targetPath = path.resolve(options.cwd, options.outputFile);
            await fs.ensureDir(path.dirname(targetPath));
            await fs.writeFile(targetPath, xmlContent, 'utf-8');
        }

        const write = options.write ?? ((msg: string) => process.stdout.write(msg + '\n'));
        write(xmlContent);
    }
}
