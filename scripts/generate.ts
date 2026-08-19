#!/usr/bin/env tsx
/**
 * 代码生成器 - 支持生成组件、Composable、页面
 *
 * 使用方式：
 *   pnpm generate:component MyComponent
 *   pnpm generate:composable useMyHook
 *   pnpm generate:page MyPage
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DiskFileSystemAdapter } from 'brutx-shared-vue/fs';
import {
    ScaffoldEngine,
    type GenerateType,
} from '../packages/ui/scripts/scaffold/scaffold-engine.js';

interface AnsiColors {
    reset: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    cyan: string;
    bold: string;
    dim: string;
}

const COLORS: AnsiColors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
};

const VALID_TYPES: readonly GenerateType[] = ['component', 'composable', 'page'] as const;

const TYPE_LABEL_MAP: Record<GenerateType, string> = {
    component: '组件',
    composable: 'Composable',
    page: '页面',
};

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function colorize(color: keyof AnsiColors, text: string): string {
    return `${COLORS[color]}${text}${COLORS.reset}`;
}

function logSuccess(message: string): void {
    console.log(`${colorize('green', '  ✓')} ${message}`);
}

function logError(message: string): void {
    console.error(`${colorize('red', '  ✗')} ${message}`);
}

function logInfo(message: string): void {
    console.log(`${colorize('cyan', '  ℹ')} ${message}`);
}

function validateName(name: string): boolean {
    const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
    return NAME_PATTERN.test(name);
}

function printUsage(): void {
    console.log('');
    console.log(colorize('bold', '  BrutxUI 代码生成器'));
    console.log('');
    console.log(colorize('dim', '  使用方式:'));
    console.log(`    ${colorize('cyan', 'pnpm generate:component')} ${colorize('yellow', '<名称>')}     生成组件`);
    console.log(`    ${colorize('cyan', 'pnpm generate:composable')} ${colorize('yellow', '<名称>')}    生成 Composable`);
    console.log(`    ${colorize('cyan', 'pnpm generate:page')} ${colorize('yellow', '<名称>')}         生成页面`);
    console.log('');
    console.log(colorize('dim', '  选项:'));
    console.log(`    ${colorize('cyan', '--dry-run')}                                仅预览生成文件，不写盘`);
    console.log('');
    console.log(colorize('dim', '  示例:'));
    console.log('    pnpm generate:component MyButton');
    console.log('    pnpm generate:composable useLocalStorage');
    console.log('    pnpm generate:page Dashboard');
    console.log('');
}

function parseArgs(): { type: GenerateType; name: string; dryRun: boolean } | null {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const filtered = args.filter(a => a !== '--dry-run');

    if (filtered.length < 2) {
        return null;
    }

    const type = filtered[0] as GenerateType;
    const name = filtered[1];

    if (!VALID_TYPES.includes(type)) {
        logError(`无效的生成类型: "${type}"`);
        logInfo(`支持的类型: ${VALID_TYPES.join(', ')}`);
        return null;
    }

    if (!name) {
        logError('请指定名称');
        return null;
    }

    return { type, name, dryRun };
}

async function main(): Promise<void> {
    const args = parseArgs();

    if (!args) {
        printUsage();
        process.exit(1);
    }

    const { type, name, dryRun } = args;

    if (!validateName(name)) {
        logError(`无效的名称: "${name}"`);
        logInfo('名称必须以字母开头，只包含字母、数字、连字符、下划线');
        process.exit(1);
    }

    console.log('');
    console.log(colorize('bold', `  开始生成 ${TYPE_LABEL_MAP[type]}: ${colorize('cyan', name)}${dryRun ? ' (dry-run)' : ''}`));
    console.log('');

    const fs = new DiskFileSystemAdapter();
    const engine = new ScaffoldEngine({
        fs,
        projectRoot: PROJECT_ROOT,
    });

    const result = await engine.generate({
        type,
        name,
        dryRun,
    });

    if (!result.success) {
        logError(result.error ?? '生成失败');
        process.exit(1);
    }

    for (const file of result.files) {
        const rel = path.relative(PROJECT_ROOT, file.filePath);
        if (dryRun) {
            logInfo(`[预览] ${rel}`);
        } else {
            logSuccess(`创建文件: ${colorize('cyan', rel)}`);
        }
    }

    if (result.injectedExports.length > 0) {
        console.log('');
        if (dryRun) {
            logInfo(`[预览导出] packages/ui/src/index.ts:`);
        } else {
            logSuccess(`更新导出: ${colorize('cyan', 'packages/ui/src/index.ts')}`);
        }
        for (const exp of result.injectedExports) {
            logInfo(`  ${exp}`);
        }
    }

    console.log('');
    console.log(colorize('green', `  ✓ ${dryRun ? '预览完成！' : '生成完成！'}`));
    console.log('');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
