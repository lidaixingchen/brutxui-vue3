---
title: Input 输入框
description: 单行文本输入框，带新粗野主义高亮外边框和自定义占位符。
---

# Input 输入框

新粗野主义风格的文本输入框，支持变体、尺寸和 v-model 双向绑定。

## 预览

<ComponentPreview>
  <InputDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="input" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('')
</script>

<template>
    <Input v-model="value" placeholder="Enter your name..." />
</template>
```

### 搭配 Label

```vue
<script setup>
import { ref } from 'vue'
import { Input, Label } from 'brutx-ui-vue'

const email = ref('')
</script>

<template>
    <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input id="email" v-model="email" type="email" placeholder="you@example.com" />
    </div>
</template>
```

### 禁用状态

```vue
<script setup>
import { Input } from 'brutx-ui-vue'
</script>

<template>
    <Input disabled placeholder="Disabled input" />
</template>
```

### 只读状态

通过 `readonly` 属性设置只读输入框。只读状态下输入框不可编辑但可聚焦选择文本，光标样式为 `cursor-default`，不会降低透明度（区别于 `disabled`）。

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('只读内容，可选中复制但不可编辑')
</script>

<template>
    <Input v-model="value" readonly />
</template>
```

### 错误消息

通过 `variant="error"` 和 `errorMessage` 属性显示错误消息。错误消息使用 `role="alert"` 确保屏幕阅读器自动播报。

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const email = ref('')
</script>

<template>
    <Input
        v-model="email"
        type="email"
        variant="error"
        error-message="请输入有效的邮箱地址"
        placeholder="you@example.com"
    />
</template>
```

### 可清除

设置 `clearable` 属性后，鼠标悬停时会显示清除按钮。

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('点击清除')
</script>

<template>
    <Input v-model="value" clearable @clear="value = ''" />
</template>
```

### 密码切换

设置 `show-password` 属性后，密码输入框会显示可见性切换按钮。

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const password = ref('')
</script>

<template>
    <Input v-model="password" type="password" show-password placeholder="请输入密码" />
</template>
```

### 字数统计

同时设置 `show-word-limit` 和 `maxlength` 属性后，会显示字数统计。

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('')
</script>

<template>
    <Input v-model="value" maxlength="100" show-word-limit placeholder="最多 100 个字符" />
</template>
```

### 图标与前后缀

优先使用 `Input` 自身的 `prefixIcon`、`suffixIcon` props 和 `prepend`、`append` 插槽来实现输入框装饰。

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'
import { Search } from '@lucide/vue'

const url = ref('')
</script>

<template>
    <Input :prefix-icon="Search" placeholder="搜索项目" />

    <Input v-model="url" placeholder="请输入网址">
        <template #prepend>https://</template>
        <template #append>.com</template>
    </Input>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 标准边框，悬浮上浮 + 盖影按压，聚焦时阴影放大 |
| `error` | 错误边框，聚焦时使用 Primary 阴影 |
| `success` | 成功边框，聚焦时使用 Secondary 阴影 |
| `inset` | 冲压凹槽：静态内嵌形态（内嵌阴影），刻意无悬浮/按压/聚焦上浮反馈——凹槽的物理语义是「沉入外壳」 |

```vue
<template>
    <Input v-model="value" variant="inset" placeholder="冲压凹槽形态" />
</template>
```

## 尺寸

| 尺寸 | 高度 | 内边距 | 字体大小 |
|------|------|--------|----------|
| `sm` | `h-9` | `px-3 py-1` | `text-sm` |
| `default` | `h-11` | `px-4 py-2` | `text-base` |
| `lg` | `h-14` | `px-5 py-3` | `text-lg` |

## API 参考

<span id="事件"></span>
<span id="插槽"></span>
<span id="方法-defineexpose"></span>

<ComponentApi name="input" />

## 数据类型

HTMLInputType 与 HTMLInputElement.type 支持的原生类型一致：button、checkbox、color、date、datetime-local、email、file、hidden、image、month、number、password、radio、range、reset、search、submit、tel、text、time、url 和 week。

## 程序化控制

通过组件 ref 可调用下列原生输入操作，完整成员语义见 API 参考。

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const inputRef = ref(null)

function handleFocus() {
    inputRef.value?.focus()
}
</script>

<template>
    <Input ref="inputRef" placeholder="Click button to focus" />
    <button @click="handleFocus">Focus Input</button>
</template>
```


## 可访问性

通过 ARIA 属性增强输入框的无障碍可访问性，便于辅助技术（如屏幕阅读器）正确朗读：

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const email = ref('')
</script>

<template>
    <Input
        v-model="email"
        type="email"
        aria-label="邮箱地址"
        aria-required="true"
        aria-invalid="false"
        placeholder="you@example.com"
    />
</template>
```
