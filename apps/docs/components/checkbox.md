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

## 无障碍标签

Checkbox 默认通过 locale 提供 `aria-label`（中文为"复选框"），未提供时回退到 `t('checkbox.check')`。当毗邻可见文本已能描述用途时可省略，否则建议通过 `ariaLabel` 提供更具体的描述。

```vue
<script setup>
import { ref } from 'vue'
import { Checkbox, Label } from 'brutx-ui-vue'

const checked = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Checkbox v-model:checked="checked" id="marketing" aria-label="接收营销邮件" />
        <Label for="marketing">接收营销邮件</Label>
    </div>
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |
| `checked` | `boolean` | — |
| `disabled` | `boolean` | `false` |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger'` | `'default'` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `ariaLabel` | `string` | locale 默认值（`checkbox.check`） |

## 事件

| 事件 | 载荷 |
|------|------|
| `update:checked` | `boolean` |

Checkbox 使用 reka-ui 的 `CheckboxRoot`，支持 `v-model:checked` 双向绑定。

## 样式

- **未选中**：白色背景，粗野主义边框和 `shadow-brutal-sm`
- **已选中**：根据 variant 使用不同颜色（default: `bg-brutal-success`，primary: `bg-brutal-primary` 等），带勾选图标
- **悬停**：阴影增大 `shadow-brutal`，轻微上移
- **按压**：向下位移，阴影消失
- **禁用状态**：降低透明度，显示禁止光标
- **聚焦状态**：使用 `--brutal-ring` 令牌显示可见聚焦环
