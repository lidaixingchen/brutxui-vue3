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

/**
 * 按版本块提取 section 标题序列（用于 before/after 对比摘要）。
 * 返回数组的每个元素是一个版本块内的 section 标题列表；
 * 按块比较可避免多版本块文件中同标签重复出现导致 indexOf 误判。
 */
function extractBlocksSectionOrder(content) {
    const blocks = [];
    let current = null;
    for (const line of content.split('\n')) {
        if (/^##\s/.test(line)) {
            current = [];
            blocks.push(current);
        } else if (/^###\s/.test(line) && current) {
            current.push(line.replace(/^###\s*/, '').trim());
        }
    }
    return blocks;
}

/**
 * 重排单个版本块内的 section。
 * 仅处理版本块（`## [x.y.z]`），`## 归档版本` 等非版本块原样保留，
 * 避免将来非版本块内出现 `### ` 子标题时被误重排。
 */
function reorderBlock(blockLines) {
    if (!/^## \[/.test(blockLines[0])) return blockLines;

    const sectionStarts = [];
    for (let i = 0; i < blockLines.length; i++) {
        if (/^###\s/.test(blockLines[i])) sectionStarts.push(i);
    }
    if (sectionStarts.length === 0) return blockLines;

    const preamble = blockLines.slice(0, sectionStarts[0]);
    const sections = [];
    for (let s = 0; s < sectionStarts.length; s++) {
        const start = sectionStarts[s];
        const sectionEnd = s + 1 < sectionStarts.length ? sectionStarts[s + 1] : blockLines.length;
        sections.push(blockLines.slice(start, sectionEnd));
    }

    // 剥离每个 section 尾部空行，重排后统一补一个空行分隔——
    // 否则原最后 section 无尾随空行时，重排后其下一条 `### ` 会紧贴上一节
    const trimmed = sections.map((section) => {
        let bodyEnd = section.length;
        while (bodyEnd > 0 && section[bodyEnd - 1].trim() === '') bodyEnd--;
        return section.slice(0, bodyEnd);
    });
    // 稳定排序：同优先级（含未收录标题）保持原相对顺序
    const ordered = trimmed.slice().sort((a, b) => sectionRank(a[0]) - sectionRank(b[0]));

    // 顺序未变则保持原样：只修复"重排导致的空行紧贴"，不额外改动已合规文件的格式
    if (ordered.map((section) => section[0]).join('\n') === sections.map((section) => section[0]).join('\n')) {
        return blockLines;
    }

    // 重组：preamble + 每 section（后跟一个空行），并折叠连续空行，保证 section 间恰好一个空行
    const result = [...preamble];
    for (const section of ordered) {
        result.push(...section);
        result.push('');
    }
    const collapsed = [];
    for (const line of result) {
        if (line.trim() === '' && collapsed.length > 0 && collapsed[collapsed.length - 1].trim() === '') {
            continue;
        }
        collapsed.push(line);
    }
    return collapsed;
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
    const rootChangelog = path.join(repoRoot, 'CHANGELOG.md');
    const files = existsSync(rootChangelog) ? [rootChangelog] : [];
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
        const beforeBlocks = extractBlocksSectionOrder(original);
        const afterBlocks = extractBlocksSectionOrder(updated);
        // 按版本块比较 section 序列，避免多版本块文件中同标签首次出现位置未变导致的误判
        const movedBlocks = beforeBlocks.filter(
            (labels, index) => labels.join('\n') !== (afterBlocks[index] || []).join('\n'),
        ).length;
        console.log(`[重排] ${relative}（${movedBlocks} 个版本块段落位置变化）`);
        if (!isDryRun) {
            writeFileSync(file, updated, 'utf-8');
        }
    }

    console.log('');
    console.log(isDryRun ? `dry-run 完成：${changedCount} 个文件待重排` : `重排完成：共 ${changedCount} 个文件`);
    console.log('固定段落顺序：' + SECTION_ORDER.join(' → '));
}

main();
