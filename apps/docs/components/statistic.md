---
title: Statistic 数值统计
description: 统计数值展示组件，支持动画自增过渡、硬折线卡片底盒和前后缀定制。
---

# Statistic 数值统计

用于展示核心指标或业务数据的统计卡片，支持数字缓动跳动过渡动画。可选的 `card` 属性会为其赋予极具视觉张力的黑粗描边与硬投影。

## 预览

<ComponentPreview>
  <StatisticDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="statistic" />

## 用法

### 基础用法

展示普通的指标数字，支持千分位分隔。

```vue
<script setup>
import { Statistic } from 'brutx-ui-vue'
</script>

<template>
    <Statistic title="活跃账户数" :value="12850" group-separator="," />
</template>
```

### 粗野卡片投影

通过 `card` 属性包裹黑色重描边和底盒硬投影，呈现浓郁的 Neo-Brutalist 设计感。

```vue
<template>
    <Statistic title="本周总收益" :value="4895.8" prefix="¥" card />
</template>
```

### 前后缀插槽与图标组合

可以添加百分比、箭头图标等作为前后缀标识，配合颜色变体表示涨跌。

```vue
<script setup>
import { Statistic } from 'brutx-ui-vue'
import { ArrowUpRight } from '@lucide/vue'
</script>

<template>
    <Statistic
        title="用户转化率"
        :value="15.82"
        :precision="2"
        suffix="%"
        :suffix-component="ArrowUpRight"
        variant="success"
        card
    />
</template>
```

## Props

### Statistic

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `number` | *必填* | 统计数值 |
| `title` | `string` | `''` | 统计标题 |
| `precision` | `number` | `0` | 数值精度，保留的小数位数 |
| `decimalSeparator` | `string` | `'.'` | 小数点分隔符 |
| `groupSeparator` | `string` | `','` | 千分位分隔符 |
| `prefix` | `string` | `''` | 前缀文本 |
| `suffix` | `string` | `''` | 后缀文本 |
| `prefixComponent` | `Component` | `undefined` | 前缀自定义图标组件 |
| `suffixComponent` | `Component` | `undefined` | 后缀自定义图标组件 |
| `valueStyle` | `CSSProperties` | `undefined` | 数值的自定义样式 |
| `card` | `boolean` | `false` | 是否使用粗野主义卡片投影底座 |
| `variant` | `'default' \| 'primary' \| 'accent' \| 'success' \| 'danger'` | `'default'` | 文本的配色主题变体 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'lg'` | 文字字号大小 |

## 可访问性

- **动效降级**：自增动画完美响应操作系统的减弱动态效果设置，在 `prefers-reduced-motion` 为真时，数值将省略自增效果直接同步呈现最终数字，保障可访问性体验。
