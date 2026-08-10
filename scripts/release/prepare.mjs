import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 发布准备一体化脚本：
//   prepare 模式：守卫（工作区/待发布 changeset）→ pnpm version-packages（bump + 包 CHANGELOG + RELEASING commit）
//                 → pnpm changelog（根 CHANGELOG + 自动归档）→ 自动提交根 CHANGELOG
//   --tag 模式：  读取 ui 版本自动打 annotated tag `v<version>`；--force 覆盖已存在 tag（发布后补修重打场景）
//
// 打 tag 独立成命令而非并入 prepare：tag 必须在 `pnpm release`（门禁）通过之后打，
// 否则门禁失败修复后再提交会让 tag 指向过期 commit。用户手动流程：
//   pnpm release:prepare → pnpm release → pnpm release:tag → git pushp origin main --tags

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const isWin = process.platform === 'win32';
const UI_PKG_PATH = path.join(repoRoot, 'packages', 'ui', 'package.json');
const ARCHIVE_DIR = path.join(repoRoot, 'apps', 'docs', 'changelog');
const ARCHIVE_FILE_RE = /^v\d+\.\d+\.\d+\.md$/;

// ---------- helpers ----------

function git(args, opts = {}) {
    return spawnSync('git', args, { cwd: repoRoot, encoding: 'utf-8', ...opts });
}

function gitOk(args) {
    return git(args).status === 0;
}

/** 执行 pnpm 子命令，输出透传，非零退出码直接中止脚本 */
function pnpm(args) {
    const result = spawnSync('pnpm', args, {
        cwd: repoRoot,
        stdio: 'inherit',
        // Windows 下 pnpm 是 pnpm.cmd，需经 shell 解析
        shell: isWin,
    });
    if (result.error) {
        fail(`执行失败: pnpm ${args.join(' ')}（${result.error.message}）`);
    }
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function uiVersion() {
    return JSON.parse(readFileSync(UI_PKG_PATH, 'utf-8')).version;
}

/** 是否有已跟踪文件的未提交改动（未跟踪文件仅警告，不硬拦截） */
function trackedDirty() {
    return git(['status', '--porcelain', '--untracked-files=no']).stdout.trim() !== '';
}

function untrackedFiles() {
    return git(['status', '--porcelain'])
        .stdout.split('\n')
        .filter((line) => line.startsWith('??'));
}

function pendingChangesets() {
    const dir = path.join(repoRoot, '.changeset');
    if (!existsSync(dir)) return [];
    return readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md');
}

function archivedVersions() {
    if (!existsSync(ARCHIVE_DIR)) return [];
    return readdirSync(ARCHIVE_DIR)
        .filter((f) => ARCHIVE_FILE_RE.test(f))
        .map((f) => f.slice(1, -3))
        .sort();
}

function fail(message) {
    console.error(`\n❌ ${message}`);
    process.exit(1);
}

function step(message) {
    console.log(`\n[release] ${message}`);
}

function logNext(label, commands) {
    step(`下一步（${label}）: ${commands}`);
}

// ---------- prepare 模式 ----------

function prepare(dryRun) {
    step('守卫检查');

    if (trackedDirty()) {
        fail(`工作区有已跟踪文件的未提交改动，发布前必须全部提交（含本次发布的相关改动）。\n${git(['status', '--short']).stdout}`);
    }
    const untracked = untrackedFiles();
    if (untracked.length > 0) {
        console.warn(`⚠️  检测到 ${untracked.length} 个未跟踪文件（不影响发布，但请确认不是漏提交的组件源码/文档）：`);
        console.warn(untracked.join('\n'));
    }

    const changesets = pendingChangesets();
    if (changesets.length === 0) {
        fail('没有待发布 changeset。请先运行 `pnpm changeset` 声明本次变更，再执行发布准备。');
    }
    step(`检测到 ${changesets.length} 个待发布 changeset`);

    if (dryRun) {
        step('[dry-run] 将执行: pnpm version-packages（bump 版本 + 生成包 CHANGELOG + RELEASING commit）');
        step('[dry-run] 将执行: pnpm changelog（更新根 CHANGELOG + 自动归档）');
        step('[dry-run] 将自动提交根 CHANGELOG（docs: 更新根 CHANGELOG 至 <新版本>[并归档 ...]）');
        logNext('门禁与发布', 'pnpm release');
        return;
    }

    const archivedBefore = archivedVersions();

    step('执行 pnpm version-packages（bump 版本 + 生成包 CHANGELOG + RELEASING commit）');
    pnpm(['version-packages']);

    const version = uiVersion();
    step(`ui 版本已提升至 ${version}`);

    step('执行 pnpm changelog（更新根 CHANGELOG + 自动归档）');
    pnpm(['changelog']);

    // 自动提交根 CHANGELOG（含本次新增的归档文件）
    const archivedNew = archivedVersions().filter((v) => !archivedBefore.includes(v));
    const suffix = archivedNew.length ? `并归档 ${archivedNew.join(', ')}` : '';
    const commitMsg = `docs: 更新根 CHANGELOG 至 ${version}${suffix}`;

    const addPaths = ['CHANGELOG.md'];
    if (existsSync(ARCHIVE_DIR)) addPaths.push('apps/docs/changelog');
    const add = git(['add', '--', ...addPaths]);
    if (add.status !== 0) fail(`git add 根 CHANGELOG 失败：${add.stderr}`);

    const staged = git(['diff', '--cached', '--name-only']).stdout.trim();
    if (!staged) {
        step('根 CHANGELOG 无变化（两 tag 间没有新提交可记录），跳过提交');
    } else {
        const commit = git(['commit', '-m', commitMsg]);
        if (commit.status !== 0) fail(`提交根 CHANGELOG 失败：${commit.stderr}`);
        step(`已提交：${commitMsg}`);
    }

    logNext(`门禁 + 发布`, `pnpm release`);
    logNext(`打 tag（自动读版本）`, `pnpm release:tag`);
    logNext(`推送并触发 CI 发布`, `git pushp origin main --tags`);
}

// ---------- --tag 模式 ----------

function tag(force, dryRun) {
    const version = uiVersion();
    const tagName = `v${version}`;

    step('守卫检查');
    if (trackedDirty()) {
        fail('工作区有未提交改动，请先提交（含发布后补修）再打 tag。');
    }

    const exists = gitOk(['rev-parse', '-q', '--verify', `refs/tags/${tagName}`]);
    if (exists && !force) {
        fail(`tag ${tagName} 已存在。若需重打（如发布后补修、门禁修复后再提交），用 --force 覆盖。`);
    }

    if (dryRun) {
        step(`[dry-run] 将打 annotated tag: git tag -a ${tagName} -m "Release ${tagName}"${force && exists ? ' --force' : ''}`);
        logNext('推送并触发 CI 发布', 'git pushp origin main --tags');
        return;
    }

    const args = ['tag', '-a', tagName, '-m', `Release ${tagName}`];
    if (force) args.push('--force');
    const r = git(args);
    if (r.status !== 0) fail(`打 tag 失败：${r.stderr}`);

    const head = git(['rev-parse', '--short', 'HEAD']).stdout.trim();
    step(`已打 annotated tag ${tagName} -> ${head}`);
    logNext('推送并触发 CI 发布', 'git pushp origin main --tags');
}

// ---------- entry ----------

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run') || argv.includes('-n');
const force = argv.includes('--force') || argv.includes('-f');

if (argv.includes('--tag')) {
    tag(force, dryRun);
} else {
    prepare(dryRun);
}
