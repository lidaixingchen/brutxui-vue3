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
 *   pnpm audit:fallback -- --fix              自动修复可识别的 fallback 违规
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSS_VARS } from 'brutx-shared-vue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCAN_ROOT = path.resolve(__dirname, '..', 'src');

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

/** Dark-theme subtle colors use dark-theme fallback values inside styles.css. */
const INTENTIONAL_FALLBACK_OVERRIDES = new Map([
    ['styles.css:--brutal-bg', new Set(['#141414'])],
    ['styles.css:--brutal-info', new Set(['#3b82f6'])],
]);

function walkSourceFiles(root: string): string[] {
    const results: string[] = [];
    const stack: string[] = [root];
    while (stack.length > 0) {
        const current = stack.pop()!;
        const entries = fs.readdirSync(current, { withFileTypes: true });
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

function auditFile(
    filePath: string,
    scanRoot: string,
    usedWhitelist: Set<string>,
): { violations: Violation[]; referenceCount: number } {
    const content = fs.readFileSync(filePath, 'utf-8');
    const violations: Violation[] = [];
    const relativeFile = path.relative(scanRoot, filePath).replace(/\\/g, '/');
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
        } else {
            const overrideKey = `${relativeFile}:${varName}`;
            const allowedOverrides = INTENTIONAL_FALLBACK_OVERRIDES.get(overrideKey);
            const fallback = parsed.fallback ?? '';
            if (allowedOverrides?.has(normalizeCssValue(fallback))) {
                usedWhitelist.add(overrideKey);
                searchFrom = parsed.endIdx;
                continue;
            }
            const expected = LIGHT_VARS[varName.slice(2)];
            if (
                expected !== undefined &&
                normalizeCssValue(fallback) !== normalizeCssValue(expected)
            ) {
                violations.push({
                    ...base,
                    type: 'fallback-mismatch',
                    detail: `${fallback} → 期望 ${expected}`,
                });
            }
        }
        searchFrom = parsed.endIdx;
    }
    return { violations, referenceCount };
}

export function auditFallbacks(scanRoot: string = SCAN_ROOT): AuditResult {
    const files = walkSourceFiles(scanRoot);
    let totalReferences = 0;
    const allViolations: Violation[] = [];
    const usedWhitelist = new Set<string>();
    for (const file of files) {
        const { violations, referenceCount } = auditFile(file, scanRoot, usedWhitelist);
        totalReferences += referenceCount;
        allViolations.push(...violations);
    }
    // 冗余白名单：未被任何引用豁免的条目说明已过时（值已与主题一致或引用消失），防配置漂移
    const redundantWhitelist = [...INTENTIONAL_FALLBACK_OVERRIDES.keys()].filter((key) => !usedWhitelist.has(key));
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

function fixFile(filePath: string, scanRoot: string): number {
    let content = fs.readFileSync(filePath, 'utf-8');
    const relativeFile = path.relative(scanRoot, filePath).replace(/\\/g, '/');
    const replacements: Array<{ startIdx: number; endIdx: number; replacement: string }> = [];

    let searchFrom = 0;
    while (searchFrom < content.length) {
        const idx = content.indexOf(VAR_BRUTAL_PREFIX, searchFrom);
        if (idx === -1) break;
        const parsed = parseVarCall(content, idx);
        if (!parsed) {
            searchFrom = idx + VAR_BRUTAL_PREFIX.length;
            continue;
        }
        const varNameMatch = parsed.inner.match(/^--brutal-[a-z0-9-]+/);
        const varName = varNameMatch ? varNameMatch[0] : null;
        if (varName && !INTENTIONAL_FALLBACK_OVERRIDES.has(`${relativeFile}:${varName}`)) {
            const tokenKey = varName.slice(2);
            const expected = LIGHT_VARS[tokenKey];
            if (expected !== undefined) {
                if (!parsed.hasFallback) {
                    replacements.push({
                        startIdx: idx,
                        endIdx: parsed.endIdx,
                        replacement: `var(${varName}, ${expected})`,
                    });
                } else if (normalizeCssValue(parsed.fallback!) !== normalizeCssValue(expected)) {
                    replacements.push({
                        startIdx: idx,
                        endIdx: parsed.endIdx,
                        replacement: `var(${varName}, ${expected})`,
                    });
                }
            }
        }
        searchFrom = parsed.endIdx;
    }

    if (replacements.length === 0) return 0;

    // 从后往前替换，保持字符索引有效
    replacements.sort((a, b) => b.startIdx - a.startIdx);
    for (const rep of replacements) {
        content = content.slice(0, rep.startIdx) + rep.replacement + content.slice(rep.endIdx);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return replacements.length;
}

function main(): void {
    const args = process.argv.slice(2);
    const jsonMode = args.includes('--json');
    const quietMode = args.includes('--quiet');
    const fixMode = args.includes('--fix');

    if (fixMode) {
        const files = walkSourceFiles(SCAN_ROOT);
        let fixedCount = 0;
        for (const file of files) {
            fixedCount += fixFile(file, SCAN_ROOT);
        }
        console.log(`[--fix] 已自动修复 ${fixedCount} 处 fallback 违规。`);
    }

    const result = auditFallbacks();

    if (result.redundantWhitelist.length > 0) {
        console.error('白名单存在冗余条目（未被任何引用豁免，值已与主题一致或引用消失）：');
        for (const key of result.redundantWhitelist) {
            console.error(`  - ${key}`);
        }
        console.error('请从 INTENTIONAL_FALLBACK_OVERRIDES 中移除过时条目。');
        process.exit(1);
    }

    if (jsonMode) {
        console.log(JSON.stringify(result, null, 2));
    } else if (!quietMode) {
        console.log(formatReport(result));
    } else if (result.violations.length > 0) {
        console.log(`违规数：${result.violations.length}（扫描 ${result.scannedFiles} 文件，${result.totalReferences} 处引用）`);
    }
    process.exitCode = result.violations.length === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) main();
