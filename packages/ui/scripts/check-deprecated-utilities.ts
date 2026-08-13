/**
 * 已废弃工具类防回潮门禁（ring + shadow-[rgba] 硬编码）。
 *
 * 依据视觉规则 R2/R7（docs/guides/VISUAL_SYSTEM.md）：
 * - ring 系（box-shadow 实现）已废弃，与 brutal 阴影同属性争用；新增 ring- 前缀类应被拦截。
 * - 手写 `shadow-[Npx_..._rgba(...)]` 任意值字面量被禁止；应使用 shadow-brutal 系工具类
 *   （含 shadow-brutal-destructive 危险态半透明红阴影）。
 *
 * 扫描范围（SCAN_ROOTS）：
 * - `packages/ui/src`：组件库源码，规则 R7 的唯一权威落地面。
 * - `apps/docs`：文档站源码（.vitepress/theme 下 .vue/.ts/.css 等），docs-only 主题调试工具
 *   （ThemePlayground.vue 等）同属视觉规则约束面，不因「docs 独立 Tailwind 作用域」豁免；
 *   排除 node_modules/dist/cache 与 .vitepress 构建产物（dist/cache），只扫源码字面量。
 *
 * 基线策略（复用 audit-brutal-fallback.ts）：既有违规以快照形式记录在
 * .deprecated-utilities-baseline.json，CI 仅拦截新增（计数增加或新文件出现）。修复既有违规
 * 自动减少计数，无需更新基线；存量清零后可 --update-baseline 收空基线。
 *
 * 用法：
 *   pnpm check:deprecated                      人类可读报告，违规则退出 1
 *   pnpm check:deprecated:update -- --json     更新基线快照
 *   pnpm check:deprecated:check                与基线比对，新增违规则退出 1（CI 门禁）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SCAN_ROOTS = [path.resolve(REPO_ROOT, 'packages', 'ui', 'src'), path.resolve(REPO_ROOT, 'apps', 'docs')];
// 排除目录：构建产物 / 依赖 / 缓存目录按 basename 命中即跳过。
// `.vitepress` 本身不排除（config.ts / theme/* 是源码），仅其 dist/cache 子目录命中后排除。
const SKIP_DIRS = new Set(['node_modules', 'dist', 'cache', '__snapshots__']);
const BASELINE_FILE = path.resolve(__dirname, '.deprecated-utilities-baseline.json');

interface Violation {
    file: string;
    line: number;
    snippet: string;
    category: 'RING' | 'SHADOW_RGBA';
}

// ring 任意值可能含 `(`/`.`/`_`/`#`/`%`/`:` 等字符（如 ring-[var(--x)]、ring-[3px_3px]），
// 字符类须覆盖，否则违规可被绕过或部分匹配导致计数失真
const RING_RE = /(?<![\w-])ring(?:-|\[)[a-z0-9[\]().#_%:-]+/g;
// 锚定到 rgba( 函数调用（而非任意位置出现 rgba 子串，避免误判 var(--shadow-rgba) 等变量名）；
// 加 i 处理 RGBA()/Rgba() 大小写变体（CSS 颜色函数名大小写不敏感）
const SHADOW_RGBA_RE = /\bshadow-\[[^\]"']*rgba\(/gi;

function walkSourceFiles(root: string, includeTests: boolean): string[] {
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
                if (!SKIP_DIRS.has(entry.name)) stack.push(fullPath);
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

function audit(): Violation[] {
    const all: Violation[] = [];
    const addMatches = (filePath: string, content: string, re: RegExp, category: Violation['category']): void => {
        let m: RegExpExecArray | null;
        re.lastIndex = 0;
        while ((m = re.exec(content)) !== null) {
            all.push({
                file: path.relative(REPO_ROOT, filePath).replace(/\\/g, '/'),
                line: computeLineColumn(content, m.index),
                snippet: extractSnippet(content, m.index, m.index + m[0].length),
                category,
            });
        }
    };
    // 多根遍历（packages/ui/src + apps/docs）：RING 只扫非测试文件，SHADOW_RGBA 含测试
    // （counter.test.ts 等存量一并基线化）；读文件失败兜底跳过并告警，避免异常文件导致脚本崩溃
    for (const root of SCAN_ROOTS) {
        for (const f of walkSourceFiles(root, true)) {
            let content: string;
            try {
                content = fs.readFileSync(f, 'utf-8');
            } catch (error) {
                console.warn(`无法读取文件，已跳过：${path.relative(REPO_ROOT, f)}`, error);
                continue;
            }
            if (!/\.test\./.test(path.basename(f))) addMatches(f, content, RING_RE, 'RING');
            addMatches(f, content, SHADOW_RGBA_RE, 'SHADOW_RGBA');
        }
    }
    return all;
}

type BaselineSnapshot = Record<string, number>;

function computeBaseline(violations: Violation[]): BaselineSnapshot {
    const counts: Record<string, number> = {};
    for (const v of violations) {
        const key = `${v.category}|${v.file}`;
        counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
}

function loadBaseline(): { status: 'ok' | 'missing' | 'corrupt'; data: BaselineSnapshot } {
    if (!fs.existsSync(BASELINE_FILE)) return { status: 'missing', data: {} };
    try {
        return { status: 'ok', data: JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8')) };
    } catch {
        return { status: 'corrupt', data: {} };
    }
}

function saveBaseline(snapshot: BaselineSnapshot): void {
    const sortedKeys = Object.keys(snapshot).sort();
    const sorted: Record<string, number> = {};
    for (const key of sortedKeys) sorted[key] = snapshot[key];
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

function main(): void {
    const args = process.argv.slice(2);
    const updateBaseline = args.includes('--update-baseline');
    const checkBaseline = args.includes('--check-baseline');
    const violations = audit();

    if (updateBaseline) {
        saveBaseline(computeBaseline(violations));
        console.log(`基线已写入 ${path.relative(process.cwd(), BASELINE_FILE)}`);
        console.log(`  违规总数：${violations.length}`);
        process.exit(0);
    }

    if (checkBaseline) {
        const baseline = loadBaseline();
        if (baseline.status === 'missing') {
            console.warn('⚠ 基线文件不存在（.deprecated-utilities-baseline.json）——全部当前违规将被判为新增。请先运行 check:deprecated:update 生成基线。');
        } else if (baseline.status === 'corrupt') {
            console.warn('⚠ 基线文件损坏（JSON 解析失败）——无法比对，全部当前违规将被判为新增。请检查或重新运行 check:deprecated:update。');
        }
        const baseData = baseline.data;
        const current = computeBaseline(violations);
        const newKeys: string[] = [];
        const increased: Array<{ key: string; baseline: number; current: number }> = [];
        let totalBaseline = 0;
        let totalCurrent = 0;
        for (const [key, count] of Object.entries(current)) {
            totalCurrent += count;
            const base = baseData[key] ?? 0;
            if (base === 0) newKeys.push(key);
            else if (count > base) increased.push({ key, baseline: base, current: count });
        }
        for (const count of Object.values(baseData)) totalBaseline += count;

        console.log('=== 已废弃工具类防回潮门禁（基线比对）===');
        console.log(`基线违规总数：${totalBaseline}`);
        console.log(`当前违规总数：${totalCurrent}`);
        if (newKeys.length === 0 && increased.length === 0) {
            console.log('✓ 未发现新增违规，门禁通过。');
            if (totalCurrent < totalBaseline) {
                console.log(`  已修复 ${totalBaseline - totalCurrent} 处违规，可运行 check:deprecated:update 更新基线。`);
            }
            process.exit(0);
        }
        for (const key of newKeys) console.log(`  + 新增 ${key}`);
        for (const item of increased) console.log(`  ↑ 增加 ${item.key}  ${item.baseline} → ${item.current}`);
        console.log('\n结论：存在新增违规，exit 1');
        process.exit(1);
    }

    console.log('=== 已废弃工具类扫描 ===');
    if (violations.length === 0) {
        console.log('✓ 无 RING/SHADOW_RGBA 违规');
        process.exit(0);
    }
    for (const v of violations) {
        console.log(`  ${v.category}|${v.file}:${v.line} → ${v.snippet}`);
    }
    console.log(`\n结论：${violations.length} 处违规，exit 1`);
    process.exit(1);
}

main();
