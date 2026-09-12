# AGENTS.md — BrutxUI Vue 3

面向 Vue 3 + Tailwind CSS 的 Neo-Brutalist UI 组件库。

## 自动生成文件（勿手动编辑）

> **执行上下文**：生成脚本依据包自治原则落位于各子包。修改设计令牌后可于根目录运行 `pnpm generate:tokens` 一键同步所有子包。

| 文件 | 触发更新的命令 |
| --- | --- |
| `packages/ui/registry-manifest.json` | `pnpm build` / `pnpm --filter brutx-ui-vue prebuild:scan`（lint、typecheck 也会前置执行，幂等） |
| `packages/ui/exports-manifest.json` | `pnpm --filter brutx-ui-vue prebuild:scan`（build、typecheck、lint 也会前置执行，幂等） |
| `packages/ui/package.json` 的 `exports` 字段 | `pnpm --filter brutx-ui-vue prebuild:exports`（build、typecheck、lint 也会前置执行，幂等） |
| `packages/ui/src/styles.css` 的 `@theme`、`:root/.dark` 与预设 tokens | `pnpm --filter brutx-ui-vue prebuild:tokens`（唯一数据源 `packages/shared/src/tokens`） |
| `packages/ui/src/preflight.css` 的 body 字体栈 | `pnpm --filter brutx-ui-vue prebuild:tokens`（唯一数据源 `packages/shared/src/tokens`） |
| `packages/ui/src/lib/utils.ts` 的 `BRUTAL_COLOR_NAMES` 列表 | `pnpm --filter brutx-ui-vue prebuild:tokens`（唯一数据源 `packages/shared/src/tokens`） |
| `packages/cli/src/styles/brutalist.css` 的令牌与预设标记块 | `pnpm --filter brutx-vue prebuild:tokens`（唯一数据源 `packages/shared/src/tokens`） |
| `packages/cli/src/lib/constants.ts` 的 `UTILS_TEMPLATE` 模板块 | `pnpm --filter brutx-vue prebuild:tokens`（唯一数据源 `packages/shared/src/tokens`） |
| `packages/ui/src/components/*/index.ts` 组件级导出文件 | `pnpm --filter brutx-ui-vue prebuild:component-index`（唯一数据源组件目录结构与变体） |


## 单体仓库

| 包名 | 路径 | 说明 |
| --- | --- | --- |
| `brutx-ui-vue` | `packages/ui/` | 核心 Vue 3 组件库 |
| `brutx-vue` | `packages/cli/` | 用于 `init` 和 `add` 的 CLI |
| `brutx-registry-vue` | `packages/registry/` | 编译后的 JSON 注册表 |
| `brutx-shared-vue` | `packages/shared/` | 共享类型和元数据 |
| `docs` | `apps/docs/` | VitePress 文档站点 |

## 常用高频命令

日常开发仅使用以下聚焦指令。完整指令字典、发布时序、性能压测与底层逃生通道详见 [完整指令参考手册](docs/guides/COMMANDS.md)。

```bash
pnpm build          # Turbo 并行构建所有包（--filter <pkg> build 仅构建指定包）
pnpm lint           # 对所有包执行 lint
pnpm typecheck      # 对所有包执行类型检查
pnpm test           # 运行所有子包测试（--filter <pkg> test 仅运行指定包）
pnpm test:ssr       # SSR 测试
```

### 脚手架（组件与页面生成）

在**根目录**下运行，严禁手动从零拼装基础骨架文件：

```bash
pnpm generate:component    # 新组件骨架（组件、variants、测试文件）
pnpm generate:composable   # Composition API 组合式函数
pnpm generate:page         # 文档测试页面
```

### Registry 包

```bash
pnpm --filter brutx-registry-vue build          # 编译 registry JSON（增量缓存）
pnpm --filter brutx-registry-vue build:watch    # watch 增量 rebuild（或设 BRUTX_WATCH=1）
pnpm --filter brutx-registry-vue validate       # 校验完整性 + 依赖图；加 -- --graph 导出 deps.dot/json
```

> registry 构建读取 `packages/ui` / `packages/shared` 源码生成 JSON；turbo.json 已对 `brutx-registry-vue#build` 设 `"cache": false` 并列入跨包 inputs——勿改回缓存，否则跨包源码变更不会使缓存失效，CI 会检出旧产物 drift。

### 开发自检约定

- **包管理器限定**：开发阶段仅允许 `pnpm`，严禁 `npm`/`yarn`（避免不一致 lockfile）。
- **校验最小化与场景匹配（核心）**：严禁在开发阶段无脑运行全局 `pnpm test`/`lint`。依据代码触碰领域触发对应最小化检查：

| 变动领域 | 最小化自检命令 | 说明 |
| --- | --- | --- |
| 业务逻辑 / 组件 / 函数 | `pnpm --filter <pkg> test <相对路径>`<br>`npx eslint <file> --fix` | 跑针对性单测与代码格式修复 |
| 类型接口 / 跨包导出 | `pnpm --filter <pkg> typecheck` | 验证 TS 类型严苛性与接口兼容 |
| 样式 / 令牌 / 导出 / 依赖 | `pnpm check:contracts` | 静态契约并发 6 合 1 门禁（~2s，全绿放行） |
| 文档 / 规范 / 技能 / 链接 | `pnpm check:docs`<br>`pnpm doc:archive` | 文档健康度并发 5 合 1 门禁（~0.4s，可加 `--fix` 自愈）；方案完工一键归档自愈 |

## 技术栈

Vue 3（`<script setup>`）· TypeScript（strict）· Tailwind CSS v4 · reka-ui（无头原语）· CVA（变体）· clsx + tailwind-merge 通过 `cn()` · Vite · Vitest · pnpm · Node.js（具体版本以各包 `package.json` 为准）

- **Tailwind v4 配置单一源**：设计令牌/主题变量**只能**改 `packages/shared/src/design-tokens.ts`，禁止手动编辑 `styles.css` 的 `@theme`，禁止创建 `tailwind.config.js`。

## 导入

- `@/` → `src/`
- 内部：相对路径（`../lib/utils`）
- 无头原语：`import { Primitive } from 'reka-ui'`
- 图标：`import { Loader2 } from '@lucide/vue'`
- 国际化：`import { useLocale } from '@/composables/useLocale'`

## 代码风格

### 通用约定

- 不写注释，除非被要求；代码注释禁止反应代码变更，仅描绘当下；禁止魔法数字和硬编码值
- 格式化由 ESLint/Prettier 强制：4 空格缩进、单引号
- 命名：PascalCase 组件（`Button.vue`）· kebab-case 变体（`button-variants.ts`）· camelCase 组合式函数（`useToast.ts`）
- 现在是开发早期0.x，所以无需考虑向后兼容性而造成历史包袱，均应进行破坏式变更

### 组件库红线

- **变体隔离**：变体逻辑提取到同目录 `*-variants.ts`，组件 `import` 引入，不得在 `.vue` 内联定义。
- **类合并**：用 `computed()` 包裹 `cn(...)` 计算类名，严禁在 `<template>` 内联调用 `cn()`。
- **原语复用**：以 reka-ui（原 radix-vue）无头原语为基础，优先复用库内已有组件（`Button` 代替 `<button>`，`Input` 代替 `<input>`），严禁用 native 元素替代。
- **国际化文本**：文本 props 默认值设为 `undefined`，通过 `useLocale().t()` 提供默认值，优先级 `props > t() > zh-CN 默认文本`。
- **Composable 状态只读**：composable 内部状态可变、返回边界 `readonly()`（集合/数组/对象用 `DeepReadonly<Ref<T>>`，标量用 `Readonly<Ref<T>>`）；模块级状态须拆「内部可变 ref + 导出的 readonly 视图」，否则内部写入也被拦截；`useDialogEnhanced` 的 `setPosition`/`setSize` 不强制 clamp（clamp 仅交互路径）。公开配置类状态（v-model 绑定、defineExpose 编程控制如 Combobox.searchQuery）豁免。

## 测试

- 测试文件与源文件同名、`*.test.ts`，一律 kebab-case（`button.test.ts`）
- 专项后缀：键盘交互 `-keyboard.test.ts`（`accordion-keyboard.test.ts`）、无障碍 `.a11y.test.ts`（`button.a11y.test.ts`）
- 与源文件同目录放置（`src/components/<name>/`、`src/composables/`）

## 目录结构（要点）

- `apps/docs/` VitePress 文档站；`docs/` 文档目录（`guides/` 规范、`plans/` 方案、`reports/` 报告、`archive/` 归档，索引见 `docs/index.md`）；`skills/brutxui/` AI 技能（参考文档在 `references/`）
- `packages/ui/`：组件 `src/components/`、组合式函数 `src/composables/`、语言包 `src/locales/`、工具 `src/lib/utils.ts`
- `packages/cli/`：`src/commands/` + `src/lib/`
- `packages/registry/` + `packages/shared/`：构建脚本与组件元数据（自动生成文件见上方表格）
- `scripts/`：门禁调度引擎（`scripts/lib/guard-runner.mjs`）、组件生成器、i18n 校验（`pnpm check:i18n`）、根 CHANGELOG 生成
- `.github/`：GitHub Actions 工作流 `workflows/`（SHA pin 格式 `owner/repo@<40-char-sha> # vN`）+ Dependabot 配置 `dependabot.yml`（自动升级 Actions SHA，每周一开 PR）

## 详细文档

- [提交信息规范](docs/guides/COMMIT_CONVENTION.md)（含 Shell 注意事项）
- [发布流程与 Changelog](docs/guides/RELEASE.md)
- [完整指令参考手册](docs/guides/COMMANDS.md)
- [组件开发指南](docs/guides/COMPONENT_GUIDE.md)
- [视觉系统指南](docs/guides/VISUAL_SYSTEM.md)
- [CVA 变体声明规范](docs/guides/CVA.md)
- [组件文档模板](docs/guides/COMPONENT_DOC_TEMPLATE.md)
- [Tailwind v4 机制说明](docs/guides/TAILWIND_V4_MECHANISMS.md)
- [AI 技能描述](skills/brutxui/SKILL.md)

## 文档落位与方案归档守则

`docs/` 采用“生命周期分流 + 领域镜像分仓”，治理总则见 [DOC_GOVERNANCE.md](docs/guides/DOC_GOVERNANCE.md)，提交前要求见 [COMMIT_CONVENTION.md](docs/guides/COMMIT_CONVENTION.md)：

- **落位分流**：规范在 `guides/`（常青大写）、活跃方案在 `plans/<domain>/`（带 Frontmatter）、历史封存在 `archive/YYYY/<domain>/`、报告在 `reports/`。链接一律相对路径。
- **方案完工必须归档自愈**：凡落地完结 `docs/plans/` 方案（读者读完不用做），**提交前必须运行 `pnpm doc:archive <方案路径>`**，一键完成物理迁移、状态固化（`archived` + 完工日期）、双向链接重算、知识地图自愈与原子暂存；严禁带着未归档方案直接提交代码。详见 [DOC_GOVERNANCE.md](docs/guides/DOC_GOVERNANCE.md) §六 与 [COMMIT_CONVENTION.md](docs/guides/COMMIT_CONVENTION.md)。

## 处理 AI 代码审查报告（open-code-review）

`.ocr-reports/*.md` 基于代码快照生成，未考虑既有测试/文档声明的设计契约。报告建议与测试契约冲突时**先判断哪个是对的**，不是自动跳过、也不是无脑采纳：

- **测试固化设计决策 → 不改代码**：测试名/注释声明了设计意图（`intentionally`/`by design`）即刻意选择，跳过并在代码注释记录理由。
- **测试固化缺陷行为 → 修复 + 更新断言**：测试只是对异常路径的记录、无设计意图，且该行为恰是报告指出的缺陷，则修代码 + 改测试。
- **跳过后的责任**：报告指出的缺口是真实 API 局限，跳过 = 暂不处理，应注释为已知限制；需求演进时应「改代码 + 更新测试」，勿拿测试当挡箭牌。
- 报告基于旧快照是常态，逐条按现行代码核实。

## AGENTS.md 维护约定

- 编写或修改本文件时，对项目约定、发布流程、命令用途、包职责或用户偏好不确定，先询问用户，不要自行补全。
- 只记录已确认的事实和约定；从历史提交、tag 或现有文件推断的内容，先确认再写入。
- 不要把一次性操作经验写成本项目长期规则，除非用户明确确认。

## AI 技能文档维护规范

编写或修改项目内 AI 技能文档（如 `skills/brutxui/SKILL.md`）时：

- **最新状态原则**：只保留最新 API 与编码规范，严禁包含历史版本变迁描述（废弃/不再支持/从某版本起改为什么）。
- **定位对齐原则**：按受众（库开发者 vs. 库使用者）裁剪内容，分发给使用者的技能包只保留使用与集成规范，不混入内部开发规范（如多语言 key 翻译、原生原语隔离）。
- **路径可移植原则**：仓库内文档关联链接统一用相对路径，禁止硬编码本机绝对路径（如 `file:///e:/...`）。
- **非 Claude Code 可调用**：`skills/brutxui/` 面向库使用者/其他 AI，Claude Code harness 不加载它，无需尝试触发；Claude Code 需要组件规范时直接读 `skills/brutxui/SKILL.md` 或对应 references。
