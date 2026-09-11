/**
 * CLI brutalist.css 令牌漂移门禁
 *
 * 背景：packages/cli/src/styles/brutalist.css 与 packages/cli/src/lib/constants.ts 的令牌与
 * 预设区域由 scripts/generate-tokens.ts 自动注入；packages/shared/src/tokens 是全库令牌唯一事实来源。
 *
 * 本脚本直接以 shared 单一事实源为基线校验 CLI 磁盘文件新鲜度，
 * 彻底消除对 packages/ui 产物的横向依赖，实现完全自包含的包自治门禁。
 *
 * 使用：pnpm --filter brutx-vue exec tsx scripts/check-brutalist-tokens.ts
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TokenStyleCompiler } from 'brutx-shared-vue/tokens';
import { patchBrutalistCss, patchConstantsTs } from './generate-tokens.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliCssPath = path.join(packageRoot, 'src', 'styles', 'brutalist.css');
const cliConstantsPath = path.join(packageRoot, 'src', 'lib', 'constants.ts');

async function main(): Promise<void> {
    const compiler = new TokenStyleCompiler();

    const failures: string[] = [];

    // 1. 校验 brutalist.css 与 shared 单一事实源一致性
    const cliCssOriginal = await readFile(cliCssPath, 'utf-8');
    const cliCssExpected = patchBrutalistCss(cliCssOriginal, compiler);
    if (cliCssOriginal !== cliCssExpected) {
        failures.push('CLI brutalist.css 与 shared 令牌单一事实源存在内容漂移（需运行 pnpm --filter brutx-vue prebuild:tokens 同步）');
    }

    // 2. 校验 constants.ts 与 shared 颜色/z-index 列表一致性
    const cliConstantsOriginal = await readFile(cliConstantsPath, 'utf-8');
    const cliConstantsExpected = patchConstantsTs(cliConstantsOriginal);
    if (cliConstantsOriginal !== cliConstantsExpected) {
        failures.push('CLI constants.ts 模板块与 shared 令牌列表存在内容漂移（需运行 pnpm --filter brutx-vue prebuild:tokens 同步）');
    }

    if (failures.length > 0) {
        console.error('✖ CLI brutalist.css / constants.ts 令牌未与 shared 单一事实源对齐：');
        for (const failure of failures) {
            console.error(`- ${failure}`);
        }
        process.exit(1);
    }

    console.log('✓ CLI brutalist.css 与 constants.ts 令牌已与 shared 单一事实源完全对齐（包自治门禁通过）');
}

main().catch((err) => {
    console.error('CLI 令牌契约检查异常：', err);
    process.exit(1);
});
