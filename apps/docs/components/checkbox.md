---
title: Checkbox 复选框
description: 复选框组件，带有厚边框和鲜明勾选图标，实现完全的键盘操作支持。
---

# Checkbox 复选框

新粗野主义风格的复选框，基于 reka-ui 的 CheckboxRoot 原语构建，带勾选指示器。

## 预览

<ComponentPreview>
  <CheckboxDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="checkbox" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Checkbox } from 'brutx-ui-vue'

const checked = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Checkbox v-model:checked="checked" />
        <span class="text-sm font-bold">Accept terms</span>
    </div>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 默认背景，标准前景色 |
| `primary` | Primary（珊瑚色）背景 |
| `secondary` | Secondary（薄荷青）背景 |
| `accent` | Accent（黄色）背景 |
| `danger` | Danger（红色）背景 |

```vue
<template>
    <Checkbox variant="primary" />
</template>
```

## 尺寸

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸 |
| `default` | 默认尺寸 |
| `lg` | 大尺寸 |

## 搭配 Label

```vue
<script setup>
import { ref } from 'vue'
import { Checkbox, Label } from 'brutx-ui-vue'

const checked = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Checkbox v-model:checked="checked" id="terms" />
        <Label for="terms">Accept terms and conditions</Label>
    </div>
</template>
```

## 禁用状态

```vue
<script setup>
import { Checkbox } from 'brutx-ui-vue'
</script>

<template>
    <Checkbox disabled />
</template>
```

## 不确定状态

将 `checked` 设置为 `'indeterminate'` 可展示不确定状态，此时指示器显示 `Minus`（减号）图标，常用于"部分选中"等层级选择场景。

```vue
<script setup>
import { Checkbox } from 'brutx-ui-vue'
</script>

<template>
    <Checkbox :checked="'indeterminate'" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `checked` | `boolean \| 'indeterminate'` | — | 选中状态 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸 |
| `ariaLabel` | `string` | locale 默认值（`checkbox.check`） | 无障碍标签 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:checked` | `boolean \| 'indeterminate'` | 选中状态变化时触发，支持 `v-model:checked` 双向绑定 |

## 可访问性

- **键盘操作**：支持 `Space` 键切换选中状态
- **ARIA 属性**：Checkbox 默认通过 locale 提供 `aria-label`（中文为"复选框"），未提供时回退到 `t('checkbox.check')`。当毗邻可见文本已能描述用途时可省略，否则建议通过 `ariaLabel` 提供更具体的描述
- **焦点管理**：使用 `--brutal-ring` 令牌显示可见聚焦环

```vue
<script setup>
import { ref } from 'vue'
import { Checkbox, Label } from 'brutx-ui-vue'

const checked = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Checkbox v-model:checked="checked" id="marketing" ariaLabel="接收营销邮件" />
        <Label for="marketing">接收营销邮件</Label>
    </div>
</template>
```
