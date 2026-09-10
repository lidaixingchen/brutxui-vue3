import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI_PKG_PATH = path.join('packages', 'ui', 'package.json');
const ROOT_CHANGELOG = 'CHANGELOG.md';
const DOCS_ARCHIVE_DIR = path.join('apps', 'docs', 'changelog');

/**
 * 获取命令行参数（支持 `--flag value` 与 `--flag=value`）
 * @param {string} flag
 * @returns {string | null}
 */
function getArgValue(flag) {
    const prefix = `${flag}=`;
    for (let i = 2; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (arg === flag) {
            return i + 1 < process.argv.length ? process.argv[i + 1] : null;
        }
        if (arg.startsWith(prefix)) {
            return arg.slice(prefix.length);
        }
    }
    return null;
}

/**
 * 从 packages/ui/package.json 获取当前版本号
 * @param {string} [rootDir=repoRoot]
 * @returns {string}
 */
function getVersionFromPackageJson(rootDir = repoRoot) {
    const pkgPath = path.join(rootDir, UI_PKG_PATH);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
}

/**
 * 从 Markdown 文本中解析指定版本的变更记录与对比链接
 * @param {string} content
 * @param {string} rawVersion
 * @returns {{ version: string, compareUrl: string, body: string } | null}
 */
export function parseReleaseSection(content, rawVersion) {
    const version = rawVersion.replace(/^v/, '').trim();
    // 转义所有正则表达式特殊字符（包括 SemVer 可能包含的 `+`、`-` 等）
    const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 匹配版本标题行：锚定行首，完整消费整行内容及行尾换行符
    const headerRegex = new RegExp(
        `^[ \\t]*##[ \\t]*\\[${escapedVersion}\\]\\(([^)]+)\\)[^\\r\\n]*(?:\\r?\\n|$)`,
        'm'
    );
    const headerMatch = content.match(headerRegex);
    if (!headerMatch || headerMatch.index === undefined) {
        return null;
    }

    const compareUrl = headerMatch[1].trim();
    const startIndex = headerMatch.index + headerMatch[0].length;

    // 截取到下一个 ## [ 或 ## 归档版本 或文件结尾
    const afterHeader = content.slice(startIndex);
    const nextSectionRegex = /\r?\n[ \t]*##\s+(?:\[|归档版本)/;
    const nextMatch = afterHeader.match(nextSectionRegex);

    const bodyRaw = nextMatch && nextMatch.index !== undefined
        ? afterHeader.slice(0, nextMatch.index)
        : afterHeader;

    const body = bodyRaw.trim();
    return {
        version,
        compareUrl,
        body,
    };
}

/**
 * 提取指定版本的 Release Notes（优先根 CHANGELOG.md，回退至归档文件）
 * @param {string} [rawVersion]
 * @param {string} [rootDir=repoRoot]
 * @returns {string}
 */
export function extractReleaseNotes(rawVersion, rootDir = repoRoot) {
    const version = (rawVersion || getVersionFromPackageJson(rootDir)).replace(/^v/, '').trim();
    const changelogPath = path.join(rootDir, ROOT_CHANGELOG);
    const archivePath = path.join(rootDir, DOCS_ARCHIVE_DIR, `v${version}.md`);

    let parsed = null;

    if (existsSync(changelogPath)) {
        const changelogContent = readFileSync(changelogPath, 'utf-8');
        parsed = parseReleaseSection(changelogContent, version);
    }

    if (!parsed && existsSync(archivePath)) {
        const archiveContent = readFileSync(archivePath, 'utf-8');
        parsed = parseReleaseSection(archiveContent, version);
    }

    if (!parsed) {
        throw new Error(`未找到版本 v${version} 的更新日志（CHANGELOG.md 与归档目录均不存在该版本记录）`);
    }

    const { compareUrl, body } = parsed;
    const fullChangelogLine = `**Full Changelog**: ${compareUrl}`;

    return body ? `${body}\n\n${fullChangelogLine}\n` : `${fullChangelogLine}\n`;
}

function main() {
    const explicitTag = getArgValue('--tag');
    const explicitVersion = getArgValue('--version');
    const outFile = getArgValue('--out');

    const targetVersion = explicitTag || explicitVersion || getVersionFromPackageJson();

    try {
        const notes = extractReleaseNotes(targetVersion);
        if (outFile) {
            const outPath = path.resolve(process.cwd(), outFile);
            mkdirSync(path.dirname(outPath), { recursive: true });
            writeFileSync(outPath, notes, 'utf-8');
        } else {
            process.stdout.write(notes);
        }
    } catch (error) {
        console.error(`[extract-release-notes] 失败: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

// 跨平台不区分大小写归一化判定直接执行
const isDirectCall = Boolean(
    process.argv[1] &&
    path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase()
);

if (isDirectCall) {
    main();
}
