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

### FormWizard 多步骤表单

基于 `Stepper` 组件构建的向导式表单，支持步骤验证、线性导航和自定义步骤内容。

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

### FormConditional 条件字段

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

## 子组件

| 组件 | 说明 |
| ---- | ---- |
| `Form` | 根表单组件，集成 vee-validate |
| `FormField` | 字段包装器，连接表单状态，提供字段上下文 |
| `FormItem` | 标签、控件和消息的布局容器，生成唯一 ID |
| `FormLabel` | 支持错误状态的标签，注入字段上下文 |
| `FormControl` | 输入控件的包装器，通过 slot 提供无障碍属性 |
| `FormDescription` | 输入框下方的辅助文本 |
| `FormMessage` | 验证错误消息，注入字段上下文 |
| `FormWizard` | 多步骤向导式表单 |
| `FormConditional` | 根据表单值动态显示/隐藏字段组 |

## 数据类型

### FormFieldContext

`FormField` 通过 `provide/inject` 向子组件提供 `FormFieldContext`：

```ts
interface FormFieldContext {
    name: ComputedRef<string>
    error: Ref<string | undefined>
    value: Ref<unknown>
    setValue: (value: unknown) => void
    setError: (message: string | undefined) => void
}
```

### FormItemContext

`FormItem` 通过 `provide/inject` 向子组件提供 `FormItemContext`：

```ts
interface FormItemContext {
    id: string
    formItemId: string
    formDescriptionId: string
    formMessageId: string
}
```

`FormControl`、`FormLabel`、`FormMessage` 均注入 `FormFieldContext` 和 `FormItemContext`，可直接访问字段值和错误状态。

### FormStep

```ts
interface FormStep {
    id: string
    title: string
    description?: string
    icon?: Component
    validator?: (values: Record<string, unknown>) => ValidationResult
    optional?: boolean
}
```

### ValidationResult

```ts
interface ValidationResult {
    valid: boolean
    errors: Record<string, string>
}
```

## 组合式函数

### useFormWizard

在 FormWizard 子组件中获取向导上下文：

```ts
const {
    currentStep,    // Ref<number> - 当前步骤
    steps,          // ComputedRef<FormStep[]> - 步骤配置
    values,         // ComputedRef<Record<string, unknown>> - 表单数据
    updateValues,   // (values: Record<string, unknown>) => void - 更新表单数据
    nextStep,       // () => void - 下一步
    previousStep,   // () => void - 上一步
    goToStep,       // (step: number) => void - 跳转步骤
    complete,       // () => void - 完成表单
    getStepErrors,  // (step: number) => Record<string, string> | undefined - 获取指定步骤的错误
    isFirstStep,    // ComputedRef<boolean>
    isLastStep,     // ComputedRef<boolean>
    canGoNext,      // ComputedRef<boolean>
} = useFormWizard()
```

## Props

### Form

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `class` | `string` | — | 自定义样式类 |
| `initialValues` | `Record<string, unknown>` | — | 表单初始值 |
| `validationSchema` | `unknown` | — | 验证模式（支持 vee-validate schema） |

### FormField

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `name` | `string` | —（必填） | 字段名称 |

### FormItem

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `class` | `string` | — | 自定义样式类 |

### FormLabel

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `class` | `string` | — | 自定义样式类（错误状态时自动添加 `text-brutal-destructive`） |

### FormControl

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `class` | `string` | — | 自定义样式类 |

**Slot Props:** `FormControl` 通过作用域 slot 提供以下属性，用于绑定到内部输入控件：

| 属性 | 类型 | 说明 |
| ---- | ---- | ---- |
| `id` | `string` | 与 `FormItem` 关联的唯一 ID |
| `class` | `string` | 样式类 |
| `aria-describedby` | `string` | 描述元素的 ID（包含 `FormDescription` 和 `FormMessage`） |
| `aria-invalid` | `boolean` | 字段是否有验证错误 |

```vue
<FormControl v-slot="{ id, ariaDescribedby, ariaInvalid }">
    <Input :id="id" :aria-describedby="ariaDescribedby" :aria-invalid="ariaInvalid" />
</FormControl>
```

### FormDescription

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `class` | `string` | — | 自定义样式类 |

### FormMessage

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `class` | `string` | — | 自定义样式类 |

### FormWizard

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `steps` | `FormStep[]` | — | 步骤配置数组（必填） |
| `modelValue` | `Record<string, unknown>` | `{}` | 表单数据（v-model） |
| `initialStep` | `number` | `0` | 初始步骤索引 |
| `validateOnNext` | `boolean` | `true` | 是否在下一步时验证 |
| `showIndicator` | `boolean` | `true` | 是否显示步骤指示器 |
| `linear` | `boolean` | `true` | 是否必须按顺序完成 |
| `class` | `string` | — | 自定义样式类 |

### FormConditional

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `when` | `(values: Record<string, unknown>) => boolean` | — | 条件判断函数（必填） |
| `class` | `string` | — | 自定义样式类 |

## 事件

### Form 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `submit` | `Record<string, unknown>` | 表单提交时触发，包含所有字段值 |

### FormWizard 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `update:modelValue` | `Record<string, unknown>` | 表单数据更新 |
| `step-change` | `[step: number, previousStep: number]` | 步骤切换 |
| `complete` | `Record<string, unknown>` | 表单完成 |
| `validation-error` | `[step: number, errors: Record<string, string>]` | 验证失败 |
| `navigation-blocked` | `[targetStep: number, blockedStep: number]` | 线性模式下导航被阻止 |

## 可访问性

### 表单结构

- `FormItem` 自动生成唯一 ID，确保 `FormLabel`、`FormControl`、`FormDescription`、`FormMessage` 之间的关联关系正确。
- `FormLabel` 通过 `for` 属性关联到对应的输入控件。
- `FormControl` 通过作用域 slot 提供 `id`、`aria-describedby`、`aria-invalid` 属性，需绑定到内部输入控件以保证无障碍性。

### 验证错误

- 验证失败时，`FormLabel` 自动添加 `text-brutal-destructive` 样式。
- `FormMessage` 使用 `role="alert"` 确保屏幕阅读器能及时播报错误信息。
- 输入控件的 `aria-invalid` 属性会自动设置为 `true`。

### FormWizard 导航

- 步骤指示器使用 `role="tablist"` 和 `role="tab"` 语义。
- 支持键盘导航（Tab、Enter、Space）。
- 当 `linear` 模式启用时，被阻止的步骤会通过 `aria-disabled` 标识。

## 常见问题

**Q: 提交时没有触发表单验证是怎么回事？**

A: 请确认已正确安装并配置了 `vee-validate` 和 `@vee-validate/zod` 依赖，并且将 `validationSchema` 传递给了 `Form` 组件。同时，每个需要验证的字段必须用 `FormField` 包裹，并确保 `FormField` 的 `name` 属性与 schema 中的字段名一致。

**Q: FormWizard 中如何跳过某些步骤的验证？**

A: 在 `steps` 配置中设置 `optional: true` 可将步骤标记为可选，可选步骤在前进时不会触发验证。如果需要更精细的控制，可以在步骤的 `validator` 函数中自定义验证逻辑，根据条件返回 `{ valid: true, errors: {} }` 来跳过验证。

**Q: FormConditional 的条件函数为什么不生效？**

A: `FormConditional` 的 `when` 函数接收的参数是当前表单的完整值对象。请确保字段名拼写正确，且表单值已通过 `v-model` 或 `initialValues` 正确初始化。如果条件依赖的字段尚未渲染或值为 `undefined`，条件判断可能会返回意外结果。
