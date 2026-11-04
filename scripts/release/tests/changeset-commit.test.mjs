import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import commitMessages from '../changeset-commit.mjs';

const require = createRequire(import.meta.url);
const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const COMMITLINT_CONFIG = path.join(REPO_ROOT, 'commitlint.config.mjs');

function packageBinary(packageName, binaryName) {
    const manifestPath = require.resolve(`${packageName}/package.json`);
    return path.resolve(path.dirname(manifestPath), require(manifestPath).bin[binaryName]);
}

const COMMITLINT_CLI = packageBinary('@commitlint/cli', 'commitlint');
const CHANGESETS_CLI = packageBinary('@changesets/cli', 'changeset');

function assertCommitMessage(message) {
    const result = spawnSync(process.execPath, [COMMITLINT_CLI, '--config', COMMITLINT_CONFIG], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        input: message,
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(message.includes('[skip ci]'), false);
}

test('变更声明将完整摘要保留在正文并通过提交校验', () => {
    const summary = '统一主题令牌与集合选项的交互反馈，使鼠标高亮、键盘焦点和业务选中状态使用清晰的视觉表达，并同步源码分发与文档示例。\n\n包含多行 Markdown 说明。';
    const message = commitMessages.getAddMessage({ summary });

    assert.equal(message.split('\n')[0], 'docs(changeset): 记录版本变更');
    assert.ok(message.includes(summary));
    assertCommitMessage(message);
});

test('版本提交列出本次发布包并通过提交校验', () => {
    const message = commitMessages.getVersionMessage({
        releases: [
            { name: 'brutx-ui-vue', type: 'patch', newVersion: '0.2.1' },
            { name: 'brutx-vue', type: 'patch', newVersion: '0.2.1' },
            { name: 'brutx-registry-vue', type: 'patch', newVersion: '0.1.1' },
            { name: 'brutx-shared-vue', type: 'none', newVersion: '0.1.0' },
        ],
    });

    assert.equal(message.split('\n')[0], 'chore(release): 更新工作区版本');
    assert.ok(message.includes('- brutx-ui-vue@0.2.1'));
    assert.ok(message.includes('- brutx-vue@0.2.1'));
    assert.ok(message.includes('- brutx-registry-vue@0.1.1'));
    assert.equal(message.includes('brutx-shared-vue'), false);
    assertCommitMessage(message);
});

test('实际 Changesets 版本提交通过仓库提交钩子', () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-changeset-commit-'));
    const write = (relativePath, content) => {
        const filePath = path.join(fixtureRoot, relativePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
    };
    const git = args => execFileSync('git', args, { cwd: fixtureRoot, encoding: 'utf8' }).trim();

    try {
        write('package.json', JSON.stringify({ name: 'release-commit-fixture', private: true, type: 'module' }));
        write('pnpm-workspace.yaml', 'packages:\n  - packages/*\n  - apps/*\n');
        write('.gitignore', 'node_modules/\n');
        write('packages/ui/package.json', JSON.stringify({ name: 'brutx-ui-vue', version: '0.2.0' }));
        write('packages/cli/package.json', JSON.stringify({ name: 'brutx-vue', version: '0.2.0' }));
        write('apps/docs/package.json', JSON.stringify({ name: 'docs', version: '0.2.0', private: true }));
        write('.changeset/config.json', fs.readFileSync(path.join(REPO_ROOT, '.changeset/config.json')));
        const config = JSON.parse(fs.readFileSync(path.join(fixtureRoot, '.changeset/config.json'), 'utf8'));
        const generatorPath = path.resolve(fixtureRoot, '.changeset', config.commit);
        fs.mkdirSync(path.dirname(generatorPath), { recursive: true });
        fs.copyFileSync(fileURLToPath(new URL('../changeset-commit.mjs', import.meta.url)), generatorPath);
        write('.changeset/release.md', '---\n"brutx-ui-vue": patch\n"brutx-vue": patch\n---\n\n完善组件交互反馈。\n');
        fs.symlinkSync(path.join(REPO_ROOT, 'node_modules'), path.join(fixtureRoot, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');

        git(['init', '--quiet', '--initial-branch', 'main']);
        git(['config', 'user.name', '发布测试']);
        git(['config', 'user.email', 'release@example.test']);
        git(['config', 'commit.gpgsign', 'false']);
        git(['config', 'core.hooksPath', path.join(fixtureRoot, '.git/hooks')]);
        const hookPath = path.join(fixtureRoot, '.git/hooks/commit-msg');
        const hookLog = path.join(fixtureRoot, '.git/commit-messages');
        fs.writeFileSync(hookPath, `#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
const result = spawnSync(process.execPath, [${JSON.stringify(COMMITLINT_CLI)}, '--config', ${JSON.stringify(COMMITLINT_CONFIG)}, '--edit', process.argv[2]], { stdio: 'inherit' });
appendFileSync(${JSON.stringify(hookLog)}, readFileSync(process.argv[2], 'utf8') + '\\n');
process.exit(result.status);
`);
        fs.chmodSync(hookPath, 0o755);
        git(['add', '.']);
        git(['commit', '--quiet', '-m', 'chore: 初始化发布测试']);

        const result = spawnSync(process.execPath, [CHANGESETS_CLI, 'version'], {
            cwd: fixtureRoot,
            encoding: 'utf8',
        });
        assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
        for (const packageName of ['ui', 'cli']) {
            const pkg = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'packages', packageName, 'package.json'), 'utf8'));
            assert.equal(pkg.version, '0.2.1');
        }
        const message = git(['log', '-1', '--format=%B']);
        assert.equal(message.split('\n')[0], 'chore(release): 更新工作区版本');
        assert.ok(fs.readFileSync(hookLog, 'utf8').includes(message));
        assert.equal(fs.existsSync(path.join(fixtureRoot, '.changeset/release.md')), false);
        assert.equal(git(['status', '--porcelain']), '');
    } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
});
