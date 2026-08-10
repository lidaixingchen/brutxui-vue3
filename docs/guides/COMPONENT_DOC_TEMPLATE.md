# 组件文档模板

本文件是 BrutxUI 组件文档的标准模板。新建组件文档时，请复制 `apps/docs/components/` 下的对应文件并按此模板填写。

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

| 方法/属性 | 类型 | 说明 |
|-----------|------|------|
| `someMethod` | `() => void` | 说明 |
| `state` | `ComputedRef<T>` | 说明 |

## Props

### {主组件名}

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `class` | `string` | — | 自定义样式类 |

### {子组件名}

<!-- 如有子组件且有独立 Props，在此列出；无则删除 -->

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |

## 事件

<!-- 如组件有自定义事件，在此列出；无则删除此章节 -->
<!-- 参数格式：简单类型直接写（如 MouseEvent、string），复合参数用元组带参数名（如 [column: string, direction: 'asc' | 'desc']） -->

| 事件 | 参数 | 说明 |
|------|------|------|
| `click` | `MouseEvent` | 点击时触发 |
| `change` | `string` | 值变化时触发 |
| `sort` | `[column: string, direction: 'asc' \| 'desc']` | 排序变化时触发 |

## 插槽

<!-- 如组件有插槽，在此列出；无则删除此章节 -->
<!-- 如有作用域插槽，增加"作用域"列 -->

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认内容 |
| `cell-{id}` | `{ row: T; value: unknown }` | 自定义单元格渲染 |

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
| 11 | Props | ✅ | 统一 4 列格式 |
| 12 | 事件 | 按需 | 有自定义事件时必须 |
| 13 | 插槽 | 按需 | 有插槽时必须 |
| 14 | 可访问性 | ✅ | 统一使用此名称 |
| 15 | 样式定制 | 按需 | 支持 CSS 变量自定义时必须 |
| 16 | 常见问题 | 推荐 | 复杂组件建议添加 |

---

## 格式规范

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
| Demo 文件 | PascalCaseDemo.vue | `AlertDialogDemo.vue` |
| 组件名 | PascalCase | `AlertDialog` |
| 安装名 | kebab-case | `alert-dialog` |
