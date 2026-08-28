import type { PackageManager } from '../types.js';
import { runProcess } from '../run-process.js';
import { logger } from '../logger.js';

export interface CommandExecutionSpec {
    command: string;
    args: string[];
}

export class PackageManagerAdapter {
    /**
     * 生成安装依赖命令的执行参数元组
     */
    static buildInstallCommand(
        pm: PackageManager,
        deps: string[],
        targetPackageName?: string,
        isMonorepo?: boolean
    ): CommandExecutionSpec {
        if (!isMonorepo || !targetPackageName || targetPackageName === 'standalone') {
            switch (pm) {
                case 'pnpm':
                    return { command: 'pnpm', args: ['add', ...deps] };
                case 'yarn':
                    return { command: 'yarn', args: ['add', ...deps] };
                case 'bun':
                    return { command: 'bun', args: ['add', ...deps] };
                case 'npm':
                default:
                    return { command: 'npm', args: ['install', ...deps] };
            }
        }

        switch (pm) {
            case 'pnpm':
                return { command: 'pnpm', args: ['--filter', targetPackageName, 'add', ...deps] };
            case 'yarn':
                return { command: 'yarn', args: ['workspace', targetPackageName, 'add', ...deps] };
            case 'bun':
                return { command: 'bun', args: ['--filter', targetPackageName, 'add', ...deps] };
            case 'npm':
            default:
                return { command: 'npm', args: ['--workspace', targetPackageName, 'install', ...deps] };
        }
    }

    /**
     * 生成用户友好的手动安装命令字符串
     */
    static getManualInstallCommand(
        pm: PackageManager,
        deps: string[],
        targetPackageName?: string,
        isMonorepo?: boolean
    ): string {
        const spec = PackageManagerAdapter.buildInstallCommand(pm, deps, targetPackageName, isMonorepo);
        return `${spec.command} ${spec.args.join(' ')}`;
    }

    /**
     * 在目标工作区/目录执行跨包安装
     */
    static async executeInstall(
        pm: PackageManager,
        deps: string[],
        workingDir: string,
        targetPackageName?: string,
        isMonorepo?: boolean
    ): Promise<void> {
        const spec = PackageManagerAdapter.buildInstallCommand(pm, deps, targetPackageName, isMonorepo);
        await runProcess(spec.command, spec.args, {
            cwd: workingDir,
            stdio: 'pipe',
            onStdout: line => logger.log(line),
            onStderr: line => logger.log(line),
        });
    }
}
