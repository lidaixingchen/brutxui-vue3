import chalk from 'chalk';
import type { DiagnosticReport } from '../types.js';
import type { DiagnosticReporter, ReporterOptions } from './types.js';

export class PrettyReporter implements DiagnosticReporter {
    readonly name = 'pretty';

    async render(report: DiagnosticReport, options: ReporterOptions): Promise<void> {
        if (options.silent) {
            return;
        }

        const write = options.write ?? ((msg: string) => process.stdout.write(msg + '\n'));

        write('');
        write(chalk.bold(' Brutx-Vue Doctor'));
        write('');

        for (const check of report.checks) {
            let icon: string;
            if (check.status === 'pass') {
                icon = chalk.green('✅');
            } else if (check.status === 'warn') {
                icon = chalk.yellow('⚠️');
            } else {
                icon = chalk.red('❌');
            }

            write(`  ${icon} ${check.name} — ${check.message}`);

            if (check.status !== 'pass' && check.fixDescription) {
                write(chalk.dim(`     → Fix: ${check.fixDescription}`));
            }
        }

        write('');
        const { passed, warnings, errors } = report.summary;
        write(
            `  Summary: ${chalk.green(`${passed} passed`)}, ${chalk.yellow(`${warnings} warning${warnings !== 1 ? 's' : ''}`)}, ${chalk.red(`${errors} error${errors !== 1 ? 's' : ''}`)}`
        );
        write('');
    }
}
