---
title: Descriptions 描述列表
description: 以键值对形式展示只读信息，常见于详情页。
---

# Descriptions 描述列表

以键值对形式展示只读信息。常见于详情页、个人资料页和数据展示场景。

## 安装

<InstallationTabs componentName="descriptions" />

## 用法

```vue
<script setup>
import { Descriptions, DescriptionsItem } from 'brutx-ui-vue'
</script>

<template>
    <Descriptions title="用户信息" :column="2">
        <DescriptionsItem label="姓名">张三</DescriptionsItem>
        <DescriptionsItem label="邮箱">zhangsan@example.com</DescriptionsItem>
        <DescriptionsItem label="电话">+86 138 0000 0000</DescriptionsItem>
        <DescriptionsItem label="地址">北京市朝阳区</DescriptionsItem>
    </Descriptions>
</template>
```

### 带边框

```vue
<script setup>
import { Descriptions, DescriptionsItem } from 'brutx-ui-vue'
</script>

<template>
    <Descriptions title="订单详情" border>
        <DescriptionsItem label="订单号">ORD-2024-001</DescriptionsItem>
        <DescriptionsItem label="日期">2024-01-15</DescriptionsItem>
        <DescriptionsItem label="状态">已完成</DescriptionsItem>
        <DescriptionsItem label="金额">¥299.99</DescriptionsItem>
        <DescriptionsItem label="备注" :span="2">需要快递配送</DescriptionsItem>
    </Descriptions>
</template>
```

### 垂直方向

```vue
<script setup>
import { Descriptions, DescriptionsItem } from 'brutx-ui-vue'
</script>

<template>
    <Descriptions title="产品信息" direction="vertical" border>
        <DescriptionsItem label="名称">机械键盘</DescriptionsItem>
        <DescriptionsItem label="品牌">BrutxUI</DescriptionsItem>
        <DescriptionsItem label="价格">¥999.99</DescriptionsItem>
    </Descriptions>
</template>
```

### 不同尺寸

```vue
<script setup>
import { Descriptions, DescriptionsItem } from 'brutx-ui-vue'
</script>

<template>
    <Descriptions size="sm" border>
        <DescriptionsItem label="小尺寸">内容</DescriptionsItem>
    </Descriptions>

    <Descriptions size="default" border>
        <DescriptionsItem label="默认尺寸">内容</DescriptionsItem>
    </Descriptions>

    <Descriptions size="lg" border>
        <DescriptionsItem label="大尺寸">内容</DescriptionsItem>
    </Descriptions>
</template>
```

## 子组件

| 组件 | 说明 |
| --- | --- |
| `Descriptions` | 根容器组件 |
| `DescriptionsItem` | 单个描述项（标签 + 内容） |

## Props

### Descriptions

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `column` | `number` | `3` | 列数 |
| `border` | `boolean` | `false` | 是否显示边框 |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 排列方向 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 组件尺寸 |
| `title` | `string` | — | 标题文本 |
| `class` | `string` | — | 自定义 CSS 类 |

### DescriptionsItem

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | —（必填） | 标签文本 |
| `span` | `number` | `1` | 跨列数 |
| `labelWidth` | `string \| number` | — | 标签宽度（仅水平方向有效） |
| `class` | `string` | — | 自定义 CSS 类 |

## 插槽

### Descriptions

| 插槽 | 说明 |
| --- | --- |
| `default` | DescriptionsItem 组件 |
| `title` | 自定义标题内容 |

### DescriptionsItem

| 插槽 | 说明 |
| --- | --- |
| `default` | 内容值 |
| `label` | 自定义标签内容 |

## 可访问性

- 使用语义化 HTML 结构
- 边框模式使用类表格布局，兼容屏幕阅读器
- 标签通过视觉分组与对应值关联
