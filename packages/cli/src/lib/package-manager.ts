import { execFileSync } from 'child_process';
import type { PackageManager } from './types.js';

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
): void {
    if (packages.length === 0) return;

    const sanitized = packages.map(sanitizePackageName).filter(Boolean);
    if (sanitized.length === 0) return;

    const [command, ...baseArgs] = INSTALL_COMMANDS[packageManager].split(' ');
    execFileSync(command, [...baseArgs, '--', ...sanitized], { stdio: 'inherit', cwd });
}

export function getInstallCommand(packageManager: PackageManager, packages: string[]): string {
    const sanitized = packages.map(sanitizePackageName).filter(Boolean);
    return `${INSTALL_COMMANDS[packageManager]} -- ${sanitized.join(' ')}`;
}
