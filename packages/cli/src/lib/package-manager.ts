import type { PackageManager } from './types.js';
import { logger } from './logger.js';
import { runProcess } from './run-process.js';

const INSTALL_COMMANDS: Record<PackageManager, string> = {
    pnpm: 'pnpm add',
    yarn: 'yarn add',
    bun: 'bun add',
    npm: 'npm install',
};

// 显式校验白名单：允许 npm alias（pkg@npm:other-pkg@version）、semver-pin（name@=version）与 scope 语法。
// `+` 是合法的 semver build metadata（pkg@1.0.0+build.5）与 git+ URL（pkg@git+https://...）字符，一并放行。
const PACKAGE_SPEC_PATTERN = /^[a-zA-Z0-9@:/._=+-]+$/;

function sanitizePackageName(name: string): string {
    // 显式校验而非静默清洗：非法 spec（含 semver 范围符 ^~*<>| 等）直接报错，
    // 避免 vue@^3.5.0 被改写为 vue@3.5.0、pkg@* 变成 pkg@ 等语义被篡改的问题。
    if (!PACKAGE_SPEC_PATTERN.test(name)) {
        throw new Error(`Unsupported package spec: "${name}"`);
    }
    return name;
}

export async function installPackages(
    packageManager: PackageManager,
    packages: string[],
    cwd: string
): Promise<void> {
    if (packages.length === 0) return;

    // async 函数体内的同步抛错（如 sanitizePackageName 校验失败）会以 rejected promise 呈现，
    // 不会像改造前那样在 new Promise 之外同步抛出、破坏调用方的 .catch()/Promise.all 处理。
    const sanitized = packages.map(sanitizePackageName);
    const [command, ...baseArgs] = INSTALL_COMMANDS[packageManager].split(' ');

    // SIGINT 处理（转发 + 等待子进程 close 自然退出，退出码 130）由 runProcess 统一实现
    await runProcess(command, [...baseArgs, '--', ...sanitized], {
        cwd,
        stdio: 'pipe',
        onStdout: (line) => logger.log(line),
        onStderr: (line) => logger.log(line),
    });
}

export function getInstallCommand(packageManager: PackageManager, packages: string[]): string {
    // 仅用于向用户展示安装提示（不执行），直接列出原包名，
    // 避免在 installPackages 已失败降级时对同一批非法 deps 二次抛错，掩盖 "Run manually" 提示。
    return `${INSTALL_COMMANDS[packageManager]} -- ${packages.join(' ')}`;
}
