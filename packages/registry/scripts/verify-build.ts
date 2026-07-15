/**
 * build:verify —— 证明"增量 build 结果 == 全量 build 结果"
 *
 * 流程（P0-4 增量正确性校验）：
 *   1. 备份当前 registry 输出 + .registry-cache.json 到临时目录
 *   2. 删除 .registry-cache.json，跑一次全量 build → 输出集 A
 *   3. 把 A 移到临时目录，恢复 cache，跑一次增量 build → 输出集 B
 *   4. 深度 diff(A, B)：
 *      - 排除字段：仅 registry-manifest.json 的 `buildTimestamp`
 *        （buildTimestamp 由 BRUTX_REGISTRY_BUILD_TIMESTAMP 注入，两次 build 必然不同）
 *      - 其余字段（含 gitCommit、registryVersion、所有 items integrity）必须完全一致
 *   5. 输出 diff 报告；不一致则 exit 1（CI 门禁）
 *
 * 用法：
 *   pnpm --filter brutx-registry-vue build:verify
 *   COMMIT_SHA=abc123 pnpm --filter brutx-registry-vue build:verify
 *
 * 注：本脚本假设当前 working tree 已是干净状态——首次 build 用现有 cache（可能是
 * 增量），第二次 build 会复用第一次全量 build 写入的 cache（必然全命中）。
 * 这与"增量 vs 全量"的语义一致：验证"命中缓存复用旧输出"与"重算输出"等价。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(REGISTRY_DIR, 'registry');
const CACHE_FILE = path.resolve(REGISTRY_DIR, '.registry-cache.json');
const TMP_DIR = path.resolve(REGISTRY_DIR, '.verify-tmp');

const DIFF_EXCLUDED_FIELDS = new Set<string>(['buildTimestamp']);

interface DiffEntry {
    file: string;
    path: string;
    reason: 'only-in-full' | 'only-in-incremental' | 'content-mismatch';
    details?: string;
}

function listJsonFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith('.json'));
}

function readJson(file: string): unknown {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

/**
 * 规范化 JSON：按 key 字典序排列对象字段，便于深度比较。
 * 排除 DIFF_EXCLUDED_FIELDS 中的顶层字段（仅作用于 registry-manifest.json 的顶层）。
 */
function normalize(value: unknown, excludeTopLevel: Set<string> = new Set()): unknown {
    if (Array.isArray(value)) {
        return value.map(v => normalize(v, new Set()));
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([k]) => !excludeTopLevel.has(k))
            .sort(([a], [b]) => a.localeCompare(b));
        const result: Record<string, unknown> = {};
        for (const [k, v] of entries) {
            result[k] = normalize(v, new Set());
        }
        return result;
    }
    return value;
}

function stringifyForDiff(value: unknown): string {
    return JSON.stringify(normalize(value), null, 2);
}

function rmrf(target: string): void {
    if (fs.existsSync(target)) {
        fs.rmSync(target, { recursive: true, force: true });
    }
}

function moveDir(src: string, dst: string): void {
    rmrf(dst);
    fs.renameSync(src, dst);
    fs.mkdirSync(src, { recursive: true });
}

function runBuild(env: NodeJS.ProcessEnv): void {
    // Windows 上 npm_execpath 指向 pnpm.mjs（不能直接 execFileSync），
    // 需要用 node 显式执行。其他平台同样兼容。
    const pnpmPath = process.env.npm_execpath ?? 'pnpm';
    const args = [pnpmPath, 'run', 'build'];
    execFileSync(process.execPath, args, {
        cwd: REGISTRY_DIR,
        stdio: 'inherit',
        env,
    });
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
        // 仅 registry-manifest.json 顶层排除 buildTimestamp；其余文件全字段比较
        const exclude = file === 'registry-manifest.json' ? DIFF_EXCLUDED_FIELDS : new Set<string>();
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

function main(): void {
    console.log('🔍 build:verify — 证明增量 build 结果 == 全量 build 结果\n');

    if (fs.existsSync(TMP_DIR)) {
        rmrf(TMP_DIR);
    }
    fs.mkdirSync(TMP_DIR, { recursive: true });

    const fullOutputBackup = path.join(TMP_DIR, 'full');
    const incrOutputBackup = path.join(TMP_DIR, 'incremental');
    const cacheBackup = path.join(TMP_DIR, '.registry-cache.json.bak');

    // 固定 COMMIT_SHA，避免两次 build 因 GITHUB_SHA 不同而 gitCommit 字段不同
    const fixedSha = process.env.COMMIT_SHA ?? process.env.GITHUB_SHA ?? null;
    const buildEnv: NodeJS.ProcessEnv = {
        ...process.env,
        ...(fixedSha ? { COMMIT_SHA: fixedSha, GITHUB_SHA: fixedSha } : {}),
    };

    try {
        // --- Step 1: 备份当前 cache，确保第一次 build 是全量 ---
        if (fs.existsSync(CACHE_FILE)) {
            fs.copyFileSync(CACHE_FILE, cacheBackup);
        }
        rmrf(CACHE_FILE);

        // --- Step 2: 全量 build（无 cache）→ 输出集 A ---
        console.log('▶ Step 1/3: Full build (no cache)...');
        runBuild(buildEnv);
        moveDir(OUTPUT_DIR, fullOutputBackup);

        // --- Step 3: 增量 build（cache 来自第一次 build 写入的 .registry-cache.json）→ 输出集 B ---
        console.log('\n▶ Step 2/3: Incremental build (cache from step 1)...');
        runBuild(buildEnv);
        moveDir(OUTPUT_DIR, incrOutputBackup);

        // --- Step 4: 深度 diff ---
        console.log('\n▶ Step 3/3: Diffing outputs...');
        const diffs = diffOutputs(fullOutputBackup, incrOutputBackup);

        if (diffs.length === 0) {
            console.log('\n✓ build:verify PASSED — 增量与全量输出完全一致');
            console.log('  (排除字段: registry-manifest.json.buildTimestamp)');
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
        // --- Step 5: 恢复 OUTPUT_DIR（被 moveDir 移到 TMP_DIR）和 cache ---
        // diff 完成后，把增量 build 的输出复制回 OUTPUT_DIR（它就是正常 build 的输出）
        const incrBackup = path.join(TMP_DIR, 'incremental');
        if (fs.existsSync(incrBackup)) {
            rmrf(OUTPUT_DIR);
            fs.renameSync(incrBackup, OUTPUT_DIR);
        }
        if (fs.existsSync(cacheBackup)) {
            fs.copyFileSync(cacheBackup, CACHE_FILE);
        } else {
            rmrf(CACHE_FILE);
        }
        rmrf(TMP_DIR);
    }
}

main();
