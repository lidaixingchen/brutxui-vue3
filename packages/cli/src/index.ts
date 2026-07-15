import { Command } from 'commander';
import { createRequire } from 'module';
import { init } from './commands/init.js';
import { add } from './commands/add.js';
import { doctor } from './commands/doctor.js';
import { diff } from './commands/diff.js';
import { update } from './commands/update.js';
import { list } from './commands/list.js';
import { info } from './commands/info.js';
import { remove } from './commands/remove.js';
import { create } from './commands/create.js';
import { CliError, getCliErrorAdvice, logger, clearCache } from './lib/index.js';
import { setGlobalDryRun } from './lib/global-dry-run.js';
import { VERBOSE_LEVEL_NONE, VERBOSE_LEVEL_STEP, VERBOSE_LEVEL_TRACE } from './lib/logger.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
    .name('brutx-vue')
    .description('CLI for adding Brutx-Vue components to your project')
    .version(pkg.version)
    .option('--verbose', 'Show detailed error output', false)
    .option('--dry-run', 'Global dry-run: simulate all write operations without touching disk', false)
    .option('--verbose-level <level>', 'Verbose output level (1=steps, 2=details, 3=trace)', '0');

program
    .command('init')
    .description('Initialize Brutx-Vue in your project')
    .option('-y, --yes', 'Skip confirmation prompts', false)
    .option('-d, --defaults', 'Use default configuration', false)
    .option('-c, --cwd <cwd>', 'The working directory', process.cwd())
    .option('-f, --force', 'Force overwrite of existing configuration', false)
    .option('-s, --silent', 'Mute output', false)
    .option('--vscode', 'Generate VS Code snippets')
    .option('--workspace-root <path>', 'Specify the workspace root directory')
    .action(init);

program
    .command('add')
    .description('Add components to your project')
    .argument('[components...]', 'Components to add')
    .option('-y, --yes', 'Skip confirmation prompts', false)
    .option('-a, --all', 'Add all components', false)
    .option('-o, --overwrite', 'Overwrite existing files', false)
    .option('-p, --path <path>', 'The path to add the component to')
    .option('-c, --cwd <cwd>', 'The working directory', process.cwd())
    .option('-s, --silent', 'Mute output', false)
    .option('--dry-run', 'Simulate addition without writing files', false)
    .option('-r, --registry <registry>', 'Specify registry path or URL')
    .option('--no-cache', 'Skip registry cache')
    .option('--offline', 'Use only cached data, never hit the network', false)
    .option('--vscode', 'Update VS Code snippets with new components')
    .action(add);

program
    .command('doctor')
    .description('Check project health and diagnose configuration issues')
    .option('--cwd <cwd>', 'The working directory', process.cwd())
    .option('--fix', 'Automatically fix fixable issues', false)
    .option('--fix-only <fixId>', 'Apply only the specified fix')
    .option('--json', 'Output JSON report', false)
    .option('-y, --yes', 'Skip confirmation prompts', false)
    .option('-s, --silent', 'Mute output', false)
    .option('--offline', 'Skip registry reachability checks', false)
    .action(doctor);

program
    .command('diff')
    .description('Compare local components with registry latest version')
    .argument('[components...]', 'Components to compare')
    .option('--all', 'Compare all installed components', false)
    .option('--cwd <cwd>', 'The working directory', process.cwd())
    .option('-r, --registry <registry>', 'Specify local registry path')
    .option('--json', 'Output JSON format', false)
    .option('-s, --silent', 'Mute output', false)
    .option('--no-cache', 'Skip registry cache')
    .option('--offline', 'Use only cached data, never hit the network', false)
    .action(diff);

program
    .command('update')
    .description('Update installed components to the latest registry version')
    .argument('[components...]', 'Components to update')
    .option('-a, --all', 'Update all outdated components', false)
    .option('-y, --yes', 'Skip confirmation prompts', false)
    .option('-c, --cwd <cwd>', 'The working directory', process.cwd())
    .option('-s, --silent', 'Mute output', false)
    .option('--dry-run', 'Show which components would be updated without writing', false)
    .option('-r, --registry <registry>', 'Specify registry URL')
    .option('--no-cache', 'Skip registry cache')
    .option('--across-versions', 'Allow updating version-pinned components across their locked version', false)
    .option('--offline', 'Use only cached data, never hit the network', false)
    .action(update);

program
    .command('list')
    .description('List installed components')
    .option('-c, --cwd <cwd>', 'The working directory', process.cwd())
    .option('--json', 'Output JSON format', false)
    .option('-s, --silent', 'Mute output', false)
    .option('-r, --registry <registry>', 'Specify registry path or URL for update checks')
    .option('--check-updates', 'Check registry integrity to show available updates', false)
    .option('--no-cache', 'Skip registry cache when checking updates')
    .option('--offline', 'Use only cached data, never hit the network', false)
    .action(list);

program
    .command('info')
    .description('Show details of a component')
    .argument('<component>', 'Component name')
    .option('-c, --cwd <cwd>', 'The working directory', process.cwd())
    .option('--json', 'Output JSON format', false)
    .option('-s, --silent', 'Mute output', false)
    .option('-r, --registry <registry>', 'Specify registry path or URL')
    .option('--offline', 'Use only cached data, never hit the network', false)
    .action(info);

program
    .command('remove')
    .description('Remove installed components')
    .argument('<components...>', 'Components to remove')
    .option('-c, --cwd <cwd>', 'The working directory', process.cwd())
    .option('-y, --yes', 'Skip confirmation prompts', false)
    .option('-s, --silent', 'Mute output', false)
    .option('--dry-run', 'Show which files would be removed without deleting', false)
    .action(remove);

program
    .command('create')
    .description('Create a new Vue 3 project with BrutxUI pre-configured')
    .argument('<project-name>', 'Name of the project to create')
    .option('-t, --template <template>', 'Project template (default, nuxt)', 'default')
    .option('--package-manager <pm>', 'Package manager to use (pnpm, npm, yarn, bun)', 'pnpm')
    .option('-c, --cwd <cwd>', 'The directory to create the project in', process.cwd())
    .option('-y, --yes', 'Skip confirmation prompts', false)
    .action(create);

program
    .command('cache')
    .description('Manage the brutx-vue component cache')
    .argument('<action>', 'Cache action to perform (clear)')
    .option('--max-age <days>', 'Only clear cache entries older than N days (clear action only)', undefined)
    .action(async (action: string, options: { maxAge?: string }) => {
        if (action !== 'clear') {
            logger.error(`Unknown cache action: ${action}. Supported: clear`);
            process.exit(1);
        }
        const maxAgeDays = options.maxAge !== undefined ? Number.parseInt(options.maxAge, 10) : undefined;
        if (maxAgeDays !== undefined && (Number.isNaN(maxAgeDays) || maxAgeDays <= 0)) {
            logger.error(`--max-age must be a positive integer (got: ${options.maxAge})`);
            process.exit(1);
        }
        await clearCache(maxAgeDays);
        if (maxAgeDays !== undefined) {
            logger.success(`Cleared cache entries older than ${maxAgeDays} day(s).`);
        } else {
            logger.success('Cache cleared.');
        }
    });

async function main(): Promise<void> {
    // 在 commander 解析前应用全局 dry-run 和 verbose level。
    // 命令 action 在 parseAsync 期间执行，全局选项必须先于 action 生效。
    const preprocessedArgv = preprocessArgv(process.argv);
    applyGlobalOptionsFromArgv(preprocessedArgv);

    try {
        await program.parseAsync(preprocessedArgv);
    } catch (error) {
        const verbose = program.opts().verbose as boolean;

        if (error instanceof CliError) {
            logger.error(error.message);
            for (const line of getCliErrorAdvice(error)) {
                logger.info(line);
            }

            if (verbose && error.stack) {
                logger.newLine();
                logger.dim(error.stack);
            }

            process.exit(error.exitCode);
        }

        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        logger.error(`An unexpected error occurred: ${message}`);
        logger.newLine();
        logger.info('Try running brutx-vue doctor to diagnose project issues.');
        logger.info(`Docs: ${pkg.homepage as string}`);
        logger.info(`Report issues: ${pkg.repository.url as string}/issues`);

        if (verbose && stack) {
            logger.newLine();
            logger.dim(stack);
        }

        process.exit(1);
    }
}

/**
 * 预处理 argv：把 -v / -vv / -vvv 转换为 --verbose-level 1/2/3。
 * commander 不原生支持 -vvv 风格的重复短选项，这里展开。
 */
function preprocessArgv(argv: string[]): string[] {
    const result: string[] = [];
    for (const arg of argv) {
        if (arg === '-vvv') {
            result.push('--verbose-level', String(VERBOSE_LEVEL_TRACE));
        } else if (arg === '-vv') {
            result.push('--verbose-level', String(2));
        } else if (arg === '-v') {
            result.push('--verbose-level', String(VERBOSE_LEVEL_STEP));
        } else {
            result.push(arg);
        }
    }
    return result;
}

/**
 * 在 commander 解析前从预处理后的 argv 应用全局 dry-run 和 verbose level。
 * 调用方应先经过 preprocessArgv 处理，使 -v/-vv/-vvv 统一为 --verbose-level。
 * 命令 action 在 parseAsync 期间执行，全局选项必须先于 action 生效。
 * 环境变量 BRUTX_DRY_RUN=1 / BRUTX_VERBOSE 由各自模块自动检测，这里只处理 CLI flag。
 */
function applyGlobalOptionsFromArgv(argv: string[]): void {
    if (argv.includes('--dry-run')) {
        setGlobalDryRun(true);
    }

    let verboseLevel = VERBOSE_LEVEL_NONE;
    const verboseLevelIdx = argv.indexOf('--verbose-level');
    if (verboseLevelIdx !== -1 && verboseLevelIdx + 1 < argv.length) {
        const parsed = Number.parseInt(argv[verboseLevelIdx + 1], 10);
        if (!Number.isNaN(parsed)) {
            verboseLevel = parsed;
        }
    }
    // -v / -vv / -vvv 已由 preprocessArgv 转换为 --verbose-level，此处无需重复检测
    // --verbose（旧 flag）也提升到至少 STEP 级
    if (argv.includes('--verbose') && verboseLevel < VERBOSE_LEVEL_STEP) {
        verboseLevel = VERBOSE_LEVEL_STEP;
    }
    if (verboseLevel > VERBOSE_LEVEL_NONE) {
        logger.setVerboseLevel(verboseLevel);
    }
}

main();
