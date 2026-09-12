import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const isWin = process.platform === 'win32';

function runStep(label, cmd, args) {
    console.log(`\n[test:release] Running ${label}...`);
    const res = spawnSync(cmd, args, {
        cwd: REPO_ROOT,
        stdio: 'inherit',
    });
    if (res.status !== 0) {
        console.error(`[test:release] FAILED: ${label}`);
        process.exit(res.status ?? 1);
    }
    console.log(`[test:release] PASSED: ${label}`);
}

runStep('Release Coordinator State Machine Tests', 'node', ['--test', 'scripts/release/tests/release-coordinator.test.mjs']);
runStep('Toolchain & Provenance Verification Fixture', 'node', ['scripts/release/tests/provenance-fixture.mjs']);

console.log('\n[test:release] All release tests passed successfully.');
