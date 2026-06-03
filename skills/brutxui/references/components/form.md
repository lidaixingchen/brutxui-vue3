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

## Slider

```vue
<Slider v-model="value" :min="0" :max="100" :step="5" />
```

- `modelValue`: `number[]`
- `min`: `number` — 默认 `0`
- `max`: `number` — 默认 `100`
- `step`: `number` — 默认 `1`
- `disabled`: `boolean`

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

```vue
<Calendar v-model="selectedDate" />
```

## Form

```vue
<Form :initial-values="form" :validation-schema="schema">
  <FormField name="email">
    <FormItem>
      <FormLabel>邮箱</FormLabel>
      <FormControl><Input placeholder="请输入邮箱" /></FormControl>
      <FormDescription>我们不会分享您的邮箱</FormDescription>
      <FormMessage />
    </FormItem>
  </FormField>
</Form>
```

子组件：Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage

- `initialValues`: `Record<string, unknown>`
- `validationSchema`: `unknown`
