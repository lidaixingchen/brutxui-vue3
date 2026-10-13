import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { installFakePnpm } from './fake-pnpm.mjs';

const PREPARE_SOURCE = fileURLToPath(new URL('../prepare.mjs', import.meta.url));

test('release prepare commits generated changelog files without staging unrelated archive notes', () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-release-prepare-'));
    const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-release-pnpm-'));
    const archiveDir = path.join(fixtureRoot, 'apps', 'docs', 'changelog');
    const preparePath = path.join(fixtureRoot, 'scripts', 'release', 'prepare.mjs');
    try {
        fs.mkdirSync(path.join(fixtureRoot, 'packages', 'ui'), { recursive: true });
        fs.mkdirSync(path.join(fixtureRoot, 'packages', 'cli'), { recursive: true });
        fs.mkdirSync(path.join(fixtureRoot, '.changeset'), { recursive: true });
        fs.mkdirSync(path.join(fixtureRoot, 'apps', 'docs', 'guide'), { recursive: true });
        fs.mkdirSync(archiveDir, { recursive: true });
        fs.mkdirSync(path.dirname(preparePath), { recursive: true });
        fs.mkdirSync(binDir, { recursive: true });
        fs.writeFileSync(preparePath, fs.readFileSync(PREPARE_SOURCE, 'utf-8'));
        fs.writeFileSync(path.join(fixtureRoot, 'packages', 'ui', 'package.json'), JSON.stringify({ name: 'brutx-ui-vue', version: '0.2.0' }, null, 2));
        fs.writeFileSync(path.join(fixtureRoot, 'packages', 'cli', 'package.json'), JSON.stringify({ name: 'brutx-vue', version: '0.2.0' }, null, 2));
        fs.writeFileSync(path.join(fixtureRoot, '.changeset', 'fix.md'), '---\n"brutx-ui-vue": patch\n---\nFix input behavior.\n');
        fs.writeFileSync(path.join(fixtureRoot, 'CHANGELOG.md'), '# 更新日志\n');
        fs.writeFileSync(path.join(fixtureRoot, 'apps', 'docs', 'guide', 'changelog.md'), '## 最新版本\n\nold\n\n## 历史归档版本\n');
        fs.writeFileSync(path.join(archiveDir, 'index.md'), '# 归档版本\n\n## 归档列表\n');
        for (const version of ['0.0.1', '0.0.2', '0.0.3']) {
            fs.writeFileSync(path.join(archiveDir, `v${version}.md`), `# v${version}\n`);
        }
        execFileSync('git', ['init', '--quiet'], { cwd: fixtureRoot });
        execFileSync('git', ['config', 'user.name', 'Release Test'], { cwd: fixtureRoot });
        execFileSync('git', ['config', 'user.email', 'release@example.test'], { cwd: fixtureRoot });
        execFileSync('git', ['add', '.'], { cwd: fixtureRoot });
        execFileSync('git', ['commit', '--quiet', '-m', 'fixture baseline'], { cwd: fixtureRoot });

        const unrelatedPath = path.join(archiveDir, 'research-note.md');
        fs.writeFileSync(unrelatedPath, 'Keep this local note out of the release commit.\n');
        installFakePnpm(binDir, `
const { execFileSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const root = process.cwd();
if (process.argv[2] === 'version-packages') {
    const packagePath = path.join(root, 'packages', 'ui', 'package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
    pkg.version = '0.2.1';
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\\n');
    execFileSync('git', ['add', '--', 'packages/ui/package.json', '.changeset/fix.md'], { cwd: root });
    execFileSync('git', ['commit', '--quiet', '-m', 'Version Packages'], { cwd: root });
} else if (process.argv[2] === 'changelog') {
    writeFileSync(path.join(root, 'CHANGELOG.md'), '# 更新日志\\n\\n## [0.2.1]\\n');
    writeFileSync(path.join(root, 'apps', 'docs', 'changelog', 'v0.0.4.md'), '# v0.0.4\\n');
    writeFileSync(path.join(root, 'apps', 'docs', 'changelog', 'index.md'), '# 归档版本\\n\\n## 归档列表\\n\\n* [v0.0.4](./v0.0.4.md)\\n');
    writeFileSync(path.join(root, 'apps', 'docs', 'guide', 'changelog.md'), '## 最新版本\\n\\n0.2.1\\n\\n## 历史归档版本\\n');
} else {
    throw new Error('Unexpected pnpm command: ' + process.argv[2]);
}
`);

        const result = spawnSync(process.execPath, [preparePath], {
            cwd: fixtureRoot,
            encoding: 'utf-8',
            env: { ...process.env, PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ''}` },
        });
        assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

        const committedPaths = execFileSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], {
            cwd: fixtureRoot,
            encoding: 'utf-8',
        }).trim().split('\n');
        assert.ok(committedPaths.includes('apps/docs/changelog/v0.0.4.md'));
        assert.ok(committedPaths.includes('apps/docs/changelog/index.md'));
        assert.ok(committedPaths.includes('CHANGELOG.md'));
        assert.ok(committedPaths.includes('apps/docs/guide/changelog.md'));
        assert.equal(committedPaths.includes('apps/docs/changelog/research-note.md'), false);
        assert.equal(fs.readFileSync(path.join(archiveDir, 'v0.0.4.md'), 'utf-8'), '# v0.0.4\n');
        assert.equal(execFileSync('git', ['status', '--short'], { cwd: fixtureRoot, encoding: 'utf-8' }).trim(), '?? apps/docs/changelog/research-note.md');
    } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
        fs.rmSync(binDir, { recursive: true, force: true });
    }
});

test('fake pnpm fixture emits a Windows command shim for its explicit CJS entry', () => {
    const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-release-pnpm-shim-'));
    const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
    try {
        const shimPath = installFakePnpm(binDir, 'process.exit(0);', { platform: 'win32', nodePath });
        assert.equal(path.basename(shimPath), 'pnpm.cmd');
        assert.equal(fs.readFileSync(shimPath, 'utf-8'), `@echo off\r\n"${nodePath}" "%~dp0pnpm-fixture.cjs" %*\r\nexit /b %ERRORLEVEL%\r\n`);
        assert.equal(fs.readFileSync(path.join(binDir, 'pnpm-fixture.cjs'), 'utf-8'), 'process.exit(0);');
    } finally {
        fs.rmSync(binDir, { recursive: true, force: true });
    }
});
