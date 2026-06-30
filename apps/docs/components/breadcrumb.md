---
title: Breadcrumb 面包屑
description: 面包屑导航组件，用于展示当前页面的路径层次结构，帮助用户快速返回上层目录。
---

# Breadcrumb 面包屑

新粗野主义风格的面包屑导航组件，基于 Reka UI 的面包屑原语构建，适用于展示多级页面树，特别在中后台 Dashboard 等复杂嵌套场景中作为标配导航。

## 预览

<ComponentPreview>
  <BreadcrumbDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="breadcrumb" />

## 用法

```vue
<script setup>
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis
} from 'brutx-ui-vue'
</script>

<template>
    <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink href="/">首页</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbLink href="/components">组件</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>面包屑</BreadcrumbPage>
            </BreadcrumbItem>
        </BreadcrumbList>
    </Breadcrumb>
</template>
```

### 折叠省略

当页面层级非常多时，可以使用 `BreadcrumbEllipsis` 来折叠中间不太重要的页面。

```vue
<template>
    <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink href="#">首页</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <!-- 折叠省略按钮 -->
                <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>当前页面</BreadcrumbPage>
            </BreadcrumbItem>
        </BreadcrumbList>
    </Breadcrumb>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Breadcrumb` | 根容器 |
| `BreadcrumbList` | 面包屑列表容器 |
| `BreadcrumbItem` | 单个面包屑项容器 |
| `BreadcrumbLink` | 可点击的链接项 |
| `BreadcrumbPage` | 当前页面标识（不可点击） |
| `BreadcrumbSeparator` | 分隔符，默认渲染正斜杠 `/` |
| `BreadcrumbEllipsis` | 省略号按钮，用于折叠中间层级 |

## Props

### Breadcrumb

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |

### BreadcrumbList

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |

### BreadcrumbItem

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |

### BreadcrumbLink

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `as` | `string` | `'a'` | 渲染的 HTML 标签，如 `'a'`、`'button'` 等 |
| `asChild` | `boolean` | `false` | 是否开启 Reka UI 的 asChild，以便配合 Vue-Router 的 `<router-link>` 渲染 |
| `class` | `string` | — | 自定义样式类 |

### BreadcrumbPage

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |

### BreadcrumbSeparator

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |

### BreadcrumbEllipsis

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `iconSize` | `IconSize` | `'default'` | 图标尺寸，支持 `IconSize` 枚举值 |
| `class` | `string` | — | 自定义样式类 |

## 插槽

### BreadcrumbSeparator

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认渲染正斜杠 `/`，可放入自定义的小图标组件 |

### BreadcrumbEllipsis

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认渲染 `MoreHorizontal` 图标，可放入自定义的省略图标组件 |

## 可访问性

- **键盘操作**：链接项支持 `Tab` 键导航，`Enter` 键激活
- **ARIA 属性**：自动添加 `aria-label="面包屑"` 到导航容器，`aria-current="page"` 标识当前页面
- **语义化结构**：使用 `<nav>` 元素包裹，`<ol>` 列表结构符合 WAI-ARIA 面包屑规范
