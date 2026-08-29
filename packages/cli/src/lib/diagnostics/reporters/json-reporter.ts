import fs from 'fs-extra';
import path from 'path';
import type { DiagnosticReport } from '../types.js';
import type { DiagnosticReporter, ReporterOptions } from './types.js';

export class JsonReporter implements DiagnosticReporter {
    readonly name = 'json';

    async render(report: DiagnosticReport, options: ReporterOptions): Promise<void> {
        const jsonString = JSON.stringify(report.checks, null, 2);

        if (options.outputFile) {
            const targetPath = path.resolve(options.cwd, options.outputFile);
            await fs.ensureDir(path.dirname(targetPath));
            await fs.writeFile(targetPath, jsonString + '\n', 'utf-8');
        }

        const write = options.write ?? ((msg: string) => process.stdout.write(msg + '\n'));
        write(jsonString);
    }
}
