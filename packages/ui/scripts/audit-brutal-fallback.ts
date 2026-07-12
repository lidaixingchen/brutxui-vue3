/**
 * BrutxUI 设计令牌 fallback 覆盖率审计脚本
 *
 * 扫描所有 `.css`/`.vue` 文件中的 `var(--brutal-*)` 引用，校验是否带 fallback。
 * 无 fallback 的引用将在 CI 中报错（退出码 1）。
 *
 * 用法：
 *   pnpm audit:fallback                       人类可读报告，违规则退出 1
 *   pnpm audit:fallback -- --json             机器可读 JSON 输出
 *   pnpm audit:fallback -- --quiet            仅输出违规数与退出码
 *   pnpm audit:fallback -- --update-baseline  写入当前违规快照到基线文件
 *   pnpm audit:fallback -- --check-baseline   与基线比对，新增违规则退出 1（CI 门禁）
 *
 * 基线策略：现有违规以快照形式记录在 `.fallback-baseline.json`，CI 仅拦截
 * 新增违规（计数增加或新文件出现）。修复现有违规会自动减少计数，无需更新基线。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCAN_ROOT = path.resolve(__dirname, '..', 'src');
const BASELINE_FILE = path.resolve(__dirname, '.fallback-baseline.json');

interface Violation {
    file: string;
    line: number;
    column: number;
    snippet: string;
    varName: string;
}

interface AuditResult {
    scannedFiles: number;
    totalReferences: number;
    violations: Violation[];
}

const VAR_BRUTAL_PREFIX = 'var(--brutal-';

function walkSourceFiles(root: string): string[] {
    const results: string[] = [];
    const stack: string[] = [root];
    while (stack.length > 0) {
        const current = stack.pop()!;
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(current, { withFileTypes: true });
        } catch {
            continue;
        }
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (ext === '.css' || ext === '.vue') {
                    results.push(fullPath);
                }
            }
        }
    }
    return results.sort();
}

/**
 * 从 `var(` 起始位置解析完整的 var() 调用，返回结束索引、是否有 fallback、内部文本。
 * 正确处理嵌套括号（如 `var(--a, var(--b, #000))`）。
 */
function parseVarCall(
    text: string,
    startIdx: number,
): { endIdx: number; hasFallback: boolean; inner: string } | null {
    const openParen = text.indexOf('(', startIdx);
    if (openParen === -1) return null;
    let depth = 1;
    let i = openParen + 1;
    let hasFallback = false;
    while (i < text.length && depth > 0) {
        const ch = text[i];
        if (ch === '(') {
            depth++;
        } else if (ch === ')') {
            depth--;
            if (depth === 0) break;
        } else if (ch === ',' && depth === 1) {
            hasFallback = true;
        }
        i++;
    }
    if (depth !== 0) return null;
    const inner = text.slice(openParen + 1, i);
    return { endIdx: i + 1, hasFallback, inner };
}

function computeLineColumn(text: string, idx: number): { line: number; column: number } {
    let line = 1;
    let column = 1;
    for (let i = 0; i < idx && i < text.length; i++) {
        if (text[i] === '\n') {
            line++;
            column = 1;
        } else {
            column++;
        }
    }
    return { line, column };
}

function extractSnippet(text: string, startIdx: number, endIdx: number): string {
    const lineStart = text.lastIndexOf('\n', startIdx) + 1;
    const lineEnd = text.indexOf('\n', endIdx);
    const stop = lineEnd === -1 ? text.length : lineEnd;
    return text.slice(lineStart, stop).trim();
}

function auditFile(filePath: string): { violations: Violation[]; referenceCount: number } {
    const content = fs.readFileSync(filePath, 'utf-8');
    const violations: Violation[] = [];
    let referenceCount = 0;
    let searchFrom = 0;
    while (searchFrom < content.length) {
        const idx = content.indexOf(VAR_BRUTAL_PREFIX, searchFrom);
        if (idx === -1) break;
        const parsed = parseVarCall(content, idx);
        if (!parsed) {
            searchFrom = idx + VAR_BRUTAL_PREFIX.length;
            continue;
        }
        referenceCount++;
        if (!parsed.hasFallback) {
            const varNameMatch = parsed.inner.match(/^--brutal-[a-z-]+/);
            const varName = varNameMatch ? varNameMatch[0] : '--brutal-?';
            const { line, column } = computeLineColumn(content, idx);
            violations.push({
                file: path.relative(SCAN_ROOT, filePath),
                line,
                column,
                snippet: extractSnippet(content, idx, parsed.endIdx),
                varName,
            });
        }
        searchFrom = parsed.endIdx;
    }
    return { violations, referenceCount };
}

function audit(): AuditResult {
    const files = walkSourceFiles(SCAN_ROOT);
    let totalReferences = 0;
    const allViolations: Violation[] = [];
    for (const file of files) {
        const { violations, referenceCount } = auditFile(file);
        totalReferences += referenceCount;
        allViolations.push(...violations);
    }
    return {
        scannedFiles: files.length,
        totalReferences,
        violations: allViolations,
    };
}

function formatReport(result: AuditResult): string {
    const lines: string[] = [];
    lines.push('=== BrutxUI fallback 覆盖率审计 ===');
    lines.push(`扫描文件：${result.scannedFiles}`);
    lines.push(`var(--brutal-*) 引用总数：${result.totalReferences}`);
    lines.push(`无 fallback 违规数：${result.violations.length}`);
    lines.push('');
    if (result.violations.length === 0) {
        lines.push('✓ 全部引用均带 fallback，审计通过。');
        return lines.join('\n');
    }
    const byFile = new Map<string, Violation[]>();
    for (const v of result.violations) {
        if (!byFile.has(v.file)) byFile.set(v.file, []);
        byFile.get(v.file)!.push(v);
    }
    for (const [file, fileViolations] of byFile) {
        lines.push(`■ ${file}（${fileViolations.length} 处）`);
        for (const v of fileViolations) {
            lines.push(`  L${v.line}:${v.column}  ${v.varName}`);
            lines.push(`    ${v.snippet}`);
        }
        lines.push('');
    }
    lines.push('修复指南：将 var(--brutal-foo) 改为 var(--brutal-foo, <fallback>)，');
    lines.push('fallback 值参考 packages/shared/src/design-tokens.ts 的 BASE_THEME。');
    return lines.join('\n');
}

type BaselineSnapshot = Record<string, number>;

function computeBaseline(violations: Violation[]): BaselineSnapshot {
    const counts: Record<string, number> = {};
    for (const v of violations) {
        counts[v.file] = (counts[v.file] ?? 0) + 1;
    }
    return counts;
}

function loadBaseline(): BaselineSnapshot {
    if (!fs.existsSync(BASELINE_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function saveBaseline(snapshot: BaselineSnapshot): void {
    const sortedKeys = Object.keys(snapshot).sort();
    const sorted: Record<string, number> = {};
    for (const key of sortedKeys) sorted[key] = snapshot[key];
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

interface BaselineCheckResult {
    passed: boolean;
    newFiles: string[];
    increasedFiles: Array<{ file: string; baseline: number; current: number }>;
    totalBaseline: number;
    totalCurrent: number;
}

function checkAgainstBaseline(current: BaselineSnapshot, baseline: BaselineSnapshot): BaselineCheckResult {
    const newFiles: string[] = [];
    const increasedFiles: Array<{ file: string; baseline: number; current: number }> = [];
    let totalBaseline = 0;
    let totalCurrent = 0;
    for (const [file, count] of Object.entries(current)) {
        totalCurrent += count;
        const base = baseline[file] ?? 0;
        if (base === 0 && count > 0) {
            newFiles.push(file);
        } else if (count > base) {
            increasedFiles.push({ file, baseline: base, current: count });
        }
    }
    for (const count of Object.values(baseline)) totalBaseline += count;
    return {
        passed: newFiles.length === 0 && increasedFiles.length === 0,
        newFiles,
        increasedFiles,
        totalBaseline,
        totalCurrent,
    };
}

function formatBaselineReport(result: AuditResult, check: BaselineCheckResult): string {
    const lines: string[] = [];
    lines.push('=== BrutxUI fallback 基线比对（CI 门禁）===');
    lines.push(`基线违规总数：${check.totalBaseline}`);
    lines.push(`当前违规总数：${check.totalCurrent}`);
    lines.push('');
    if (check.passed) {
        lines.push('✓ 未发现新增违规，门禁通过。');
        if (check.totalCurrent < check.totalBaseline) {
            lines.push(`  已修复 ${check.totalBaseline - check.totalCurrent} 处违规，可运行 pnpm audit:fallback -- --update-baseline 更新基线。`);
        }
        return lines.join('\n');
    }
    if (check.newFiles.length > 0) {
        lines.push(`✗ 新出现违规的文件（${check.newFiles.length} 个）：`);
        for (const f of check.newFiles) {
            lines.push(`  + ${f}`);
        }
        lines.push('');
    }
    if (check.increasedFiles.length > 0) {
        lines.push(`✗ 违规数增加的文件（${check.increasedFiles.length} 个）：`);
        for (const item of check.increasedFiles) {
            lines.push(`  ↑ ${item.file}  ${item.baseline} → ${item.current}`);
        }
        lines.push('');
    }
    lines.push('修复指南：将 var(--brutal-foo) 改为 var(--brutal-foo, <fallback>)，');
    lines.push('fallback 值参考 packages/shared/src/design-tokens.ts 的 BASE_THEME。');
    return lines.join('\n');
}

function main(): void {
    const args = process.argv.slice(2);
    const jsonMode = args.includes('--json');
    const quietMode = args.includes('--quiet');
    const updateBaseline = args.includes('--update-baseline');
    const checkBaseline = args.includes('--check-baseline');
    const result = audit();

    if (updateBaseline) {
        const snapshot = computeBaseline(result.violations);
        saveBaseline(snapshot);
        console.log(`基线已写入 ${path.relative(process.cwd(), BASELINE_FILE)}`);
        console.log(`  违规文件数：${Object.keys(snapshot).length}`);
        console.log(`  违规总数：${result.violations.length}`);
        process.exit(0);
    }

    if (checkBaseline) {
        const baseline = loadBaseline();
        const current = computeBaseline(result.violations);
        const check = checkAgainstBaseline(current, baseline);
        if (jsonMode) {
            console.log(JSON.stringify({ ...check, result }, null, 2));
        } else if (!quietMode) {
            console.log(formatBaselineReport(result, check));
        } else if (!check.passed) {
            console.log(`新增违规：${check.newFiles.length} 个新文件，${check.increasedFiles.length} 个文件增加（基线 ${check.totalBaseline} → 当前 ${check.totalCurrent}）`);
        }
        process.exit(check.passed ? 0 : 1);
    }

    if (jsonMode) {
        console.log(JSON.stringify(result, null, 2));
    } else if (!quietMode) {
        console.log(formatReport(result));
    } else if (result.violations.length > 0) {
        console.log(`违规数：${result.violations.length}（扫描 ${result.scannedFiles} 文件，${result.totalReferences} 处引用）`);
    }
    process.exit(result.violations.length === 0 ? 0 : 1);
}

main();
