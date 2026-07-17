# AGENTS.md — BrutxUI Vue 3

面向 Vue 3 + Tailwind CSS 的 Neo-Brutalist UI 组件库。独立维护的 Vue 3 版本。

> [!WARNING]
> **禁止手动编辑以下自动生成/自动注入的文件**。所有对这些文件的变更必须通过特定脚本或上游源文件触发：
> - `packages/ui/registry-manifest.json`：由 `prebuild-scan.ts` 自动生成，请通过 `pnpm build` 或 `pnpm --filter brutx-ui-vue prebuild:scan` 触发更新。
> - `packages/ui/src/styles.css`：其中的 `@theme` 变量声明和运行时 tokens（标记有 `@brutx:theme-tokens` 和 `@brutx:root-tokens`）由 `generate-styles-tokens.ts` 自动注入，其唯一数据源为 `packages/shared/src/design-tokens.ts`。
> - `packages/registry/registry/` 目录下的所有 JSON 文件：由注册表构建器自动编译，请勿手动编辑。
> - `packages/registry/registry/deps.dot` 与 `deps.json`：由 validate 脚本自动生成。

## 单体仓库

| 包名                   | 路径                   | 说明                      |
| -------------------- | -------------------- | ----------------------- |
| `brutx-ui-vue`       | `packages/ui/`       | 核心 Vue 3 组件库            |
| `brutx-vue`          | `packages/cli/`      | 用于 `init` 和 `add` 的 CLI |
| `brutx-registry-vue` | `packages/registry/` | 编译后的 JSON 注册表           |
| `brutx-shared-vue`   | `packages/shared/`   | 共享类型和元数据                |
| `docs`               | `apps/docs/`         | VitePress 文档站点          |

## 命令

```bash
pnpm build          # 构建 UI 包
pnpm lint           # 对所有包执行 lint
pnpm typecheck      # 对所有包执行类型检查
pnpm test           # 运行 UI 测试
pnpm test:watch     # 监视模式运行测试
pnpm release        # 构建门禁 + changeset publish
pnpm changelog      # 生成根 CHANGELOG.md 新版本段（详见 docs/RELEASE.md）
pnpm changelog:dry  # 干跑：仅打印不写文件
```

### 脚手架（组件与页面生成）

在**根目录**下运行，严禁手动从零拼装基础骨架文件：
```bash
pnpm generate:component    # 自动生成新组件骨架（含组件、variants、测试文件）
pnpm generate:composable   # 自动生成 Composition API 组合式函数
pnpm generate:page         # 自动生成文档测试页面
```

### Registry 包命令

```bash
pnpm --filter brutx-registry-vue build          # 编译 registry JSON（含增量缓存）
pnpm --filter brutx-registry-vue build:watch    # watch 模式：监听 UI 源码变化增量 rebuild
pnpm --filter brutx-registry-vue build:verify   # 增量与全量 build 对照验证
pnpm --filter brutx-registry-vue build:bench    # 输出每组件构建耗时与总耗时
pnpm --filter brutx-registry-vue validate       # 校验 registry 完整性 + 依赖图
pnpm --filter brutx-registry-vue validate -- --graph  # 额外导出 deps.dot / deps.json
```

watch 模式也可通过 `BRUTX_WATCH=1` 环境变量激活，详见 [build-registry.ts](packages/registry/scripts/build-registry.ts) 的 `runWatch()`。

### 命令执行与开发自检约定
- **包管理器限定**：本单体仓库开发阶段仅允许使用 `pnpm`，严禁使用 `npm` 或 `yarn` 进行本地依赖安装与脚本执行，以防生成不一致的 lockfile。
- **校验与测试最小化（核心）**：为了防止过度占用开发机资源，**严禁在开发阶段运行全局重型校验与全量测试**（如根目录下的全局 `pnpm test`、`pnpm lint`、`pnpm typecheck`）。必须精准到修改的文件/包：
  - **测试最小化**：仅针对当前修改的文件或特定目录运行测试，使用带具体路径的命令，例如：
    ```bash
    pnpm --filter brutx-ui-vue test src/components/button/Button.test.ts
    ```
  - **Lint 最小化**：仅对修改的文件进行 lint，例如使用：
    ```bash
    npx eslint packages/ui/src/components/button/Button.vue --fix
    ```
  - **Typecheck 最小化**：仅对发生修改的子包运行类型检查，而不是全局检查，例如：
    ```bash
    pnpm --filter brutx-ui-vue typecheck
    ```


## 技术栈

Vue 3.5+（`<script setup>`）· TypeScript 6.0+（strict）· Tailwind CSS 4.3+ · reka-ui 2.9+（无头原语）· CVA 0.7+（变体）· clsx + tailwind-merge 通过 `cn()` · Vite 8+ · Vitest 4+ · pnpm 11+ · Node.js 22.5+

- **Tailwind v4 配置单一源**：所有设计令牌、主题变量变更**只能**在 `packages/shared/src/design-tokens.ts` 中修改，禁止手动在 `styles.css` 中编辑 `@theme` 部分，禁止创建 `tailwind.config.js`。

## 导入

- `@/` → `src/`
- 内部：相对路径（`../lib/utils`）
- 无头原语：`import { Primitive } from 'reka-ui'`
- 图标：`import { Loader2 } from '@lucide/vue'`
- 国际化：`import { useLocale } from '@/composables/useLocale'`

## 代码风格

- 除非要求否则不写注释 · 无魔法数字 · 无硬编码值
- 4 空格缩进 · 单引号 · PascalCase 组件（`Button.vue`）· kebab-case 变体（`button-variants.ts`）· camelCase 组合式函数（`useToast.ts`）
- **变体隔离**：变体逻辑必须提取到同目录的独立的 `*-variants.ts` 中，组件中 `import` 引入，不得在 `.vue` 中内联定义。
- **类合并**：必须使用 `computed()` 包裹 `cn(...)` 进行类名计算，严禁在 `<template>` 模板中直接内联调用 `cn()`（会引发重复计算与性能问题）。
- **无障碍与组件复用**：必须以 `reka-ui`（原 `radix-vue`）的无头原语作为基础。优先复用库中已有的 BrutxUI 组件（如使用 `Button` 代替 `<button>`，`Input` 代替 `<input>`），严禁使用 native 元素替代。
- **国际化文本**：文本 props 默认值必须设为 `undefined`，必须通过 `useLocale().t()` 提供翻译默认值，优先级为：`props > t() > zh-CN 默认文本`。

## Shell git注意事项

详见 [提交信息规范 - Shell 注意事项](docs/COMMIT_CONVENTION.md#shell-注意事项)。

## 目录结构

- **文档网站：** `apps/docs/`（VitePress）
- **核心包：** `packages/ui/`
  - 组件文件：`packages/ui/src/components/`
  - 组合式函数：`packages/ui/src/composables/`
  - 语言包：`packages/ui/src/locales/`
  - 工具函数：`packages/ui/src/lib/utils.ts`、`packages/ui/src/lib/data-table-utils.ts`
  - 设计令牌：`packages/shared/src/design-tokens.ts`（`BASE_THEME` 单一数据源）；`packages/ui/src/styles.css` 的 `@theme` 变量声明（含 fallback，标记 `@brutx:theme-tokens`）与 `:root`/`.dark` 块（纯运行时值，标记 `@brutx:root-tokens`）均由 `packages/ui/scripts/generate-styles-tokens.ts` 在 `pnpm prebuild:tokens` 时从该文件注入（勿手动编辑）
  - 测试文件：`packages/ui/src/components/*.test.ts`
  - 构建产物：`packages/ui/dist/`
- **CLI 工具：** `packages/cli/`
  - CLI 操作：`packages/cli/src/commands/`
  - 核心逻辑：`packages/cli/src/lib/`
  - 审计日志：`packages/cli/src/lib/audit.ts`（`.brutx/audit.log` JSONL，记录 add/remove/update/diff 操作）
  - 全局 dry-run：`packages/cli/src/lib/global-dry-run.ts`（`BRUTX_DRY_RUN=1` 或 `--dry-run` 全局 flag 激活）
  - verbose 等级：`packages/cli/src/lib/logger.ts` 支持 `-v`/`-vv`/`-vvv` 与 `BRUTX_VERBOSE` 环境变量
- **注册表构建器：** `packages/registry/`
  - 组件清单（自动生成）：`packages/ui/registry-manifest.json`（由 `packages/ui/scripts/prebuild-scan.ts` 通过 AST 扫描 `packages/ui/src/components/` 自动生成，已接入 `pnpm build`；勿手动编辑）
  - 人工元数据：`packages/shared/src/component-metadata.ts`（`COMPONENT_METADATA`，由 `packages/shared/src/components.ts` 的 `COMPONENTS` 派生 title/description/category 等）
  - 扫描器：`packages/shared/src/scan-component-files.ts`（AST 依赖发现，供 prebuild-scan 调用）
  - 构建脚本：`packages/registry/scripts/build-registry.ts`（build 时合并 manifest + metadata；含 watch 模式 `runWatch()`）、`validate-registry.ts`（build 时校验 + `--graph` 导出依赖图）
  - 依赖分析工具：`packages/registry/scripts/validate-utils.ts`（`classifyRegistryImport` 区分 type-only / `buildDependencyGraph` 构建依赖图）
  - 生成的组件 JSON：`packages/registry/registry/`（由 build 自动生成，勿手动编辑）
  - 依赖图产物（自动生成）：`packages/registry/registry/deps.dot`、`deps.json`（由 `validate --graph` 生成，已 gitignore）
- **共享类型：** `packages/shared/`
- **为此UI库创建的Skills：** `skills/`
  - BrutxUI Skill：`skills/brutxui/`
  - 参考文档：`skills/brutxui/references/`
- **方案文档：** `docs/`
- **仓库脚本：** `scripts/`
  - 根 CHANGELOG 生成：`scripts/release/generate-changelog.mjs`（由 `pnpm changelog` / `pnpm changelog:dry` 调用，详见 [docs/RELEASE.md](docs/RELEASE.md#根-changelogmd-生成)）
  - i18n 镜像校验：`scripts/check-i18n.mjs`（由 `pnpm check:i18n` 调用）
  - 组件生成器：`scripts/generate.ts`（由 `pnpm generate:component` 等调用）
- **仓库基础设施：** `.github/`
  - GitHub Actions 工作流：`.github/workflows/`（新增 workflow 时使用 SHA pin 格式 `owner/repo@<40-char-sha> # vN`，由 dependabot 自动维护后续升级）
  - Dependabot 配置：`.github/dependabot.yml`（自动管理 GitHub Actions 的 SHA pin 升级，每周一开 PR）

## 详细文档

- [提交信息规范](docs/COMMIT_CONVENTION.md)
- [发布流程与 Changelog](docs/RELEASE.md)
- [组件开发指南](docs/COMPONENT_GUIDE.md)
- [视觉系统指南](docs/VISUAL_SYSTEM.md)
- [CVA 变体声明规范](docs/CVA.md)
- [组件文档模板](docs/COMPONENT_DOC_TEMPLATE.md)
- [AI 技能描述](skills/brutxui/SKILL.md)

## AGENTS.md 维护约定

- 编写或修改本文件时，如果对项目约定、发布流程、命令用途、包职责或用户偏好有不确定之处，先询问用户，不要自行补全。
- 只记录已确认的事实和约定；从历史提交、tag 或现有文件推断出的内容，应先向用户确认后再写入。
- 不要把一次性的操作经验写成本项目长期规则，除非用户明确确认。

## AI 技能文档维护规范

在编写或修改项目内的 AI 技能文档（如 `skills/brutxui/SKILL.md` 等）时，应遵循以下约定：
- **最新状态原则**：应仅提供并保留最新的 API 和编码规范，严禁包含任何历史版本的变迁描述（如不再支持、废弃了哪些、从 xx 版本起改为什么等），防止 AI 在阅读时混淆。
- **定位对齐原则**：必须根据技能文档的实际受众（库开发者 vs. 库使用者）进行内容裁剪。分发给使用者的技能包中仅保留**库使用与集成规范**（如组件引用、类名合并、外部配置等），不得混入库底层的**内部开发规范**（如组件内部多语言 key 翻译、原生原语隔离等）。
- **路径可移植原则**：对于 Git 仓库托管的文档，其内部关联链接**必须统一使用相对路径**（例如：`[组件词典](./references/components-dictionary.md)`）。禁止硬编码本机特有的绝对路径（如 `file:///e:/project/...`），以保证文档在不同开发环境下的可移植性。