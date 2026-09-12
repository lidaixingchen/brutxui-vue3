import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const isWin = process.platform === 'win32';

function run(cmd, args) {
    console.log(`\n[release:check] Running ${cmd} ${args.join(' ')}...`);
    const res = spawnSync(cmd, args, {
        cwd: repoRoot,
        stdio: 'inherit',
        shell: isWin,
    });
    if (res.status !== 0) {
        console.error(`[release:check] Command failed with exit code ${res.status}`);
        process.exit(res.status ?? 1);
    }
}

console.log('[release:check] Starting local release verification...');

// 1. 构建与门禁检查
run('pnpm', ['exec', 'turbo', 'run', 'build:artifact', 'test', 'typecheck:source', 'lint:source']);

// 2. 静态契约门禁
run('node', ['scripts/check-contracts-all.mjs']);

// 3. 核心消费者测试
run('node', ['packages/cli/scripts/test-consumers.mjs']);

// 4. 发布状态机与演练测试
run('node', ['scripts/release/tests/run-release-tests.mjs']);

// 5. 记录本地检查结果
const headCommitRes = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf-8' });
const headCommit = headCommitRes.stdout?.trim() || 'unknown';

const checkResult = {
    commit: headCommit,
    timestamp: new Date().toISOString(),
    status: 'passed',
};

const tmpDir = path.join(repoRoot, 'tmp');
if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
}
writeFileSync(path.join(tmpDir, 'release-check.json'), JSON.stringify(checkResult, null, 2) + '\n');

console.log('\n[release:check] All pre-release checks passed successfully!');
console.log('[release:check] Check result saved to tmp/release-check.json');
console.log('[release:check] Next step: run `pnpm release:tag` to create annotated tag.');
