import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const REPO_URL = 'https://github.com/lidaixingchen/brutxui-vue3';

const TYPE_LABELS = {
    feat: '✨ Features',
    fix: '🐛 Bug Fixes',
    docs: '📝 Documentation',
    style: '🎨 Styles',
    refactor: '♻️ Code Refactoring',
    perf: '⚡ Performance',
    test: '✅ Tests',
    build: '📦 Build',
    ci: '🔧 CI',
    chore: '🧹 Chores',
    revert: '⏪ Reverts',
};

const EXCLUDED_TYPES = ['release'];

const COMMIT_PATTERN = /^(\w+)(?:\(([^)]+)\))?\s*(!)?\s*:\s*(.+)$/;

function getArgValue(flag) {
    const index = process.argv.indexOf(flag);
    if (index === -1 || index + 1 >= process.argv.length) return null;
    return process.argv[index + 1];
}

function git(args) {
    const result = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf-8' });
    if (result.error || result.status !== 0) return null;
    return result.stdout.trim();
}

function getLatestTag() {
    return git(['describe', '--tags', '--abbrev=0']);
}

function getPreviousTag(currentTag) {
    return git(['describe', '--tags', '--abbrev=0', `${currentTag}^`]);
}

function resolveHeadSha() {
    return git(['rev-parse', 'HEAD']);
}

function resolveTagSha(tag) {
    // annotated tag 需要解引用到 commit；^{commit} 对轻量级 tag 也安全
    return git(['rev-parse', `${tag}^{commit}`]);
}

function getVersionFromPackageJson() {
    const pkgPath = path.join(repoRoot, 'packages', 'ui', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
}

function getCommitsBetween(fromRef, toRef) {
    const range = `${fromRef}..${toRef}`;
    const raw = git(['log', range, '--format=%H%x1f%s%x1f%b%x1f%an%x1f%ae%x1e']);
    if (!raw) return [];
    return raw.split('\x1e').filter(Boolean);
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
    const isBreaking = breakingMark === '!' || (body && /BREAKING[ -]CHANGE:/.test(body));

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

        const label = TYPE_LABELS[commit.type] || '🧹 Chores';
        if (!categories.has(label)) {
            categories.set(label, []);
        }
        categories.get(label).push(commit);
    }

    return categories;
}

function renderMarkdown(version, date, categories, compareBase) {
    const lines = [];
    const compareEnd = `v${version}`;
    lines.push(`## [${version}](${REPO_URL}/compare/${compareBase}...${compareEnd}) - ${date}`);
    lines.push('');

    function renderCommit(commit) {
        const scope = commit.scope ? `**${commit.scope}:** ` : '';
        const header = `* ${scope}${commit.subject} ([${commit.hash.slice(0, 7)}](${REPO_URL}/commit/${commit.hash}))`;
        if (!commit.body) return [header];
        const bodyLines = commit.body.split('\n').filter(Boolean);
        return [header, ...bodyLines.map((line) => `  ${line}`)];
    }

    if (categories.has('breaking')) {
        lines.push('### ⚠️ Breaking Changes');
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

function stripUnreleasedSection(content) {
    // 移除已有的 ## [Unreleased] 段（含其后到下一个 ## 之间的空行）
    // 匹配：## [Unreleased](...) 或 ## [Unreleased] 任意形式
    const unreleasedPattern = /\n## \[Unreleased\][^\n]*\n(?:\n|(?!##).)*?(?=\n## |\n*$)/;
    return content.replace(unreleasedPattern, '');
}

function archiveOldestVersion(fullContent, newVersion) {
    const docsChangelogDir = path.join(repoRoot, 'apps/docs/changelog');
    const docsIndexImg = path.join(docsChangelogDir, 'index.md');

    // 1. 使用正则匹配所有的版本标题 (包括刚刚 prepended 的新版本)
    const versionHeaderRegex = /## \[(0|[1-9]\d*\.\d+\.\d+)\]\([^\)]+\)\s+-\s+(\d{4}-\d{2}-\d{2})/g;
    const matches = [...fullContent.matchAll(versionHeaderRegex)];

    // 2. 如果版本号数量没有超过 3 个，则不需要裁剪归档，直接返回原内容
    if (matches.length <= 3) {
        return fullContent;
    }

    // 3. 超过 3 个，第 4 个版本即为需要被归档的最老活跃版本 (索引为 3)
    const oldestActive = matches[3];
    const oldestVersion = oldestActive[1];
    const oldestDate = oldestActive[2];
    const oldestStartIndex = oldestActive.index;

    // 确定第 4 个版本的结束边界
    let oldestEndIndex = fullContent.indexOf('\n## 归档版本');
    if (oldestEndIndex === -1) {
        oldestEndIndex = fullContent.length;
    }
    if (matches[4] && matches[4].index < oldestEndIndex) {
        oldestEndIndex = matches[4].index;
    }

    // 4. 提取该段归档内容并清洗格式
    const rawArchiveText = fullContent.slice(oldestStartIndex, oldestEndIndex).trim();
    const archiveFileContent = `# v${oldestVersion}\n\n> [← 返回主 CHANGELOG](../guide/changelog.md)\n\n${rawArchiveText}\n`;

    // 5. 自动写入或更新 `apps/docs/changelog/v${oldestVersion}.md`
    if (!existsSync(docsChangelogDir)) {
        mkdirSync(docsChangelogDir, { recursive: true });
    }
    const archiveFilePath = path.join(docsChangelogDir, `v${oldestVersion}.md`);
    writeFileSync(archiveFilePath, archiveFileContent, 'utf-8');
    console.log(`[Archive] 自动归档旧版本至: apps/docs/changelog/v${oldestVersion}.md`);

    // 6. 从主 CHANGELOG 内容中裁剪掉该版本段
    const cleanedBody = fullContent.slice(0, oldestStartIndex) + fullContent.slice(oldestEndIndex);

    // 7. 同步在主 CHANGELOG 的“## 归档版本”列表顶部插入新归档链接
    const changelogArchiveLink = `* **[${oldestVersion}](apps/docs/changelog/v${oldestVersion}.md)** - ${oldestDate}`;
    let updatedContent = cleanedBody;

    const archiveHeader = '## 归档版本';
    const archiveDescription = '> 以下版本已归档至 [apps/docs/changelog/](apps/docs/changelog/)，点击版本号查看完整变更记录：';

    if (!cleanedBody.includes('## 归档版本')) {
        // 退路机制：章节缺失时自动拼装补全在 CHANGELOG 末尾
        updatedContent = cleanedBody.trim() + `\n\n${archiveHeader}\n\n${archiveDescription}\n\n${changelogArchiveLink}\n`;
    } else if (!cleanedBody.includes(changelogArchiveLink)) {
        // 高容错性正则：支持多变空行与微调
        const archiveTitleRegex = /## 归档版本[\s\S]*?点击版本号查看完整变更记录：\s*/;
        if (cleanedBody.match(archiveTitleRegex)) {
            updatedContent = cleanedBody.replace(
                archiveTitleRegex,
                `## 归档版本\n\n${archiveDescription}\n\n${changelogArchiveLink}\n`
            );
        }
    }

    // 8. 同步更新文档站 `changelog/index.md` 列表顶部插入新归档链接，使用 .md 后缀保持 GitHub 可跳转
    if (existsSync(docsIndexImg)) {
        let indexContent = readFileSync(docsIndexImg, 'utf-8');
        const docsArchiveLink = `* **[v${oldestVersion}](./v${oldestVersion}.md)** - ${oldestDate}`;
        if (!indexContent.includes(docsArchiveLink)) {
            indexContent = indexContent.replace(
                '## 归档列表\n\n',
                `## 归档列表\n\n${docsArchiveLink}\n`
            );
            writeFileSync(docsIndexImg, indexContent, 'utf-8');
            console.log(`[Archive] 自动更新文档站归档索引: apps/docs/changelog/index.md`);
        }
    }

    // 9. 递归：如果裁剪后版本数量依然大于 3，则继续裁剪直到剩下 3 个最新版
    return archiveOldestVersion(updatedContent, newVersion);
}

function prependToChangelog(newEntry, version) {
    const changelogPath = path.join(repoRoot, 'CHANGELOG.md');
    const defaultHeader =
        '# 更新日志\n\n' +
        '本项目所有重要变更均记录于此。\n\n' +
        '格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，\n' +
        '版本号遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。\n\n';

    const unreleasedEntry =
        `## [Unreleased](${REPO_URL}/compare/v${version}...HEAD)\n\n`;

    try {
        let finalChangelogContent = '';
        if (existsSync(changelogPath)) {
            let existing = readFileSync(changelogPath, 'utf-8');
            existing = stripUnreleasedSection(existing);
            const firstEntryIndex = existing.indexOf('\n## [');
            const header = firstEntryIndex !== -1 ? existing.slice(0, firstEntryIndex + 1) : defaultHeader;
            const contentWithoutHeader = firstEntryIndex !== -1 ? existing.slice(firstEntryIndex + 1) : existing;
            
            // 拼出带有新 Entry 的完整内容
            const fullContent = header + unreleasedEntry + newEntry + '\n' + contentWithoutHeader;
            // 触发自动归档裁剪
            finalChangelogContent = archiveOldestVersion(fullContent, version);
        } else {
            const fullContent = defaultHeader + unreleasedEntry + newEntry;
            finalChangelogContent = archiveOldestVersion(fullContent, version);
        }
        
        writeFileSync(changelogPath, finalChangelogContent, 'utf-8');
    } catch (error) {
        console.error('Error updating CHANGELOG.md:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

function resolveFromTag(currentTag) {
    // 优先级：当前版本对应的 tag 存在 → 取上一个 tag；否则用最新 tag
    const currentTagSha = resolveTagSha(currentTag);
    if (currentTagSha) {
        return getPreviousTag(currentTag);
    }
    return getLatestTag();
}

function main() {
    const isDryRun = process.argv.includes('--dry-run');
    const explicitFrom = getArgValue('--from');
    const explicitVersion = getArgValue('--version');
    const explicitDate = getArgValue('--date');
    const scopeFilter = getArgValue('--scope');

    const version = explicitVersion || getVersionFromPackageJson();
    const currentTag = `v${version}`;
    const fromTag = explicitFrom || resolveFromTag(currentTag);

    if (!fromTag) {
        console.error('Error: 无法确定起始 tag，请用 --from <tag> 显式指定（例如 --from v0.9.4）');
        process.exit(1);
    }

    const now = new Date();
    const date = explicitDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 终点：当前版本 tag 存在则用 tag，否则用 HEAD（开发中未打 tag）
    const currentTagSha = resolveTagSha(currentTag);
    const rangeEnd = currentTagSha ? currentTag : 'HEAD';

    const commits = getCommitsBetween(fromTag, rangeEnd);
    if (commits.length === 0) {
        console.log(`No commits between ${fromTag}..${rangeEnd}. Skipping changelog update.`);
        return;
    }

    const parsed = commits
        .map(parseCommit)
        .filter((c) => !EXCLUDED_TYPES.includes(c.type))
        .filter((c) => !c.isChore || c.isBreaking);

    const filtered = scopeFilter
        ? parsed.filter((c) => !c.scope || c.scope === scopeFilter)
        : parsed;

    const categorized = categorize(filtered);
    const entry = renderMarkdown(version, date, categorized, fromTag);

    if (isDryRun) {
        console.log(entry);
    } else {
        prependToChangelog(entry, version);
        console.log(`CHANGELOG.md updated with ${parsed.length} commits from ${fromTag}..${rangeEnd}.`);
    }
}

main();
