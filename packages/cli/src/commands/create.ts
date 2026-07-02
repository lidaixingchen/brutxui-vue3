import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

import {
    type CreateOptions,
    type CreateTemplate,
    type PackageManager,
    CliError,
    logger,
} from '../lib/index.js';
import { init } from './init.js';

const TEMPLATES: Record<CreateTemplate, string> = {
    default: 'Vite + Vue 3 + TypeScript',
    nuxt: 'Nuxt 3',
};

function runCommand(
    command: string,
    args: string[],
    cwd: string,
): Promise<void> {
    const isWindows = process.platform === 'win32';

    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            shell: isWindows,
            stdio: 'inherit',
        });

        const onSigint = () => {
            child.kill('SIGINT');
        };
        process.on('SIGINT', onSigint);

        child.on('error', (err) => {
            process.removeListener('SIGINT', onSigint);
            reject(err);
        });

        child.on('close', (code, signal) => {
            process.removeListener('SIGINT', onSigint);
            if (signal === 'SIGINT') {
                reject(new Error('Process interrupted by user'));
                return;
            }
            if (code !== 0) {
                reject(new Error(`${command} exited with code ${code}`));
                return;
            }
            resolve();
        });
    });
}

function getInstallCommand(pm: PackageManager): { command: string; args: string[] } {
    switch (pm) {
        case 'pnpm': return { command: 'pnpm', args: ['install'] };
        case 'yarn': return { command: 'yarn', args: ['install'] };
        case 'bun': return { command: 'bun', args: ['install'] };
        case 'npm': return { command: 'npm', args: ['install'] };
    }
}

async function scaffoldProject(
    name: string,
    template: CreateTemplate,
    cwd: string,
): Promise<void> {
    if (template === 'nuxt') {
        await runCommand('npx', ['nuxi@latest', 'init', name, '--no-install'], cwd);
    } else {
        await runCommand('npm', ['create', 'vite@latest', name, '--', '--template', 'vue-ts'], cwd);
    }
}

export async function create(projectName: string, options: CreateOptions): Promise<void> {
    const template: CreateTemplate = options.template ?? 'default';
    const packageManager: PackageManager = options.packageManager ?? 'pnpm';
    const baseCwd = options.cwd ?? process.cwd();
    const projectDir = path.resolve(baseCwd, projectName);

    if (await fs.pathExists(projectDir)) {
        throw new CliError(`Directory "${projectName}" already exists.`);
    }

    logger.bold(`\nCreating project "${projectName}" with template "${TEMPLATES[template]}"...\n`);

    try {
        await scaffoldProject(projectName, template, baseCwd);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new CliError(`Failed to scaffold project: ${message}`);
    }

    logger.newLine();
    logger.bold('Installing dependencies...');
    logger.newLine();

    try {
        const { command, args } = getInstallCommand(packageManager);
        await runCommand(command, args, projectDir);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new CliError(`Failed to install dependencies: ${message}`);
    }

    logger.newLine();
    logger.bold('Configuring BrutxUI...');
    logger.newLine();

    await init({
        cwd: projectDir,
        yes: true,
        force: true,
        silent: false,
    });

    logger.newLine();
    const devCommand = packageManager === 'npm' ? 'npm run dev' : `${packageManager} dev`;
    logger.success(`Project created at ./${projectName}. Run 'cd ${projectName} && ${devCommand}' to start.`);
}
