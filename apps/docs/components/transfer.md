---
title: Transfer 穿梭框
description: 新粗野主义风格的穿梭框组件，用于在两个列表之间转移数据。
---

# Transfer 穿梭框

双栏穿梭选择框，拥有经典的 Neo-Brutalism 双像素边框、硬投影和活跃状态的按压反馈。

## 预览

<ComponentPreview>
  <TransferDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="transfer" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Transfer } from 'brutx-ui-vue'

const data = ref([
    { key: 1, label: '选项 1' },
    { key: 2, label: '选项 2' },
    { key: 3, label: '选项 3', disabled: true },
    { key: 4, label: '选项 4' }
])

const value = ref([1])
</script>

<template>
    <Transfer v-model="value" :data="data" />
</template>
```

## 搜索过滤

通过设置 `filterable` 属性为 `true` 可以开启搜索过滤功能。

```vue
<template>
    <Transfer v-model="value" :data="data" filterable />
</template>
```

## 自定义标题与按钮文本

可以通过 `titles` 和 `buttonTexts` 分别自定义面板标题和转移按钮的文本内容。

```vue
<template>
    <Transfer
        v-model="value"
        :data="data"
        :titles="['待选列表', '已选列表']"
        :button-texts="['撤销', '加入']"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `(string \| number)[]` | `[]` | 右侧面板中已选数据的 key 数组，支持 `v-model` 双向绑定 |
| `data` | `TransferDataItem[]` | `[]` | 穿梭框的源数据源列表，每一项包含 `{ key, label, disabled }` |
| `filterable` | `boolean` | `false` | 是否开启过滤搜索框 |
| `filterMethod` | `(query: string, item: TransferDataItem) => boolean` | — | 自定义搜索过滤方法 |
| `titles` | `string[]` | `['Source', 'Target']` / `['源列表', '目标列表']` | 左右两个面板的标题 |
| `buttonTexts` | `string[]` | `['', '']` | 左右两个穿梭按钮的显示文字，如果为空则只显示图标 |

## TransferDataItem 类型定义

```typescript
export interface TransferDataItem {
    key: string | number
    label: string
    disabled?: boolean
}
```

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `(string \| number)[]` | 右侧目标列表的值变化时触发 |
| `change` | `(value: (string \| number)[], direction: 'left' \| 'right', movedKeys: (string \| number)[])` | 数据发生穿梭移动时触发 |
