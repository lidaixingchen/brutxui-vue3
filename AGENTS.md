# AGENTS.md — BrutxUI Vue 3

面向 Vue 3 + Tailwind CSS 的 Neo-Brutalist UI 组件库。独立维护的 Vue 3 版本。

## 单体仓库

| 包名 | 路径 | 说明 |
|---------|------|------|
| `brutx-ui-vue` | `packages/ui/` | 核心 Vue 3 组件库 |
| `brutx-vue` | `packages/cli/` | 用于 `init` 和 `add` 的 CLI |
| `brutx-registry-vue` | `packages/registry/` | 编译后的 JSON 注册表 |
| `brutx-shared-vue` | `packages/shared/` | 共享类型和元数据 |
| `docs` | `apps/docs/` | VitePress 文档站点 |

## 命令

```bash
pnpm build          # 构建 UI 包
pnpm lint           # 对所有包执行 lint
pnpm typecheck      # 对所有包执行类型检查
pnpm test           # 运行 UI 测试
pnpm test:watch     # 监视模式运行测试
pnpm release:check  # 执行发布前完整门禁
```

## 发布流程

- 提交信息格式固定为 `release: bump version to <ui-version> for ui and <cli-version> for cli`。如果只发布其中一个包，仍保持该格式，并填写当前实际版本。
- 哪个 NPM 包版本发生变化就发布哪个包；当前公开发布包为 `brutx-ui-vue`（`packages/ui/`）和 `brutx-vue`（`packages/cli/`）。
- tag 命名固定以 UI 包版本为主，格式为 `v<ui-version>`，例如 `v0.6.6`。CLI 版本不单独创建 tag。
- 推送 `main` 和对应的 `v*` tag 后，由云端自动发布。
- 任何影响组件安装、注册表生成或发布产物的改动，都必须同步检查 `packages/ui/`、`packages/shared/`、`packages/registry/`、`packages/cli/` 四处：源码文件、组件元数据、registry 构建脚本/JSON、CLI 安装复制逻辑必须保持一致。
- 发布前必须执行完整检查：`pnpm release:check`。该门禁会覆盖构建、类型检查、lint、UI/CLI 测试、视觉测试、CLI 集成测试、注册表 build/validate、docs build、导出产物检查和 `pnpm pack --dry-run` 包内容审计。
- 如果本地验证 release tag，设置 `RELEASE_TAG=v<ui-version>` 后再运行 `pnpm release:check`；GitHub Actions 中会自动读取 `GITHUB_REF_NAME`。
- 发布前必须检查 `pnpm-lock.yaml` 是否需要同步。若只修改包自身 `version` 且运行 pnpm 后 lockfile 无变化，可以不提交 lockfile；若修改 `dependencies`、`devDependencies`、`peerDependencies` 或 lockfile 自动变化，必须提交同步后的 `pnpm-lock.yaml`。

## AGENTS.md 维护约定

- 编写或修改本文件时，如果对项目约定、发布流程、命令用途、包职责或用户偏好有不确定之处，先询问用户，不要自行补全。
- 只记录已确认的事实和约定；从历史提交、tag 或现有文件推断出的内容，应先向用户确认后再写入。
- 不要把一次性的操作经验写成本项目长期规则，除非用户明确确认。

## 技术栈

Vue 3.5+（`<script setup>`）· TypeScript 6.0+（strict）· Tailwind CSS 4.3+ · reka-ui 2.9+（无头原语）· CVA 0.7+（变体）· clsx + tailwind-merge 通过 `cn()` · Vite 8+ · Vitest 4+ · pnpm 11+ · Node.js 22.5+

## 组件约定

- `<script setup lang="ts">` 配合 `defineProps<T>()` + `withDefaults()`
- 变体在独立的 `*-variants.ts` 文件中使用 CVA 定义，与组件同目录
- 始终通过 `cn()` 合并类——切勿拼接字符串
- 始终使用 `computed()` 进行动态类合并——切勿在模板中调用 `cn()`
- 始终使用 `reka-ui` 实现无障碍无头原语
- 始终从 `src/index.ts` 导出新组件
- 文本 props 默认值设为 `undefined`，通过 `useLocale()` 的 `t()` 函数提供默认文本；优先级链为 `props > t() > zh-CN 回退`
- 可翻译文本使用 `t('componentName.key')` 访问，含插值的使用 `t('key', { param: value })`
- `PricingSection` 是定价区主实现，支持一次性价格与订阅切换；`SaaSPricing` 仅作为基于它的 SaaS 兼容封装，避免新增或维护第二套定价逻辑
- 创建或修改组件时，优先复用现有 BrutxUI 组件，禁止用 native HTML 元素替代已有组件（如用 `Button` 而非 `<button>`、`Select` 系列而非 `<select>`/`<option>`、`Badge` 而非手写 badge `<div>`、`Input` 而非 `<input>`），防止重复造轮子；仅在特殊 ARIA 角色、内联图标切换等无对应组件的场景下方可使用 native 元素

## Neo-Brutalist 视觉系统

详见 [VISUAL_SYSTEM.md](VISUAL_SYSTEM.md)，包含设计令牌、视觉规则、Tailwind 工具类、主题预设和反模式。

## 导入

- `@/` → `src/`
- 内部：相对路径（`../lib/utils`）
- 无头原语：`import { Primitive } from 'reka-ui'`
- 图标：`import { Loader2 } from '@lucide/vue'`
- 国际化：`import { useLocale } from '@/composables/useLocale'`

## 代码风格

- 除非要求否则不写注释 · 无魔法数字 · 无硬编码值
- 4 空格缩进 · 单引号 · PascalCase 组件（`Button.vue`）· kebab-case 变体（`button-variants.ts`）· camelCase 组合式函数（`useToast.ts`）

## Shell 注意事项

- **Bash 工具中 `@'...'@` 不是 here-string**：Claude Code 的 Bash 工具使用 Git Bash（POSIX sh），不是 PowerShell。`@'...'@` 会被当作普通字符串，开头的 `@` 会成为内容的一部分。多行 commit message 应直接用普通引号包裹。
- PowerShell 的 `@'...'@` 单引号 here-string 语法要求结束标记 `'@` 必须位于行首（列 0），前面不能有空格。此语法仅在 PowerShell 终端中有效，在 Bash 工具中无效。

## 安全

- CLI：`resolveAliasPath` 内置 `isSafePath` 验证，所有路径解析自动受保护；`resolveComponentFilePath` 也有独立验证；磁盘根目录边界已处理
- CLI：`readConfig` 包含运行时类型验证，防止恶意 `components.json` 注入
- CSS：`styles.css` 中无重复令牌
- 禁止硬编码密钥

## 目录结构

- **文档网站：** `apps/docs/`（VitePress）
- **核心包：** `packages/ui/`
  - 组件文件：`packages/ui/src/components/`
  - 组合式函数：`packages/ui/src/composables/`
  - 语言包：`packages/ui/src/locales/`
  - 工具函数：`packages/ui/src/lib/utils.ts`、`packages/ui/src/lib/data-table-utils.ts`
  - 测试文件：`packages/ui/src/components/*.test.ts`
  - 构建产物：`packages/ui/dist/`
- **CLI 工具：** `packages/cli/`
  - CLI 操作：`packages/cli/src/commands/`
  - 核心逻辑：`packages/cli/src/lib/`
- **注册表构建器：** `packages/registry/`
  - 组件映射表：`packages/registry/scripts/component-files.ts`（`COMPONENT_FILES`，新增组件在此登记）
  - 构建脚本：`packages/registry/scripts/build-registry.ts`、`validate-registry.ts`
  - 生成的组件 JSON：`packages/registry/registry/`（由 build 生成，勿手动编辑）
- **共享类型：** `packages/shared/`
- **为此UI库创建的Skills：** `skills/`
  - BrutxUI Skill：`skills/brutxui/`
  - 参考文档：`skills/brutxui/references/`
- **方案文档：** `docs/`

## 注册表模式

注册表是**生成式**的：`packages/registry/scripts/build-registry.ts` 遍历 `packages/registry/scripts/component-files.ts` 里的 `COMPONENT_FILES` 映射表，从源码读取、重写导入路径、提取依赖，自动生成 `packages/registry/registry/*.json` 和 `index.json`。**不要手动编写 registry JSON**——未登记的组件不会进入 `index.json`，CLI 也无法安装。

- 新增组件时，在 `packages/registry/scripts/component-files.ts` 的 `COMPONENT_FILES` 中追加条目（声明 `files`、`composables` 等），然后运行 `pnpm --filter brutx-registry-vue build` 生成 JSON。
- `pnpm --filter brutx-registry-vue validate` 会执行三道一致性校验：① 源码目录 ↔ `COMPONENT_FILES`（防止新增组件忘登记）；② `{name}.json` ↔ `index.json`（防止手写孤儿 JSON）；③ 字段完整性。
- ⚠️ **CI 会强制检查**：`validate` 脚本会扫描 `packages/ui/src/components/` 下所有目录，与 `COMPONENT_FILES` 比对。漏登记会导致 CI 失败，必须先登记再提交。
