# Form

新粗野主义风格的表单系统，基于 vee-validate 构建，提供可组合的子组件用于结构化表单布局。

## 预览

<ComponentPreview>
  <div class="max-w-sm space-y-4">
    <div class="space-y-2">
      <label class="text-sm font-bold tracking-wide leading-none text-brutal-fg">Email</label>
      <input class="flex w-full h-11 px-4 py-2 text-base border-3 border-brutal bg-brutal-bg text-brutal-fg font-medium focus:outline-none focus:shadow-brutal" placeholder="you@example.com" />
    </div>
    <div class="space-y-2">
      <label class="text-sm font-bold tracking-wide leading-none text-brutal-fg">Password</label>
      <input type="password" class="flex w-full h-11 px-4 py-2 text-base border-3 border-brutal bg-brutal-bg text-brutal-fg font-medium focus:outline-none focus:shadow-brutal" placeholder="••••••••" />
    </div>
    <button class="w-full h-11 px-5 py-2 text-base bg-brutal-primary text-brutal-fg border-3 border-brutal shadow-brutal font-black tracking-wide active:translate-y-[2px] active:shadow-none transition-all">Sign In</button>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="form" />

**需要额外安装依赖：**

```bash
pnpm add vee-validate @vee-validate/zod zod
```

## 用法

```vue
<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import Form from '@/components/ui/Form.vue'
import FormField from '@/components/ui/FormField.vue'
import FormItem from '@/components/ui/FormItem.vue'
import FormLabel from '@/components/ui/FormLabel.vue'
import FormControl from '@/components/ui/FormControl.vue'
import FormDescription from '@/components/ui/FormDescription.vue'
import FormMessage from '@/components/ui/FormMessage.vue'
import Input from '@/components/ui/Input.vue'
import SubmitButton from '@/components/ui/SubmitButton.vue'

const schema = toTypedSchema(z.object({
    username: z.string().min(2).max(50),
    email: z.string().email(),
}))

function onSubmit(values) {
    console.log('Form submitted:', values)
}
</script>

<template>
    <Form :validation-schema="schema" @submit="onSubmit">
        <FormField name="username" v-slot="{ componentField }">
            <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                    <Input v-bind="componentField" placeholder="Enter username" />
                </FormControl>
                <FormDescription>This is your public display name.</FormDescription>
                <FormMessage />
            </FormItem>
        </FormField>

        <FormField name="email" v-slot="{ componentField }">
            <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input v-bind="componentField" type="email" placeholder="you@example.com" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <SubmitButton variant="primary">Submit</SubmitButton>
    </Form>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Form` | 根表单组件，集成 vee-validate |
| `FormField` | 字段包装器，连接表单状态 |
| `FormItem` | 标签、控件和消息的布局容器 |
| `FormLabel` | 支持错误状态的标签 |
| `FormControl` | 输入控件的包装器 |
| `FormDescription` | 输入框下方的辅助文本 |
| `FormMessage` | 验证错误消息 |

## Props

### Form

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |
| `initialValues` | `Record<string, unknown>` | — |
| `validationSchema` | `unknown` | — |

### FormField

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `name` | `string` | —（必填） |

### FormLabel

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `variant` | `'default' \| 'error' \| 'success' \| 'muted'` | `'default'` |
| `class` | `string` | — |

## 事件

### Form

| 事件 | 载荷 |
|------|------|
| `submit` | `Record<string, unknown>` |
