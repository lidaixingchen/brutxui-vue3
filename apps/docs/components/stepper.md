---
title: Stepper 步骤条
description: 多步骤进度指示组件，支持水平与垂直方向，完成/激活/未开始三种状态，可点击跳转，适合多步表单与向导流程。
---

# Stepper 步骤条

可视化的多步流程引导组件，完成步骤带勾选图标，激活步骤高亮放大，粗边框圆形节点与连接线尽显新粗野主义质感。

## 预览

<ComponentPreview>
  <StepperDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="stepper" />

## 用法

```vue
<script setup>
import { Stepper } from 'brutx-ui-vue'
import type { StepperStep } from 'brutx-ui-vue'
import { ref } from 'vue'

const steps: StepperStep[] = [
    { id: 1, title: '基本信息', description: '填写账户资料' },
    { id: 2, title: '安全设置', description: '设置密码' },
    { id: 3, title: '完成', description: '注册成功' },
]

const current = ref(0)
</script>

<template>
    <!-- 水平步骤条 -->
    <Stepper v-model="current" :steps="steps" orientation="horizontal" />

    <!-- 垂直步骤条（支持内容插槽） -->
    <Stepper v-model="current" :steps="steps" orientation="vertical">
        <template #step-1>
            <p class="text-sm">在此填写第一步的内容...</p>
        </template>
        <template #step-2>
            <p class="text-sm">在此填写第二步的内容...</p>
        </template>
    </Stepper>

    <!-- 导航按钮 -->
    <button :disabled="current === 0" @click="current--">上一步</button>
    <button :disabled="current === steps.length - 1" @click="current++">下一步</button>
</template>
```

### 不可点击

设置 `clickable` 为 `false` 可禁用步骤点的点击跳转，仅作展示用。

```vue
<Stepper v-model="current" :steps="steps" :clickable="false" />
```

## 变体

通过 `variant` 属性控制激活步骤的颜色。

| 变体 | 说明 |
|------|------|
| `default` | 默认背景色（`bg-brutal-bg`） |
| `primary` | 主色（珊瑚红）背景 |
| `accent` | 强调色（黄色）背景 |

```vue
<Stepper v-model="current" :steps="steps" variant="accent" />
```

## 尺寸

通过 `size` 属性控制步骤点尺寸。

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸节点 |
| `default` | 默认尺寸节点 |
| `lg` | 大尺寸节点 |

```vue
<Stepper v-model="current" :steps="steps" size="lg" />
```

## 数据类型

```ts
interface StepperStep {
    id: string | number   // 唯一标识（垂直插槽名为 step-{id}）
    title: string         // 步骤标题
    description?: string  // 可选副标题
}
```

## 导出类型

```ts
import type { StepperStep } from 'brutx-ui-vue'
```

## API 参考

<span id="事件"></span>

<ComponentApi name="stepper" />

## 插槽

垂直模式下，每个步骤在激活时可通过 `#step-{id}` 插槽注入内容区域：

```html
<Stepper v-model="current" :steps="steps" orientation="vertical">
    <template #step-1>
        <!-- 第一步激活时展示的内容 -->
    </template>
</Stepper>
```

## 可访问性

- **键盘操作**：步骤按钮支持方向键导航（`←`/`→` 水平模式，`↑`/`↓` 垂直模式），`Home`/`End` 跳转首尾步骤，`Enter`/`Space` 点击当前聚焦步骤
- **焦点管理**：通过 Tab 键可聚焦到步骤按钮

### 节点状态说明

| 状态 | 样式 | 条件 |
|------|------|------|
| `completed` | 绿色背景 + ✓ 图标 | 索引 < 当前步骤 |
| `active` | 变体背景色 + 大阴影 | 索引 = 当前步骤 |
| `upcoming` | 默认背景色 + 半透明 | 索引 > 当前步骤 |

## 方法（defineExpose）
实例方法和只读状态见上方 API 参考。通过 `ref` 调用实例方法：

```vue
<script setup>
import { ref } from 'vue'
import { Stepper } from 'brutx-ui-vue'

const stepperRef = ref(null)
const current = ref(0)
const steps = [...]

function handleNext() {
    stepperRef.value?.nextStep()
}

function handleBack() {
    stepperRef.value?.previousStep()
}
</script>

<template>
    <Stepper ref="stepperRef" v-model="current" :steps="steps" />
    <button @click="handleBack" :disabled="stepperRef?.isFirstStep">上一步</button>
    <button @click="handleNext" :disabled="stepperRef?.isLastStep">下一步</button>
</template>
```
