# AGENTS.md — BrutxUI Vue 3

面向 Vue 3 + Tailwind CSS 的 Neo-Brutalist UI 组件库。

## 自动生成文件（勿手动编辑）

| 文件 | 触发更新的命令 |
| --- | --- |
| `packages/ui/registry-manifest.json` | `pnpm build` / `prebuild:scan`（lint、typecheck 也会前置执行，幂等） |
| `packages/ui/src/styles.css` 的 `@theme` 与运行时 tokens | `prebuild:tokens`（唯一数据源 `packages/shared/src/design-tokens.ts`） |
| `packages/registry/registry/*.json`、`deps.dot`、`deps.json` | registry build / `validate --graph` |

## 单体仓库

| 包名 | 路径 | 说明 |
| --- | --- | --- |
| `brutx-ui-vue` | `packages/ui/` | 核心 Vue 3 组件库 |
| `brutx-vue` | `packages/cli/` | 用于 `init` 和 `add` 的 CLI |
| `brutx-registry-vue` | `packages/registry/` | 编译后的 JSON 注册表 |
| `brutx-shared-vue` | `packages/shared/` | 共享类型和元数据 |
| `docs` | `apps/docs/` | VitePress 文档站点 |

## 命令

```bash
pnpm build          # Turbo 并行构建所有包（--filter <pkg> build 仅构建指定包）
pnpm lint           # 对所有包执行 lint
pnpm typecheck      # 对所有包执行类型检查
pnpm test           # 运行所有子包测试（--filter <pkg> test 仅运行指定包）
pnpm test:watch     # 监视模式运行测试
pnpm release        # 构建门禁 + changeset publish
pnpm changelog      # 生成根 CHANGELOG.md 新版本段（详见 docs/RELEASE.md）
pnpm changelog:dry  # 干跑：仅打印不写文件
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

watch 实现见 `packages/registry/scripts/build-registry.ts` 的 `runWatch()`；其余命令（`build:verify`、`bench`）见 registry 包 scripts。

### 开发自检约定

- **包管理器限定**：开发阶段仅允许 `pnpm`，严禁 `npm`/`yarn`（避免不一致 lockfile）。
- **校验最小化（核心）**：严禁在开发阶段运行全局 `pnpm test`/`lint`/`typecheck`，只跑改动范围：

| 校验 | 最小化命令 |
| --- | --- |
| 测试 | `pnpm --filter <pkg> test <相对路径>`（如 `src/components/button/Button.test.ts`） |
| lint | `npx eslint <file> --fix` |
| typecheck | `pnpm --filter <pkg> typecheck` |

## 技术栈

Vue 3.5+（`<script setup>`）· TypeScript 6.0+（strict）· Tailwind CSS 4.3+ · reka-ui 2.9+（无头原语）· CVA 0.7+（变体）· clsx + tailwind-merge 通过 `cn()` · Vite 8+ · Vitest 4+ · pnpm 11+ · Node.js 22.5+

- **Tailwind v4 配置单一源**：设计令牌/主题变量**只能**改 `packages/shared/src/design-tokens.ts`，禁止手动编辑 `styles.css` 的 `@theme`，禁止创建 `tailwind.config.js`。

## 导入

- `@/` → `src/`
- 内部：相对路径（`../lib/utils`）
- 无头原语：`import { Primitive } from 'reka-ui'`
- 图标：`import { Loader2 } from '@lucide/vue'`
- 国际化：`import { useLocale } from '@/composables/useLocale'`

## 代码风格

- 除非要求否则不写注释 · 无魔法数字 · 无硬编码值
- 4 空格缩进 · 单引号 · PascalCase 组件（`Button.vue`）· kebab-case 变体（`button-variants.ts`）· camelCase 组合式函数（`useToast.ts`）
- **变体隔离**：变体逻辑提取到同目录 `*-variants.ts`，组件 `import` 引入，不得在 `.vue` 内联定义。
- **类合并**：用 `computed()` 包裹 `cn(...)` 计算类名，严禁在 `<template>` 内联调用 `cn()`。
- **无障碍与组件复用**：以 `reka-ui`（原 radix-vue）无头原语为基础，优先复用库内已有组件（`Button` 代替 `<button>`，`Input` 代替 `<input>`），严禁用 native 元素替代。
- **国际化文本**：文本 props 默认值设为 `undefined`，通过 `useLocale().t()` 提供默认值，优先级 `props > t() > zh-CN 默认文本`。

## 目录结构（要点）

- `apps/docs/` VitePress 文档站；`docs/` 方案文档；`skills/brutxui/` AI 技能（参考文档在 `references/`）
- `packages/ui/`：组件 `src/components/`、组合式函数 `src/composables/`、语言包 `src/locales/`、工具 `src/lib/utils.ts`
- `packages/cli/`：`src/commands/` + `src/lib/`（`audit.log` 审计、`BRUTX_DRY_RUN=1` 全局 dry-run、`-v/-vv/-vvv` 与 `BRUTX_VERBOSE`）
- `packages/registry/` + `packages/shared/`：构建脚本与组件元数据（自动生成文件见上方表格）
- `scripts/`：组件生成器、i18n 校验（`pnpm check:i18n`）、根 CHANGELOG 生成
- `.github/`：GitHub Actions 工作流 `workflows/`（SHA pin 格式 `owner/repo@<40-char-sha> # vN`）+ Dependabot 配置 `dependabot.yml`（自动升级 Actions SHA，每周一开 PR）

## 详细文档

- [提交信息规范](docs/COMMIT_CONVENTION.md)（含 Shell 注意事项）
- [发布流程与 Changelog](docs/RELEASE.md)
- [组件开发指南](docs/COMPONENT_GUIDE.md)
- [视觉系统指南](docs/VISUAL_SYSTEM.md)
- [CVA 变体声明规范](docs/CVA.md)
- [组件文档模板](docs/COMPONENT_DOC_TEMPLATE.md)
- [AI 技能描述](skills/brutxui/SKILL.md)

## AGENTS.md 维护约定

- 编写或修改本文件时，对项目约定、发布流程、命令用途、包职责或用户偏好不确定，先询问用户，不要自行补全。
- 只记录已确认的事实和约定；从历史提交、tag 或现有文件推断的内容，先确认再写入。
- 不要把一次性操作经验写成本项目长期规则，除非用户明确确认。

## AI 技能文档维护规范

编写或修改项目内 AI 技能文档（如 `skills/brutxui/SKILL.md`）时：

- **最新状态原则**：只保留最新 API 与编码规范，严禁包含历史版本变迁描述（废弃/不再支持/从某版本起改为什么）。
- **定位对齐原则**：按受众（库开发者 vs. 库使用者）裁剪内容，分发给使用者的技能包只保留使用与集成规范，不混入内部开发规范（如多语言 key 翻译、原生原语隔离）。
- **路径可移植原则**：仓库内文档关联链接统一用相对路径，禁止硬编码本机绝对路径（如 `file:///e:/...`）。
