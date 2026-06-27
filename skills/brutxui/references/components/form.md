# 表单组件

## Button

```vue
<Button variant="primary" size="lg" :loading="isLoading">提交</Button>
```

- `variant`: `'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'`
- `size`: `'sm' | 'default' | 'lg' | 'xl' | 'icon'`
- `loading`: `boolean`
- `disabled`: `boolean`
- `asChild`: `boolean`

## SubmitButton

```vue
<SubmitButton :loading="isSubmitting" pending-text="提交中...">提交</SubmitButton>
```

- `variant`/`size`: 同 Button
- `pendingText`: `string` — 加载时显示的文字
- `loading`: `boolean`
- `disabled`: `boolean`

## Input

```vue
<Input v-model="value" placeholder="请输入..." type="email" />
```

- `type`: `string`
- `placeholder`: `string`
- `disabled`: `boolean`

## NumberInput

数字输入框，带 +/- 按钮。

```vue
<NumberInput v-model="quantity" :min="0" :max="100" layout="split" />
```

继承 reka-ui `NumberFieldRootProps`，额外：

- `layout`: `'split' | 'stacked'` — 默认 `'split'`
- `placeholder`: `string`

## HardcoreInput

硬核输入框，带音效反馈和校验规则。

```vue
<HardcoreInput
  v-model="email"
  :rules="[(v) => v.includes('@') || '请输入有效邮箱']"
  :sound="true"
  :shake-on-error="true"
  validate-on="blur"
/>
```

- `modelValue`: `string`
- `sound`: `boolean` — 默认 `true`
- `rules`: `Array<(val: string) => boolean | string>`
- `shakeOnError`: `boolean` — 默认 `true`
- `type`: `string`
- `placeholder`: `string`
- `disabled`: `boolean`
- `readonly`: `boolean`
- `validateOn`: `'input' | 'blur' | 'submit'` — 默认 `'blur'`

## Textarea

```vue
<Textarea v-model="content" placeholder="请输入..." :rows="4" />
```

- `placeholder`: `string`
- `rows`: `number`
- `disabled`: `boolean`

## Label

```vue
<Label for="email">邮箱地址</Label>
```

- `for`: `string`

## Checkbox

```vue
<Checkbox id="terms" v-model:checked="checked" />
```

- `checked`: `boolean`（`v-model:checked`）
- `disabled`: `boolean`

## Switch

```vue
<Switch v-model:checked="enabled" />
```

- `checked`: `boolean`（`v-model:checked`）
- `disabled`: `boolean`

## RadioGroup

```vue
<RadioGroup v-model="selected">
  <RadioGroupItem value="a" id="r1" />
  <RadioGroupItem value="b" id="r2" />
</RadioGroup>
```

- `defaultValue`: `string`
- `modelValue`: `string`

## Select

```vue
<Select v-model="value">
  <SelectTrigger><SelectValue placeholder="选择..." /></SelectTrigger>
  <SelectContent>
    <SelectItem value="a">选项 A</SelectItem>
  </SelectContent>
</Select>
```

子组件：Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectLabel, SelectSeparator, SelectGroup, SelectScrollUpButton, SelectScrollDownButton

## Combobox

```vue
<Combobox
  :options="[{ value: 'vue', label: 'Vue.js' }]"
  v-model="framework"
  placeholder="选择框架"
  search-placeholder="搜索..."
  empty-text="没有结果"
/>
```

- `options`: `ComboboxOption[]` — `{ value: string; label: string; disabled?: boolean }[]`
- `modelValue`: `string`
- `placeholder`: `string`
- `searchPlaceholder`: `string`
- `emptyText`: `string`
- `disabled`: `boolean`

## TreeSelect

树形下拉选择器，基于 Popover + 递归节点组件构建。

```vue
<TreeSelect
  :nodes="[
    { id: '1', label: '文档', children: [
      { id: '1-1', label: '指南' },
      { id: '1-2', label: 'API' },
    ]},
    { id: '2', label: '源码' },
  ]"
  v-model="selected"
  placeholder="选择节点..."
  searchable
  clearable
/>
```

- `nodes`: `TreeNode[]` — 树形数据
- `modelValue`: `string | string[]` — 单选为 string，多选为 string[]
- `multiple`: `boolean` — 默认 `false`
- `searchable`: `boolean` — 默认 `true`
- `clearable`: `boolean` — 默认 `false`
- `placeholder`: `string`
- `searchPlaceholder`: `string`
- `emptyText`: `string`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `maxDisplay`: `number` — 多选时最多显示标签数，默认 `3`
- `maxHeight`: `string` — 下拉列表最大高度，默认 `'15rem'`
- `disabled`: `boolean`

TreeNode: `{ id: string; label: string; children?: TreeNode[]; disabled?: boolean; icon?: string; data?: unknown }`

## Slider

```vue
<Slider v-model="value" :min="0" :max="100" :step="5" />
```

- `modelValue`: `number[]`
- `defaultValue`: `number[]`
- `min`: `number` — 默认 `0`
- `max`: `number` — 默认 `100`
- `step`: `number` — 默认 `1`
- `disabled`: `boolean`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `variant`: `'default' | 'primary' | 'secondary' | 'success'` — 默认 `'default'`

## Toggle

```vue
<Toggle v-model:pressed="isOn" variant="outline" size="sm">B</Toggle>
```

- `pressed`: `boolean`（`v-model:pressed`）
- `variant`: `'default' | 'outline'`
- `size`: `'default' | 'sm' | 'lg'`
- `disabled`: `boolean`

## ToggleGroup

```vue
<ToggleGroup type="multiple" v-model="selected">
  <ToggleGroupItem value="bold">B</ToggleGroupItem>
  <ToggleGroupItem value="italic">I</ToggleGroupItem>
</ToggleGroup>
```

- `type`: `'single' | 'multiple'` — 默认 `'single'`
- `modelValue`: `string | string[]`
- `variant`: `'default' | 'outline'`
- `size`: `'default' | 'sm' | 'lg'`

## TagsInput

```vue
<TagsInput v-model="tags">
  <TagsInputInput placeholder="添加标签..." />
  <TagsInputItem v-for="tag in tags" :key="tag" :value="tag">
    <TagsInputItemText>{{ tag }}</TagsInputItemText>
    <TagsInputItemDelete />
  </TagsInputItem>
</TagsInput>
```

子组件：TagsInput, TagsInputInput, TagsInputItem, TagsInputItemText, TagsInputItemDelete

## Calendar

基于 v-calendar DatePicker 构建，支持单日期和日期范围选择。需要额外安装 `v-calendar`。

```vue
<Calendar v-model="selectedDate" />
<Calendar v-model="dateRange" :is-range="true" />
```

- `modelValue`: `Date | Date[] | null`
- `isRange`: `boolean` — 默认 `false`
- `disabled`: `boolean` — 默认 `false`

## ColorPicker

颜色选择器，基于 reka-ui Popover 构建。支持 HEX/RGB/HSL 格式、透明度、预设颜色和历史记录。

```vue
<ColorPicker v-model="color" format="hex" :show-alpha="true" />
<ColorPicker v-model="color" :presets="['#FF6B6B', '#4ECDC4']" :show-history="true" />
```

- `modelValue`: `string | null`
- `format`: `'hex' | 'rgb' | 'hsl'` — 默认 `'hex'`
- `showAlpha`: `boolean` — 默认 `false`
- `presets`: `string[] | ColorPreset[]`
- `showPresets`: `boolean` — 默认 `true`
- `showHistory`: `boolean` — 默认 `false`
- `historyMax`: `number` — 默认 `10`
- `historyStorageKey`: `string`
- `disabled`: `boolean` — 默认 `false`
- `clearable`: `boolean` — 默认 `false`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`

## DatePicker

日期选择器组件族，基于 v-calendar + reka-ui Popover。需要额外安装 `v-calendar`。包含 7 个组件：

```vue
<DatePicker v-model="date" :shortcuts="shortcuts" :clearable="true" />
<DatePickerRange v-model="range" start-placeholder="开始" end-placeholder="结束" />
<DateTimePicker v-model="dt" :show-seconds="true" :time-step="{ minute: 15 }" />
<TimePicker v-model="time" :show-seconds="true" />
<WeekPicker v-model="week" :week-starts-on="1" />
<MonthPicker v-model="month" />
<YearPicker v-model="year" />
```

### DatePicker

- `modelValue`: `Date | null`
- `mode`: `'date' | 'week' | 'month' | 'year'` — 默认 `'date'`
- `displayFormat`: `string` — 默认 `'YYYY-MM-DD'`，支持 YYYY/YY/MM/DD/HH/mm/ss/WW token
- `valueFormat`: `'date' | 'timestamp' | string` — 默认 `'date'`
- `minDate` / `maxDate`: `Date`
- `disabled` / `readonly` / `clearable`: `boolean`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `variant`: `'default' | 'error' | 'success'`
- `shortcuts`: `DatePickerShortcut[]` — `{ label: string; value: Date | (() => Date) }`

### DatePickerRange

- `modelValue`: `[Date, Date] | null`
- `startPlaceholder` / `endPlaceholder` / `separator`: `string`
- `shortcuts`: `DatePickerRangeShortcut[]` — `{ label: string; value: [Date, Date] | (() => [Date, Date]) }`

### DateTimePicker

- `modelValue`: `Date | null`
- `displayFormat`: `string` — 默认 `'YYYY-MM-DD HH:mm'`（showSeconds 时含 ss）
- `showSeconds`: `boolean` — 默认 `false`
- `timeStep`: `{ hour?: number; minute?: number; second?: number }`
- `shortcuts`: `DatePickerShortcut[]`

### TimePicker

- `modelValue`: `Date | null`
- `showSeconds`: `boolean` — 默认 `false`
- `timeStep`: `{ hour?: number; minute?: number; second?: number }`

### WeekPicker

- `modelValue`: `Date | null`（自动对齐到周起始日，整周高亮）
- `displayFormat`: `string` — 默认 `'YYYY-WW'`
- `weekStartsOn`: `0 | 1` — 默认 `1`（0=周日，1=周一）
- `shortcuts`: `DatePickerShortcut[]`

### MonthPicker

- `modelValue`: `Date | null`
- `displayFormat`: `string` — 默认 `'YYYY-MM'`

### YearPicker

- `modelValue`: `Date | null`
- `displayFormat`: `string` — 默认 `'YYYY'`

所有组件共享事件：`update:modelValue`、`change`、`open`、`close`。

## Form

完整的表单系统，集成 vee-validate 和 Zod 校验。

### 基本用法

```vue
<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, Input, SubmitButton } from 'brutx-ui-vue'

const schema = toTypedSchema(z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
}))

function onSubmit(values: Record<string, unknown>) {
  console.log('Form submitted:', values)
}
</script>

<template>
  <Form :validation-schema="schema" @submit="onSubmit">
    <FormField name="username" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>用户名</FormLabel>
        <FormControl>
          <Input v-bind="componentField" placeholder="请输入用户名" />
        </FormControl>
        <FormDescription>这是您的公开显示名称。</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="email" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>邮箱</FormLabel>
        <FormControl>
          <Input v-bind="componentField" type="email" placeholder="you@example.com" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <SubmitButton variant="primary">提交</SubmitButton>
  </Form>
</template>
```

### 子组件

| 组件 | 说明 |
| --- | --- |
| `Form` | 根表单组件，集成 vee-validate |
| `FormField` | 字段包装器，连接表单状态，提供 `value` 和 `setValue` |
| `FormItem` | 标签、控件和消息的布局容器 |
| `FormLabel` | 支持错误状态的标签，注入字段上下文 |
| `FormControl` | 输入控件的包装器，注入字段上下文 |
| `FormDescription` | 输入框下方的辅助文本 |
| `FormMessage` | 验证错误消息，注入字段上下文 |

### 字段上下文

`FormField` 通过 `provide/inject` 向子组件提供 `FormFieldContext`：

```typescript
interface FormFieldContext {
  name: ComputedRef<string>
  error: Ref<string | undefined>
  value: Ref<unknown>
  setValue: (value: unknown) => void
}
```

### Form Props

| 属性 | 类型 | 默认值 |
| --- | --- | --- |
| `class` | `string` | — |
| `initialValues` | `Record<string, unknown>` | — |
| `validationSchema` | `unknown` | — |

### FormField Props

| 属性 | 类型 | 默认值 |
| --- | --- | --- |
| `name` | `string` | —（必填） |

### FormLabel Props

| 属性 | 类型 | 默认值 |
| --- | --- | --- |
| `variant` | `'default' \| 'error' \| 'success' \| 'muted'` | `'default'` |
| `class` | `string` | — |

### Form Events

| 事件 | 载荷 |
| --- | --- |
| `submit` | `Record<string, unknown>` |

## FormWizard 多步骤表单

基于 Stepper 组件的向导式表单，支持步骤验证和线性导航。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FormWizard, Input } from 'brutx-ui-vue'

const values = ref({})
const steps = [
    { id: 'personal', title: '个人信息' },
    { id: 'address', title: '地址' },
]
</script>

<template>
    <FormWizard v-model="values" :steps="steps" @complete="onComplete">
        <template #step-personal>
            <Input v-model="values.name" placeholder="姓名" />
        </template>
        <template #step-address>
            <Input v-model="values.address" placeholder="地址" />
        </template>
    </FormWizard>
</template>
```

### FormWizard Props

- `steps`: `FormStep[]` — 步骤配置数组（必填）
- `modelValue`: `Record<string, unknown>` — 表单数据（v-model）
- `initialStep`: `number` — 初始步骤索引，默认 `0`
- `validateOnNext`: `boolean` — 下一步时验证，默认 `true`
- `showIndicator`: `boolean` — 显示步骤指示器，默认 `true`
- `linear`: `boolean` — 必须按顺序完成，默认 `true`

### FormStep 类型

```typescript
interface FormStep {
    id: string
    title: string
    description?: string
    validator?: (values: Record<string, unknown>) => ValidationResult
    optional?: boolean
}
```

### useFormWizard

在 FormWizard 子组件中获取向导上下文：

```typescript
const { currentStep, nextStep, previousStep, goToStep, complete, isFirstStep, isLastStep } = useFormWizard()
```

## FormConditional 条件字段

根据表单值动态显示/隐藏字段组：

```vue
<Form v-model="values">
    <FormField name="type" />
    <FormConditional :when="(v) => v.type === 'company'">
        <FormField name="companyName" />
    </FormConditional>
</Form>
```

- `when`: `(values: Record<string, unknown>) => boolean` — 条件判断函数（必填）
