---
title: HardcoreInput 硬核输入框
description: 带 8-bit 复古音效、表情反馈和物理震动的表单校验输入框，集成 Form 系统。
---

# HardcoreInput 硬核输入框

输入框校验器的终极形态。通过 Web Audio API 动态合成 8-bit 复古电子音效（零音频依赖），同时在校验结果变化时触发 Neobrutalist 表情弹跳与物理震动。

## 预览

<ComponentPreview>
  <HardcoreInputDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="hardcore-input" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { HardcoreInput } from 'brutx-ui-vue'

const value = ref('')

const minLength = (val) => val.length >= 5 || '至少需要 5 个字符'
const hasNumber = (val) => /\d/.test(val) || '必须包含数字'
</script>

<template>
    <HardcoreInput
        v-model="value"
        placeholder="输入内容..."
        :rules="[minLength, hasNumber]"
        validate-on="blur"
    />
</template>
```

## 校验触发时机

| 模式 | 说明 |
|------|------|
| `blur` | 失焦时校验（默认） |
| `input` | 每次输入时实时校验 |
| `submit` | 外部调用 `validate()` 时校验 |

## 音效系统

通过 `useAudioEngine` composable 使用 Web Audio API 合成三种音效：

| 音效 | 波形 | 说明 |
|------|------|------|
| `type` | Triangle | 打字音效，带 50ms 节流 |
| `success` | Sine | 校验通过，频率上升 |
| `fail` | Square | 校验失败，频率下降 |

可通过 `sound` prop 禁用音效。

## 视觉反馈

- **成功**：输入框边框变为 `--brutal-success` 色，右侧显示酷表情 SVG
- **错误**：输入框边框变为 `--brutal-destructive` 色，右侧显示怒气表情 SVG，输入框产生抖动动画
- **默认**：无额外反馈

## Form 集成

HardcoreInput 可与 Form 系统集成，当存在于 `FormField` 中时自动同步校验状态：

```vue
<Form v-slot="{ handleSubmit }">
    <FormField v-slot="{ componentField }" name="username">
        <FormItem>
            <FormLabel>用户名</FormLabel>
            <HardcoreInput v-bind="componentField" :rules="[minLength]" />
            <FormMessage />
        </FormItem>
    </FormField>
</Form>
```

## 无障碍

- 输入框设置了 `:aria-invalid` 和 `:aria-describedby`
- 错误消息设置了 `aria-live="polite"`
- 当用户偏好 `prefers-reduced-motion: reduce` 时，抖动和弹跳动画被禁用

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | `''` | v-model 绑定值 |
| `sound` | `boolean` | `true` | 是否启用 8-bit 复古电子音效 |
| `rules` | `Array<(val: string) => boolean \| string>` | `[]` | 校验规则函数列表 |
| `shakeOnError` | `boolean` | `true` | 输入错误时是否触发输入框抖动 |
| `type` | `string` | `'text'` | HTML input type 属性 |
| `placeholder` | `string` | `''` | 占位文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `readonly` | `boolean` | `false` | 是否只读 |
| `validateOn` | `'input' \| 'blur' \| 'submit'` | `'blur'` | 校验触发时机 |
| `class` | `string` | — | 外部类覆盖 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `@update:modelValue` | `(value: string)` | v-model 更新事件 |
| `@validation-change` | `(state, message?)` | 校验状态变化事件 |

## 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 输入框右侧附加内容（如图标、表情区域覆盖） |

## 暴露属性/方法

| 名称 | 说明 |
|------|------|
| `validate()` | 主动触发校验 |
| `validationState` | 当前校验状态 |
| `errorMessage` | 当前错误消息 |

## useFormFieldValidation 组合式函数

`HardcoreInput` 内部的校验状态机已抽取为独立的 `useFormFieldValidation` 组合式函数，可在任何自定义表单控件中复用同一套校验逻辑（规则求值、状态机切换、错误消息管理、触发时机控制）。它不依赖 vee-validate，适合无法接入 Form 系统或需要轻量内联校验的场景。

```ts
import { useFormFieldValidation } from 'brutx-ui-vue'
import type { UseFormFieldValidationOptions, ValidationRule, ValidateOn } from 'brutx-ui-vue'

// 校验规则：返回 true 表示通过，返回字符串表示错误消息
const minLength: ValidationRule<string> = (val) => val.length >= 5 || '至少需要 5 个字符'
const hasNumber: ValidationRule<string> = (val) => /\d/.test(val) || '必须包含数字'

const {
    validationState,        // 当前校验状态
    errorMessage,           // 当前错误消息
    validate,               // 主动校验
    reset,                  // 重置为默认状态
    shouldValidateOnInput,  // 是否在 input 时机校验
    shouldValidateOnBlur,   // 是否在 blur 时机校验
} = useFormFieldValidation({
    rules: [minLength, hasNumber],
    validateOn: 'blur',
    defaultErrorMessage: '校验失败',
    onValidationChange: (state, message) => {
        // 状态变化回调，可用于联动音效、震动等副作用
    },
})
```

### UseFormFieldValidationOptions

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rules` | `MaybeRefOrGetter<ValidationRule<TValue>[]>` | `[]` | 校验规则数组；为空时 `validate` 永远返回 `true` 并将状态置为 `default` |
| `validateOn` | `MaybeRefOrGetter<'input' \| 'blur' \| 'submit'>` | `'submit'` | 校验触发时机（仅影响 `shouldValidateOnInput` / `shouldValidateOnBlur` 的判定，需调用方自行在对应事件中调用 `validate`） |
| `defaultErrorMessage` | `MaybeRefOrGetter<string>` | `'Invalid value'` | 规则返回 `false` 时的默认错误消息 |
| `onValidationChange` | `(state: ValidationState, message?: string) => void` | — | 校验状态变化时回调（仅在状态实际变化时触发，避免重复） |

### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `validationState` | `Ref<'default' \| 'success' \| 'error'>` | 当前校验状态（响应式） |
| `errorMessage` | `Ref<string>` | 当前错误消息（响应式，无错误时为空字符串） |
| `validate(value)` | `(value: TValue) => boolean` | 对给定值执行校验；通过返回 `true`，失败返回 `false` 并写入 `errorMessage` |
| `reset()` | `() => void` | 重置为 `default` 状态并清空错误消息 |
| `shouldValidateOnInput()` | `() => boolean` | 是否配置为在 input 时机校验 |
| `shouldValidateOnBlur()` | `() => boolean` | 是否配置为在 blur 时机校验 |

### ValidationRule

```ts
type ValidationRule<TValue> = (value: TValue) => boolean | string
```

规则函数接收当前值，返回 `true` 表示通过，返回 `string` 表示失败并以该字符串作为错误消息，返回 `false` 表示失败并使用 `defaultErrorMessage`。

### 使用示例

在自定义输入控件中复用同一套校验逻辑：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useFormFieldValidation } from 'brutx-ui-vue'

const value = ref('')
const { validationState, errorMessage, validate, shouldValidateOnBlur } = useFormFieldValidation({
    rules: [(v) => v.length >= 3 || '至少 3 个字符'],
    validateOn: 'blur',
})

function onBlur() {
    if (shouldValidateOnBlur()) validate(value.value)
}
</script>

<template>
    <input
        v-model="value"
        @blur="onBlur"
        :aria-invalid="validationState === 'error'"
        :class="{
            'border-brutal-success': validationState === 'success',
            'border-brutal-destructive': validationState === 'error',
        }"
    />
    <p v-if="errorMessage" class="text-brutal-destructive text-sm">{{ errorMessage }}</p>
</template>
```

> 提示：`useFormFieldValidation` 不绑定具体控件，所有时机判断（`shouldValidateOnInput` / `shouldValidateOnBlur`）只返回布尔值，由调用方决定在哪个事件中调用 `validate`。`submit` 时机需调用方在外部（如表单提交时）显式调用 `validate`。
