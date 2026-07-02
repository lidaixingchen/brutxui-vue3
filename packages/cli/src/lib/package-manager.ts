import { spawn } from 'child_process';
import type { PackageManager } from './types.js';
import { logger } from './logger.js';

const INSTALL_COMMANDS: Record<PackageManager, string> = {
    pnpm: 'pnpm add',
    yarn: 'yarn add',
    bun: 'bun add',
    npm: 'npm install',
};

function sanitizePackageName(name: string): string {
    return name.replace(/[^a-zA-Z0-9@/._-]/g, '');
}

export function installPackages(
    packageManager: PackageManager,
    packages: string[],
    cwd: string
): Promise<void> {
    if (packages.length === 0) return Promise.resolve();

    const sanitized = packages.map(sanitizePackageName).filter(Boolean);
    if (sanitized.length === 0) return Promise.resolve();

    const [command, ...baseArgs] = INSTALL_COMMANDS[packageManager].split(' ');
    const isWindows = process.platform === 'win32';

    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, [...baseArgs, '--', ...sanitized], {
            cwd,
            shell: isWindows,
            stdio: ['inherit', 'pipe', 'pipe'],
        });

        child.stdout?.on('data', (data) => {
            logger.log(data.toString().trimEnd());
        });

        child.stderr?.on('data', (data) => {
            logger.log(data.toString().trimEnd());
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
                reject(new Error('Installation interrupted by user'));
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

export function getInstallCommand(packageManager: PackageManager, packages: string[]): string {
    const sanitized = packages.map(sanitizePackageName).filter(Boolean);
    return `${INSTALL_COMMANDS[packageManager]} -- ${sanitized.join(' ')}`;
}
