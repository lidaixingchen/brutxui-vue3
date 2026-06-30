---
title: TagsInput 标签输入
description: 标签输入框组件，用于输入或粘贴以添加标签、分类，支持键盘快捷键和退格键删除。
---

# TagsInput 标签输入

新粗野主义风格的标签录入组件，常用于文章标签、邮件收件人、关键词筛选等表单场景。

## 预览

<ComponentPreview>
  <TagsInputDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="tags-input" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import {
    TagsInput,
    TagsInputInput,
    TagsInputItem,
    TagsInputItemText,
    TagsInputItemDelete
} from 'brutx-ui-vue'

const tags = ref(['vue', 'css'])
</script>

<template>
    <TagsInput v-model="tags">
        <TagsInputItem v-for="tag in tags" :key="tag" :value="tag">
            <TagsInputItemText>{{ tag }}</TagsInputItemText>
            <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput placeholder="Add tag..." />
    </TagsInput>
</template>
```

## 变体

可以使用 `TagsInputItem` 的 `variant` 属性定制单个标签的配色方案：

| 变体 | 颜色说明 |
|------|----------|
| `primary` | 默认珊瑚红背景，配黑色粗边框 |
| `secondary` | 薄荷青背景 |
| `accent` | 粗野黄色背景 |
| `success` | 经典绿色背景 |
| `danger` | 经典红色背景 |
| `default` | 纯白背景 |

```vue
<template>
    <TagsInputItem value="css" variant="secondary">
        <TagsInputItemText>CSS</TagsInputItemText>
        <TagsInputItemDelete />
    </TagsInputItem>
</template>
```

## 无障碍标签

TagsInput 默认通过 locale 提供 `aria-label`（中文为"标签输入"），未提供时回退到 `t('tagsInput.label')`。当需要更具体的描述（如"文章标签"、"收件人"）时，可通过 `ariaLabel` prop 自定义。

```vue
<script setup>
import { ref } from 'vue'
import {
    TagsInput,
    TagsInputInput,
    TagsInputItem,
    TagsInputItemText,
    TagsInputItemDelete
} from 'brutx-ui-vue'

const tags = ref(['vue', 'css'])
</script>

<template>
    <TagsInput v-model="tags" aria-label="文章标签">
        <TagsInputItem v-for="tag in tags" :key="tag" :value="tag">
            <TagsInputItemText>{{ tag }}</TagsInputItemText>
            <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput placeholder="添加标签..." />
    </TagsInput>
</template>
```

## Props

### TagsInput Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `Array<T>` | `[]` | 标签数据列表，支持 `v-model` 双向绑定 |
| `defaultValue` | `Array<T>` | `[]` | 非受控模式下的默认标签列表 |
| `disabled` | `boolean` | `false` | 是否禁用输入 |
| `max` | `number` | `0` | 最大允许标签数，`0` 表示不限制 |
| `addOnPaste` | `boolean` | `false` | 是否在粘贴时根据分隔符自动添加标签 |
| `addOnTab` | `boolean` | `false` | 是否在按下 Tab 键时添加标签 |
| `addOnBlur` | `boolean` | `false` | 是否在输入框失焦时添加标签 |
| `duplicate` | `boolean` | `false` | 是否允许添加重复标签 |
| `delimiter` | `string \| RegExp` | `','` | 触发添加标签的分隔符，支持正则表达式 |
| `dir` | `'ltr' \| 'rtl'` | — | 阅读方向，未设置时继承全局配置 |
| `convertValue` | `(value: string) => T` | — | 将输入字符串转换为目标类型的函数，使用对象作为值时必填 |
| `displayValue` | `(value: T) => string` | `value.toString()` | 自定义标签显示值的函数 |
| `ariaLabel` | `string` | locale 默认值（`tagsInput.label`） | 无障碍标签，未提供时使用 locale 默认值 |
| `name` | `string` | — | 表单字段名称 |
| `required` | `boolean` | — | 是否为必填字段 |

### TagsInputInput Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `placeholder` | `string` | — | 输入框占位文本 |
| `autoFocus` | `boolean` | — | 是否在挂载时自动聚焦 |
| `maxLength` | `number` | — | 最大字符数限制 |

### TagsInputItem Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `AcceptableInputValue` | — | 标签值（必填），支持 `string \| number \| bigint \| Record<string, any>` |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success'` | `'primary'` | 标签的视觉配色变体 |
| `disabled` | `boolean` | `false` | 是否禁用此标签 |

### TagsInputItemDelete Props

继承基础 Primitive 属性，无额外 Props。

### TagsInputItemText Props

继承基础 Primitive 属性，无额外 Props。

## Events

### TagsInput Events

| 事件名                | 参数                | 说明                                 |
| --------------------- | ------------------- | ------------------------------------ |
| `update:modelValue`   | `payload: Array<T>` | 标签列表变化时触发                   |
| `addTag`              | `payload: T`        | 成功添加标签时触发                   |
| `removeTag`           | `payload: T`        | 成功移除标签时触发                   |
| `invalid`             | `payload: T`        | 标签无效时触发（超出最大数量或重复） |

## Slots

### TagsInput Slots

| 插槽名    | 作用域参数                 | 说明                                                    |
| --------- | -------------------------- | ------------------------------------------------------- |
| `default` | `{ modelValue: Array<T> }` | 默认插槽，用于放置 `TagsInputItem` 和 `TagsInputInput` |

### TagsInputItemDelete Slots

| 插槽名    | 说明                                |
| --------- | ----------------------------------- |
| `default` | 自定义删除按钮内容，默认显示 X 图标 |
