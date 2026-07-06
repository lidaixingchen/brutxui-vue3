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
import { CliError, getCliErrorAdvice, logger } from './lib/index.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
    .name('brutx-vue')
    .description('CLI for adding Brutx-Vue components to your project')
    .version(pkg.version)
    .option('--verbose', 'Show detailed error output', false);

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
    .action(update);

program
    .command('list')
    .description('List installed components')
    .option('-c, --cwd <cwd>', 'The working directory', process.cwd())
    .option('--json', 'Output JSON format', false)
    .option('-s, --silent', 'Mute output', false)
    .action(list);

program
    .command('info')
    .description('Show details of a component')
    .argument('<component>', 'Component name')
    .option('-c, --cwd <cwd>', 'The working directory', process.cwd())
    .option('--json', 'Output JSON format', false)
    .option('-s, --silent', 'Mute output', false)
    .option('-r, --registry <registry>', 'Specify registry path or URL')
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

async function main(): Promise<void> {
    try {
        await program.parseAsync();
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

main();
