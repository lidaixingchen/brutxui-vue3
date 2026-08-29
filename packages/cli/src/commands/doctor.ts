import chalk from 'chalk';
import type { DoctorOptions, FailOnLevel, ReporterType } from '../lib/types.js';
import {
    CliError,
    diagnose,
    generateProjectSbom,
    isOfflineRequested,
    logger,
    repair,
    withOfflineScope,
} from '../lib/index.js';
import type { DiagnosticCategory, DiagnosticReport, RepairReport } from '../lib/diagnostics/types.js';
import {
    PrettyReporter,
    GithubReporter,
    JsonReporter,
    SarifReporter,
    JunitReporter,
    type DiagnosticReporter,
} from '../lib/diagnostics/reporters/index.js';

const VALID_REPORTERS: readonly ReporterType[] = ['pretty', 'github', 'json', 'sarif', 'junit'];
const VALID_FAIL_ON: readonly FailOnLevel[] = ['error', 'warn', 'drift'];

export function resolveDoctorReporter(options: DoctorOptions): ReporterType {
    if (options.reporter) {
        if (!VALID_REPORTERS.includes(options.reporter)) {
            throw new CliError(`Invalid --reporter "${options.reporter}". Valid options: ${VALID_REPORTERS.join(', ')}`);
        }
        return options.reporter;
    }
    if (options.json) {
        return 'json';
    }
    if (options.ci || process.env.GITHUB_ACTIONS === 'true') {
        return 'github';
    }
    return 'pretty';
}

export function determineExitCode(report: DiagnosticReport, failOn: FailOnLevel = 'error'): number {
    if (failOn && !VALID_FAIL_ON.includes(failOn)) {
        throw new CliError(`Invalid --fail-on "${failOn}". Valid options: ${VALID_FAIL_ON.join(', ')}`);
    }
    if (failOn === 'warn') {
        return report.hasErrors || report.hasWarnings ? 1 : 0;
    }
    if (failOn === 'drift') {
        const hasDrift = report.checks.some(
            c => c.category === 'integrity' && c.status !== 'pass'
        );
        return report.hasErrors || hasDrift ? 1 : 0;
    }
    return report.hasErrors ? 1 : 0;
}

function createReporterInstance(reporterType: ReporterType): DiagnosticReporter {
    switch (reporterType) {
        case 'github':
            return new GithubReporter();
        case 'json':
            return new JsonReporter();
        case 'sarif':
            return new SarifReporter();
        case 'junit':
            return new JunitReporter();
        case 'pretty':
        default:
            return new PrettyReporter();
    }
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
        const categories = options.category ? [options.category as DiagnosticCategory] : undefined;
        const ruleIds = options.rule ? [options.rule] : undefined;

        let report = await diagnose({
            cwd,
            offline,
            categories,
            ruleIds,
        });

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
                    categories,
                    ruleIds,
                });
                renderRepairSummary(repairReport);
                report = repairReport.freshReport;
            }
        }

        // 3. 多态 Reporter 渲染分发
        const reporterType = resolveDoctorReporter(options);
        const reporter = createReporterInstance(reporterType);

        await reporter.render(report, {
            cwd,
            failOn: options.failOn,
            silent: options.silent,
            outputFile: options.outputFile,
        });

        // 4. 细粒度退出码判定
        const exitCode = determineExitCode(report, options.failOn);
        if (exitCode !== 0) {
            throw new CliError('Doctor check failed with issues', { exitCode });
        }
    } finally {
        restoreOffline();
    }
}
