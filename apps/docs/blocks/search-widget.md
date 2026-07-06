---
title: Search Widget
description: 搜索组件区块，带有输入框和分组建议列表。
---

# Search Widget 搜索组件

新粗野主义风格的搜索组件，包含 Command 输入框和分组建议列表，支持实时过滤和选择。

> `SearchWidget` 已标记为 legacy block。它会继续可用，但新实现建议直接使用 `Command` 组件组合搜索输入、结果列表、最近搜索和加载状态。

## 预览

<ComponentPreview>
  <SearchWidgetDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="search-widget" />

## 用法

### 基础用法

```vue
<script setup>
import SearchWidget from '@/components/ui/search-widget/SearchWidget.vue'
import type { SearchSuggestion } from '@/components/ui/search-widget/SearchWidget.vue'

const suggestions: SearchSuggestion[] = [
    { label: 'Dashboard', value: 'dashboard', group: 'Pages' },
    { label: 'Settings', value: 'settings', group: 'Pages' },
    { label: 'Vue 3', value: 'vue3', group: 'Technologies' },
    { label: 'Tailwind CSS', value: 'tailwind', group: 'Technologies' },
]

function handleSearch(value: string) {
    console.log('Search:', value)
}

function handleSelect(suggestion: SearchSuggestion) {
    console.log('Selected:', suggestion)
}
</script>

<template>
    <SearchWidget
        placeholder="Search..."
        :suggestions="suggestions"
        @search="handleSearch"
        @select="handleSelect"
    />
</template>
```

### 无分组建议

```vue
<script setup>
import SearchWidget from '@/components/ui/search-widget/SearchWidget.vue'

const suggestions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
]
</script>

<template>
    <SearchWidget
        :suggestions="suggestions"
        @select="(s) => console.log(s)"
    />
</template>
```

### 最近搜索

当输入框为空且 `recent` 非空时，下拉列表展示「最近搜索」分组（标题取自 locale `searchWidget.recentSearches`）。点击某项会将输入框回填为该项 `label` 并触发 `select` 事件。

```vue
<script setup>
import SearchWidget from '@/components/ui/search-widget/SearchWidget.vue'
import type { SearchSuggestion } from 'brutx-ui-vue'

const recent: SearchSuggestion[] = [
    { label: 'Button 按钮', value: 'button' },
    { label: '主题配置', value: 'theming' },
]
</script>

<template>
    <SearchWidget :recent="recent" @select="(s) => console.log(s)" />
</template>
```

### 加载状态

设置 `loading` 为 `true` 时，建议列表底部显示 `Spinner`，用于异步搜索场景。

```vue
<script setup>
import { ref } from 'vue'
import SearchWidget from '@/components/ui/search-widget/SearchWidget.vue'

const loading = ref(false)

function handleSearch(value) {
    loading.value = true
    fetchResults(value).finally(() => { loading.value = false })
}
</script>

<template>
    <SearchWidget :loading="loading" :suggestions="suggestions" @search="handleSearch" />
</template>
```

## 数据类型

### SearchSuggestion

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `label` | `string` | 建议项显示文本 |
| `value` | `string` | 建议项值 |
| `group` | `string` | 可选，分组名称 |

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `placeholder` | `string` | locale: `searchWidget.defaultPlaceholder` | 输入框占位文本 |
| `suggestions` | `SearchSuggestion[]` | `[]` | 建议列表数据 |
| `recent` | `SearchSuggestion[]` | `[]` | 最近搜索记录列表 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `iconSize` | `IconSize` | `'default'` | 搜索图标尺寸 |
| `class` | `string` | — | 自定义 CSS 类名 |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `search` | `[value: string]` | 输入内容变化时触发 |
| `select` | `[suggestion: SearchSuggestion]` | 选中建议项时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
| --- | --- | --- |
| `actions` | — | 额外操作区域 |

## 可访问性

- 搜索输入框具有 `role="combobox"` 和 `aria-expanded` 属性，表明其为可展开的组合框
- 建议列表使用 `role="listbox"` 和 `role="option"` 标识选项
- 支持键盘导航：`Arrow Up/Down` 切换选项，`Enter` 选中，`Escape` 关闭下拉
- 空状态和加载状态均提供对应的 ARIA 提示信息
