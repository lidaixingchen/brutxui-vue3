/**
 * 视觉规范门禁：非标 ring 工具类白名单拦截 + shadow-[rgba] 硬编码防回潮。
 *
 * 依据视觉规则 R2/R7（docs/guides/VISUAL_SYSTEM.md）：
 * - 焦点体系采用 ring（FOCUS_RING_CLASSES 五件套及标准变体）。为防止 ring-[...] 任意值、
 *   非标宽度（如 ring-4）、ring-offset-white 白圈等滥用回潮，对 ring-* 实施白名单校验：
 *   仅允许白名单内的标准类（FOCUS_RING_CLASSES 配套及少量合法变体）。
 * - 手写 `shadow-[Npx_..._rgba(...)]` 任意值字面量被禁止；应使用 shadow-brutal 系工具类
 *   （含 shadow-brutal-destructive 危险态半透明红阴影）。
 *
 * 扫描范围（SCAN_ROOTS）：
 * - `packages/ui/src`：组件库源码，规则 R7 的唯一权威落地面。
 * - `apps/docs`：文档站源码（.vitepress/theme 下 .vue/.ts/.css 等），docs-only 主题调试工具
 *   （ThemePlayground.vue 等）同属视觉规则约束面，不因「docs 独立 Tailwind 作用域」豁免；
 *   排除 node_modules/dist/cache 与 .vitepress 构建产物（dist/cache），只扫源码字面量。
 *
 * 用法：
 *   pnpm check:deprecated                      人类可读报告，违规则退出 1
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SCAN_ROOTS = [path.resolve(REPO_ROOT, 'packages', 'ui', 'src'), path.resolve(REPO_ROOT, 'apps', 'docs')];
// 排除目录：依赖与测试快照按 basename 全局跳过（任何源码树位置都不该扫）；
// dist/cache 是构建产物目录，仅排除 `.vitepress` 直接子目录（docs 构建产物），
// 避免未来源码树出现同名源码目录被静默漏扫（防回潮门禁的可信度要求）。
function isSkippedDir(currentDir: string, name: string): boolean {
    if (name === 'node_modules' || name === '__snapshots__') return true;
    if (name === 'dist' || name === 'cache') return path.basename(currentDir) === '.vitepress';
    return false;
}
interface Violation {
    file: string;
    line: number;
    snippet: string;
    category: 'RING' | 'SHADOW_RGBA';
}

// ring 任意值可能含 `(`/`.`/`_`/`#`/`%`/`:`/`/` 等字符（如 ring-[var(--x)]、ring-[3px_3px]、ring-black/50），
// 字符类须覆盖，否则违规可被绕过或部分匹配导致计数失真
const RING_RE = /(?<![\w-])ring(?:-|\[)[a-z0-9[\]().#_%:/-]+/g;

// 合法 ring 工具类白名单：FOCUS_RING_CLASSES 五件套及标准变体
const RING_ALLOWLIST = new Set([
    // 标准宽度及变体
    'ring-1',
    'ring-2',
    'ring-3',
    // 颜色类
    'ring-brutal-ring',
    'ring-brutal-destructive',
    'ring-brutal-success',
    // 偏移与间隙色
    'ring-offset-1',
    'ring-offset-2',
    'ring-offset-brutal-bg',
    // 位置变体：内环绘制（表格选中行黑环、ScrollArea 激活内环等非焦点视觉）
    'ring-inset',
]);

// 锚定到 rgba( 函数调用（而非任意位置出现 rgba 子串，避免误判 var(--shadow-rgba) 等变量名）；
// 加 i 处理 RGBA()/Rgba() 大小写变体（CSS 颜色函数名大小写不敏感）
const SHADOW_RGBA_RE = /\bshadow-\[[^\]"']*rgba\(/gi;

function walkSourceFiles(root: string, includeTests: boolean): string[] {
    const results: string[] = [];
    const stack: string[] = [root];
    while (stack.length > 0) {
        const current = stack.pop()!;
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                if (!isSkippedDir(current, entry.name)) stack.push(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (ext !== '.ts' && ext !== '.vue' && ext !== '.css') continue;
                if (!includeTests && /\.test\./.test(entry.name)) continue;
                results.push(fullPath);
            }
        }
    }
    return results.sort();
}

function computeLineColumn(text: string, idx: number): number {
    let line = 1;
    for (let i = 0; i < idx && i < text.length; i++) {
        if (text[i] === '\n') line++;
    }
    return line;
}

function extractSnippet(text: string, startIdx: number, endIdx: number): string {
    const lineStart = text.lastIndexOf('\n', startIdx) + 1;
    const lineEnd = text.indexOf('\n', endIdx);
    const stop = lineEnd === -1 ? text.length : lineEnd;
    return text.slice(lineStart, stop).trim();
}

export function auditDeprecatedUtilities(roots: string[] = SCAN_ROOTS): Violation[] {
    const all: Violation[] = [];
    const addMatches = (filePath: string, content: string, re: RegExp, category: Violation['category']): void => {
        let m: RegExpExecArray | null;
        re.lastIndex = 0;
        while ((m = re.exec(content)) !== null) {
            if (category === 'RING' && RING_ALLOWLIST.has(m[0])) {
                continue;
            }
            all.push({
                file: path.relative(REPO_ROOT, filePath).replace(/\\/g, '/'),
                line: computeLineColumn(content, m.index),
                snippet: extractSnippet(content, m.index, m.index + m[0].length),
                category,
            });
        }
    };
    // RING 只检查产品源码，SHADOW_RGBA 同时检查测试源码。
    for (const root of roots) {
        for (const f of walkSourceFiles(root, true)) {
            const content = fs.readFileSync(f, 'utf-8');
            if (!/\.test\./.test(path.basename(f))) addMatches(f, content, RING_RE, 'RING');
            addMatches(f, content, SHADOW_RGBA_RE, 'SHADOW_RGBA');
        }
    }
    return all;
}

function main(): void {
    const violations = auditDeprecatedUtilities();
    console.log('=== 已废弃工具类扫描 ===');
    if (violations.length === 0) {
        console.log('✓ 无 RING/SHADOW_RGBA 违规');
        return;
    }
    for (const v of violations) {
        console.log(`  ${v.category}|${v.file}:${v.line} → ${v.snippet}`);
    }
    console.log(`\n结论：${violations.length} 处违规，exit 1`);
    process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) main();
