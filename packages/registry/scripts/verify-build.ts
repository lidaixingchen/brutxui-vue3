/**
 * 生成 UI 清单后，分别在冷缓存和热缓存下构建 Registry，深度比较每份 JSON 产物。
 *
 * 用法：pnpm --filter brutx-registry-vue build:verify
 */
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'url';
import { execFileSync } from 'node:child_process';
import { runBuildInWorker } from '../src/runner/watch-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_DIR = path.resolve(__dirname, '..');

interface DiffEntry {
    file: string;
    path: string;
    reason: 'only-in-full' | 'only-in-incremental' | 'content-mismatch';
    details?: string;
}

function listJsonFiles(dir: string): string[] {
    return fs.readdirSync(dir).filter(f => f.endsWith('.json'));
}

function readJson(file: string): unknown {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

/** 规范化对象字段顺序，保留数组元素顺序。 */
function normalize(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(normalize);
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .sort(([a], [b]) => a.localeCompare(b));
        return Object.fromEntries(entries.map(([key, fieldValue]) => [key, normalize(fieldValue)]));
    }
    return value;
}

function stringifyForDiff(value: unknown): string {
    return JSON.stringify(normalize(value), null, 2);
}

function runPnpm(args: string[]): void {
    // npm_execpath 指向 pnpm 的 JS 入口（如 pnpm.mjs），需用 node 显式执行；
    // 当未通过 pnpm/npm 启动（npm_execpath 缺失）时，回退到 PATH 中的 pnpm 可执行文件，
    // 需启用 shell 让 Windows 解析 pnpm.CMD（否则 node 会把 'pnpm' 当 JS 模块加载或 ENOENT）。
    const pnpmPath = process.env.npm_execpath;
    if (pnpmPath) {
        execFileSync(process.execPath, [pnpmPath, ...args], {
            cwd: REGISTRY_DIR,
            stdio: 'inherit',
        });
    } else {
        execFileSync('pnpm', args, {
            cwd: REGISTRY_DIR,
            stdio: 'inherit',
            shell: true,
        });
    }
}

function diffOutputs(fullDir: string, incrDir: string): DiffEntry[] {
    const diffs: DiffEntry[] = [];
    const fullFiles = new Set(listJsonFiles(fullDir));
    const incrFiles = new Set(listJsonFiles(incrDir));

    for (const file of fullFiles) {
        if (!incrFiles.has(file)) {
            diffs.push({ file, path: file, reason: 'only-in-full' });
        }
    }
    for (const file of incrFiles) {
        if (!fullFiles.has(file)) {
            diffs.push({ file, path: file, reason: 'only-in-incremental' });
        }
    }

    for (const file of fullFiles) {
        if (!incrFiles.has(file)) continue;
        const fullData = readJson(path.join(fullDir, file));
        const incrData = readJson(path.join(incrDir, file));
        const fullStr = stringifyForDiff(fullData);
        const incrStr = stringifyForDiff(incrData);
        if (fullStr !== incrStr) {
            diffs.push({
                file,
                path: file,
                reason: 'content-mismatch',
                details: `Full length=${fullStr.length}, Incremental length=${incrStr.length}`,
            });
        }
    }

    return diffs;
}

async function main(): Promise<void> {
    console.log('🔍 build:verify — 证明增量 build 结果 == 全量 build 结果\n');

    runPnpm(['--filter', 'brutx-ui-vue', 'generate']);
    const workDir = fs.mkdtempSync(path.join(tmpdir(), 'brutx-registry-verify-'));
    const outputDir = path.join(workDir, 'registry');
    const fullOutput = path.join(workDir, 'full');
    const build = () => runBuildInWorker({ paths: { outputDir } });

    try {
        console.log('▶ Step 1/3: Full build (no cache)...');
        await build();
        fs.cpSync(outputDir, fullOutput, { recursive: true });

        console.log('\n▶ Step 2/3: Incremental build (cache from step 1)...');
        await build();

        console.log('\n▶ Step 3/3: Diffing outputs...');
        const diffs = diffOutputs(fullOutput, outputDir);

        if (diffs.length === 0) {
            console.log('\n✓ build:verify PASSED — 增量与全量输出完全一致');
            process.exitCode = 0;
        } else {
            console.error(`\n✗ build:verify FAILED — 发现 ${diffs.length} 处差异`);
            for (const d of diffs) {
                if (d.reason === 'only-in-full') {
                    console.error(`  • ${d.path}: 仅全量 build 输出`);
                } else if (d.reason === 'only-in-incremental') {
                    console.error(`  • ${d.path}: 仅增量 build 输出`);
                } else {
                    console.error(`  • ${d.path}: 内容不一致 (${d.details ?? '无详情'})`);
                }
            }
            process.exitCode = 1;
        }
    } finally {
        fs.rmSync(workDir, { recursive: true, force: true });
    }
}

await main();
