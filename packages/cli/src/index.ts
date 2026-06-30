import { Command } from 'commander';
import { createRequire } from 'module';
import { init } from './commands/init.js';
import { add } from './commands/add.js';
import { doctor } from './commands/doctor.js';
import { diff } from './commands/diff.js';
import { CliError, logger } from './lib/index.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
    .name('brutx-vue')
    .description('CLI for adding Brutx-Vue components to your project')
    .version(pkg.version);

program
    .command('init')
    .description('Initialize Brutx-Vue in your project')
    .option('-y, --yes', 'Skip confirmation prompts', false)
    .option('-d, --defaults', 'Use default configuration', false)
    .option('-c, --cwd <cwd>', 'The working directory', process.cwd())
    .option('-f, --force', 'Force overwrite of existing configuration', false)
    .option('-s, --silent', 'Mute output', false)
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
    .action(add);

program
    .command('doctor')
    .description('Check project health and diagnose configuration issues')
    .option('--cwd <cwd>', 'The working directory', process.cwd())
    .option('--fix', 'Automatically fix fixable issues', false)
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
    .action(diff);

async function main(): Promise<void> {
    try {
        await program.parseAsync();
    } catch (error) {
        if (error instanceof CliError) {
            logger.error(error.message);
            process.exit(error.code);
        }
        throw error;
    }
}

main();
