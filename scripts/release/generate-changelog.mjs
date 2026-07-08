import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const REPO_URL = 'https://github.com/lidaixingchen/brutxui-vue3';

const TYPE_LABELS = {
    feat: '✨ Features',
    fix: '🐛 Bug Fixes',
    docs: '📝 Documentation',
    style: '💄 Styles',
    refactor: '♻️ Code Refactoring',
    perf: '⚡ Performance',
    test: '✅ Tests',
    build: '📦 Build',
    ci: '🔧 CI',
    chore: '🏠 Chores',
    revert: '⏪ Reverts',
};

const EXCLUDED_TYPES = ['release'];

const COMMIT_PATTERN = /^(\w+)(?:\(([^)]+)\))?\s*(!)?\s*:\s*(.+)$/;

function getArgValue(flag) {
    const index = process.argv.indexOf(flag);
    if (index === -1 || index + 1 >= process.argv.length) return null;
    return process.argv[index + 1];
}

function getLatestTag() {
    try {
        const result = spawnSync('git', ['describe', '--tags', '--abbrev=0'], {
            cwd: repoRoot,
            encoding: 'utf-8',
        });
        if (result.error || result.status !== 0) return null;
        return result.stdout.trim();
    } catch {
        return null;
    }
}

function getFirstCommitSha() {
    try {
        const result = spawnSync('git', ['rev-list', '--max-parents=0', 'HEAD'], {
            cwd: repoRoot,
            encoding: 'utf-8',
        });
        if (result.error || result.status !== 0) return null;
        return result.stdout.trim().split('\n')[0];
    } catch {
        return null;
    }
}

function getVersionFromPackageJson() {
    const pkgPath = path.join(repoRoot, 'packages', 'ui', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
}

function getCommitsSince(tag) {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    try {
        const result = spawnSync('git', ['log', range, '--format=%H%x1f%s%x1f%b%x1f%an%x1f%ae%x1e'], {
            cwd: repoRoot,
            encoding: 'utf-8',
        });
        if (result.error || result.status !== 0) return [];
        return result.stdout.trim().split('\x1e').filter(Boolean);
    } catch {
        return [];
    }
}

function parseCommit(line) {
    const [hash, subject, body, author, email] = line.split('\x1f').map((s) => s.trim());
    const match = subject.match(COMMIT_PATTERN);

    if (!match) {
        return {
            hash,
            type: 'chore',
            scope: null,
            subject,
            body,
            author,
            email,
            isBreaking: false,
            isChore: true,
        };
    }

    const [, type, scope, breakingMark, description] = match;
    const isBreaking = breakingMark === '!' || (body && body.includes('BREAKING CHANGE:'));

    return {
        hash,
        type,
        scope: scope || null,
        subject: description,
        body,
        author,
        email,
        isBreaking,
        isChore: type === 'chore',
    };
}

function categorize(commits) {
    const categories = new Map();

    for (const commit of commits) {
        if (commit.isBreaking) {
            if (!categories.has('breaking')) {
                categories.set('breaking', []);
            }
            categories.get('breaking').push(commit);
            continue;
        }

        const label = TYPE_LABELS[commit.type] || '🏠 Chores';
        if (!categories.has(label)) {
            categories.set(label, []);
        }
        categories.get(label).push(commit);
    }

    return categories;
}

function renderMarkdown(version, date, categories, compareBase) {
    const lines = [];
    const compareEnd = version === 'Unreleased' ? 'HEAD' : `v${version}`;
    if (compareBase) {
        lines.push(`## [${version}](${REPO_URL}/compare/${compareBase}...${compareEnd}) (${date})`);
    } else {
        lines.push(`## [${version}] (${date})`);
    }
    lines.push('');

    function renderCommit(commit) {
        const scope = commit.scope ? `**${commit.scope}:** ` : '';
        const header = `* ${scope}${commit.subject} ([${commit.hash.slice(0, 7)}](${REPO_URL}/commit/${commit.hash}))`;
        if (!commit.body) return [header];
        const bodyLines = commit.body.split('\n').filter(Boolean);
        return [header, ...bodyLines.map((line) => `  ${line}`)];
    }

    if (categories.has('breaking')) {
        lines.push('### ⚠ BREAKING CHANGES');
        lines.push('');
        for (const commit of categories.get('breaking')) {
            lines.push(...renderCommit(commit));
        }
        lines.push('');
    }

    for (const [label, commits] of categories) {
        if (label === 'breaking') continue;

        lines.push(`### ${label}`);
        lines.push('');
        for (const commit of commits) {
            lines.push(...renderCommit(commit));
        }
        lines.push('');
    }

    return lines.join('\n');
}

function prependToChangelog(newEntry) {
    const changelogPath = path.join(repoRoot, 'CHANGELOG.md');
    const defaultHeader = '# 更新日志\n\n本项目所有重要变更均记录于此。\n\n格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，\n版本号遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。\n\n';

    try {
        if (existsSync(changelogPath)) {
            const existing = readFileSync(changelogPath, 'utf-8');
            const firstEntryIndex = existing.indexOf('\n## [');
            const header = firstEntryIndex !== -1 ? existing.slice(0, firstEntryIndex + 1) : defaultHeader;
            const contentWithoutHeader = firstEntryIndex !== -1 ? existing.slice(firstEntryIndex + 1) : '';
            writeFileSync(changelogPath, header + newEntry + '\n' + contentWithoutHeader, 'utf-8');
        } else {
            writeFileSync(changelogPath, defaultHeader + newEntry, 'utf-8');
        }
    } catch (error) {
        console.error('Error updating CHANGELOG.md:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

function main() {
    const isDryRun = process.argv.includes('--dry-run');
    const isFullHistory = process.argv.includes('--full-history');
    const scopeFilter = getArgValue('--scope');

    const tag = isFullHistory ? null : getLatestTag();
    const version = getVersionFromPackageJson();
    const commits = getCommitsSince(tag);

    if (commits.length === 0) {
        console.log('No new commits since last tag. Skipping changelog update.');
        return;
    }

    const tagVersion = tag ? tag.replace(/^v/, '') : null;
    const displayVersion = tagVersion === version ? 'Unreleased' : version;

    const parsed = commits
        .map(parseCommit)
        .filter((c) => !EXCLUDED_TYPES.includes(c.type))
        .filter((c) => !c.isChore || c.isBreaking);

    const filtered = scopeFilter
        ? parsed.filter((c) => !c.scope || c.scope === scopeFilter)
        : parsed;

    const categorized = categorize(filtered);
    const entry = renderMarkdown(displayVersion, new Date().toISOString().slice(0, 10), categorized, tag ?? getFirstCommitSha());

    if (isDryRun) {
        console.log(entry);
    } else {
        prependToChangelog(entry);
        console.log('CHANGELOG.md updated.');
    }
}

main();
