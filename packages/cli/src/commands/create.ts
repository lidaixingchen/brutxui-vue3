import path from 'path';
import fs from 'fs-extra';

import {
    type CreateOptions,
    type CreateTemplate,
    type PackageManager,
    CliError,
    logger,
} from '../lib/index.js';
import { runProcess } from '../lib/run-process.js';
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
    // SIGINT 处理（转发 + 等待子进程 close 自然退出，退出码 130）由 runProcess 统一实现
    return runProcess(command, args, { cwd });
}

function getInstallCommand(pm: PackageManager): { command: string; args: string[] } {
    switch (pm) {
        case 'pnpm': return { command: 'pnpm', args: ['install'] };
        case 'yarn': return { command: 'yarn', args: ['install'] };
        case 'bun': return { command: 'bun', args: ['install'] };
        case 'npm': return { command: 'npm', args: ['install'] };
        default: throw new CliError(`Unsupported package manager: "${String(pm)}". Supported: pnpm, yarn, bun, npm.`);
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

const VALID_PACKAGE_MANAGERS: readonly PackageManager[] = ['pnpm', 'yarn', 'bun', 'npm'];
const VALID_TEMPLATES = Object.keys(TEMPLATES) as CreateTemplate[];
// 首字符必须为字母/数字，且整体不允许为 "." 或 ".."（防止路径穿越把项目建到父目录；
// 也避免 "-" 开头的名称被脚手架解析为命令行选项而非项目名）
const PROJECT_NAME_PATTERN = /^(?!\.{1,2}$)[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export async function create(projectName: string, options: CreateOptions): Promise<void> {
    const template: CreateTemplate = options.template ?? 'default';
    const packageManager: PackageManager = options.packageManager ?? 'pnpm';

    if (!PROJECT_NAME_PATTERN.test(projectName)) {
        throw new CliError(
            `Invalid project name: "${projectName}". Must start with a letter or digit; only letters, digits, ".", "-", and "_" are allowed, and cannot be "." or "..".`
        );
    }

    if (!VALID_TEMPLATES.includes(template)) {
        throw new CliError(
            `Unsupported template: "${String(template)}". Supported: ${VALID_TEMPLATES.join(', ')}.`
        );
    }

    if (!VALID_PACKAGE_MANAGERS.includes(packageManager)) {
        throw new CliError(
            `Unsupported package manager: "${String(packageManager)}". Supported: ${VALID_PACKAGE_MANAGERS.join(', ')}.`
        );
    }

    const baseCwd = options.cwd ?? process.cwd();
    const projectDir = path.resolve(baseCwd, projectName);

    if (await fs.pathExists(projectDir)) {
        throw new CliError(`Directory "${projectName}" already exists.`);
    }

    logger.bold(`\nCreating project "${projectName}" with template "${TEMPLATES[template]}"...\n`);

    try {
        await scaffoldProject(projectName, template, baseCwd);
    } catch (error) {
        // 脚手架可能留下半成品目录；清理后重新抛出，保证失败后可以直接重试
        // （否则重试会命中上面的 pathExists 检查报 "Directory already exists"）
        await fs.remove(projectDir).catch(() => {});
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
        await fs.remove(projectDir).catch(() => {});
        const message = error instanceof Error ? error.message : String(error);
        throw new CliError(`Failed to install dependencies: ${message}`);
    }

    logger.newLine();
    logger.bold('Configuring BrutxUI...');
    logger.newLine();

    try {
        await init({
            cwd: projectDir,
            yes: true,
            force: true,
            silent: false,
        });
    } catch (error) {
        // 与 scaffold/install 步骤一致：包装为带操作上下文的 CliError。
        // init 抛出的 CliError 保留其 code/exitCode/cause，避免丢失错误语义。
        const message = error instanceof Error ? error.message : String(error);
        if (error instanceof CliError) {
            throw new CliError(`Failed to configure BrutxUI: ${message}`, {
                code: error.code,
                exitCode: error.exitCode,
                cause: error,
            });
        }
        throw new CliError(`Failed to configure BrutxUI: ${message}`, { cause: error });
    }

    logger.newLine();
    const devCommand = packageManager === 'npm' ? 'npm run dev' : `${packageManager} dev`;
    logger.success(`Project created at ./${projectName}. Run 'cd ${projectName} && ${devCommand}' to start.`);
}
