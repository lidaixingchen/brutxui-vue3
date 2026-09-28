---
title: Tabs 标签页
description: 选项卡组件，提供按压切换动画和极高辨识度的激活状态边框。
---

# Tabs 标签页

基于 reka-ui 的 Tabs 原语构建的新粗野主义风格标签页导航组件。支持水平/垂直布局、受控模式和多种激活状态颜色变体。

## 预览

<ComponentPreview>
  <TabsDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="tabs" />

## 用法

```vue
<script setup>
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'brutx-ui-vue/tabs'
</script>

<template>
    <Tabs default-value="account">
        <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
            <p class="text-sm">Manage your account settings.</p>
        </TabsContent>
        <TabsContent value="password">
            <p class="text-sm">Change your password here.</p>
        </TabsContent>
    </Tabs>
</template>
```

### 垂直布局

通过 `Tabs` 的 `orientation` 属性设置垂直布局（`vertical`）。垂直布局下，`TabsList` 会自动切换为纵向排列（`flex-col`），适用于侧边栏导航等场景。

`orientation` 属性会通过依赖注入传递给子组件，因此 `TabsList` 无需单独设置即可自动适配方向。如需在单个 `TabsList` 上覆盖方向，可直接设置其 `orientation` 属性。

```vue
<script setup>
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'brutx-ui-vue/tabs'
</script>

<template>
    <Tabs default-value="general" orientation="vertical" class="flex gap-4">
        <TabsList>
            <TabsTrigger value="general">通用</TabsTrigger>
            <TabsTrigger value="security">安全</TabsTrigger>
            <TabsTrigger value="notifications">通知</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
            <p class="text-sm">通用设置选项。</p>
        </TabsContent>
        <TabsContent value="security">
            <p class="text-sm">安全设置选项。</p>
        </TabsContent>
        <TabsContent value="notifications">
            <p class="text-sm">通知设置选项。</p>
        </TabsContent>
    </Tabs>
</template>
```

### 受控模式

使用 `v-model` 实现受控标签页切换：

```vue
<script setup>
import { ref } from 'vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'brutx-ui-vue/tabs'

const currentTab = ref('account')
</script>

<template>
    <Tabs v-model="currentTab">
        <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
            <p class="text-sm">Manage your account settings.</p>
        </TabsContent>
        <TabsContent value="password">
            <p class="text-sm">Change your password here.</p>
        </TabsContent>
    </Tabs>
</template>
```

### 数据驱动模式（tabs prop）

传入 `tabs` 数组即可让 `Tabs` 自动渲染 `TabsList`/`TabsTrigger`/`TabsContent`，适用于简单的标签导航场景。未传 `tabs` 时通过默认插槽组合完整结构。

```vue
<script setup lang="ts">
import { Tabs } from 'brutx-ui-vue/tabs'
import type { TabItem } from 'brutx-ui-vue/tabs'

const tabs: TabItem[] = [
    { label: '概览', value: 'overview' },
    { label: '分析', value: 'analytics' },
    { label: '设置', value: 'settings' },
]
</script>

<template>
    <Tabs :tabs="tabs" default-value="overview" />
</template>
```

#### 自定义内容面板

通过 `#default` 插槽可替换默认的 Card 展示。插槽会替代默认内容区域，但 `TabsList` 仍由 `tabs` 自动渲染：

```vue
<script setup lang="ts">
import { Tabs, TabsContent } from 'brutx-ui-vue/tabs'
import type { TabItem } from 'brutx-ui-vue/tabs'

const tabs: TabItem[] = [
    { label: 'Tab A', value: 'a' },
    { label: 'Tab B', value: 'b' },
]
</script>

<template>
    <Tabs :tabs="tabs">
        <template #default>
            <TabsContent value="a">
                <p class="text-sm">自定义 A 内容</p>
            </TabsContent>
            <TabsContent value="b">
                <p class="text-sm">自定义 B 内容</p>
            </TabsContent>
        </template>
    </Tabs>
</template>
```

#### header / footer 插槽

`tabs` 模式下额外提供 `header` 与 `footer` 两个命名插槽，用于在标签区块上下方插入辅助内容。`tabs` 为空数组时会显示 `Result` fallback，并仍渲染 `header`/`footer` 插槽。

#### 受控与自主状态管理

`tabs` 模式内置双模式状态管理：

- 传入 `modelValue`（或使用 `v-model`）时为受控模式，由父组件主导激活值
- 未传 `modelValue` 时为非受控模式，组件内部维护激活值
- 初始选择依次使用 `defaultValue` 和首项的 `value`；选中项被移除后，同样按此顺序回退

## 变体

`TabsTrigger` 支持以下激活状态颜色变体：

| 变体 | 说明 |
|------|------|
| `default` | 默认激活状态样式 |
| `primary` | Primary（珊瑚色）背景 |
| `secondary` | Secondary 背景 |
| `success` | Success（绿色）背景 |

```vue
<template>
    <TabsTrigger value="tab" variant="primary">Primary 变体</TabsTrigger>
</template>
```

## 尺寸

`TabsList` 支持以下容器尺寸：

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸 |
| `default` | 默认尺寸 |
| `lg` | 大尺寸 |

## 子组件

| 组件 | 说明 |
|------|------|
| `Tabs` | 根组件（包装 reka-ui 的 `TabsRoot`） |
| `TabsList` | 标签触发器容器 |
| `TabsTrigger` | 可点击的标签按钮 |
| `TabsContent` | 每个标签的内容面板 |

## 导出类型

从 `brutx-ui-vue/tabs` 子路径导入：

```ts
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    tabsListVariants,
    tabsTriggerVariants,
    tabsContentVariants,
} from 'brutx-ui-vue/tabs'
import type { TabItem } from 'brutx-ui-vue/tabs'
import { TabsRoot } from 'reka-ui'
```

### TabItem

`tabs` prop 的数据项类型：

```ts
interface TabItem {
    label: string
    value: string
    disabled?: boolean
}
```

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `label` | `string` | 标签显示文本 |
| `value` | `string` | 标签唯一标识 |
| `disabled` | `boolean` | 是否禁用此标签（可选） |

## 组合式函数

组件导出了以下变体工具函数，可用于自定义样式扩展：

```ts
import {
    tabsListVariants,
    tabsTriggerVariants,
    tabsContentVariants,
} from 'brutx-ui-vue/tabs'
```

| 函数 | 变体参数 | 说明 |
|------|----------|------|
| `tabsListVariants` | `size`: `'sm' \| 'default' \| 'lg'`，`orientation`: `'horizontal' \| 'vertical'` | 容器样式变体 |
| `tabsTriggerVariants` | `variant`: `'default' \| 'primary' \| 'secondary' \| 'success'` | 触发器样式变体 |
| `tabsContentVariants` | — | 内容面板基础样式 |

## API 参考

<span id="受控-非受控双模式"></span>
<span id="tabs"></span>
<span id="tabslist"></span>
<span id="tabstrigger"></span>
<span id="tabscontent"></span>
<span id="事件"></span>

<ComponentApi name="tabs" />

## 可访问性

- **键盘操作**：方向键在标签触发器之间导航
- **ARIA 属性**：标签内容通过 ARIA 属性与其触发器关联，激活标签具有 `aria-selected="true"`
