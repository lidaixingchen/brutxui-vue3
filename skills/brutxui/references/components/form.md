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

<!-- 错误消息 -->
<Input
  v-model="email"
  variant="error"
  error-message="请输入有效的邮箱地址"
  placeholder="you@example.com"
/>

<!-- 可清除 -->
<Input v-model="value" clearable @clear="value = ''" />

<!-- 密码切换 -->
<Input v-model="password" type="password" show-password placeholder="请输入密码" />

<!-- 字数统计 -->
<Input v-model="value" maxlength="100" show-word-limit placeholder="最多 100 个字符" />

<!-- 前缀/后缀插槽 -->
<Input v-model="url" placeholder="请输入网址">
  <template #prepend>https://</template>
  <template #append>.com</template>
</Input>

<!-- 无障碍属性 -->
<Input
  v-model="email"
  aria-label="邮箱地址"
  aria-describedby="email-hint"
  :aria-invalid="hasError"
  :aria-required="true"
/>
```

- `type`: `string`
- `placeholder`: `string`
- `disabled`: `boolean`
- `readonly`: `boolean`
- `variant`: `'default' | 'error' | 'success'` — 默认 `'default'`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `maxlength`: `number` — 最大输入长度
- `clearable`: `boolean` — 悬停时显示清除按钮
- `showPassword`: `boolean` — 显示密码切换按钮（仅 `type="password"` 有效）
- `showWordLimit`: `boolean` — 显示字数统计（需配合 `maxlength`）
- `prefixIcon`: `Component` — 前缀图标
- `suffixIcon`: `Component` — 后缀图标
- `errorMessage`: `string` — 错误消息文本，仅在 `variant="error"` 时显示，使用 `role="alert"` 确保屏幕阅读器自动播报
- `ariaLabel`: `string` — 无障碍标签
- `ariaLabelledby`: `string` — 关联的标签元素 ID
- `ariaDescribedby`: `string` — 描述元素 ID
- `ariaInvalid`: `boolean` — 是否无效
- `ariaRequired`: `boolean` — 是否必填

### Input 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `string` | 值更新时触发 |
| `clear` | — | 点击清除按钮时触发 |

### Input 插槽

| 插槽 | 说明 |
| --- | --- |
| `prepend` | 输入框前置内容（如 URL 协议） |
| `append` | 输入框后置内容（如域名） |
| `prefix` | 自定义前缀内容 |
| `suffix` | 自定义后缀内容 |

### Input 暴露的 API

通过 `ref` 访问组件实例后可调用以下方法：

| 方法 | 说明 |
| --- | --- |
| `focus()` | 聚焦输入框 |
| `blur()` | 移除焦点 |
| `select()` | 选中输入框中的文本 |

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

## NumberInput

数字输入框，带 +/- 按钮。

```vue
<NumberInput v-model="quantity" :min="0" :max="100" layout="split" />

<!-- 边框样式变体 -->
<NumberInput v-model="count" variant="error" error-message="请输入有效数字" />
```

继承 reka-ui `NumberFieldRootProps`，额外：

- `layout`: `'split' | 'stacked'` — 默认 `'split'`
- `variant`: `'default' | 'error' | 'success'` — 默认 `'default'`，边框样式变体
- `errorMessage`: `string` — 错误消息文本，仅在 `variant="error"` 时显示
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

<!-- 错误消息 -->
<Textarea
  v-model="message"
  variant="error"
  error-message="消息内容不能为空"
  placeholder="请输入消息..."
/>

<!-- 无障碍属性 -->
<Textarea
  v-model="bio"
  aria-label="个人简介"
  aria-describedby="bio-hint"
  :aria-invalid="hasError"
  :aria-required="true"
/>
```

- `placeholder`: `string`
- `rows`: `number`
- `disabled`: `boolean`
- `readonly`: `boolean`
- `variant`: `'default' | 'error' | 'success'` — 默认 `'default'`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `errorMessage`: `string` — 错误消息文本，仅在 `variant="error"` 时显示，使用 `role="alert"` 确保屏幕阅读器自动播报
- `ariaLabel`: `string` — 无障碍标签
- `ariaLabelledby`: `string` — 关联的标签元素 ID
- `ariaDescribedby`: `string` — 描述元素 ID
- `ariaInvalid`: `boolean` — 是否无效
- `ariaRequired`: `boolean` — 是否必填

### Textarea 暴露的 API

通过 `ref` 访问组件实例后可调用以下方法：

| 方法 | 说明 |
|------|------|
| `focus()` | 聚焦文本域 |
| `blur()` | 移除焦点 |
| `select()` | 选中文本域中的文本 |

## Label

```vue
<Label for="email" size="default" :required="true">邮箱地址</Label>
```

- `for`: `string`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `required`: `boolean` — 默认 `false`，为 true 时渲染红色 `*` 星号并设 `aria-required`

## Checkbox

```vue
<Checkbox id="terms" v-model:checked="checked" />
```

- `checked`: `boolean`（`v-model:checked`）
- `disabled`: `boolean`
- `ariaLabel`: `string` — 无障碍标签，未提供时使用 locale 默认值 `t('checkbox.check')`

> indeterminate 状态（`checked="indeterminate"`）显示 `Minus` 图标，而非 `Check` 图标。

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

<!-- SelectTrigger 边框样式变体 -->
<Select>
  <SelectTrigger variant="error" error-message="请选择一个选项">
    <SelectValue placeholder="选择..." />
  </SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>

<!-- SelectTrigger 可清除 -->
<Select v-model="value">
  <SelectTrigger clearable :model-value="value" @clear="value = ''">
    <SelectValue placeholder="选择..." />
  </SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>
```

子组件：Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectLabel, SelectSeparator, SelectGroup, SelectScrollUpButton, SelectScrollDownButton

### SelectTrigger Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 触发器尺寸 |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | 边框样式变体 |
| `errorMessage` | `string` | — | 错误消息文本，仅在 `variant="error"` 时显示 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `clearable` | `boolean` | `false` | 悬停时显示清除按钮 |
| `modelValue` | `string \| number \| null` | — | 当前选中值（用于清除功能） |

### SelectTrigger 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `clear` | — | 点击清除按钮时触发 |

## Combobox

```vue
<Combobox
  :options="[{ value: 'vue', label: 'Vue.js' }]"
  v-model="framework"
  placeholder="选择框架"
  search-placeholder="搜索..."
  empty-text="没有结果"
  :loading="isLoading"
  :creative="true"
  @create="handleCreate"
/>
```

- `options`: `ComboboxOption[]` — `{ value: string; label: string; disabled?: boolean }[]`
- `modelValue`: `string`
- `placeholder`: `string`
- `searchPlaceholder`: `string`
- `emptyText`: `string`
- `disabled`: `boolean`
- `loading`: `boolean` — 默认 `false`，列表底部显示 Spinner
- `creative`: `boolean` — 默认 `false`，输入无匹配项时显示"创建 '{query}'"选项
- Events: `update:modelValue`, `create(query: string)` — creative 模式下选择创建项时触发

> ComboboxMulti 同步支持 `loading`/`creative`/`create`，但创建后不关闭下拉（多选模式保持打开）。

### Combobox 暴露的 API

| 属性/方法 | 类型 | 说明 |
| --- | --- | --- |
| `open` | `Ref<boolean>` | 下拉面板是否展开 |
| `searchQuery` | `Ref<string>` | 当前搜索关键词 |
| `selectedValue` | `ComputedRef<string \| undefined>` | 当前选中值（只读） |
| `focus` | `() => void` | 聚焦触发器 |

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

### TreeSelect 暴露的 API

| 属性/方法 | 类型 | 说明 |
| --- | --- | --- |
| `open` | `Ref<boolean>` | 下拉面板是否展开 |
| `searchQuery` | `Ref<string>` | 当前搜索关键词 |
| `selectedNodes` | `ComputedRef<TreeNode[]>` | 多选模式下选中的节点列表（只读） |
| `expandedIds` | `Ref<Set<string>>` | 当前展开的节点 ID 集合 |
| `focus` | `() => void` | 聚焦触发器 |

## Slider

```vue
<Slider v-model="value" :min="0" :max="100" :step="5" orientation="horizontal" :marks="[0, 25, 50, 75, 100]" :show-tooltip="true" />
```

- `modelValue`: `number[]`
- `min`: `number` — 默认 `0`
- `max`: `number` — 默认 `100`
- `step`: `number` — 默认 `1`
- `disabled`: `boolean`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `variant`: `'default' | 'primary' | 'secondary' | 'success'` — 默认 `'default'`
- `orientation`: `'horizontal' | 'vertical'` — 默认 `'horizontal'`，透传给 reka-ui 原语
- `marks`: `number[]` — 渲染刻度标记
- `showTooltip`: `boolean` — 默认 `false`，拖拽时显示当前值

### Slider 暴露的 API

| 属性/方法 | 类型 | 说明 |
| --- | --- | --- |
| `currentValue` | `ComputedRef<number[]>` | 当前滑块值（只读） |
| `setValue` | `(value: number[]) => void` | 设置滑块值 |

## Toggle

```vue
<Toggle v-model:pressed="isOn" variant="outline" size="sm">B</Toggle>
```

- `pressed`: `boolean`（`v-model:pressed`）
- `variant`: `'default' | 'outline'`
- `size`: `'default' | 'sm' | 'lg'`
- `disabled`: `boolean`
- `loading`: `boolean` — 默认 `false`，loading 时显示 Loader2 spinner 并自动禁用，设置 `aria-busy="true"`
- `ariaLabel`: `string` — 无障碍标签

## ToggleGroup

```vue
<ToggleGroup type="multiple" v-model="selected" orientation="horizontal">
  <ToggleGroupItem value="bold">B</ToggleGroupItem>
  <ToggleGroupItem value="italic">I</ToggleGroupItem>
</ToggleGroup>
```

- `type`: `'single' | 'multiple'` — 默认 `'single'`
- `modelValue`: `string | string[]`
- `variant`: `'default' | 'outline'`
- `size`: `'default' | 'sm' | 'lg'`
- `orientation`: `'horizontal' | 'vertical'` — 默认 `'horizontal'`，vertical 时容器 flex-col 并透传 aria-orientation

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

- `ariaLabel`: `string` — 无障碍标签，未提供时使用 locale 默认值 `t('tagsInput.label')`

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
- `displayFormat`: `string` — 默认 `'YYYY-MM-DD'`，支持 YYYY/YY/MM/DD/HH/mm/ss/WW token
- `minDate` / `maxDate`: `Date`
- `disabled` / `readonly` / `clearable`: `boolean`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `variant`: `'default' | 'error' | 'success'`
- `shortcuts`: `DatePickerShortcut[]` — `{ label: string; value: Date | (() => Date) }`

### DatePickerRange

- `modelValue`: `[Date, Date] | null`
- `displayFormat`: `string` — 默认 `'YYYY-MM-DD'`
- `startPlaceholder` / `endPlaceholder` / `separator`: `string`
- `minDate` / `maxDate`: `Date`
- `disabled` / `clearable`: `boolean`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `variant`: `'default' | 'error' | 'success'`
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
- `minDate` / `maxDate`: `Date`
- `disabled` / `readonly` / `clearable`: `boolean`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `variant`: `'default' | 'error' | 'success'`
- `shortcuts`: `DatePickerShortcut[]`

### MonthPicker

- `modelValue`: `Date | null`
- `displayFormat`: `string` — 默认 `'YYYY-MM'`
- `minDate` / `maxDate`: `Date`
- `disabled` / `readonly` / `clearable`: `boolean`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `variant`: `'default' | 'error' | 'success'`

### YearPicker

- `modelValue`: `Date | null`
- `displayFormat`: `string` — 默认 `'YYYY'`
- `minDate` / `maxDate`: `Date`
- `disabled` / `readonly` / `clearable`: `boolean`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `variant`: `'default' | 'error' | 'success'`

所有组件共享事件：`update:modelValue`、`change`、`open`、`close`。

- 暴露 (DatePicker): `open` (`Ref<boolean>`) — 基础 DatePicker 组件可通过 ref 程序化控制面板开关

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
|------|------|
| `Form` | 根表单组件，集成 vee-validate |
| `FormField` | 字段包装器，连接表单状态，提供字段上下文 |
| `FormItem` | 标签、控件和消息的布局容器，生成唯一 ID |
| `FormLabel` | 支持错误状态的标签，注入字段上下文 |
| `FormControl` | 输入控件的包装器，通过 slot 提供无障碍属性 |
| `FormDescription` | 输入框下方的辅助文本 |
| `FormMessage` | 验证错误消息，注入字段上下文 |
| `FormWizard` | 多步骤向导式表单 |
| `FormConditional` | 根据表单值动态显示/隐藏字段组 |

### 字段上下文

`FormField` 通过 `provide/inject` 向子组件提供 `FormFieldContext`：

```typescript
interface FormFieldContext {
  name: ComputedRef<string>
  error: Ref<string | undefined>
  value: Ref<unknown>
  setValue: (value: unknown) => void
  setError: (message: string | undefined) => void
}
```

`FormItem` 通过 `provide/inject` 向子组件提供 `FormItemContext`：

```typescript
interface FormItemContext {
  id: string
  formItemId: string
  formDescriptionId: string
  formMessageId: string
}
```

`FormControl`、`FormLabel`、`FormMessage` 均注入 `FormFieldContext` 和 `FormItemContext`，可直接访问字段值和错误状态。

### Form Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `inline` | `boolean` | `false` | 行内表单布局 |
| `labelPosition` | `'left' \| 'right' \| 'top'` | `'right'` | 标签位置 |
| `labelWidth` | `string \| number` | — | 标签宽度 |
| `scrollToError` | `boolean` | `false` | 验证失败时滚动到第一个错误字段 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 统一尺寸 |
| `class` | `string` | — | 自定义类名 |
| `initialValues` | `Record<string, unknown>` | — | 表单初始值 |
| `validationSchema` | `unknown` | — | vee-validate 校验 schema |

### Form 暴露的 API

通过 `ref` 访问组件实例后可调用以下方法：

| 方法 | 返回类型 | 说明 |
| --- | --- | --- |
| `validate()` | `Promise<boolean>` | 验证所有字段，返回 `true` 表示验证通过 |
| `validateField(field)` | `Promise<boolean>` | 验证单个字段 |
| `resetFields()` | `void` | 重置所有字段为初始值 |
| `clearValidate(fields?)` | `void` | 清除指定或所有字段的验证错误 |
| `scrollToField(field)` | `void` | 滚动到指定字段 |

### FormField Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | —（必填） | 字段名称 |

### FormLabel Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义类名（错误状态时自动添加 `text-brutal-destructive`） |

### FormControl Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义类名 |

**Slot Props:** `FormControl` 通过作用域 slot 提供以下属性，用于绑定到内部输入控件：

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 与 `FormItem` 关联的唯一 ID |
| `class` | `string` | 样式类 |
| `aria-describedby` | `string` | 描述元素的 ID（包含 `FormDescription` 和 `FormMessage`） |
| `aria-invalid` | `boolean` | 字段是否有验证错误 |

```vue
<FormControl v-slot="{ id, ariaDescribedby, ariaInvalid }">
  <Input :id="id" :aria-describedby="ariaDescribedby" :aria-invalid="ariaInvalid" />
</FormControl>
```

### Form 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `submit` | `Record<string, unknown>` | 表单提交时触发 |

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

```typescript
interface FormStep {
    id: string
    title: string
    description?: string
    icon?: Component
    validator?: (values: Record<string, unknown>) => ValidationResult
    optional?: boolean
}
```

### ValidationResult 类型

```typescript
interface ValidationResult {
    valid: boolean
    errors: Record<string, string>
}
```

### useFormWizard

在 FormWizard 子组件中获取向导上下文：

```typescript
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

### FormWizard 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `Record<string, unknown>` | 表单数据更新 |
| `step-change` | `[step: number, previousStep: number]` | 步骤切换 |
| `complete` | `Record<string, unknown>` | 表单完成 |
| `validation-error` | `[step: number, errors: Record<string, string>]` | 验证失败 |
| `navigation-blocked` | `[targetStep: number, blockedStep: number]` | 线性模式下导航被阻止 |

## FormConditional 条件字段

根据表单值动态显示/隐藏字段组：

```vue
<Form v-model="values">
    <FormField name="type" />
    <FormConditional :when="(v) => v.type === 'company'">
        <FormField name="companyName" />
        <FormField name="taxId" />
    </FormConditional>
</Form>
```

### FormConditional Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `when` | `(values: Record<string, unknown>) => boolean` | — | 条件判断函数（必填） |
| `class` | `string` | — | 自定义样式类 |

## useFormFieldValidation

通用表单验证组合式函数，从 HardcoreInput 验证逻辑抽取，可用于任意表单控件。

```typescript
import { useFormFieldValidation } from 'brutx-ui-vue'

const { validationState, errorMessage, validate, reset, shouldValidateOnInput, shouldValidateOnBlur } = useFormFieldValidation({
  rules: [(v) => v.includes('@') || '请输入有效邮箱'],
  validateOn: 'blur',
  onValidationChange: (state, message) => console.log(state, message),
})
```

### Options

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rules` | `ValidationRule<TValue>[]` | `[]` | 验证规则数组，返回 `true` 或错误消息字符串 |
| `validateOn` | `'input' \| 'blur' \| 'submit'` | `'submit'` | 验证触发时机 |
| `defaultErrorMessage` | `string` | `'Invalid value'` | 默认错误消息 |
| `onValidationChange` | `(state, message?) => void` | — | 验证状态变化回调 |

### 返回值

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `validationState` | `Ref<'default' \| 'success' \| 'error'>` | 当前验证状态 |
| `errorMessage` | `Ref<string>` | 错误消息 |
| `validate(value)` | `(value: TValue) => boolean` | 执行验证，返回是否通过 |
| `reset()` | `() => void` | 重置为 default 状态 |
| `shouldValidateOnInput` | `() => boolean` | 是否在 input 时验证 |
| `shouldValidateOnBlur` | `() => boolean` | 是否在 blur 时验证 |

## Upload

文件上传系统，支持拖拽、文件列表管理、进度追踪和错误处理。

```vue
<script setup>
import { ref } from 'vue'
import { Upload, UploadTrigger, UploadFileList, type UploadFile } from 'brutx-ui-vue'

const fileList = ref<UploadFile[]>([])

async function handleUpload(options) {
    const formData = new FormData()
    formData.append('file', options.file)
    const response = await fetch('/api/upload', { method: 'POST', body: formData })
    options.onSuccess(response)
}
</script>

<template>
    <Upload
        v-model:file-list="fileList"
        :http-request="handleUpload"
        accept="image/*"
        :max-size="5 * 1024 * 1024"
    >
        <template #trigger="{ selectFiles, drag }">
            <UploadTrigger :drag="drag" @select="selectFiles" />
        </template>
        <template #file-list="{ files, remove, retry }">
            <UploadFileList :files="files" @remove="remove" @retry="retry" />
        </template>
    </Upload>
</template>
```

### Upload Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fileList` | `UploadFile[]` | `[]` | 文件列表，支持 `v-model:fileList` |
| `limit` | `number` | — | 最大文件数量 |
| `multiple` | `boolean` | `true` | 是否支持多选 |
| `accept` | `string` | — | 接受的文件类型 |
| `maxSize` | `number` | — | 最大文件大小（字节） |
| `maxRetries` | `number` | `3` | 最大重试次数 |
| `beforeUpload` | `(file: File) => boolean \| Promise<boolean>` | — | 上传前钩子 |
| `beforeRemove` | `(file: UploadFile) => boolean \| Promise<boolean>` | — | 删除前钩子 |
| `httpRequest` | `(options: UploadRequestOptions) => Promise<void>` | — | 自定义上传实现 |
| `listType` | `'text' \| 'picture' \| 'picture-card'` | `'text'` | 列表显示类型 |
| `autoUpload` | `boolean` | `true` | 选择后是否自动上传 |
| `drag` | `boolean` | `true` | 是否支持拖拽 |

### UploadFile 类型

```typescript
interface UploadFile {
    id: string
    name: string
    size: number
    type: string
    status: 'ready' | 'uploading' | 'success' | 'error'
    progress: number
    url?: string
    raw?: File
    error?: UploadError
}
```
