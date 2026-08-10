/**
 * 一次性重排既有 CHANGELOG 的段落顺序，与 generate-changelog.mjs 保持一致。
 *
 * 背景：旧版 generate-changelog.mjs 的段落顺序依赖提交在 git log 中首次出现的先后
 * （Map 插入顺序），导致新功能常被大量 fix 提交顶到最后。现统一为 SECTION_ORDER
 * 的固定顺序（破坏性 → 新功能 → 重构 → 修复 → 文档 → 测试 → 其余兜底）。
 *
 * 覆盖范围：根 CHANGELOG.md + apps/docs/changelog/ 下全部归档文件。
 * 处理方式：按 `## ` 版本块切分，块内按 `### ` section 重排，其余结构原样保留。
 * 幂等：已符合 SECTION_ORDER 的文件不会变更。
 *
 * 用法：node scripts/release/reorder-changelog-sections.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTION_ORDER, sectionRank } from './changelog-sections.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** 提取全文所有 section 标题（用于 before/after 对比摘要） */
function extractSectionOrder(content) {
    const labels = [];
    for (const match of content.matchAll(/^###\s+([^\r\n]+)/gm)) {
        labels.push(match[1].trim());
    }
    return labels;
}

/** 重排单个版本块内的 section；无 section 的块（Unreleased、归档列表）原样返回 */
function reorderBlock(blockLines) {
    // 剥离块尾空行，重排后放回块尾，避免空行被 section 吞掉
    let end = blockLines.length;
    while (end > 0 && blockLines[end - 1].trim() === '') end--;
    const trailing = blockLines.slice(end);
    const body = blockLines.slice(0, end);

    const sectionStarts = [];
    for (let i = 0; i < body.length; i++) {
        if (/^###\s/.test(body[i])) sectionStarts.push(i);
    }
    if (sectionStarts.length === 0) return [...body, ...trailing];

    const preamble = body.slice(0, sectionStarts[0]);
    const sections = [];
    for (let s = 0; s < sectionStarts.length; s++) {
        const start = sectionStarts[s];
        const sectionEnd = s + 1 < sectionStarts.length ? sectionStarts[s + 1] : body.length;
        sections.push(body.slice(start, sectionEnd));
    }
    // 稳定排序：同优先级（含未收录标题）保持原相对顺序
    const ordered = sections.slice().sort((a, b) => sectionRank(a[0]) - sectionRank(b[0]));
    return [...preamble, ...ordered.flat(), ...trailing];
}

/** 整文件重排：按 `## ` 切块，块间内容（头部/前言）保持不动 */
function reorderFileContent(content) {
    const lines = content.split('\n');
    const blockStarts = [];
    for (let i = 0; i < lines.length; i++) {
        if (/^##\s/.test(lines[i])) blockStarts.push(i);
    }
    if (blockStarts.length === 0) return content;

    const chunks = [];
    let cursor = 0;
    for (let b = 0; b < blockStarts.length; b++) {
        const start = blockStarts[b];
        const blockEnd = b + 1 < blockStarts.length ? blockStarts[b + 1] : lines.length;
        if (start > cursor) chunks.push(lines.slice(cursor, start).join('\n'));
        chunks.push(reorderBlock(lines.slice(start, blockEnd)).join('\n'));
        cursor = blockEnd;
    }
    if (cursor < lines.length) chunks.push(lines.slice(cursor).join('\n'));
    return chunks.join('\n');
}

function main() {
    const isDryRun = process.argv.includes('--dry-run');

    const docsChangelogDir = path.join(repoRoot, 'apps/docs/changelog');
    const files = [path.join(repoRoot, 'CHANGELOG.md')];
    if (existsSync(docsChangelogDir)) {
        files.push(
            ...readdirSync(docsChangelogDir)
                .filter((name) => name.endsWith('.md'))
                .sort()
                .map((name) => path.join(docsChangelogDir, name)),
        );
    }

    let changedCount = 0;
    for (const file of files) {
        const relative = path.relative(repoRoot, file).replace(/\\/g, '/');
        const original = readFileSync(file, 'utf-8');
        const updated = reorderFileContent(original);
        if (updated === original) {
            console.log(`[跳过] ${relative}`);
            continue;
        }

        changedCount++;
        const before = extractSectionOrder(original);
        const after = extractSectionOrder(updated);
        const moved = before.filter((label) => before.indexOf(label) !== after.indexOf(label));
        console.log(`[重排] ${relative}（${moved.length} 个段落位置变化）`);
        if (!isDryRun) {
            writeFileSync(file, updated, 'utf-8');
        }
    }

    console.log('');
    console.log(isDryRun ? `dry-run 完成：${changedCount} 个文件待重排` : `重排完成：共 ${changedCount} 个文件`);
    console.log('固定段落顺序：' + SECTION_ORDER.join(' → '));
}

main();
