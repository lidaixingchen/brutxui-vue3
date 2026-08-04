import { spawn } from 'child_process';
import type { PackageManager } from './types.js';
import { logger } from './logger.js';

const INSTALL_COMMANDS: Record<PackageManager, string> = {
    pnpm: 'pnpm add',
    yarn: 'yarn add',
    bun: 'bun add',
    npm: 'npm install',
};

const PACKAGE_SPEC_PATTERN = /^[a-zA-Z0-9@:/._=-]+$/;

function sanitizePackageName(name: string): string {
    // 显式校验而非静默清洗：非法 spec（含 semver 范围符 ^~*<>| 等）直接报错，
    // 避免 vue@^3.5.0 被改写为 vue@3.5.0、pkg@* 变成 pkg@ 等语义被篡改的问题。
    if (!PACKAGE_SPEC_PATTERN.test(name)) {
        throw new Error(`Unsupported package spec: "${name}"`);
    }
    return name;
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
            env: process.env,
            stdio: ['inherit', 'pipe', 'pipe'],
        });

        child.stdout?.on('data', (data) => {
            logger.log(data.toString().trimEnd());
        });

        child.stderr?.on('data', (data) => {
            logger.log(data.toString().trimEnd());
        });

        const onSigint = () => {
            // 与 create.ts runCommand 保持一致：移除监听 + 转发中断 + 显式以 130 退出，
            // 避免子进程忽略 SIGINT 时父进程挂起。
            process.removeListener('SIGINT', onSigint);
            child.kill('SIGINT');
            process.exit(130);
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
