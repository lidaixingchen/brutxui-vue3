---
title: TagsInput 标签输入
description: 标签输入框组件，用于输入或粘贴以添加标签、分类，支持键盘快捷键和退格键删除。
---

# TagsInput 标签输入

新粗野主义风格的标签录入组件，基于 reka-ui 原语构建，常用于文章标签、邮件收件人、关键词筛选等表单场景。支持键盘快捷键、分隔符自动添加和多种配色变体。

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

| 变体 | 说明 |
|------|------|
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

## 子组件

| 组件 | 说明 |
|------|------|
| `TagsInput` | 根组件，管理标签列表状态 |
| `TagsInputInput` | 文本输入框 |
| `TagsInputItem` | 单个标签项容器 |
| `TagsInputItemText` | 标签文本内容 |
| `TagsInputItemDelete` | 标签删除按钮 |

## API 参考

<span id="tagsinput"></span>
<span id="tagsinputinput"></span>
<span id="tagsinputitem"></span>
<span id="tagsinputitemdelete"></span>
<span id="tagsinputitemtext"></span>
<span id="事件"></span>
<span id="插槽"></span>
<span id="tagsinput-1"></span>
<span id="tagsinputitemdelete-1"></span>

<ComponentApi name="tags-input" />

## 可访问性

- **ARIA 属性**：TagsInput 默认通过 locale 提供 `aria-label`（中文为"标签输入"），未提供时回退到 `t('tagsInput.label')`
- **自定义标签**：当需要更具体的描述（如"文章标签"、"收件人"）时，可通过 `ariaLabel` prop 自定义

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

## 常见问题

**Q: 如何使用对象作为标签值而非字符串？**

A: 当标签值为对象时，必须提供 `convertValue` 函数将输入字符串转换为目标对象类型，同时建议提供 `displayValue` 函数来自定义标签的显示文本。如果未提供 `convertValue`，组件将使用字符串作为标签值。

**Q: 为什么设置了 `max` 属性后添加标签没有反应？**

A: 当标签数量达到 `max` 限制时，新标签不会被添加，同时会触发 `invalid` 事件。可以通过监听该事件来向用户展示提示信息。如果 `max` 设为 `0`，则表示不限制标签数量。

**Q: 粘贴多个标签时如何自动拆分？**

A: 设置 `addOnPaste` 为 `true` 后，粘贴包含分隔符的文本时会自动拆分为多个标签。默认分隔符为逗号（`,`），可通过 `delimiter` 属性自定义，支持字符串和正则表达式。例如设置 `delimiter=";"` 可以按分号拆分。
