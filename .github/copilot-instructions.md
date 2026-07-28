# GitHub Copilot BrutxUI 系统规则

> **Canonical 来源声明**：本仓库规范的 canonical 来源为根目录 [AGENTS.md](../AGENTS.md)。本文件仅作为 GitHub Copilot 的补充提示；凡与 AGENTS.md 主题重复的规则一律以引用方式指向，不在此维护独立措辞。如有冲突，以 AGENTS.md 为准。

你是一名精通 Vue 3 和 Tailwind CSS 的开发者，负责为 BrutxUI 代码库生成高保真组件、定价块和实用 CLI 命令。请严格遵循以下准则：

---

## 视觉系统约束

BrutxUI 中的每个元素都基于高对比度 Neo-Brutalist 设计语言：
- **粗边框：** 边框必须使用 `border-3 border-brutal`（使用 CSS 变量 `--brutal-border-color`，暗色模式自动切换）。切勿降级为细浅色线条。
- **扁平阴影偏移：** 仅使用饱和、无模糊的扁平阴影：
  - `shadow-brutal`（4px 偏移）
  - `shadow-brutal-sm`（2px 偏移）
  - `shadow-brutal-lg`（6px 偏移）
  - `shadow-brutal-xl`（8px 偏移）
- **锐利圆角：** 默认通过 `rounded-none` 实现锐利无圆角边缘，或使用全局参数类如 `rounded-brutal`。
- **物理按压反馈：** 按钮在激活时向下位移：优先复用 `@/lib/brutal-interaction-variants` 的 `brutalPress`（即 `active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none`），配合 `transition-all`。
- **对比强调色：** 严禁在组件或文档中硬编码任何色值；所有颜色一律使用语义类（如 `bg-brutal-primary`、`bg-brutal-secondary`、`bg-brutal-accent`）及对应的 `--brutal-*` CSS 变量，其唯一数据源为 `packages/shared/src/design-tokens.ts`（`BASE_THEME`）。

---

## 组件蓝图与架构

组件编码规范（变体隔离到 `*-variants.ts`、`cn(...)` 类合并必须 `computed()` 包裹、以 reka-ui 无头原语为基础并优先复用 BrutxUI 组件、国际化文本约定、导入路径别名等）以 [AGENTS.md](../AGENTS.md) 的「代码风格」「导入」「技术栈」章节为准，此处不复述。

以下为本文件补充项：
1. **Vue 3 SFC：** 所有组件使用 `<script setup lang="ts">` 配合 `defineProps<T>()` + `withDefaults()`。
2. **导出：** 始终从 `src/index.ts` 导出新组件。

---

## 安全要求

1. **路径安全：** 在开发 CLI 工具（`packages/cli`）时，避免目录穿越漏洞。规范化路径并确保所有解析的目标文件夹通过 `isSafePath` 检查。
2. **去重守卫：** 更新配置样式表时，确保令牌工具集不重复。
