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

function getVersionFromPackageJson() {
    const pkgPath = path.join(repoRoot, 'packages', 'ui', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
}

function getCommitsSince(tag) {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    try {
        const result = spawnSync('git', ['log', range, '--format=%H|%s|%b|%an|%ae'], {
            cwd: repoRoot,
            encoding: 'utf-8',
        });
        if (result.error || result.status !== 0) return [];
        return result.stdout.trim().split('\n').filter(Boolean);
    } catch {
        return [];
    }
}

function parseCommit(line) {
    const [hash, subject, body, author, email] = line.split('|');
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

function renderMarkdown(version, date, categories, latestTag) {
    const lines = [];
    lines.push(`## [${version}](${REPO_URL}/compare/${latestTag || 'v0.0.0'}...v${version}) (${date})`);
    lines.push('');

    if (categories.has('breaking')) {
        lines.push('### ⚠ BREAKING CHANGES');
        lines.push('');
        for (const commit of categories.get('breaking')) {
            const scope = commit.scope ? `**${commit.scope}:** ` : '';
            lines.push(`* ${scope}${commit.subject} ([${commit.hash.slice(0, 7)}](${REPO_URL}/commit/${commit.hash}))`);
        }
        lines.push('');
    }

    for (const [label, commits] of categories) {
        if (label === 'breaking') continue;

        lines.push(`### ${label}`);
        lines.push('');
        for (const commit of commits) {
            const scope = commit.scope ? `**${commit.scope}:** ` : '';
            lines.push(`* ${scope}${commit.subject} ([${commit.hash.slice(0, 7)}](${REPO_URL}/commit/${commit.hash}))`);
        }
        lines.push('');
    }

    return lines.join('\n');
}

function prependToChangelog(newEntry) {
    const changelogPath = path.join(repoRoot, 'CHANGELOG.md');
    const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';

    try {
        if (existsSync(changelogPath)) {
            const existing = readFileSync(changelogPath, 'utf-8');
            const firstEntryIndex = existing.indexOf('\n## [');
            const contentWithoutHeader = firstEntryIndex !== -1 ? existing.slice(firstEntryIndex + 1) : '';
            writeFileSync(changelogPath, header + newEntry + '\n' + contentWithoutHeader, 'utf-8');
        } else {
            writeFileSync(changelogPath, header + newEntry, 'utf-8');
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

    const parsed = commits
        .map(parseCommit)
        .filter((c) => !EXCLUDED_TYPES.includes(c.type))
        .filter((c) => !c.isChore || c.isBreaking);

    const filtered = scopeFilter
        ? parsed.filter((c) => !c.scope || c.scope === scopeFilter)
        : parsed;

    const categorized = categorize(filtered);
    const entry = renderMarkdown(version, new Date().toISOString().slice(0, 10), categorized, tag);

    if (isDryRun) {
        console.log(entry);
    } else {
        prependToChangelog(entry);
        console.log('CHANGELOG.md updated.');
    }
}

main();
