---
title: Breadcrumb 面包屑
description: 面包屑导航组件，用于展示当前页面的路径层次结构，帮助用户快速返回上层目录。
---

# Breadcrumb 面包屑

新粗野主义风格的面包屑导航组件，基于 Reka UI 的面包屑原语构建，适用于展示多级页面树，特别在中后台 Dashboard 等复杂嵌套场景中作为标配导航。

默认链接以完整边框、底色和硬阴影呈现为实体标签。悬停时改变底色，按压时文字与边框整体向阴影方向移动并收起阴影；当前页使用强调色底和较小硬阴影。`folder` 变体保留底边开口的插片外观与平面层次，悬停时同样提供底色反馈。

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

当页面层级非常多时，可以使用 `BreadcrumbEllipsis` 来折叠中间不太重要的页面。该组件为**纯展示省略号指示**（`role="presentation"`，无可交互语义）；如需点击展开等交互，请自行包裹 `DropdownMenu` 等触发组件。

```vue
<template>
    <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink href="#">首页</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <!-- 折叠省略指示（纯展示，无交互） -->
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
| `BreadcrumbEllipsis` | 省略号指示（纯展示），用于折叠中间层级 |

## API 参考

<span id="breadcrumb"></span>
<span id="breadcrumblist"></span>
<span id="breadcrumbitem"></span>
<span id="breadcrumblink"></span>
<span id="breadcrumbpage"></span>
<span id="breadcrumbseparator"></span>
<span id="breadcrumbellipsis"></span>
<span id="插槽"></span>
<span id="breadcrumbseparator-1"></span>
<span id="breadcrumbellipsis-1"></span>

<ComponentApi name="breadcrumb" />

## 可访问性

- **键盘操作**：链接项支持 `Tab` 键导航，`Enter` 键激活
- **ARIA 属性**：自动添加 `aria-label="面包屑"` 到导航容器，`aria-current="page"` 标识当前页面
- **语义化结构**：使用 `<nav>` 元素包裹，`<ol>` 列表结构符合 WAI-ARIA 面包屑规范
