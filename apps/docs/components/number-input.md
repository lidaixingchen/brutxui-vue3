---
title: NumberInput 数字输入框
description: 数字微调输入框组件，带有一对粗野主义的加减控制按钮，提供两种加减按钮的排版布局。
---

# NumberInput 数字输入框

用于录入数字的文本框，内置了长按加减按钮连续滚动的逻辑，并支持最大值、最小值、精度步长调整。

## 预览

<ComponentPreview>
  <NumberInputDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="number-input" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { NumberInput } from 'brutx-ui-vue'

const count = ref(5)
</script>

<template>
    <NumberInput v-model="count" :min="0" :max="10" :step="1" />
</template>
```

## 变体

NumberInput 提供两种按钮排版形态，通过 `layout` 属性配置：

| 布局属性 | 排版说明 |
|----------|----------|
| `split` (默认) | **双侧分立式**：减号按钮在输入框左侧，加号按钮在右侧，极具粗野对称感。 |
| `stacked` | **右侧堆叠式**：加减上下按钮成组排列在右边。 |

```vue
<template>
    <!-- 分立式 -->
    <NumberInput v-model="count" layout="split" />
    
    <!-- 堆叠式 -->
    <NumberInput v-model="count" layout="stacked" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `number \| null` | — | 当前输入值 |
| `defaultValue` | `number` | — | 未受控时的默认值 |
| `min` | `number` | — | 允许的最小值 |
| `max` | `number` | — | 允许的最大值 |
| `step` | `number` | `1` | 每次微调的增减幅度 |
| `stepSnapping` | `boolean` | `true` | 是否启用步进对齐，为 `false` 时值不会自动吸附到 step 的倍数 |
| `focusOnChange` | `boolean` | `false` | 值变化时是否自动聚焦输入框 |
| `formatOptions` | `Intl.NumberFormatOptions` | — | 数字格式化选项，影响显示与允许输入的字符 |
| `locale` | `string` | — | 格式化与货币使用的区域设置 |
| `layout` | `'split' \| 'stacked'` | `'split'` | 调整按钮的布局结构 |
| `placeholder` | `string` | `undefined` | 占位符，未设置时使用国际化默认值 |
| `disabled` | `boolean` | `false` | 是否禁用输入框及按钮 |
| `readonly` | `boolean` | `false` | 是否只读 |
| `disableWheelChange` | `boolean` | `false` | 是否禁止鼠标滚轮改变值 |
| `invertWheelChange` | `boolean` | `false` | 是否反转滚轮滚动方向 |
| `name` | `string` | — | 表单字段名称，随表单一起提交 |
| `required` | `boolean` | `false` | 是否为必填字段 |
| `id` | `string` | — | 元素的 id 属性 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 加减按钮图标的尺寸 |
| `as` | `string \| Component` | `'div'` | 根元素渲染为的标签或组件 |
| `asChild` | `boolean` | `false` | 是否启用组合模式，不渲染自身 DOM，将 props 传递给子元素 |
| `class` | `string` | `undefined` | 容器的自定义 CSS 类 |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `(val: number)` | 输入值变化时触发 |

## 可访问性

- **键盘操作**：输入框支持 Tab 键聚焦，加减按钮支持 Enter/Space 键触发，支持方向键 Up/Down 微调数值
- **ARIA 属性**：加减按钮自动设置 `aria-label`（如"增加"/"减少"），输入框设置 `aria-valuemin`、`aria-valuemax`、`aria-valuenow` 属性
- **表单集成**：支持 `name`、`required`、`disabled`、`readonly` 等原生表单属性，与表单验证兼容
- **焦点管理**：`focusOnChange` 属性控制值变化时是否自动聚焦，`disabled` 状态下禁止所有交互
