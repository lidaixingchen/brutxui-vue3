import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beginReleaseCheck } from './check-record.mjs';

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
        const reason = res.error?.message ?? res.signal ?? res.status;
        console.error(`[release:check] Command failed: ${reason}`);
    }
    return res.status ?? 1;
}

function headCommit() {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf-8' }).trim();
}

function verifyRelease() {
    const completeCheck = beginReleaseCheck(repoRoot);
    let commit = null;
    let status = 'failed';
    try {
        commit = headCommit();
        const checks = [
            ['pnpm', ['exec', 'turbo', 'run', 'build:artifact', 'test', 'typecheck:source', 'lint:source']],
            ['node', ['scripts/check-contracts-all.mjs']],
            ['node', ['packages/cli/scripts/test-consumers.mjs']],
            ['node', ['scripts/release/tests/run-release-tests.mjs']],
        ];
        for (const [command, args] of checks) {
            const exitCode = run(command, args);
            if (exitCode !== 0) return exitCode;
        }
        if (headCommit() !== commit) {
            console.error('[release:check] HEAD changed during release verification. Run the checks again.');
            return 1;
        }
        status = 'passed';
    } finally {
        completeCheck(commit, status);
    }

    console.log('\n[release:check] All pre-release checks passed successfully!');
    console.log('[release:check] Next step: run `pnpm release:tag` to create annotated tag.');
    return 0;
}

console.log('[release:check] Starting local release verification...');
process.exitCode = verifyRelease();
