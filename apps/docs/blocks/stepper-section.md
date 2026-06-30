---
title: Stepper Section
description: 步骤导航区块，带有水平步骤条、内容卡片和前后导航按钮。
---

# Stepper Section 步骤导航

新粗野主义风格的步骤导航区块，包含水平 Stepper、内容卡片和上一步/下一步按钮。

## 预览

<ComponentPreview>
  <StepperSectionDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="stepper-section" />

## 用法

### 基础用法

```vue
<script setup>
import { ref } from 'vue'
import StepperSection from '@/components/ui/stepper-section/StepperSection.vue'
import type { StepperStepItem } from '@/components/ui/stepper-section/StepperSection.vue'

const currentStep = ref(0)

const steps: StepperStepItem[] = [
    { title: 'Account', description: 'Create your account' },
    { title: 'Profile', description: 'Set up your profile' },
    { title: 'Complete', description: 'Review and finish' },
]

function handleStepClick(index: number) {
    console.log('Step:', index)
}
</script>

<template>
    <StepperSection
        title="Setup Wizard"
        :steps="steps"
        v-model="currentStep"
        @step-click="handleStepClick"
    />
</template>
```

### 自定义步骤内容

通过默认插槽自定义每个步骤的内容区域，根据 `currentStep` 值渲染对应内容：

```vue
<script setup>
import { ref } from 'vue'
import StepperSection from '@/components/ui/stepper-section/StepperSection.vue'

const currentStep = ref(0)

const steps = [
    { title: 'Personal Info', description: 'Your basic information' },
    { title: 'Preferences', description: 'Customize your experience' },
    { title: 'Confirmation', description: 'Review your choices' },
]
</script>

<template>
    <StepperSection
        :steps="steps"
        v-model="currentStep"
    >
        <template v-if="currentStep === 0">
            <p>Personal info form goes here</p>
        </template>
        <template v-if="currentStep === 1">
            <p>Preferences form goes here</p>
        </template>
        <template v-if="currentStep === 2">
            <p>Confirmation summary goes here</p>
        </template>
    </StepperSection>
</template>
```

## 数据类型

### StepperStepItem

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `title` | `string` | 步骤标题 |
| `description` | `string` | 可选，步骤描述 |

## Props

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `stepperSection.defaultTitle` | 区块标题文本 |
| `steps` | `StepperStepItem[]` | `[]` | 步骤列表数据 |
| `modelValue` | `number` | `0` | 当前激活步骤的索引，支持 `v-model` 双向绑定 |
| `class` | `string` | — | 自定义 CSS 类名 |

## 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `step-click` | `[index: number]` | 点击步骤标题时触发，参数为步骤索引 |

## 插槽

| 插槽 | 作用域 | 说明 |
| ---- | ---- | ---- |
| `header` | — | 替换/扩展区块头部 |
| `default` | — | 步骤内容区域（卡片内部） |
| `footer` | — | 替换/扩展区块底部 |

## 可访问性

- Stepper 使用 `role="navigation"` 和 `aria-label` 标识步骤导航区域
- 每个步骤节点包含 `aria-current="step"` 标识当前步骤
- 步骤节点通过 `tabindex` 支持键盘导航
- 导航按钮在禁用状态下设置 `aria-disabled="true"`
