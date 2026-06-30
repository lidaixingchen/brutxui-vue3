---
title: Breadcrumb 面包屑
description: 面包屑导航组件，用于展示当前页面的路径层次结构，帮助用户快速返回上层目录。
---

# Breadcrumb 面包屑

新粗野主义风格的面包屑导航组件，适用于展示多级页面树，特别在中后台 Dashboard 等复杂嵌套场景中作为标配导航。

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

## 折叠省略

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

## Props / 插槽

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

### BreadcrumbLink Props

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

### BreadcrumbSeparator Slots

| 插槽名 | 说明 |
|--------|------|
| `default` | 默认渲染正斜杠 `/`，可放入自定义的小图标组件 |

### BreadcrumbEllipsis

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |
| `iconSize` | `IconSize` | `'default'` | 图标尺寸，支持 `IconSize` 枚举值 |

### BreadcrumbEllipsis Slots

| 插槽名 | 说明 |
|--------|------|
| `default` | 默认渲染 `MoreHorizontal` 图标，可放入自定义的省略图标组件 |
