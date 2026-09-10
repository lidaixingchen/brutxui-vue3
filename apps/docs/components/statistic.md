---
title: Statistic 统计数值
description: 粗野主义风格的统计数值展示组件，支持高精度大数安全格式化、前后缀、趋势指示与本地化定制。
---

# Statistic 统计数值

展示关键业务统计指标或数字量化信息。底层采用原生 `Intl.NumberFormat` 与高精度分段算法，支持超大安全整数及浮点数安全格式化，杜绝数字截断与失真。

## 预览

<ComponentPreview>
  <StatisticDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="statistic" />

## 用法

```vue
<script setup>
import { Statistic } from 'brutx-ui-vue'
</script>

<template>
    <!-- 基础用法 -->
    <Statistic title="总用户数" :value="128940" />

    <!-- 货币与精度定制 -->
    <Statistic title="成交金额" :value="98234.5" prefix="¥" :precision="2" />

    <!-- 趋势状态与卡片变体 -->
    <Statistic
        title="转化率"
        :value="12.4"
        suffix="%"
        trend="up"
        variant="card"
    />
</template>
```

### 超大数值与高精度

支持直接传入超出 JavaScript 安全整数范围的字符串数值或 BigInt，保持原始精度不失真：

```vue
<template>
    <Statistic title="代币总量" value="900719925474099200000000" />
    <Statistic title="质押总量" :value="123456789012345678901234567890n" />
</template>
```

### 自定义千分位与小数分隔符

```vue
<template>
    <Statistic
        title="欧洲格式"
        :value="1234567.89"
        group-separator="."
        decimal-separator=","
        :precision="2"
    />
</template>
```

## 变体

| 变体 | 说明 |
| ---- | ---- |
| `default` | 默认变体，轻量内联布局，无额外边框背景 |
| `card` | 粗野主义卡片，3px 黑色硬边框、硬阴影、内边距与圆角 |
| `bordered` | 粗黑硬边框卡片，无投影 |
| `subtle` | 强调底色背景卡片，带粗黑边框与硬阴影 |

```vue
<template>
    <Statistic title="Default" :value="1200" variant="default" />
    <Statistic title="Card" :value="1200" variant="card" />
    <Statistic title="Bordered" :value="1200" variant="bordered" />
    <Statistic title="Subtle" :value="1200" variant="subtle" />
</template>
```

## 尺寸

| 尺寸 | 标题字号 | 数值字号 | 趋势字号 |
| ---- | -------- | -------- | -------- |
| `sm` | `text-xs` | `text-2xl` | `text-xs` |
| `default` | `text-sm` | `text-3xl sm:text-4xl` | `text-sm` |
| `lg` | `text-base` | `text-4xl sm:text-5xl` | `text-base` |

```vue
<template>
    <Statistic title="小型" :value="88" size="sm" variant="card" />
    <Statistic title="标准" :value="88" size="default" variant="card" />
    <Statistic title="大型" :value="88" size="lg" variant="card" />
</template>
```

## 导出类型

组件导出了变体样式函数与 TypeScript 类型定义，方便二次封装：

```ts
import type {
    StatisticProps,
    StatisticValue,
    StatisticVariantProps,
    StatisticContentVariantProps,
} from 'brutx-ui-vue'
import {
    statisticVariants,
    statisticTitleVariants,
    statisticContentVariants,
    statisticValueVariants,
    statisticTrendVariants,
} from 'brutx-ui-vue'
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `value` | `number \| string \| bigint \| null` | `undefined` | 要展示的数值，支持数字、字符串、BigInt |
| `title` | `string` | `undefined` | 统计项标题 |
| `prefix` | `string` | `undefined` | 数值前缀文本（如 `¥` 或 `$`） |
| `suffix` | `string` | `undefined` | 数值后缀文本（如 `%` 或单位） |
| `precision` | `number` | `undefined` | 小数精度（保留小数位数） |
| `decimalSeparator` | `string` | `'.'` | 小数点分隔符 |
| `groupSeparator` | `string` | `','` | 千分位分组分隔符 |
| `formatter` | `(val: StatisticValue) => string` | `undefined` | 自定义格式化函数 |
| `placeholder` | `string` | `'-'` | 无效或空数值时的占位符 |
| `trend` | `'up' \| 'down'` | `undefined` | 趋势方向，展示上升或下降箭头图标与状态色 |
| `trendPlacement` | `'prefix' \| 'suffix'` | `'suffix'` | 趋势图标位置 |
| `variant` | `'default' \| 'card' \| 'bordered' \| 'subtle'` | `'default'` | 容器视觉变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸规格 |
| `class` | `string` | `undefined` | 自定义样式类 |

## 插槽

| 插槽 | 作用域 | 说明 |
| ---- | ------ | ---- |
| `default` | `{ value: StatisticValue; formatted: string }` | 自定义数值内容展示 |
| `title` | `{ title?: string }` | 自定义标题区域内容 |
| `prefix` | `{ prefix?: string }` | 自定义前缀区域内容（如图标） |
| `suffix` | `{ suffix?: string }` | 自定义后缀区域内容（如徽标标签） |
| `trend` | `{ trend: 'up' \| 'down' }` | 自定义趋势指示器内容 |

## 可访问性

- **键盘操作**：组件属于纯展示类数据排版元素，默认不接收键盘焦点；若内部插槽嵌入可聚焦按钮或链接，遵循自然 Tab 导航顺序。
- **ARIA 属性**：数值内容使用语义化结构标签渲染；趋势指示图标自带 `aria-label="上升"` 或 `aria-label="下降"`，满足色彩独立感知标准。
- **焦点管理**：静态排版结构，无焦点陷阱，不干预读屏器线性文本流。
- **动效降级**：纯静态文本呈现，无突变眩晕动画，原生兼容系统级减弱动效偏好。
