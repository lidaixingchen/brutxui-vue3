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

### 基础用法

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

### 搜索过滤

通过设置 `filterable` 属性为 `true` 可以开启搜索过滤功能。

```vue
<template>
    <Transfer v-model="value" :data="data" filterable />
</template>
```

### 自定义标题与按钮文本

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

## API 参考

<span id="transfer"></span>
<span id="事件"></span>
<span id="transfer-1"></span>

<ComponentApi name="transfer" />

## 数据类型

```ts
interface TransferDataItem {
    key: string | number
    label: string
    disabled?: boolean
}
```

## 导出类型

```ts
import type { TransferDataItem } from 'brutx-ui-vue'
```

## 可访问性

- **键盘操作**：
  - 各面板内的 Checkbox 控件支持 `Space` / `Enter` 键进行勾选
  - 中间转移按钮支持 `Tab` 键聚焦并使用 `Enter` / `Space` 键触发穿梭
- **ARIA 属性**：中间的操作按钮使用 `aria-label` 标示操作方向与含义（"Move selected to right" / "Move selected to left"），各个选择列表项使用 Checkbox 进行状态修饰
- **焦点管理**：操作按钮在转移后保持焦点，便于用户连续使用键盘进行数据移动
