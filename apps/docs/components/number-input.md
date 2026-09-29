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

### 边框样式变体

通过 `variant` 属性设置不同的边框样式，用于表单验证状态反馈：

| 变体 | 说明 |
|------|------|
| `default` | 标准边框 |
| `error` | 错误边框，聚焦时使用危险色阴影 |
| `success` | 成功边框，聚焦时使用成功色阴影 |

```vue
<template>
    <NumberInput v-model="count" variant="default" />
    <NumberInput v-model="count" variant="error" />
    <NumberInput v-model="count" variant="success" />
</template>
```

## API 参考

<span id="事件"></span>

<ComponentApi name="number-input" />

## 可访问性

- **键盘操作**：输入框支持 Tab 键聚焦，加减按钮支持 Enter/Space 键触发，支持方向键 Up/Down 微调数值
- **ARIA 属性**：加减按钮自动设置 `aria-label`（如"增加"/"减少"），输入框设置 `aria-valuemin`、`aria-valuemax`、`aria-valuenow` 属性
- **表单集成**：支持 `name`、`required`、`disabled`、`readonly` 等原生表单属性，与表单验证兼容
- **焦点管理**：`focusOnChange` 属性控制值变化时是否自动聚焦，`disabled` 状态下禁止所有交互
- **动效与音效降级**：数值变化触发的 Drum Ticker 滚轮微动效在 `prefers-reduced-motion` 下自动停用；`sound` 音效遵循浏览器自动播放策略，未交互前不发声
