# Submit Button

新粗野主义风格提交按钮，内置加载和等待状态，专为表单提交设计。

## 预览

<ComponentPreview>
  <div class="flex items-center gap-3">
    <button type="submit" class="inline-flex items-center justify-center gap-2 border-3 border-brutal font-black tracking-wide transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:translate-y-[2px] active:shadow-none bg-brutal-primary text-brutal-fg shadow-brutal hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 h-11 px-5 py-2 text-base">Submit</button>
    <button type="submit" disabled class="inline-flex items-center justify-center gap-2 border-3 border-brutal font-black tracking-wide transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:translate-y-[2px] active:shadow-none bg-brutal-primary text-brutal-fg shadow-brutal hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 h-11 px-5 py-2 text-base opacity-50">Submitting...</button>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="submit-button" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import SubmitButton from '@/components/ui/SubmitButton.vue'

const isLoading = ref(false)

async function handleSubmit() {
    isLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    isLoading.value = false
}
</script>

<template>
    <form @submit.prevent="handleSubmit">
        <SubmitButton :loading="isLoading" variant="primary">
            Save Changes
        </SubmitButton>
    </form>
</template>
```

## 配合表单使用

```vue
<script setup>
import { ref } from 'vue'
import Form from '@/components/ui/Form.vue'
import SubmitButton from '@/components/ui/SubmitButton.vue'

const isLoading = ref(false)

function onSubmit(values) {
    isLoading.value = true
    setTimeout(() => {
        isLoading.value = false
    }, 2000)
}
</script>

<template>
    <Form @submit="onSubmit">
        <SubmitButton :loading="isLoading" variant="primary">
            Sign In
        </SubmitButton>
    </Form>
</template>
```

## 等待文本

加载时，按钮会显示 `pendingText` 属性的值，而非插槽内容：

```vue
<script setup>
import SubmitButton from '@/components/ui/SubmitButton.vue'
</script>

<template>
    <SubmitButton loading pending-text="Processing..." variant="primary">
        Pay Now
    </SubmitButton>
</template>
```

## 属性

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success' \| 'outline' \| 'ghost' \| 'link'` | `'default'` |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'icon'` | `'default'` |
| `pendingText` | `string` | `'Submitting...'` |
| `loading` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `class` | `string` | — |

## 行为

- 按钮渲染为 `<button type="submit">` 用于表单提交
- 当 `loading` 为 `true` 时，按钮被禁用并显示旋转图标
- 当 `loading` 为 `true` 时，插槽内容被替换为 `pendingText`
- `disabled` 属性或 `loading` 状态都会阻止点击
