---
方案类型: 重构 / 架构优化
状态: archived
日期: 2026-09-10
完工日期: 2026-09-11
关联文档:
  - ../../guides/DOC_GOVERNANCE.md
修订记录:
  - 2026-09-10: 评审重构，由单一工具类收敛为领域深模块架构（CssTokenInjector 与 NuxtConfigModifier）
---

# CLI代码修改与配置注入深模块重构方案

---

## 一、 背景与核心架构摩擦点分析

### 1. 现状痛点

在当前 `packages/cli` 架构中，针对宿主工程既有代码的注入、改写与语法处理散落在不同业务模块中，存在明显的**逻辑重复**与**抽象割裂**：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    当前外部代码注入与改写散落现状                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. CSS 标记块与引入逻辑存在双重实现                                         │
│    ├─ init-service.ts：处理 tokensFile 分支、标记块替换与相对 import 计算    │
│    ├─ tailwind-rules.ts (planFix)：重复实现几乎相同的双文件判定与内容生成   │
│    └─ 两处双文件协同分支各自维护，新增配置或规范调整极易产生逻辑漂移        │
│                                                                             │
│ 2. 词法状态机 AST 逻辑与脚手架业务混杂                                      │
│    ├─ init-service.ts 内部内联 150+ 行 findNuxtRootBlock / hasRootObjectKey │
│    └─ 纯语法的 TypeScript 配置解析器与上层工程初始化业务强耦合              │
│                                                                             │
│ 3. VS Code Snippets 存在格式丢失风险与机制孤立                              │
│    ├─ vscode-snippets.ts 采用普通 JSON 解析，破坏用户原有 JSONC 注释        │
│    └─ 自建 .bak 物理文件容灾，绕过了统一的 FileTransaction 安全事务机制    │
│                                                                             │
│ 4. 模块导入改写存在多余透传包装倾向                                         │
│    └─ shared 已有 SfcAstEngine，上层若再建静态透传将增加无意义间接层        │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **双文件协同导致双重维护漂移（Duplicated Multi-File Orchestration）**：
   当配置了独立 Token 文件（`tokensFile`）时，修改不仅涉及向一个文件写入样式，更涉及**双文件协同状态机**：
   - 目标 A（`tokens.css`）：创建或就地替换 Brutx Token 标记块；
   - 目标 B（`main.css`）：清理历史遗留的 Brutx Token 标记块，并注入指向 `tokens.css` 的 `@import` 语句。
   `init-service.ts` 与 `tailwind-rules.ts` 各自手写了一整套完全相同的分支与路径计算逻辑，破坏了单一事实源原则。
2. **底层语法状态机深度污染上层服务（Domain Pollution）**：
   用于向 `nuxt.config.ts` 安全注入配置的 `findNuxtRootBlock` 与 `hasRootObjectKey`（跳过注释、泛型、模板字符串的状态机）原本是纯粹的语法工具，直接内嵌在 `init-service.ts` 内部，无法被其他命令或自愈规则复用，且使得初始化服务体积臃肿。
3. **安全与事务边界不一致（Security & Transaction Inconsistency）**：
   `vscode-snippets.ts` 自建 `.bak` 备份，不仅与 `FileTransaction` 的原子回滚机制割裂，且直接使用普通 `JSON.parse` 还会抹去宿主工程 VS Code 配置文件中的合法注释（JSONC）。

---

## 二、 领域深模块架构与核心契约

为避免将正交领域的代码改写揉杂成单一“上帝工具类（Grab Bag）”，本方案严格遵循**深模块（Deep Module）原则**：按领域划分清晰边界，提供“小接口（Small Interface）+ 大实现（Deep Implementation）”，并打通纯数据自愈规划（Planning）与事务执行（Execution）的接缝（Seam）。

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           领域深模块与接缝拓扑架构                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. 样式领域深模块 (src/lib/css/css-token-injector.ts)                       │
│    ┌─────────────────────────────────────────────────────────────────────┐  │
│    │ Small Interface:                                                    │  │
│    │  planCssTokenInjection(ctx): Promise<CssTokenPlan>                  │  │
│    │  applyCssTokenPlan(plan, transaction): Promise<void>                │  │
│    └─────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼ 隐藏内部巨大复杂度                    │
│    ┌─────────────────────────────────────────────────────────────────────┐  │
│    │ Deep Implementation:                                                │  │
│    │  • 单文件 vs 双文件(tokensFile)模式智能判决                         │  │
│    │  • 跨文件相对路径规范化 (computeRelativeImportSpecifier)             │  │
│    │  • /* brutx-ui:start */ 块正则查找、替换与清理                      │  │
│    │  • @import "tailwindcss" 与相对 import 安全定位注入                 │  │
│    │  • 100% 纯数据输出 RepairAction[] (供诊断预览 diff 与自愈复用)      │  │
│    └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ 2. 框架语法深模块 (src/lib/frameworks/nuxt-config.ts)                       │
│    ┌─────────────────────────────────────────────────────────────────────┐  │
│    │ Small Interface:                                                    │  │
│    │  injectNuxtConfig(content, options): ConfigInjectionResult          │  │
│    └─────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼ 隐藏内部巨大复杂度                    │
│    ┌─────────────────────────────────────────────────────────────────────┐  │
│    │ Deep Implementation:                                                │  │
│    │  • 词法状态机解析器 (Lexical Scanner)                               │  │
│    │  • 跳过单/多行注释、引号字符串、模板字符串反引号                    │  │
│    │  • 识别并跳过泛型参数 (<T>)，精准定位根对象首尾花括号               │  │
│    │  • 根层级 key 检测，幂等注入 components / css 配置                  │  │
│    └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ 3. 编辑器生态 (src/lib/vscode-snippets.ts)                                  │
│    • mergeSnippetsContent(existing, newSnippets): string (基于 jsonc-parser)│
│    • 读写全量接入 FileTransaction 与 isSafePath，彻底废除 .bak 机制          │
│                                                                             │
│ 4. 模块导入转换 (直接复用 SfcAstEngine)                                     │
│    • 坚决不设 pass-through 包装层，通过 Deletion Test 维护极简调用链路      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. 样式领域深模块：`CssTokenInjector`

深化既有的 `packages/cli/src/lib/css/` 目录，创建 `css-token-injector.ts`。其核心设计在于**分离变更规划（Planning）与事务应用（Execution）**。

#### 接口契约定义

```typescript
import type { FileSystemAdapter } from 'brutx-shared-vue/fs';
import type { TailwindConfig } from '../config.js';
import type { RepairAction } from '../diagnostics/types.js';
import type { FileTransaction } from '../file-transaction.js';

export interface CssTokenPlanContext {
    /** 工程根路径 */
    cwd: string;
    /** Tailwind 与 Tokens 配置 */
    tailwind: TailwindConfig;
    /** 文件系统适配器（只读探测） */
    fs: FileSystemAdapter;
    /** 可选的自定义 Brutalist CSS 样式内容（未提供则内部自动读取 default styles） */
    tokensCss?: string;
}

export interface CssTokenPlan {
    /** 是否实际产生了修改需求（若已存在且内容完全一致则为 false） */
    readonly hasChanges: boolean;
    /** 纯数据自愈动作序列（可直接作为 PlanFixResult 返回，也可被事务直接消费） */
    readonly actions: readonly RepairAction[];
    /** 主 CSS 文件绝对路径 */
    readonly mainCssPath: string;
    /** 独立 Token 文件绝对路径（单文件模式下为 null） */
    readonly tokensPath: string | null;
}

/**
 * 规划 CSS Token 注入与引入关系（纯计算与只读探测，零写副作用）
 */
export async function planCssTokenInjection(
    context: CssTokenPlanContext
): Promise<CssTokenPlan>;

/**
 * 在文件事务中安全应用 CSS 注入计划
 */
export async function applyCssTokenPlan(
    plan: CssTokenPlan,
    transaction: FileTransaction
): Promise<void>;
```

#### 架构收益
- **`tailwind-rules.ts`（诊断自愈）**：
  直接调用 `const plan = await planCssTokenInjection(ctx)`，将 `plan.actions` 包装为 `PlanFixResult` 即可。`doctor` 命令天然获得文件级 Unified Diff 预览与原子自愈能力。
- **`init-service.ts`（初始化）**：
  直接执行 `const plan = await planCssTokenInjection(...)` 并调用 `await applyCssTokenPlan(plan, transaction)`。两处原本重复的 120+ 行双文件判定、路径计算与内容拼接被 100% 消除。

---

### 2. 框架语法深模块：`NuxtConfigModifier`

创建 `packages/cli/src/lib/frameworks/nuxt-config.ts`，将原本混在 `init-service.ts` 中的词法状态机彻底解耦。

#### 接口契约定义

```typescript
export interface NuxtConfigInjectionOptions {
    /** 需要注入的主 CSS 相对或别名路径（例如 '~/assets/css/main.css'） */
    cssPath: string;
    /** 组件所在相对路径（例如 'components'） */
    componentsRelDir: string;
}

export interface ConfigInjectionResult {
    /** 变换后的完整配置文件文本 */
    content: string;
    /** 是否产生了修改 */
    changed: boolean;
    /** 执行状态：成功注入、无需修改、或语法结构不支持（需人工介入） */
    status: 'injected' | 'unchanged' | 'manual-required';
}

/**
 * 基于词法状态机安全向 defineNuxtConfig 根对象注入配置
 *
 * 复杂度完全隐藏在模块内部：
 * 1. 跳过单/多行注释与字符串字面量；
 * 2. 处理泛型参数 defineNuxtConfig<{ ... }>，避免泛型花括号干扰；
 * 3. 检测根对象第一层是否已有 components / css 键名；
 * 4. 保持原有代码缩进与排版风格。
 */
export function injectNuxtConfig(
    content: string,
    options: NuxtConfigInjectionOptions
): ConfigInjectionResult;
```

#### 架构收益
- **纯函数、零 I/O 依赖**：极大简化单元测试，覆盖泛型、单行/多行注释、嵌套配置对象等极端边缘情况无需 mock 文件系统。
- **扩展性**：未来若需支持其他框架（如 Astro、VitePress），均在 `src/lib/frameworks/` 目录下按同构模式增加对应配置修改器，杜绝单一类膨胀。

---

### 3. VS Code Snippets：保护性合并与事务统一

改造 `packages/cli/src/lib/vscode-snippets.ts`，使用成熟的 `jsonc-parser` 替代粗暴的 `JSON.parse`，并彻底废弃 `.bak` 文件。

#### 接口与实现规范

```typescript
import { applyEdits, modify } from 'jsonc-parser';

/**
 * 基于 JSONC AST 安全合入新代码片段，严格保留已有注释、缩进与未修改字段
 */
export function mergeSnippetsContent(
    existingContent: string | null,
    newSnippets: Record<string, unknown>
): string {
    let content = existingContent && existingContent.trim().length > 0
        ? existingContent
        : '{\n}\n';

    for (const [key, snippet] of Object.entries(newSnippets)) {
        const edits = modify(content, [key], snippet, {
            formattingOptions: {
                insertSpaces: true,
                tabSize: 4,
                eol: '\n',
            },
        });
        content = applyEdits(content, edits);
    }

    return content;
}
```

#### 事务接入规范
- 废弃 `vscode-snippets.ts` 内部的手写 `.bak` 备份逻辑；
- 写操作入参强制接收 `FileTransaction`（或通过注入的适配器），统一享有 `assertSafePath` 路径穿透校验与事务失败自动回滚能力。

---

### 4. 模块导入重写：确立单一权威源

- **坚决不增设透传方法**：删除原方案中的 `CodeModifier.transformImports` 规划。
- **唯一事实源**：统一复用 `brutx-shared-vue/ast` 的 `SfcAstEngine`，并在 CLI 内直接通过 `ProjectContext.transformImports` 访问。通过 Deletion Test，消灭冗余包装。

---

## 三、 演进与重构步骤

### Phase 1: 建立 `NuxtConfigModifier` 纯函数模块
1. 新建 `packages/cli/src/lib/frameworks/nuxt-config.ts`。
2. 将 `findNuxtRootBlock`、`hasRootObjectKey` 及核心注入逻辑从 `init-service.ts` 迁入并重构为纯函数。
3. 编写针对各种 TypeScript 语法的单元测试（嵌套注释、泛型声明、已有键名规避）。

### Phase 2: 构建 `CssTokenInjector` 规划与执行模块
1. 新建 `packages/cli/src/lib/css/css-token-injector.ts`。
2. 整合 `constants.ts` 的标记块规则、`css-dependency-graph.ts` 的相对路径计算，实现 `planCssTokenInjection` 纯数据规划。
3. 实现 `applyCssTokenPlan`，将 `RepairAction[]` 映射至 `FileTransaction` 写操作。
4. 编写针对单文件注入、跨文件迁移与 `@import` 定位的单元测试。

### Phase 3: 收敛业务层与消除双重实现
1. 重构 `init-service.ts`：将 `addBrutalistStyles` 与 `configureNuxtConfig` 分别委托给 `applyCssTokenPlan` 和 `injectNuxtConfig`。
2. 重构 `tailwind-rules.ts`：将 `planFix` 的生成逻辑精简为直接复用 `planCssTokenInjection`，消除双重实现。

### Phase 4: VS Code Snippets 现代化改造
1. 在 `vscode-snippets.ts` 中引入 `jsonc-parser` 实现非破坏性文本合入。
2. 移除私有 `.bak` 备份逻辑，写操作对齐 `FileTransaction`。

### Phase 5: 全量验证与门禁检查
1. 运行针对性单元测试与端到端测试：`pnpm --filter brutx-vue test`。
2. 验证 `init`、`add` 与 `doctor --fix` 产生的 CSS、Nuxt 配置与 Snippets 行为 100% 保持一致。
3. 运行静态契约门禁与文档门禁：`pnpm check:contracts` 与 `pnpm check:docs`。

---

## 四、 收益与验证指标

- **高内聚（High Locality）**：CSS 双文件协同、Nuxt 词法语法与 Snippets 编辑分别收敛于各自领域模块，不再扩散至业务层。
- **高杠杆（Deep Leverage）**：`init-service` 与 `tailwind-rules` 共享同一份 `CssTokenPlan`，消除重复样板代码约 200 行。
- **纯数据接缝（Pure Data Seam）**：通过 `RepairAction[]` 打通诊断预览与事务落盘，使代码修改兼具可测性与可回滚性。
- **零破坏（Non-Destructive AST Merging）**：VS Code 代码片段合入全面保护现有注释与缩进，消除宿主工程配置被覆写的风险。
- **架构极简（Zero Indirection Waste）**：摒弃大杂烩工具类，拒绝为 `SfcAstEngine` 添加无效透传。
