---
方案类型: 样式解耦
状态: done
日期: 2026-08-29
---

# Tailwind模块化依赖图扫描与样式解耦方案

---

## 一、 背景与第一性原理

### 1. 现状痛点与问题本质

随着 Tailwind CSS v4 的全面普及，Tailwind 放弃了传统的 `tailwind.config.js`，转向以原生 CSS 声明与 `@import` 指令为核心的模块化设计体系。在规范的现代前端工程中，开发者通常会将样式拆分为职责明确的独立模块（例如：`globals.css` 内部按序声明 `@import "tailwindcss";`、`@import "./theme.css";`、`@import "./tokens.css";` 和 `@import "./utilities.css";`）。

然而，当前 BrutxUI CLI（`packages/cli`）在样式管理与诊断机制上，仍沿用单文件内联写入的旧模型，带来了结构性的摩擦与限制：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      现有 Tailwind 样式注入与扫描局限                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. 单体单文件硬编码注入 (Monolithic Inline Injection)                       │
│    ├─ CLI 初始化与 doctor 自愈直接将数百行 Brutalist CSS（含 @theme、       │
│    │  :root/.dark 变量与 @utility）全量塞入 tailwind.css 目标入口             │
│    ├─ 严重破坏了用户项目原本干净整洁的 CSS 模块化目录结构                    │
│    └─ 导致用户在阅读和维护主入口样式表时产生大量非必要的视觉噪音与合并冲突    │
│                                                                             │
│ 2. 样式依赖图盲区 (Dependency Graph Blindness)                               │
│    ├─ tailwind.tokens 诊断规则仅针对 components.json 指定的单一文件做正则检测 │
│    ├─ 若用户遵循最佳实践将 tokens 拆分到 @import 子文件（如 ./theme.css），  │
│    │  CLI 无法穿透 @import 关系，错误判定为“缺少 BrutxUI tokens”误报警告/错误│
│    └─ 无法感知 CSS 依赖链中的死循环引用（Circular Import）与 404 悬空文件    │
│                                                                             │
│ 3. 层叠顺序与原生规范脆弱性 (Cascade Placement Fragility)                   │
│    ├─ Tailwind v4 要求 @import "tailwindcss" 置于顶部，后续按序加载主题/工具 │
│    ├─ 简单字符串拼接（content += brutxBlock）容易破坏 CSS 规范语法位置        │
│    └─ 缺乏 AST 级/块级安全插入定位能力                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### (1) 样式架构的第一性原理剖析
- **关注点分离（Separation of Concerns）**：
  - 应用主入口（`main.css` / `globals.css`）：属于**组装层（Assembly Layer）**，职责是声明环境基础（`@import "tailwindcss";`）并编排各个子样式模块的加载顺序。
  - 组件库设计令牌（`brutx-tokens.css`）：属于**第三方资产层（Vendor / Design System Layer）**，是粗野主义（Neo-Brutalism）风格的颜色、边框、阴影与工具类集合。
  - 将第三方资产层的全量内容硬塞入组装层，混淆了模块边界。

#### (2) 依赖扫描的第一性原理剖析
- **静态分析必须顺应模块加载语义**：
  - CSS 运行时的真实行为是由 `@import` 构建的一棵**依赖树（Import Tree）**。
  - 静态检查如果仅停留在叶子或根文件表面，就必然会在“模块化良好”的高质量项目中出现严重误报，迫使开发者不得不向工具的缺陷妥协。

---

## 二、 方案探索与架构突破

为了从根本上解决样式污染与依赖盲区问题，我们从 CSS 模块化编译原理与开发体验（DX）出发，探索更为彻底和优雅的解决方案：

### 1. 样式解耦架构探索：从单体硬灌到「两级分层与解耦 Token 架构」

| 维度 | 方案 A：维持现状（单文件内联替换） | 方案 B：仅新增 `tokensFile` 字段做简单写入 | 方案 C（推荐）：两级分层解耦模型 + 自适应路径解析器 |
| :--- | :--- | :--- | :--- |
| **主入口纯净度** | 差（数千字符硬塞在 main.css） | 良好（独立文件），但路径需用户手写 | **极致纯净**：主入口仅保留 1 行声明式 `@import "./brutx-tokens.css";` |
| **路径解析与自适应** | 不涉及 | 仅支持绝对/硬编码相对路径，易配错 | **智能解析**：自动计算 `mainCss` 到 `tokensFile` 的 POSIX 相对路径，支持别名（`@/styles/...`） |
| **向后兼容性** | 维持现状 | 破坏旧配置兼容性 | **平滑兼容**：未声明 `tokensFile` 时无缝回退至单文件模式；支持一键迁移命令 |
| **Init 初始化体验** | 强制灌入主文件 | 需手动修改配置 | **智能引导**：检测到项目已有模块化 CSS 时，默认推荐开启独立 Token 模式 |

#### 方案 C 核心突破点：
1. **纯净解耦独立文件模式（Decoupled Tokens File Mode）**：
   - 允许在 `components.json` 中配置 `tailwind.tokensFile`（例如 `"src/styles/brutx-tokens.css"` 或别名 `@/styles/brutx-tokens.css`）。
   - CLI 将全量 Brutalist 设计令牌、`@theme` 块、`:root/.dark` 变量与 `@utility` 规则独立写入该文件。
   - 主入口文件仅由 CLI 原子维护一行 `@import "./brutx-tokens.css";`，保持主入口的轻量与模块化。
2. **两级分层拓扑与原子自愈**：
   - 诊断与修复引擎在自愈时，能够同时保证 `tokensFile` 内容的完整性与主入口 `@import` 语句的正确引入。

---

### 2. 依赖图扫描引擎探索：从正则查表到「CSS 依赖图有向无环图（DAG）扫描器」

| 维度 | 方案 A：正则检测单一文件 | 方案 B：仅检查下一层 `@import` | 方案 C（推荐）：`CssDependencyGraphEngine` 递归拓扑扫描 |
| :--- | :--- | :--- | :--- |
| **检测准确度** | 低（模块化拆分项目误报） | 中（多层嵌套时失效） | **100% 准确**：递归遍历完整 CSS `@import` DAG 拓扑图 |
| **循环引用防护** | 无 | 易导致递归爆栈 | **内置防环检测（Cycle Detection）**，安全处理递归依赖 |
| **错误诊断深度** | 仅报错“缺少 tokens” | 无法定位丢失环节 | **精准定位**：清晰指出哪一级 `@import` 发生 404 丢失或令牌缺失 |
| **层叠顺序校验** | 无 | 无 | **规范校验（Placement Rule）**：确保 `@import "tailwindcss"` 与 `@theme` 的相对顺序符合 Tailwind v4 规范 |

---

## 三、 详细架构设计

### 1. 样式依赖拓扑与注入模型

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                           Tailwind v4 Modular CSS Architecture                            │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│   components.json Configuration                                                           │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │ {                                                                                 │   │
│   │   "tailwind": {                                                                   │   │
│   │     "config": "",                                                                 │   │
│   │     "css": "src/styles/globals.css",                                              │   │
│   │     "tokensFile": "src/styles/brutx-tokens.css"    <--- 独立 Token 文件模式        │   │
│   │   }                                                                               │   │
│   │ }                                                                                 │   │
│   └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                           │                                               │
│                                           ▼                                               │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 主入口文件 (src/styles/globals.css)                                                │   │
│   │ ┌───────────────────────────────────────────────────────────────────────────────┐ │   │
│   │ │ @import "tailwindcss";                                                        │ │   │
│   │ │ @import "./theme.css";                                                        │ │   │
│   │ │ @import "./brutx-tokens.css";    <--- 单行优雅引入，保持主文件整洁与模块化      │ │   │
│   │ │ @import "./custom.css";                                                       │ │   │
│   │ └───────────────────────────────────────────────────────────────────────────────┘ │   │
│   └───────────────────────────────────────┬───────────────────────────────────────────┘   │
│                                           │ @import 依赖链路                              │
│                                           ▼                                               │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 独立 Token 文件 (src/styles/brutx-tokens.css)                                     │   │
│   │ ┌───────────────────────────────────────────────────────────────────────────────┐ │   │
│   │ │ /* @brutx:tokens:start */                                                     │ │   │
│   │ │ @theme {                                                                      │ │   │
│   │ │   --color-brutal-bg: var(--brutal-bg);                                        │ │   │
│   │ │   --color-brutal-fg: var(--brutal-fg);                                        │ │   │
│   │ │   ...                                                                         │ │   │
│   │ │ }                                                                             │ │   │
│   │ │ :root { ... }                                                                 │ │   │
│   │ │ .dark { ... }                                                                 │ │   │
│   │ │ @utility brutal-shadow { ... }                                                │ │   │
│   │ │ /* @brutx:tokens:end */                                                       │ │   │
│   │ └───────────────────────────────────────────────────────────────────────────────┘ │   │
│   └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. 核心接口与数据模型

#### (1) 配置扩展契约（`components.json`）

在 `TailwindConfig` 中扩展 `tokensFile` 属性：

```typescript
export interface TailwindConfig {
    /**
     * Tailwind 配置文件路径；Tailwind v4 项目中为空字符串 ""。
     */
    config: string;

    /**
     * 全局 CSS 主入口文件路径或别名（如 "src/styles/globals.css" 或 "@/styles/globals.css"）。
     */
    css: string;

    /**
     * 独立的 BrutxUI 令牌文件路径或别名（可选，如 "src/styles/brutx-tokens.css" 或 "@/styles/brutx-tokens.css"）。
     * 配置后启用解耦 Token 模式：CLI 将全量设计令牌写入此文件，并在主 css 入口中仅保留单行 @import。
     * 未配置时回退至单文件内联模式。
     */
    tokensFile?: string;
}
```

#### (2) CSS 依赖图引擎抽象（`CssDependencyGraphEngine`）

```typescript
export interface CssImportStatement {
    /** 原始导入标识符，如 './theme.css' 或 'tailwindcss' */
    readonly specifier: string;
    /** 导入修饰符（如 'layer(utilities)' 或 'screen and (max-width: 768px)'，无修饰符时为空字符串） */
    readonly modifiers: string;
    /** 是否为外部/包依赖（如 'tailwindcss' 或 '@fontsource/...'） */
    readonly isExternal: boolean;
    /** 在当前文件中的代码行号（1-indexed） */
    readonly line: number;
    /** 起止偏移量 */
    readonly start: number;
    readonly end: number;
    /** 解析后的绝对物理路径（外部依赖或解析失败时为 null） */
    readonly resolvedPath: string | null;
}

export interface CssNode {
    /** 文件绝对路径 */
    readonly absolutePath: string;
    /** 相对工作区根目录的展示路径 */
    readonly relativePath: string;
    /** 文件是否存在 */
    readonly exists: boolean;
    /** 文件源码内容（不存在时为空） */
    readonly content: string;
    /** 解析出的所有 @import 语句 */
    readonly imports: CssImportStatement[];
    /** 是否包含完整的 BrutxUI 令牌标记块 */
    readonly hasTokensBlock: boolean;
    /** 是否包含 Tailwind v4 的核心引入 (@import "tailwindcss") */
    readonly hasTailwindCore: boolean;
    /** 是否包含 @theme 声明 */
    readonly hasThemeBlock: boolean;
}

export interface CssDependencyGraph {
    /** 入口节点 */
    readonly rootNode: CssNode;
    /** 拓扑图所有节点映射表 (absolutePath -> CssNode) */
    readonly nodes: ReadonlyMap<string, CssNode>;
    /** 检测到的循环引用路径（若无环则为空数组） */
    readonly circularPaths: string[][];
    /** 悬空引用（@import 目标文件不存在）列表 */
    readonly missingImports: { from: string; specifier: string; line: number }[];
    /** 整个依赖图中是否已在某一节点包含有效的 BrutxUI 令牌 */
    readonly hasBrutxTokens: boolean;
    /** 包含 BrutxUI 令牌的节点绝对路径列表 */
    readonly tokenNodePaths: string[];
}

export interface CssGraphScanOptions {
    readonly cwd: string;
    readonly fs: FileSystemAdapter;
    /** 路径别名解析器（支持与 ProjectContext.resolveAliasPath 或 tsconfig paths 对齐） */
    readonly resolveAlias?: (specifier: string) => Promise<string> | string;
}
```

---

### 3. 核心算法与实现逻辑

#### (1) CSS 依赖图深度递归扫描算法（`scanCssGraph`）

```typescript
import path from 'path';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import { hasBrutxCssBlock } from '../constants.js';

// 支持 url(...) 与引号形式，兼容尾部 layer(...)、supports(...) 或 media query 修饰符
const IMPORT_PATTERN = /@import\s+(?:url\(['"]?([^'")]+)['"]?\)|['"]([^'"]+)['"])([^;]*);/g;
const THEME_PATTERN = /@theme\s*\{/;
const TW_CORE_PATTERN = /@import\s+['"]tailwindcss['"][^;]*;/;

/**
 * 将 CSS 块注释内容替换为空格，保持字符偏移量与行号与原文件完全一致（避免注释内的 @import 产生幽灵 404）
 */
function stripCssComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, match => ' '.repeat(match.length));
}

export async function scanCssGraph(
    entryPath: string,
    options: CssGraphScanOptions
): Promise<CssDependencyGraph> {
    const { fs, cwd, resolveAlias } = options;
    const nodes = new Map<string, CssNode>();
    const circularPaths: string[][] = [];
    const missingImports: { from: string; specifier: string; line: number }[] = [];
    const tokenNodePaths: string[] = [];

    async function traverse(currentPath: string, visitStack: string[]): Promise<void> {
        const normalizedPath = path.resolve(currentPath);

        if (visitStack.includes(normalizedPath)) {
            circularPaths.push([...visitStack, normalizedPath]);
            return;
        }

        if (nodes.has(normalizedPath)) {
            return;
        }

        const exists = await fs.pathExists(normalizedPath);
        if (!exists) {
            const rel = path.relative(cwd, normalizedPath).replace(/\\/g, '/');
            nodes.set(normalizedPath, {
                absolutePath: normalizedPath,
                relativePath: rel,
                exists: false,
                content: '',
                imports: [],
                hasTokensBlock: false,
                hasTailwindCore: false,
                hasThemeBlock: false,
            });
            return;
        }

        const content = await fs.readFile(normalizedPath, 'utf-8');
        const hasTokens = hasBrutxCssBlock(content);
        const hasTailwindCore = TW_CORE_PATTERN.test(content);
        const hasThemeBlock = THEME_PATTERN.test(content);

        if (hasTokens) {
            tokenNodePaths.push(normalizedPath);
        }

        // 先预处理剥离注释（保留等长空白字符以确保行号/偏移量绝对精准）
        const sanitizedContent = stripCssComments(content);
        const imports: CssImportStatement[] = [];
        let match: RegExpExecArray | null;
        IMPORT_PATTERN.lastIndex = 0;

        while ((match = IMPORT_PATTERN.exec(sanitizedContent)) !== null) {
            const specifier = (match[1] ?? match[2]).trim();
            const modifiers = (match[3] ?? '').trim();
            const isExternal = !specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.startsWith('@/') && !specifier.startsWith('~/');
            const line = content.slice(0, match.index).split('\n').length;

            let resolvedPath: string | null = null;
            if (!isExternal) {
                if (resolveAlias && (specifier.startsWith('@/') || specifier.startsWith('~/'))) {
                    try {
                        resolvedPath = await resolveAlias(specifier);
                    } catch {
                        resolvedPath = null;
                    }
                } else {
                    resolvedPath = path.resolve(path.dirname(normalizedPath), specifier);
                }
            }

            imports.push({
                specifier,
                modifiers,
                isExternal,
                line,
                start: match.index,
                end: match.index + match[0].length,
                resolvedPath,
            });

            if (resolvedPath) {
                const subExists = await fs.pathExists(resolvedPath);
                if (!subExists) {
                    missingImports.push({
                        from: normalizedPath,
                        specifier,
                        line,
                    });
                }
            }
        }

        const rel = path.relative(cwd, normalizedPath).replace(/\\/g, '/');
        nodes.set(normalizedPath, {
            absolutePath: normalizedPath,
            relativePath: rel,
            exists: true,
            content,
            imports,
            hasTokensBlock: hasTokens,
            hasTailwindCore,
            hasThemeBlock,
        });

        // 递归遍历子依赖
        for (const imp of imports) {
            if (imp.resolvedPath) {
                await traverse(imp.resolvedPath, [...visitStack, normalizedPath]);
            }
        }
    }

    await traverse(entryPath, []);

    const rootNode = nodes.get(path.resolve(entryPath))!;
    return {
        rootNode,
        nodes,
        circularPaths,
        missingImports,
        hasBrutxTokens: tokenNodePaths.length > 0,
        tokenNodePaths,
    };
}
```

#### (2) 相对路径自适应计算与注入逻辑

当采用解耦 Token 模式时，CLI 需要计算从主 CSS 引入 `tokensFile` 的规范相对路径：

```typescript
export function computeRelativeImportSpecifier(fromFile: string, toFile: string): string {
    let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/');
    if (!rel.startsWith('.')) {
        rel = `./${rel}`;
    }
    return rel;
}

export function injectImportStatement(mainContent: string, importSpecifier: string): string {
    const statement = `@import "${importSpecifier}";`;
    if (mainContent.includes(statement)) {
        return mainContent;
    }

    // 若存在 @import "tailwindcss"，精准插入在其后一行；若存在 @charset，插入在其后
    const twMatch = /@import\s+['"]tailwindcss['"][^;]*;/.exec(mainContent);
    if (twMatch) {
        const insertIndex = twMatch.index + twMatch[0].length;
        const prefix = mainContent.slice(0, insertIndex);
        const suffix = mainContent.slice(insertIndex);
        return `${prefix}\n${statement}${suffix.startsWith('\n') ? '' : '\n'}${suffix}`;
    }

    const charsetMatch = /@charset\s+['"][^'"]+['"]\s*;/.exec(mainContent);
    if (charsetMatch) {
        const insertIndex = charsetMatch.index + charsetMatch[0].length;
        const prefix = mainContent.slice(0, insertIndex);
        const suffix = mainContent.slice(insertIndex);
        return `${prefix}\n${statement}${suffix.startsWith('\n') ? '' : '\n'}${suffix}`;
    }

    return `${statement}\n${mainContent}`;
}
```

---

### 4. 诊断规则升级契约

#### (1) `tailwind.tokens` 升级为图感知规则

- **巡检行为**：
  1. 解析 `ctx.config.tailwind.css` 与 `ctx.config.tailwind.tokensFile`。
  2. 构造 `CssGraphScanOptions`（传入 `ctx.fs`、`ctx.cwd` 及基于 `ctx.projectContext.resolveAliasPath` 的别名解析器），调用 `scanCssGraph` 获取全局样式拓扑图。
  3. **路径安全门禁**：若配置了 `tokensFile`，首先通过 `isSafePath` 校验物理路径，阻断 Path Traversal 越界风险。
  4. **悬空引用告警**：若 `missingImports` 非空，报告 `status: 'error'` 指示缺失的 CSS 文件路径与代码行号。
  5. **循环引用阻断**：若 `circularPaths` 非空，报告 `status: 'error'` 指示环路依赖链。
  6. **令牌完整性校验**：
     - 若配置了 `tokensFile`（解耦模式）：检查 `tokensFile` 节点是否存在且包含完整标记块，同时检查主 `tailwind.css` 入口是否已声明对该文件的有效 `@import` 依赖。
     - 若未配置 `tokensFile`（单文件内联模式）：检查 `tailwind.css` 或其任意子 `@import` 依赖节点是否包含完整标记块。
- **自愈行为（`fix` 算子）**：
  - 若启用 `tokensFile`（解耦模式）：
    1. **安全校验**：校验 `tokensFile` 路径合法性（`isSafePath`）。
    2. **独立文件写入**：在 `tokensFile` 物理路径写入独立的 `brutalist.css` 内容（带开始与结束 marker）。
    3. **主入口导入注入**：计算 `mainCss` 到 `tokensFile` 的 POSIX 相对路径，在主 `tailwind.css` 中安全插入 `@import "<relative-specifier>";`。
    4. **旧内联块清理（防双重声明）**：若主 `tailwind.css` 中残留历史内联 Marker 块，自动执行 `replaceBrutxCssBlock(mainContent, '')` 清除，避免样式重复注入与体积冗余。
  - 若未启用 `tokensFile`（单文件内联模式）：
    - 在主 `tailwind.css` 中原子替换或追加 marker 块。

---

## 四、 实施路线与测试验证

### 1. 实施阶段拆解

1. **阶段 1：依赖图引擎与路径工具下沉**
   - 在 `packages/cli/src/lib/css/` 中实现 `CssDependencyGraphEngine`（`scanCssGraph`、`stripCssComments` 与 `computeRelativeImportSpecifier`）。
   - 增加零 IO `MemoryFileSystemAdapter` 单测，覆盖深层 `@import` 嵌套、注释剥离、修饰符匹配、别名导入与防环逻辑。
2. **阶段 2：配置模型与 Schema 扩展**
   - 更新 `packages/cli/src/lib/types.ts` 中的 `TailwindConfig`，新增 `tokensFile?: string`。
   - 同步更新 `apps/docs/public/schema.json`。
3. **阶段 3：服务层与初始化改造**
   - 改造 `packages/cli/src/lib/services/init-service.ts` 中的 `addBrutalistStyles`：
     - 支持双模式（单文件内联模式 vs 解耦独立文件模式），严格执行 `isSafePath` 安全门禁。
   - 改造 `packages/cli/src/commands/init.ts` 交互流程：当用户输入配置时提供 `tokensFile` 智能提示与默认推荐。
4. **阶段 4：诊断与自愈规则全量升级**
   - 升级 `packages/cli/src/lib/diagnostics/rules/tailwind-rules.ts`：
     - 接入 `scanCssGraph` 进行深层 DAG 依赖扫描。
     - 完善双模式原子自愈算子，实现内联模式向解耦模式迁移时的旧 Marker 块自动清理。

### 2. 自动化测试与质量门禁

- **单元测试（零 IO MemoryFS）**：
  - **依赖图扫描测试**：
    - 单文件直连、多层嵌套 `@import`（`globals.css` -> `theme.css` -> `brutx.css`）图遍历。
    - CSS 块注释干扰测试：确保 `/* @import "./deleted.css"; */` 不会被识别为依赖或产生 404 误报。
    - 修饰符兼容测试：确保 `@import "./theme.css" layer(utilities);` 能被正确解析为依赖节点。
    - 循环引用防御测试：确保 `A.css <-> B.css` 相互引用时安全中断并精准捕获环路路径。
    - 悬空引用定位测试：精准报告丢失文件的来源路径、缺失 specifier 与所在行号。
  - **解耦模式初始化测试**：
    - 验证 `init` 生成独立的 `brutx-tokens.css` 并向 `main.css` 精准插入 `@import "./brutx-tokens.css";`。
    - 跨平台路径测试：验证在 Windows 反斜杠环境下生成的导入路径始终为标准 POSIX 风格（如 `./styles/brutx-tokens.css`）。
  - **诊断与自愈幂等性测试**：
    - 验证已配置解耦文件的项目运行 `doctor` 返回 `status: 'pass'`。
    - 验证多次执行 `doctor --fix` 保证内容幂等无冗余追加。
    - 验证单文件切换至解耦文件模式时，`doctor --fix` 能够自动清理主 CSS 中的旧内联 Marker 块，杜绝双重样式声明。
