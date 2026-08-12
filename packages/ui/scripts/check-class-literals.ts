/**
 * @source 完整字面量门禁：校验动态拼接产出的类名必须命中源码字面量集。
 *
 * 背景：styles.css 的 @source 指令声明扫描 src 下所有 .vue/.ts 源码，Tailwind 按源码字面量
 * 逐个匹配，无法从 `${expr}` 动态拼接推断类名（见 docs/guides/tailwind-v4-mechanisms.md §4）。
 *
 * 语义：
 * - 类名上下文 = .ts 中含 `cva(` 的文件内的模板字面量 + .vue 的 class 属性值内的模板字面量；
 * - 对每个含 `${}` 的模板字面量，把 `${expr}` 静态代入（expr 支持裸标识符与 `obj.key` 属性访问，
 *   常量来自全仓【非测试】源码的模块级字符串常量/对象，递归深度 ≤5）；
 * - 代入后按空白拆出的每个完整类名，必须命中【非测试】源码的令牌字面量集（排除测试文件与快照目录）；
 * - 豁免 `^language-`（prism 语言类，动态语言名）；
 * - 代入失败（动态值/复杂表达式）直接记违规——运行时值插进类名，产物 CSS 必然缺失该类。
 *
 * 说明：「从封闭常量表选取完整字面量再与静态片段组合」（如 shared-input-variants 的
 * validationBorderColors[variant]）是合法例外，本脚本经 obj.key 静态代入放行。
 *
 * 用法：
 *   tsx scripts/check-class-literals.ts     # 命中即 exit 1
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCAN_ROOT = path.resolve(__dirname, '..', 'src');

interface Violation {
    file: string;
    line: number;
    snippet: string;
    token: string;
}

interface ConstDecl {
    kind: 'string' | 'template' | 'object' | 'ref' | 'other';
    stringValue?: string;
    templateRaw?: string;
    refName?: string;
    objectEntries?: Map<string, string>;
}

interface GlobalBindings {
    decls: Map<string, ConstDecl>;
}

// ---------------------------------------------------------------------------
// 源码收集（复用 audit-brutal-fallback.ts 的 walkSourceFiles 骨架）
// ---------------------------------------------------------------------------
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
                if (entry.name !== '__snapshots__') stack.push(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if ((ext === '.ts' || ext === '.vue') && !/\.test\./.test(entry.name)) {
                    results.push(fullPath);
                }
            }
        }
    }
    return results.sort();
}

// ---------------------------------------------------------------------------
// 字符串感知的注释剥离（替换为空格，保持行/列号）
// ---------------------------------------------------------------------------
function stripComments(content: string): string {
    const chars = content.split('');
    let i = 0;
    while (i < chars.length) {
        const c = chars[i];
        const n = chars[i + 1];
        // 单引号/双引号字符串
        if (c === "'" || c === '"') {
            i++;
            while (i < chars.length) {
                if (chars[i] === '\\') { i += 2; continue; }
                if (chars[i] === c) break;
                i++;
            }
            i++;
            continue;
        }
        // 模板字面量（含 ${} 表达式嵌套）
        if (c === '`') {
            i++;
            let braceDepth = 0;
            while (i < chars.length) {
                const tc = chars[i];
                if (tc === '\\') { i += 2; continue; }
                if (tc === '`' && braceDepth === 0) break;
                if (tc === '$' && chars[i + 1] === '{') { braceDepth++; i += 2; continue; }
                if (tc === '}' && braceDepth > 0) { braceDepth--; i++; continue; }
                i++;
            }
            i++;
            continue;
        }
        // 行注释
        if (c === '/' && n === '/') {
            while (i < chars.length && chars[i] !== '\n') { chars[i] = ' '; i++; }
            continue;
        }
        // 块注释
        if (c === '/' && n === '*') {
            chars[i] = ' ';
            chars[i + 1] = ' ';
            i += 2;
            while (i < chars.length) {
                if (chars[i] === '*' && chars[i + 1] === '/') {
                    chars[i] = ' ';
                    chars[i + 1] = ' ';
                    i += 2;
                    break;
                }
                if (chars[i] !== '\n') chars[i] = ' ';
                i++;
            }
            continue;
        }
        i++;
    }
    return chars.join('');
}

// ---------------------------------------------------------------------------
// 字符串字面量提取
// ---------------------------------------------------------------------------
const SINGLE_RE = /'((?:[^'\\]|\\.)*)'/g;
const DOUBLE_RE = /"((?:[^"\\]|\\.)*)"/g;

function unescapePlain(s: string): string {
    return s.replace(/\\(['"\\nrt])/g, (_m, c: string) => (c === 'n' ? '\n' : c === 't' ? '\t' : c === 'r' ? '\r' : c));
}

function extractPlainStrings(content: string): string[] {
    const out: string[] = [];
    const push = (re: RegExp): void => {
        let m: RegExpExecArray | null;
        re.lastIndex = 0;
        while ((m = re.exec(content)) !== null) out.push(unescapePlain(m[1]));
    };
    push(SINGLE_RE);
    push(DOUBLE_RE);
    return out;
}

interface TemplateLiteral {
    start: number;
    raw: string;
    hasInterpolation: boolean;
}

/** 提取模板字面量（含起始位置，用于 class 属性区间判断）。 */
function extractTemplateLiterals(content: string): TemplateLiteral[] {
    const out: TemplateLiteral[] = [];
    let i = 0;
    while (i < content.length) {
        const start = content.indexOf('`', i);
        if (start === -1) break;
        let j = start + 1;
        let end = -1;
        let braceDepth = 0;
        while (j < content.length) {
            const c = content[j];
            if (c === '\\') { j += 2; continue; }
            if (c === '`' && braceDepth === 0) { end = j; break; }
            if (c === '$' && content[j + 1] === '{') { braceDepth++; j += 2; continue; }
            if (c === '}' && braceDepth > 0) { braceDepth--; j++; continue; }
            j++;
        }
        if (end === -1) break;
        const raw = content.slice(start + 1, end);
        out.push({ start, raw, hasInterpolation: raw.includes('${') });
        i = end + 1;
    }
    return out;
}

// ---------------------------------------------------------------------------
// 全局常量收集（跨文件）：按逻辑行合并多行声明，解析字符串/对象常量
// ---------------------------------------------------------------------------
// 前导 \s* 容忍注释剥离后的空白行并入语句；RHS 用 [\s\S]* 允许跨行（如多行字符串常量）
const CONST_DECL_RE = /^\s*(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?::[^=]*)?=\s*([\s\S]*)$/;

/** 行尾运算符 → 语句未结束，需继续合并。 */
const CONTINUATION_END = /[=([{,]$/;

/** 按逻辑语句合并行（跟踪 {} [] () 深度 + 行尾运算符），用于跨行对象/多行字符串常量。 */
function mergeLogicalLines(lines: string[]): string[] {
    const merged: string[] = [];
    let current = '';
    let depth = 0;
    for (const line of lines) {
        const prevCurrent = current;
        current += (prevCurrent ? '\n' : '') + line;
        for (const ch of line) {
            if (ch === '{' || ch === '[' || ch === '(') depth++;
            else if (ch === '}' || ch === ']' || ch === ')') depth--;
        }
        const trimmed = line.trim();
        if (depth <= 0 && trimmed !== '' && !CONTINUATION_END.test(trimmed) && !current.trim().endsWith('=')) {
            merged.push(current);
            current = '';
        }
    }
    if (current.trim() !== '') merged.push(current);
    return merged;
}

function parseObjectLiteral(body: string): Map<string, string> | null {
    const entries = new Map<string, string>();
    // 仅接受纯字符串值：key: 'v1', key2: "v2"。值用非贪婪 + 回引用闭合引号，避免吞掉后续内容。
    const pairRe = /([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*(['"])((?:[^\\]|\\.)*?)\2/g;
    let m: RegExpExecArray | null;
    let lastIdx = 0;
    let seenNonStringValue = false;
    while ((m = pairRe.exec(body)) !== null) {
        const between = body.slice(lastIdx, m.index);
        if (/\w+\s*:/.test(between)) seenNonStringValue = true; // 有非字符串值片段
        entries.set(m[1], unescapePlain(m[3]));
        lastIdx = m.index + m[0].length;
    }
    const tail = body.slice(lastIdx);
    if (/\w+\s*:/.test(tail)) seenNonStringValue = true;
    return seenNonStringValue || entries.size === 0 ? null : entries;
}

function buildGlobalBindings(files: string[]): GlobalBindings {
    const decls = new Map<string, ConstDecl>();
    const setIfAbsent = (name: string, decl: ConstDecl): void => {
        if (!decls.has(name)) decls.set(name, decl);
    };
    for (const f of files) {
        const content = stripComments(fs.readFileSync(f, 'utf-8'));
        const statements = mergeLogicalLines(content.split('\n'));
        for (const stmt of statements) {
            const m = CONST_DECL_RE.exec(stmt);
            if (!m) continue;
            const name = m[1];
            // 剥离尾部 as const / satisfies <type>，还原纯对象/字符串初始值
            const rhs = m[2]
                .replace(/;\s*$/, '')
                .replace(/\s+as\s+const$/, '')
                .replace(/\s+satisfies\s+.*$/, '')
                .trim();
            if (rhs.startsWith('{') && rhs.endsWith('}')) {
                const obj = parseObjectLiteral(rhs.slice(1, -1));
                if (obj) setIfAbsent(name, { kind: 'object', objectEntries: obj });
            } else if (rhs.startsWith("'") && rhs.endsWith("'") && !rhs.includes('\n')) {
                setIfAbsent(name, { kind: 'string', stringValue: unescapePlain(rhs.slice(1, -1)) });
            } else if (rhs.startsWith('"') && rhs.endsWith('"') && !rhs.includes('\n')) {
                setIfAbsent(name, { kind: 'string', stringValue: unescapePlain(rhs.slice(1, -1)) });
            } else if (rhs.startsWith('`') && rhs.endsWith('`') && !rhs.includes('${') && !rhs.includes('\n')) {
                setIfAbsent(name, { kind: 'string', stringValue: rhs.slice(1, -1) });
            } else if (rhs.startsWith('`') && rhs.endsWith('`')) {
                setIfAbsent(name, { kind: 'template', templateRaw: rhs.slice(1, -1) });
            } else if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(rhs)) {
                setIfAbsent(name, { kind: 'ref', refName: rhs });
            }
        }
    }
    return { decls };
}

// ---------------------------------------------------------------------------
// 插值解析（递归，深度 ≤5）
// ---------------------------------------------------------------------------
function resolveExpr(e: string, bindings: GlobalBindings, depth: number): string | null {
    if (depth > 5) return null;
    const expr = e.trim();
    // obj.key 属性访问
    const propMatch = /^([A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(expr);
    if (propMatch) {
        const decl = bindings.decls.get(propMatch[1]);
        if (decl && decl.kind === 'object') {
            const v = decl.objectEntries!.get(propMatch[2]);
            if (v !== undefined) return v;
        }
        return null;
    }
    // obj['key'] / obj["key"]
    const bracketMatch = /^([A-Za-z_$][A-Za-z0-9_$]*)\[(['"])([^'"]+)\2\]$/.exec(expr);
    if (bracketMatch) {
        const decl = bindings.decls.get(bracketMatch[1]);
        if (decl && decl.kind === 'object') {
            const v = decl.objectEntries!.get(bracketMatch[3]);
            if (v !== undefined) return v;
        }
        return null;
    }
    // 裸标识符 → 查声明并递归
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(expr)) {
        const decl = bindings.decls.get(expr);
        if (!decl) return null;
        if (decl.kind === 'string') return decl.stringValue!;
        if (decl.kind === 'ref') return resolveExpr(decl.refName!, bindings, depth + 1);
        if (decl.kind === 'template') return resolveTemplate(decl.templateRaw!, bindings, depth + 1);
        return null;
    }
    return null;
}

function resolveTemplate(raw: string, bindings: GlobalBindings, depth: number): string | null {
    if (depth > 5) return null;
    let result = '';
    let i = 0;
    while (i < raw.length) {
        const dollarIdx = raw.indexOf('${', i);
        if (dollarIdx === -1) {
            result += raw.slice(i);
            break;
        }
        result += raw.slice(i, dollarIdx);
        let braceEnd = dollarIdx + 2;
        // nesting 从 1 起：已进入 `${` 的一层花括号，首个 `}` 即闭合
        let nesting = 1;
        let found = false;
        while (braceEnd < raw.length) {
            if (raw[braceEnd] === '{') nesting++;
            else if (raw[braceEnd] === '}') {
                nesting--;
                if (nesting === 0) { found = true; break; }
            }
            braceEnd++;
        }
        if (!found) return null;
        const expr = raw.slice(dollarIdx + 2, braceEnd);
        const resolved = resolveExpr(expr, bindings, depth + 1);
        if (resolved === null) return null;
        result += resolved;
        i = braceEnd + 1;
    }
    return result;
}

// ---------------------------------------------------------------------------
// .vue class 属性值区间
// ---------------------------------------------------------------------------
const CLASS_ATTR_RE = /:?class\s*=\s*"([^"]*)"/g;

function isInClassAttribute(content: string, startIdx: number): boolean {
    let m: RegExpExecArray | null;
    CLASS_ATTR_RE.lastIndex = 0;
    while ((m = CLASS_ATTR_RE.exec(content)) !== null) {
        const attrStart = m.index;
        const attrEnd = attrStart + m[0].length;
        // m[1] 是引号内文本，其位置为 attrStart + 引号前长度
        const innerStart = content.indexOf('"', attrStart + (content.slice(attrStart, m.index + m[0].length).startsWith(':class=') ? 6 : 5)) + 1;
        const innerEnd = attrEnd - 1;
        if (startIdx >= innerStart && startIdx <= innerEnd) return true;
    }
    return false;
}

// ---------------------------------------------------------------------------
// 检查
// ---------------------------------------------------------------------------
function checkFile(filePath: string, literalTokens: Set<string>, bindings: GlobalBindings): Violation[] {
    const content = stripComments(fs.readFileSync(filePath, 'utf-8'));
    const rel = path.relative(SCAN_ROOT, filePath).replace(/\\/g, '/');
    const isTs = filePath.endsWith('.ts');
    const hasCva = content.includes('cva(');
    const violations: Violation[] = [];

    for (const tpl of extractTemplateLiterals(content)) {
        if (!tpl.hasInterpolation) continue;
        const inClassContext = isTs ? hasCva : isInClassAttribute(content, tpl.start);
        if (!inClassContext) continue;

        const resolved = resolveTemplate(tpl.raw, bindings, 0);
        if (resolved === null) {
            // prism 语言类豁免：`language-${动态lang}` 中 lang 为运行时值，类名以 language- 开头即放行
            if (/language-\$\{/.test(tpl.raw)) continue;
            violations.push({
                file: rel,
                line: computeLineColumn(content, tpl.start),
                snippet: `\`${tpl.raw}\``,
                token: '<无法静态解析的动态值>',
            });
            continue;
        }
        for (const token of resolved.split(/\s+/)) {
            if (!token) continue;
            if (/^language-/.test(token)) continue; // prism 语言类豁免
            if (!literalTokens.has(token)) {
                violations.push({ file: rel, line: computeLineColumn(content, tpl.start), snippet: `\`${tpl.raw}\``, token });
            }
        }
    }
    return violations;
}

function computeLineColumn(text: string, idx: number): number {
    let line = 1;
    for (let i = 0; i < idx && i < text.length; i++) {
        if (text[i] === '\n') line++;
    }
    return line;
}

function main(): void {
    const files = walkSourceFiles(SCAN_ROOT);
    const bindings = buildGlobalBindings(files);

    // 令牌字面量集：全部【非测试】源码的静态字符串 + 模板静态片段按空白拆分
    // （模板的静态片段同样可被 Tailwind @source 扫描到，须计入）
    const literalTokens = new Set<string>();
    for (const f of files) {
        const content = stripComments(fs.readFileSync(f, 'utf-8'));
        for (const s of extractPlainStrings(content)) {
            for (const tok of s.split(/\s+/)) if (tok) literalTokens.add(tok);
        }
        for (const tpl of extractTemplateLiterals(content)) {
            if (tpl.hasInterpolation) {
                // 拆出静态片段（${...} 之外的部分）
                const parts = tpl.raw.split(/\$\{[^}]*\}/g);
                for (const part of parts) {
                    for (const tok of part.split(/\s+/)) if (tok) literalTokens.add(tok);
                }
            } else {
                for (const tok of tpl.raw.split(/\s+/)) if (tok) literalTokens.add(tok);
            }
        }
    }

    const allViolations: Violation[] = [];
    for (const f of files) allViolations.push(...checkFile(f, literalTokens, bindings));

    console.log(`=== @source 完整字面量门禁（扫描 ${files.length} 个非测试源码文件）===`);
    if (allViolations.length === 0) {
        console.log('✓ 所有动态拼接产出的类名均为源码字面量');
        process.exit(0);
    }
    for (const v of allViolations) {
        console.log(`  ✗ ${v.file}:${v.line} → 非字面量类名「${v.token}」`);
        console.log(`    ${v.snippet}`);
    }
    console.log(`\n结论：${allViolations.length} 处违规，exit 1`);
    process.exit(1);
}

main();
