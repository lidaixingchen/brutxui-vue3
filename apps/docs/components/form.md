---
title: Form 表单
description: 完整的表单字段包装器，集成了 Vee-Validate 与 Zod 模式校验支持。
---

# Form 表单

新粗野主义风格的表单系统，基于 vee-validate 构建，提供可组合的子组件用于结构化表单布局。

## 预览

<ComponentPreview>
  <FormDemo />
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
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, Input, SubmitButton } from 'brutx-ui-vue'

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
| `FormField` | 字段包装器，连接表单状态，提供 `value` 和 `setValue` |
| `FormItem` | 标签、控件和消息的布局容器 |
| `FormLabel` | 支持错误状态的标签，注入字段上下文 |
| `FormControl` | 输入控件的包装器，注入字段上下文 |
| `FormDescription` | 输入框下方的辅助文本 |
| `FormMessage` | 验证错误消息，注入字段上下文 |

## 字段上下文

`FormField` 通过 `provide/inject` 向子组件提供 `FormFieldContext`：

```ts
interface FormFieldContext {
    name: ComputedRef<string>
    error: Ref<string | undefined>
    value: Ref<unknown>        // 字段当前值
    setValue: (value: unknown) => void  // 设置字段值
}
```

`FormControl`、`FormLabel`、`FormMessage` 均注入此上下文，可直接访问字段值和错误状态。

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

---

## FormWizard 多步骤表单

基于 `Stepper` 组件构建的向导式表单，支持步骤验证、线性导航和自定义步骤内容。

### 用法

```vue
<script setup>
import { ref } from 'vue'
import { FormWizard, FormStep, Input } from 'brutx-ui-vue'

const values = ref({})

const steps = [
    { id: 'personal', title: '个人信息' },
    { id: 'address', title: '地址' },
    { id: 'review', title: '确认' },
]

function onComplete(finalValues) {
    console.log('提交:', finalValues)
}
</script>

<template>
    <FormWizard
        v-model="values"
        :steps="steps"
        @complete="onComplete"
    >
        <template #step-personal>
            <Input v-model="values.name" placeholder="姓名" />
        </template>
        <template #step-address>
            <Input v-model="values.address" placeholder="地址" />
        </template>
        <template #step-review>
            <p>确认信息：{{ values }}</p>
        </template>
    </FormWizard>
</template>
```

### FormWizard Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `steps` | `FormStep[]` | — | 步骤配置数组（必填） |
| `modelValue` | `Record<string, unknown>` | `{}` | 表单数据（v-model） |
| `initialStep` | `number` | `0` | 初始步骤索引 |
| `validateOnNext` | `boolean` | `true` | 是否在下一步时验证 |
| `showIndicator` | `boolean` | `true` | 是否显示步骤指示器 |
| `linear` | `boolean` | `true` | 是否必须按顺序完成 |
| `class` | `string` | — | 自定义样式类 |

### FormStep 类型

```ts
interface FormStep {
    id: string
    title: string
    description?: string
    icon?: Component
    validator?: (values: Record<string, unknown>) => ValidationResult
    optional?: boolean
}

interface ValidationResult {
    valid: boolean
    errors: Record<string, string>
}
```

### FormWizard 事件

| 事件 | 载荷 | 说明 |
|------|------|------|
| `update:modelValue` | `Record<string, unknown>` | 表单数据更新 |
| `stepChange` | `[step: number, previousStep: number]` | 步骤切换 |
| `complete` | `Record<string, unknown>` | 表单完成 |
| `validationError` | `[step: number, errors: Record<string, string>]` | 验证失败 |

### useFormWizard

在 FormWizard 子组件中获取向导上下文：

```ts
const {
    currentStep,    // Ref<number> - 当前步骤
    steps,          // ComputedRef<FormStep[]> - 步骤配置
    values,         // ComputedRef<Record<string, unknown>> - 表单数据
    nextStep,       // () => void - 下一步
    previousStep,   // () => void - 上一步
    goToStep,       // (step: number) => void - 跳转步骤
    complete,       // () => void - 完成表单
    isFirstStep,    // ComputedRef<boolean>
    isLastStep,     // ComputedRef<boolean>
    canGoNext,      // ComputedRef<boolean>
} = useFormWizard()
```

---

## FormConditional 条件字段

根据表单值动态显示/隐藏字段组：

```vue
<template>
    <Form v-model="values">
        <FormField name="type" />

        <FormConditional :when="(v) => v.type === 'company'">
            <FormField name="companyName" />
            <FormField name="taxId" />
        </FormConditional>

        <FormConditional :when="(v) => v.type === 'personal'">
            <FormField name="idNumber" />
        </FormConditional>
    </Form>
</template>
```

### FormConditional Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `when` | `(values: Record<string, unknown>) => boolean` | — | 条件判断函数（必填） |
| `class` | `string` | — | 自定义样式类 |
