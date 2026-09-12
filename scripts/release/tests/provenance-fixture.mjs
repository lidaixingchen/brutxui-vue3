import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

export function inspectProvenancePrerequisites() {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'));
    const expectedPackageManager = pkgJson.packageManager || '';
    
    let actualPnpmVersion = '';
    try {
        actualPnpmVersion = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
    } catch (e) {
        actualPnpmVersion = 'not-found';
    }

    const nodeVersion = process.version;
    const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
    const hasOidc = Boolean(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);

    return {
        expectedPackageManager,
        actualPnpmVersion,
        nodeVersion,
        isGitHubActions,
        hasOidc,
        prerequisitesMetForCi: isGitHubActions && hasOidc,
    };
}

export function testTarballPublishDryRun() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-provenance-test-'));

    try {
        const dummyPkgDir = path.join(tempDir, 'dummy-pkg');
        fs.mkdirSync(dummyPkgDir, { recursive: true });
        
        fs.writeFileSync(
            path.join(dummyPkgDir, 'package.json'),
            JSON.stringify(
                {
                    name: '@brutx-test/provenance-fixture',
                    version: '0.0.0-test',
                    type: 'module',
                    main: 'index.js',
                },
                null,
                2
            )
        );
        fs.writeFileSync(path.join(dummyPkgDir, 'index.js'), 'export const test = 1;\n');

        // 1. Pack tarball
        execSync('pnpm --config.ignore-scripts=true pack --pack-destination .', {
            cwd: dummyPkgDir,
            stdio: 'pipe',
            env: { ...process.env, npm_config_ignore_scripts: 'true' },
        });

        const tarballFiles = fs.readdirSync(dummyPkgDir).filter(f => f.endsWith('.tgz'));
        if (tarballFiles.length === 0) {
            throw new Error('pnpm pack failed to generate .tgz file');
        }

        const tarballPath = path.join(dummyPkgDir, tarballFiles[0]);

        // 2. Test pnpm publish <tarball> --dry-run
        // 验证锁定版本 pnpm 是否支持直接指向 tarball 文件并接受 --dry-run 与 --no-git-checks
        const publishResult = execSync(`pnpm publish "${tarballPath}" --dry-run --no-git-checks`, {
            cwd: tempDir,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        return {
            success: true,
            tarball: tarballFiles[0],
            output: publishResult,
        };
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

async function main() {
    console.log('[provenance-fixture] Auditing toolchain and provenance support...');
    const prereqs = inspectProvenancePrerequisites();
    console.log(`• Node Version: ${prereqs.nodeVersion}`);
    console.log(`• Expected packageManager: ${prereqs.expectedPackageManager}`);
    console.log(`• Actual pnpm version: ${prereqs.actualPnpmVersion}`);
    console.log(`• GitHub Actions runner: ${prereqs.isGitHubActions ? 'Yes' : 'No (Local environment)'}`);
    console.log(`• OIDC Token available: ${prereqs.hasOidc ? 'Yes' : 'No (Requires CI run with id-token: write)'}`);

    console.log('[provenance-fixture] Verifying pnpm publish <tarball> command interface...');
    const dryRun = testTarballPublishDryRun();
    if (dryRun.success) {
        console.log(`✓ pnpm publish accepts tarball directly without workspace context: ${dryRun.tarball}`);
    }

    console.log('[provenance-fixture] Toolchain provenance verification completed.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch(err => {
        console.error('[provenance-fixture] Check failed:', err);
        process.exit(1);
    });
}
