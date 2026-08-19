import chalk from 'chalk';
import type { DoctorOptions } from '../lib/types.js';
import {
    CliError,
    diagnose,
    generateProjectSbom,
    isOfflineRequested,
    logger,
    repair,
    withOfflineScope,
} from '../lib/index.js';
import type { DiagnosticReport, RepairReport } from '../lib/diagnostics/types.js';

function renderDoctorReport(report: DiagnosticReport): void {
    logger.newLine();
    logger.bold(' Brutx-Vue Doctor');
    logger.newLine();

    for (const check of report.checks) {
        let icon: string;
        if (check.status === 'pass') {
            icon = chalk.green('✅');
        } else if (check.status === 'warn') {
            icon = chalk.yellow('⚠️');
        } else {
            icon = chalk.red('❌');
        }
        logger.log(`  ${icon} ${check.name} — ${check.message}`);

        if (check.status !== 'pass' && check.fixDescription) {
            logger.dim(`     → Fix: ${check.fixDescription}`);
        }
    }

    logger.newLine();
    const { passed, warnings, errors } = report.summary;
    logger.log(
        `  Summary: ${chalk.green(`${passed} passed`)}, ${chalk.yellow(`${warnings} warning${warnings !== 1 ? 's' : ''}`)}, ${chalk.red(`${errors} error${errors !== 1 ? 's' : ''}`)}`
    );
    logger.newLine();
}

function renderRepairSummary(repairReport: RepairReport): void {
    for (const item of repairReport.applied) {
        logger.success(`Applied fix: ${item.checkName}`);
    }
    for (const item of repairReport.failed) {
        logger.warn(`Could not apply fix: ${item.checkName}. ${item.message ?? ''}`);
    }
    for (const item of repairReport.skipped) {
        logger.info(`Skipped fix: ${item.checkName}. ${item.message ?? ''}`);
    }

    if (repairReport.configUpdated) {
        logger.success('Updated components.json.');
    }
    logger.log(`Applied ${repairReport.applied.length}/${repairReport.totalAttempted} fixes.`);
}

export async function doctor(options: DoctorOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    if (options.silent) {
        logger.setSilent(true);
    }

    // 1. SBOM 模式分流
    if (options.sbom) {
        const result = await generateProjectSbom({ cwd, outputPath: options.sbomOutput });
        logger.success(`Generated SBOM: ${result.targetPath} (${result.componentCount} components)`);
        logger.info(`Format: CycloneDX ${result.specVersion}`);
        return;
    }

    const offline = isOfflineRequested(options.offline);
    const restoreOffline = withOfflineScope(offline);

    try {
        let report = await diagnose({ cwd, offline });

        // 2. 自愈修复流程与 CI 安全防御
        if (options.fix || options.fixOnly) {
            const isInteractive = !options.yes && !options.silent && !!process.stdin.isTTY;
            const autoApply = options.yes || options.silent;

            if (!isInteractive && !autoApply) {
                logger.warn('Non-interactive mode: pass --yes to apply fixes without confirmation.');
            } else {
                const repairReport = await repair({
                    cwd,
                    fixOnly: options.fixOnly,
                    offline,
                });
                renderRepairSummary(repairReport);
                report = repairReport.freshReport;
            }
        }

        // 3. 结果输出
        if (options.json) {
            process.stdout.write(JSON.stringify(report.checks, null, 2) + '\n');
        } else {
            renderDoctorReport(report);
        }

        if (report.hasErrors) {
            throw new CliError('Doctor check failed with errors');
        }
    } finally {
        restoreOffline();
    }
}
