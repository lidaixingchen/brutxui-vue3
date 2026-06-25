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
- `PricingSection` 是定价区主实现，支持一次性价格与订阅切换；`SaaSPricing` 仅作为基于它的 SaaS 兼容封装，避免新增或维护第二套定价逻辑

## Neo-Brutalist 视觉系统

### 设计令牌（`src/styles.css` → `:root` / `.dark`）

| 令牌 | 亮色 | 暗色 | 用途 |
|-------|-------|------|------|
| `--brutal-border-width` | `3px` | `3px` | 边框粗细 |
| `--brutal-border-color` | `#000000` | `#ffffff` | 边框颜色 |
| `--brutal-shadow-offset-x` | `4px` | `4px` | 阴影 X 偏移 |
| `--brutal-shadow-offset-y` | `4px` | `4px` | 阴影 Y 偏移 |
| `--brutal-shadow-color` | `#000000` | `#ffffff` | 阴影颜色 |
| `--brutal-radius` | `0px` | `0px` | 边框圆角 |
| `--brutal-bg` | `#ffffff` | `#141414` | 背景 |
| `--brutal-fg` | `#000000` | `#ffffff` | 前景 |
| `--brutal-primary` | `#FF6B6B` | `#FF6B6B` | 主色（珊瑚红） |
| `--brutal-secondary` | `#4ECDC4` | `#4ECDC4` | 辅助色（薄荷青） |
| `--brutal-accent` | `#FFE66D` | `#FFE66D` | 强调色（黄色） |
| `--brutal-destructive` | `#EF476F` | `#EF476F` | 危险色 |
| `--brutal-success` | `#7FB069` | `#7FB069` | 成功色 |
| `--brutal-info` | `#4A90D9` | `#3B82F6` | 信息提示色 |
| `--brutal-muted` | `#f3f4f6` | `#1e1e1e` | 柔和背景 |
| `--brutal-ring` | `#000000` | `#ffffff` | 焦点环 |
| `--brutal-pressed-offset` | `2px` | `2px` | 激活按压偏移 |

### 视觉规则

1. **边框：** `border-3 border-brutal`——禁止细边框或浅色 slate/gray 边框
2. **阴影：** 仅使用 `shadow-brutal*`——禁止模糊/扩散阴影（`shadow-md`、`shadow-lg` 被禁止）
3. **圆角：** `rounded-brutal`——禁止硬编码 `rounded-md` 等
4. **按压：** `active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all`——交互元素必须在按压时产生位移，不能感觉迟钝
5. **悬停：** `hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5`
6. **颜色：** 使用 `--brutal-*` CSS 变量——禁止硬编码任意颜色

## CVA 变体文件
[CVA.md](CVA.md)

### Tailwind 工具类

- 边框：`border-3`、`border-brutal`、`rounded-brutal`
- 阴影：`shadow-brutal`、`shadow-brutal-sm`、`shadow-brutal-lg`、`shadow-brutal-xl`
- 颜色：`bg-brutal-bg`、`text-brutal-fg`、`bg-brutal-primary`、`bg-brutal-secondary`、`bg-brutal-accent`、`bg-brutal-destructive`、`bg-brutal-success`、`bg-brutal-info`、`bg-brutal-muted`

### 主题预设

`.theme-classic`（默认）· `.theme-pastel`（柔和，8px 圆角）· `.theme-mono`（灰度，4px 边框）

### 文档主题实验室

`apps/docs/guide/theme-playground.md` 和 `apps/docs/.vitepress/theme/components/ThemePlayground.vue` 是 docs-only 的主题调试工具，用于生成 `.theme-custom` CSS、预览 token 效果、检查对比度和 token 覆盖率。除非用户明确要求沉淀为可安装组件，否则不要把它加入 `packages/ui`、registry 或 `useTheme()` 的公开 API。

## 反模式（禁止）

1. **禁止软阴影：** 不要使用 Tailwind 默认的 `shadow-md` 或 `shadow-lg`。使用 `shadow-brutal` 或 `shadow-brutal-lg`。
2. **禁止圆角边框：** 不要将 `rounded-md` 或 `rounded-lg` 用作默认变体，除非通过主题自定义样式类明确柔化。使用 `rounded-none` 或 `rounded-brutal`。
3. **禁止暗淡边框：** 不要将 `border-slate-100` 或 `border-slate-200` 等浅色边框用于主边框。边框必须保持粗重（`border-3 border-brutal`）。
4. **禁止缺少按压反馈：** 交互式按钮必须在点击时产生位移。不要让激活状态感觉迟钝或无生气。
5. **禁止路径穿越：** 在编译或编辑 CLI 依赖时，绝不允许相对路径遍历（`..`）逃逸安全工作区。请规范化并检查路径。

## 导入

- `@/` → `src/`
- 内部：相对路径（`../lib/utils`）
- 无头原语：`import { Primitive } from 'reka-ui'`
- 图标：`import { Loader2 } from '@lucide/vue'`
- 国际化：`import { useLocale } from '@/composables/useLocale'`

## 代码风格

- 除非要求否则不写注释 · 无魔法数字 · 无硬编码值
- 可翻译文本使用 `t('componentName.key')` 访问，含插值的使用 `t('key', { param: value })`
- 4 空格缩进 · 单引号 · PascalCase 组件（`Button.vue`）· kebab-case 变体（`button-variants.ts`）· camelCase 组合式函数（`useToast.ts`）

## 安全

- CLI：规范化路径，使用 `isSafePath` 验证
- CSS：`styles.css` 中无重复令牌
- 禁止硬编码密钥

## 目录结构

- **文档网站：** `apps/docs/`（VitePress）
- **核心包：** `packages/ui/`
  - 组件文件：`packages/ui/src/components/`
  - 组合式函数：`packages/ui/src/composables/`
  - 语言包：`packages/ui/src/locales/`
  - 工具函数：`packages/ui/src/lib/utils.ts`
  - 测试文件：`packages/ui/src/components/*.test.ts`
  - 构建产物：`packages/ui/dist/`
- **CLI 工具：** `packages/cli/`
  - CLI 操作：`packages/cli/src/commands/`
  - 核心逻辑：`packages/cli/src/lib/`
- **注册表构建器：** `packages/registry/`
  - 组件 JSON：`packages/registry/registry/`
  - 构建脚本：`packages/registry/scripts/`
- **共享类型：** `packages/shared/`
- **为此UI库创建的Skills：** `skills/`
  - BrutxUI Skill：`skills/brutxui/`
  - 参考文档：`skills/brutxui/references/`
- **方案文档：** `docs/`

## 注册表模式

- 创建新组件或块时，始终将其配置模式追加到 `packages/registry/registry/`。然后通过 `pnpm --filter brutx-registry-vue build` 和 `pnpm --filter brutx-registry-vue validate` 编译并验证模式。
