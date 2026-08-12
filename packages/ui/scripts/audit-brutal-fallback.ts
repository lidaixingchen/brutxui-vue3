/**
 * BrutxUI 设计令牌 fallback 覆盖率审计脚本
 *
 * 扫描所有 `.css`/`.vue` 文件中的 `var(--brutal-*)` 引用，校验两类问题：
 *   1. 无 fallback（missing-fallback）
 *   2. fallback 值不等于 BASE_THEME.light 对应值（fallback-mismatch；比对前先归一化，
 *      如 `#fff` ≡ `#ffffff`；组件本地令牌如 --brutal-code-* 不在 BASE_THEME 中，跳过）
 * 任一违规将在 CI 中报错（退出码 1）。
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
import { CSS_VARS } from 'brutx-shared-vue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCAN_ROOT = path.resolve(__dirname, '..', 'src');
const BASELINE_FILE = path.resolve(__dirname, '.fallback-baseline.json');

type ViolationType = 'missing-fallback' | 'fallback-mismatch';

interface Violation {
    file: string;
    line: number;
    column: number;
    snippet: string;
    varName: string;
    type: ViolationType;
    /** fallback-mismatch 时：`实际值 → 期望值` 说明 */
    detail?: string;
}

interface AuditResult {
    scannedFiles: number;
    totalReferences: number;
    violations: Violation[];
    /** 白名单中未被任何引用豁免的冗余条目（配置过时：值已与主题一致或引用消失） */
    redundantWhitelist: string[];
}

const VAR_BRUTAL_PREFIX = 'var(--brutal-';

/** BASE_THEME.light 的 var 名 → 值映射（key 不含 `--` 前缀），用于 fallback 值比对。 */
const LIGHT_VARS: Readonly<Record<string, string>> = CSS_VARS.light;

/**
 * 归一化 CSS 值用于比对：转小写 + 展开 3/4 位 hex 简写（#fff ≡ #ffffff、#ffff ≡ #ffffffff）
 * + 去除 rgba() 等函数内空格（rgba(0,0,0,0.5) ≡ rgba(0, 0, 0, 0.5)），等价写法不应误报。
 */
function normalizeCssValue(value: string): string {
    const lower = value.trim().toLowerCase();
    const noInnerSpace = lower.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/,\s*/g, ',');
    return noInnerSpace
        .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3')
        .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3$4$4');
}

/**
 * 有意偏离 BASE_THEME.light 的 fallback 白名单（键：`相对文件:--brutal-*变量名`，不随行号漂移）。
 * Image.vue：
 *   - 加载占位/错误条纹用更浅的骨架色（muted #e5e5e5），非主题令牌值；
 *   - 预览工具栏按钮（border-2、shadow-brutal-sm）按下位移用 1px 而非主题 pressedOffset 的 2px。
 * 属组件级设计决定；新增此类偏离须在此登记理由。
 * 注意：--brutal-bg 的 `#fff` 经归一化展开等于主题 `#ffffff`，不构成偏离，无需登记；
 * 审计结束后会检测并报告从未被豁免命中的冗余条目（防配置漂移）。
 */
const INTENTIONAL_FALLBACK_OVERRIDES = new Set([
    'components/image/Image.vue:--brutal-muted',
    'components/image/Image.vue:--brutal-pressed-offset',
]);

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
): { endIdx: number; hasFallback: boolean; inner: string; fallback: string | null } | null {
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
    const commaIdx = inner.indexOf(',');
    const fallback = hasFallback && commaIdx !== -1 ? inner.slice(commaIdx + 1).trim() : null;
    return { endIdx: i + 1, hasFallback, inner, fallback };
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

function auditFile(filePath: string, usedWhitelist: Set<string>): { violations: Violation[]; referenceCount: number } {
    const content = fs.readFileSync(filePath, 'utf-8');
    const violations: Violation[] = [];
    const relativeFile = path.relative(SCAN_ROOT, filePath).replace(/\\/g, '/');
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
        const varNameMatch = parsed.inner.match(/^--brutal-[a-z0-9-]+/);
        const varName = varNameMatch ? varNameMatch[0] : '--brutal-?';
        const { line, column } = computeLineColumn(content, idx);
        const base: Omit<Violation, 'type'> = {
            file: relativeFile,
            line,
            column,
            snippet: extractSnippet(content, idx, parsed.endIdx),
            varName,
        };
        if (!parsed.hasFallback) {
            violations.push({ ...base, type: 'missing-fallback' });
        } else if (!INTENTIONAL_FALLBACK_OVERRIDES.has(`${relativeFile}:${varName}`)) {
            // 注：hasFallback 为真时 fallback 恒非 null（至多为空串），无需冗余判断
            const expected = LIGHT_VARS[varName.slice(2)];
            if (
                expected !== undefined &&
                normalizeCssValue(parsed.fallback) !== normalizeCssValue(expected)
            ) {
                violations.push({
                    ...base,
                    type: 'fallback-mismatch',
                    detail: `${parsed.fallback} → 期望 ${expected}`,
                });
            }
        } else {
            // 命中白名单豁免：记录，供审计结束后检测冗余白名单配置
            usedWhitelist.add(`${relativeFile}:${varName}`);
        }
        searchFrom = parsed.endIdx;
    }
    return { violations, referenceCount };
}

function audit(): AuditResult {
    const files = walkSourceFiles(SCAN_ROOT);
    let totalReferences = 0;
    const allViolations: Violation[] = [];
    const usedWhitelist = new Set<string>();
    for (const file of files) {
        const { violations, referenceCount } = auditFile(file, usedWhitelist);
        totalReferences += referenceCount;
        allViolations.push(...violations);
    }
    // 冗余白名单：未被任何引用豁免的条目说明已过时（值已与主题一致或引用消失），防配置漂移
    const redundantWhitelist = [...INTENTIONAL_FALLBACK_OVERRIDES].filter((key) => !usedWhitelist.has(key));
    return {
        scannedFiles: files.length,
        totalReferences,
        violations: allViolations,
        redundantWhitelist,
    };
}

function formatReport(result: AuditResult): string {
    const lines: string[] = [];
    const missingCount = result.violations.filter(v => v.type === 'missing-fallback').length;
    const mismatchCount = result.violations.filter(v => v.type === 'fallback-mismatch').length;
    lines.push('=== BrutxUI fallback 覆盖率审计 ===');
    lines.push(`扫描文件：${result.scannedFiles}`);
    lines.push(`var(--brutal-*) 引用总数：${result.totalReferences}`);
    lines.push(`无 fallback 违规数：${missingCount}`);
    lines.push(`fallback 值与 BASE_THEME.light 不一致数：${mismatchCount}`);
    lines.push('');
    if (result.violations.length === 0) {
        lines.push('✓ 全部引用均带 fallback 且值与 BASE_THEME.light 一致，审计通过。');
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
            const tag = v.type === 'fallback-mismatch' ? '[值不符]' : '[无 fallback]';
            lines.push(`  L${v.line}:${v.column}  ${tag} ${v.varName}${v.detail ? `（${v.detail}）` : ''}`);
            lines.push(`    ${v.snippet}`);
        }
        lines.push('');
    }
    lines.push('修复指南：无 fallback 的引用改为 var(--brutal-foo, <fallback>)；');
    lines.push('fallback 值须与 packages/shared/src/design-tokens.ts 的 BASE_THEME.light 一致，');
    lines.push('有意偏离请登记到脚本内 INTENTIONAL_FALLBACK_OVERRIDES 白名单（含理由）。');
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
    lines.push('修复指南：无 fallback 的引用改为 var(--brutal-foo, <fallback>)；');
    lines.push('fallback 值须与 packages/shared/src/design-tokens.ts 的 BASE_THEME.light 一致，');
    lines.push('有意偏离请登记到脚本内 INTENTIONAL_FALLBACK_OVERRIDES 白名单（含理由）。');
    return lines.join('\n');
}

function main(): void {
    const args = process.argv.slice(2);
    const jsonMode = args.includes('--json');
    const quietMode = args.includes('--quiet');
    const updateBaseline = args.includes('--update-baseline');
    const checkBaseline = args.includes('--check-baseline');
    const result = audit();

    // 冗余白名单属配置错误（条目已不再豁免任何引用），始终拦截（含 --check-baseline / --update-baseline 模式）
    if (result.redundantWhitelist.length > 0) {
        console.error('白名单存在冗余条目（未被任何引用豁免，值已与主题一致或引用消失）：');
        for (const key of result.redundantWhitelist) {
            console.error(`  - ${key}`);
        }
        console.error('请从 INTENTIONAL_FALLBACK_OVERRIDES 中移除过时条目。');
        process.exit(1);
    }

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
