# 组件文档模板

本文件是 BrutxUI 组件文档的标准模板。新建组件文档时，请复制 `apps/docs/components/` 下的对应文件并按此模板填写。

**英文镜像强制要求**：每个组件文档必须成对维护——中文 `apps/docs/components/{name}.md` + 英文 `apps/docs/en/components/{name}.md`（同文件名、英文内容），与 [COMPONENT_GUIDE.md](COMPONENT_GUIDE.md)「Workflow Checklist」第 7 步一致；提交前运行 `pnpm check:i18n:strict` 校验镜像对称性。

## 函数式 API 页面

公开组件组若只提供内部挂载容器，而用户实际通过组合式函数操作，应在 `apps/docs/.vitepress/api-content/migrations.json` 的 `functionalGroups` 中声明函数入口与成员。目录将其标记为 `functional-page` / `functional-api`，组件 API 编译器会拒绝对此类页面调用 `<ComponentApi>`。

函数式页面在 API 参考中说明容器与公开入口的职责，在对应组合式函数小节列出声明的入口和全部方法；选项对象与导出类型放在数据类型小节。不要将函数选项写成容器 Props，也不要为没有公开成员的容器合成组件 API。

---

## 模板

````markdown
---
title: {ComponentName} {中文名}
description: {一句话描述组件功能和特点，20-50 字}
---

# {ComponentName} {中文名}

{2-3 句话描述：组件用途、基于哪个无头原语构建、核心特性}

## 预览

<ComponentPreview>
  <{ComponentName}Demo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="{component-name}" />

<!-- 如果需要额外依赖，在安装代码块下方说明 -->
<!-- 示例：
**需要额外安装依赖：**

```bash
pnpm add vee-validate @vee-validate/zod zod
```
-->

## 用法

```vue
<script setup>
import { {ComponentName} } from 'brutx-ui-vue'
</script>

<template>
    <{ComponentName} variant="default">
        基础用法示例
    </{ComponentName}>
</template>
```

## 变体

<!-- 如组件有变体，用表格展示；无变体则删除此章节 -->

| 变体 | 说明 |
|------|------|
| `default` | 标准背景色 |
| `primary` | Primary（珊瑚色）背景 |

```vue
<template>
    <{ComponentName} variant="primary">Primary 变体</{ComponentName}>
</template>
```

## 尺寸

<!-- 如组件有尺寸，用表格展示；无尺寸则删除此章节 -->

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸 |
| `default` | 默认尺寸 |
| `lg` | 大尺寸 |

## 子组件

<!-- 复合组件（如 Dialog、Form）必须列出所有子组件；单组件删除此章节 -->

| 组件 | 说明 |
|------|------|
| `{ComponentName}Root` | 根组件 |
| `{ComponentName}Trigger` | 触发器 |
| `{ComponentName}Content` | 内容容器 |

## 数据类型

<!-- 如组件有复杂的 TypeScript 类型定义（如 KanbanColumn、DataTableColumn），在此列出；简单组件删除此章节 -->

```ts
interface ExampleItem {
    id: string
    title: string
    description?: string
}
```

## 导出类型

<!-- 如组件从 index.ts 导出独立的 TypeScript 类型（如 SelectionMode、CheckState），在此列出；无则删除此章节 -->

```ts
import type { ExampleMode, ExampleState } from 'brutx-ui-vue'
```

## 组合式函数

<!-- 如提供了 composable，在此说明 API；无则删除此章节 -->
<!-- 注意：若组件同时有 composable 和 defineExpose，本章节侧重"独立使用"场景，"程序化控制"章节侧重"通过 ref 调用组件实例"场景 -->

```ts
import { use{ComponentName} } from 'brutx-ui-vue'

const {
    state,    // Ref<State> - 当前状态
    action,   // () => void - 执行操作
} = use{ComponentName}()
```

### 选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `option` | `type` | `value` | 说明 |

### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `state` | `Ref<State>` | 当前状态 |
| `action` | `() => void` | 执行操作 |

## 程序化控制

<!-- 如组件通过 defineExpose 暴露 API，在此说明；无则删除此章节 -->
<!-- 若同时有 composable，本章节仅说明通过 ref 调用组件实例的 API -->

```vue
<script setup>
import { ref } from 'vue'
import { {ComponentName} } from 'brutx-ui-vue'

const componentRef = ref()
</script>

<template>
    <{ComponentName} ref="componentRef" />
    <button @click="componentRef?.someMethod()">控制</button>
</template>
```

### 暴露的 API

通过上方的 `<ComponentApi>` 展示实例暴露的成员。本节保留调用示例与使用说明，不另维护重复的成员表格。

## API 参考

<ComponentApi name="{component-name}" />

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 触发，`Escape` 关闭
- **ARIA 属性**：自动管理 `aria-expanded`、`aria-controls` 等
- **焦点管理**：打开时焦点锁定在组件内，关闭时恢复焦点
- **动效降级**：尊重 `prefers-reduced-motion` 系统设置，自动禁用或简化动画（如适用）

## 样式定制

<!-- 如组件支持 CSS 变量自定义，在此列出；无则删除此章节 -->

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--brutal-{component}-duration` | `200ms` | 动画时长 |
| `--brutal-{component}-gap` | `1rem` | 间距 |

## 常见问题

<!-- 可选章节，复杂组件推荐添加；多个问题时保持 Q/A 格式一致 -->

**Q: 如何自定义动画时长？**

A: 通过 CSS 变量覆盖：

```css
:root {
    --brutal-transition-duration: 200ms;
}
```

**Q: 如何与 Form 库集成？**

A: 使用 `v-model` 绑定值，或通过 `@change` 事件手动更新表单状态。
````

---

## 章节顺序规范

| 顺序 | 章节 | 是否必须 | 说明 |
| ---- | ---- | -------- | ---- |
| 1 | 预览 | ✅ | 必须包含 `<ComponentPreview>` |
| 2 | 安装 | ✅ | 使用 `<InstallationTabs>` 组件 |
| 3 | 用法 | ✅ | 至少一个完整示例 |
| 4 | 变体 | 按需 | 有变体时必须 |
| 5 | 尺寸 | 按需 | 有尺寸时必须 |
| 6 | 子组件 | 复合组件必须 | 列出所有子组件 |
| 7 | 数据类型 | 按需 | 有复杂 TypeScript 类型时必须 |
| 8 | 导出类型 | 按需 | 从 index.ts 导出独立类型时必须 |
| 9 | 组合式函数 | 按需 | 提供 composable 时必须 |
| 10 | 程序化控制 | 按需 | 通过 defineExpose 暴露 API 时必须 |
| 11 | API 参考 | ✅ | 使用 `<ComponentApi>` 展示属性、事件、插槽与暴露成员 |
| 12 | 可访问性 | ✅ | 统一使用此名称 |
| 13 | 样式定制 | 按需 | 支持 CSS 变量自定义时必须 |
| 14 | 常见问题 | 推荐 | 复杂组件建议添加 |

> **CI 强制说明**：本章节规范、`<ComponentPreview>`、`<InstallationTabs>` 和已迁移页面的真实 `<ComponentApi>` 调用由章节检查器校验。未迁移页面可在完成数据语义与中英文复核前保留原 API 表格。

## API 数据注入与双语维护

文档页只写稳定的组件组名称和可选范围。VitePress 编译器会从组件目录解析页面对应的 API 组和站点语言，为本页静态导入 `api-generated/{slug}.{zh-CN|en}.json`，再传给 `<ComponentApi>`。不要在 Markdown 中手动导入生成 JSON，也不要用变量绑定组件名、子组件名或分类；名称和范围必须可静态校验。

`name` 接受目录中的组件组 slug，`subcomponent` 固定展示一个公开子组件，`defaultTab` 设置初始分类，`instance` 为同页重复调用提供唯一前缀，`search="false"` 可将单次 API 调用排除在本地搜索之外。搜索内容取当前页面实际展示范围内的成员名称、类型和说明，搜索结果链接到页面上对应成员的锚点。

主表展示成员名称、易读类型、默认值与使用说明；原始类型、关联类型定义、默认值声明与解析结果、源码位置放在默认收起的成员详情中。属性分类显示默认值列，事件、插槽与暴露成员显示签名或类型。正文负责章节标题，单体组件的 API 区域直接展示分类与成员，复合组件按公开子组件分组。

默认值区分未声明、显式 `undefined`、静态解析结果、按实例调用的工厂函数与运行时回退。关键使用条件写在主表说明或 `notes` 中，供读者直接查阅。类型显示由提取器依据 TypeScript 语义生成，完整原始类型仍可在详情中查看和复制。

服务端输出完整成员与原生折叠详情；搜索、组件选择与分类筛选在页面挂载后显示。禁用 JavaScript 时仍可阅读全部成员并展开详情。

中文与英文镜像必须使用相同的组件组和成员范围；成员说明分别写入中文、英文语义资源。完成迁移的页面应只保留生成的 API 清单，不重复维护同一成员的手写属性、事件或插槽表格。API 成员锚点由生成数据提供；旧的 `#props`、`#events`、`#slots`、`#exposes` 链接在页面缺少对应锚点时由编译器补齐。

### 单体组件

```markdown
## API 参考

<ComponentApi name="button" />
```

### 复合组件

完整复合组件页面默认展示组内全部公开成员。仅在正文分节展示特定子组件时，固定范围并为重复调用加上不同的实例名：

```markdown
## 内容容器 API

<ComponentApi name="dialog" subcomponent="DialogContent" instance="content" />

## 触发器 API

<ComponentApi name="dialog" subcomponent="DialogTrigger" instance="trigger" />
```

### 复杂组件

复杂组件同样使用静态生成数据展示完整 API；数据类型、组合式函数、程序化操作和可访问性说明仍写在正文，避免 API 清单替代使用指南：

```markdown
## API 参考

<ComponentApi name="data-table" defaultTab="props" />
```

---

## 中英文镜像同步

- 组件文档**成对维护**：中文 `apps/docs/components/{name}.md` + 英文 `apps/docs/en/components/{name}.md`，同文件名、英文内容，章节结构一致（仅正文语言差异）。
- 只补一侧、漏镜像另一侧会在 `pnpm check:i18n:strict` 上报「一侧缺失」；提交前必须运行该命令。
- 组件命名或文档文件移动时，同步移动两侧文件。

---

## 格式规范

以下手写 API 表格格式用于尚在迁移的旧页面。页面使用 `<ComponentApi>` 后，应以双语语义资源维护 API 说明，并删除重复的成员表格。

### Props 表格

统一使用 4 列格式，`class` 属性放在表格最后：

```markdown
| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary'` | `'default'` | 颜色变体 |
| `class` | `string` | — | 自定义样式类 |
```

### 事件表格

统一使用 3 列格式，列名为"事件"、"参数"、"说明"：

```markdown
| 事件 | 参数 | 说明 |
|------|------|------|
| `click` | `MouseEvent` | 点击时触发 |
```

### 插槽表格

统一使用 3 列格式，列名为"插槽"、"作用域"、"说明"。无作用域时用 `—`：

```markdown
| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认内容 |
| `cell-{id}` | `{ row: T; value: unknown }` | 自定义单元格渲染 |
```

### 组合式函数章节

提供 composable 时，按以下顺序组织：

1. 基本用法代码示例
2. 选项表格（如有）
3. 返回值表格

### 程序化控制章节

通过 defineExpose 暴露 API 时，按以下顺序组织：

1. 使用示例（含 ref 绑定）
2. 暴露的 API 表格

### 可访问性章节

统一使用 `## 可访问性` 作为章节名，不要使用"无障碍"或"Accessibility"。

内容按以下顺序组织：

1. 键盘操作
2. ARIA 属性
3. 焦点管理
4. 动效降级（如组件有动画效果）

---

## 命名规范

| 类型 | 格式 | 示例 |
| ---- | ---- | ---- |
| 文档文件 | kebab-case.md | `alert-dialog.md` |
| 文档英文镜像 | 与中文同名 | `apps/docs/en/components/alert-dialog.md` |
| Demo 文件 | PascalCaseDemo.vue | `AlertDialogDemo.vue` |
| 组件名 | PascalCase | `AlertDialog` |
| 安装名 | kebab-case | `alert-dialog` |
