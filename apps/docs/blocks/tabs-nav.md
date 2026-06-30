---
title: Tabs Nav
description: 带内容的标签页导航区块，含标签触发器和内容面板。
---

# Tabs Nav 标签导航

新粗野主义风格的标签页导航区块，包含标签触发器和对应内容面板，基于 reka-ui Tabs 原语构建。

## 预览

<ComponentPreview>
  <TabsNavDemo />
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block tabs-nav
```

## 用法

基本用法，传入 `tabs` 数组即可渲染标签导航：

```vue
<script setup>
import TabsNav from '@/components/ui/tabs-nav/TabsNav.vue'

const tabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'Features', value: 'features' },
    { label: 'Pricing', value: 'pricing' },
]
</script>

<template>
    <TabsNav :tabs="tabs" model-value="overview">
        <template #default>
            <!-- 自定义内容面板 -->
        </template>
    </TabsNav>
</template>
```

### 自定义内容面板

通过 `#default` 插槽可自定义每个标签对应的内容面板，替代默认的 Card 展示：

```vue
<script setup>
import TabsNav from '@/components/ui/tabs-nav/TabsNav.vue'
import Card from '@/components/ui/card/Card.vue'

const tabs = [
    { label: 'Tab A', value: 'a' },
    { label: 'Tab B', value: 'b' },
]
</script>

<template>
    <TabsNav :tabs="tabs">
        <template #default>
            <!-- 使用 TabsContent 自定义每个面板 -->
        </template>
    </TabsNav>
</template>
```

## 数据类型

### TabItem

```ts
interface TabItem {
    label: string
    value: string
}
```

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `label` | `string` | 标签显示文本 |
| `value` | `string` | 标签唯一标识 |

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tabs` | `TabItem[]` | `[]` | 标签数据数组 |
| `modelValue` | `string` | 第一个 tab 的 value | 当前激活标签的 value，支持 `v-model` 双向绑定 |
| `class` | `string` | — | 自定义根元素 CSS 类名 |

## 插槽

| 插槽 | 作用域 | 说明 |
| --- | --- | --- |
| `header` | — | 替换/扩展区块头部 |
| `default` | — | 替换标签内容面板区域，默认渲染每个 tab 的 Card 展示 |
| `footer` | — | 替换/扩展区块底部 |

## 可访问性

- 标签触发器基于 reka-ui `TabsRoot` 原语，自动遵循 WAI-ARIA Tabs 模式
- 每个标签触发器具有 `role="tab"`，标签列表具有 `role="tablist"`
- 内容面板具有 `role="tabpanel"`，通过 `aria-labelledby` 关联对应标签
- 支持键盘导航：`Arrow Left`/`Arrow Right` 在标签间切换，`Home`/`End` 跳转首尾标签
- 当 `tabs` 为空时，显示 `EmptyState` 组件提示无内容
