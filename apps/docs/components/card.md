---
title: Card 卡片
description: 卡片容器组件，支持多种内边距与可组合的头部、标题、描述和底部块。
---

# Card 卡片

新粗野主义风格的卡片容器，支持 6 种变体和可组合的子组件，用于结构化内容展示。

## 预览

<ComponentPreview>
  <CardDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="card" />

## 用法

```vue
<script setup>
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from 'brutx-ui-vue'
</script>

<template>
    <Card variant="default">
        <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Add a new payment method to your account.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Card content goes here.</p>
        </CardContent>
        <CardFooter>
            <Button variant="primary">Save</Button>
        </CardFooter>
    </Card>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 标准阴影 |
| `elevated` | 大阴影，用于强调 |
| `flat` | 无阴影 |
| `interactive` | 阴影加悬停上浮效果和手型光标 |
| `primary` | Primary 色阴影和边框 |
| `secondary` | Secondary 色阴影和边框 |

## 内边距

| 内边距 | 值 |
|--------|----|
| `none` | `p-0` |
| `sm` | `p-3` |
| `default` | `p-5` |
| `lg` | `p-8` |

## 模板组合

新卡片模板建议直接组合 `Card` 子组件。

### 文章卡片

```vue
<Card variant="interactive" padding="none">
    <CardHeader>
        <Badge variant="accent" size="sm">Vue 3</Badge>
        <CardTitle>Getting Started with BrutxUI</CardTitle>
        <CardDescription>Build bold interfaces with composable primitives.</CardDescription>
    </CardHeader>
    <CardFooter>
        <Button variant="link">阅读更多</Button>
    </CardFooter>
</Card>
```

### 文件卡片

```vue
<Card>
    <CardHeader>
        <CardTitle>report-2026.pdf</CardTitle>
        <CardDescription>PDF · 3.2 MB</CardDescription>
    </CardHeader>
    <CardFooter>
        <Button variant="outline" size="sm">下载</Button>
    </CardFooter>
</Card>
```

### 评价卡片

```vue
<Card variant="elevated">
    <CardContent>
        <p class="font-bold">“这款产品彻底改变了我们的工作流程。”</p>
    </CardContent>
    <CardFooter>
        <span class="text-sm font-black">张明 · 产品经理</span>
    </CardFooter>
</Card>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Card` | 根容器，支持 variant 和 padding 属性 |
| `CardHeader` | 头部区域，带底部内边距 |
| `CardTitle` | 标题文本，加粗且带字间距 |
| `CardDescription` | 柔和的描述文本 |
| `CardContent` | 主内容区域 |
| `CardFooter` | 底部区域，弹性布局 |

## Props

### Card

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'elevated' \| 'flat' \| 'interactive' \| 'primary' \| 'secondary'` | `'default'` | 卡片变体类型 |
| `padding` | `'none' \| 'sm' \| 'default' \| 'lg'` | `'default'` | 卡片内边距 |
| `interactive` | `boolean` | `false` | 是否可点击，添加 `role="button"`、`tabindex="0"` 和键盘支持 |
| `class` | `string` | — | 自定义 CSS 类 |

#### 事件

| 事件 | 说明 |
| --- | --- |
| `activate` | 当 `interactive=true`（或 `variant="interactive"`）时，点击或按 Enter/Space 键触发，返回原生 `Event` 对象 |

### CardTitle

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `as` | `string` | `'h3'` | 渲染的 HTML 元素 |
| `class` | `string` | — | 自定义 CSS 类 |

### CardHeader / CardDescription / CardContent / CardFooter

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `class` | `string` | — | 自定义 CSS 类 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 所有组件的默认插槽，用于插入内容 |

## 可访问性

- **语义化结构**：`CardTitle` 默认渲染为 `h3` 标题元素，可通过 `as` 属性自定义为合适的标题层级
- **交互反馈**：`interactive` 变体提供悬停效果，建议配合键盘焦点样式使用
- **可点击卡片**：设置 `interactive` 属性（或使用 `variant="interactive"`）后，卡片会添加 `role="button"` 和 `tabindex="0"`，支持 Enter/Space 键触发 `activate` 事件（派发原生事件参数）
- **内容组织**：通过 `CardHeader`、`CardContent`、`CardFooter` 子组件提供清晰的内容结构，便于辅助技术理解页面布局

### 可点击卡片

通过 `interactive` 属性将卡片变为可点击元素，自动添加手型光标和悬停提升效果：

```vue
<script setup>
import { Card, CardContent, CardTitle } from 'brutx-ui-vue'

function handleClick(event) {
    console.log('Card activated!', event)
}
</script>

<template>
    <Card interactive @activate="handleClick">
        <CardContent>
            <CardTitle>Click me!</CardTitle>
            <p>This card is interactive and supports keyboard navigation.</p>
        </CardContent>
    </Card>
</template>
```
