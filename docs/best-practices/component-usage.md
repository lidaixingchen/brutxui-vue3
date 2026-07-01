# 组件使用规范

本指南介绍 BrutxUI 组件库的最佳使用方式，帮助你写出更健壮、可维护的代码。

## 1. 组件选择指南

### 1.1 基础交互组件

| 场景 | 推荐组件 | 说明 |
|------|----------|------|
| 触发操作 | `Button` | 支持 variant/size/loading 状态 |
| 文本输入 | `Input` | 支持 clearable、密码切换、字数统计 |
| 多行文本 | `Textarea` | 自动扩展高度 |
| 数值输入 | `NumberInput` | 内置增减按钮和范围校验 |
| 单选 | `RadioGroup` | 语义化单选组 |
| 多选 | `Checkbox` | 支持 indeterminate 状态 |
| 开关切换 | `Switch` | 布尔值开关 |
| 选项选择 | `Select` / `Combobox` | Select 用于固定选项，Combobox 支持搜索 |

### 1.2 复合表单场景

```vue
<!-- 带前置/后置内容的输入框 -->
<template>
  <Input v-model="url" placeholder="请输入 URL">
    <template #prepend>
      <span class="px-3 border-r-3 border-brutal bg-brutal-muted flex items-center">
        https://
      </span>
    </template>
    <template #append>
      <Button variant="primary" size="sm" @click="verify">验证</Button>
    </template>
  </Input>
</template>
```

### 1.3 反馈组件选择

| 场景 | 推荐组件 | 说明 |
|------|----------|------|
| 重要信息确认 | `AlertDialog` | 阻断式确认，必须用户操作 |
| 临时信息展示 | `Dialog` / `Sheet` | 可关闭的浮层 |
| 操作反馈 | `Toast` | 自动消失的通知 |
| 表单校验提示 | `FormMessage` | 内联错误信息 |
| 长时间操作 | `Progress` / `Spinner` | 进度反馈 |

## 2. Props 最佳实践

### 2.1 变体与尺寸

BrutxUI 组件遵循统一的 `variant` + `size` 模式：

```vue
<template>
  <!-- 按钮变体 -->
  <Button variant="default">默认</Button>
  <Button variant="primary">主要</Button>
  <Button variant="secondary">次要</Button>
  <Button variant="accent">强调</Button>
  <Button variant="danger">危险</Button>
  <Button variant="success">成功</Button>
  <Button variant="outline">轮廓</Button>
  <Button variant="ghost">幽灵</Button>
  <Button variant="link">链接</Button>

  <!-- 按钮尺寸 -->
  <Button size="sm">小</Button>
  <Button size="default">默认</Button>
  <Button size="lg">大</Button>
  <Button size="xl">特大</Button>
</template>
```

### 2.2 布尔 Props 显式声明

```vue
<template>
  <!-- 推荐：显式传递布尔值 -->
  <Button :loading="isSubmitting">提交</Button>
  <Button disabled>禁用</Button>
  <Input v-model="name" clearable />

  <!-- 避免：隐式 true（可读性差） -->
  <!-- <Button loading>提交</Button> -->
</template>
```

### 2.3 class prop 覆盖样式

几乎所有 BrutxUI 组件都支持 `class` prop，可用于覆盖默认样式：

```vue
<template>
  <Button variant="primary" class="w-full mt-4">
    全宽按钮
  </Button>

  <Card class="max-w-md mx-auto">
    <CardHeader>
      <CardTitle>自定义卡片</CardTitle>
    </CardHeader>
  </Card>
</template>
```

### 2.4 TypeScript 类型推导

```vue
<script setup lang="ts">
import { type ComponentProps } from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'

// 从组件提取 Props 类型
type ButtonProps = ComponentProps<typeof Button>

// 在组合式函数中使用
function createButtonConfig(): ButtonProps {
  return {
    variant: 'primary',
    size: 'lg',
    loading: false,
  }
}
</script>
```

## 3. 事件处理

### 3.1 v-model 双向绑定

```vue
<script setup lang="ts">
import { ref } from 'vue'

const text = ref('')
const checked = ref(false)
const selected = ref('')
</script>

<template>
  <Input v-model="text" placeholder="输入文本" />
  <Checkbox v-model:checked="checked" label="同意协议" />
  <Select v-model="selected" :options="options" />
</template>
```

### 3.2 事件监听

```vue
<template>
  <!-- 清除事件 -->
  <Input v-model="query" clearable @clear="handleClear" />

  <!-- 关闭事件 -->
  <Alert variant="info" @close="handleAlertClose">
    <AlertTitle>提示</AlertTitle>
    <AlertDescription>操作已成功完成</AlertDescription>
  </Alert>

  <!-- 使用 Dialog -->
  <Dialog v-model:open="dialogVisible">
    <DialogTrigger as-child>
      <Button>打开对话框</Button>
    </DialogTrigger>
    <DialogContent @close="handleDialogClose">
      <!-- 内容 -->
    </DialogContent>
  </Dialog>
</template>
```

### 3.3 表单提交处理

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'brutx-ui-vue'

const { toast } = useToast()
const isSubmitting = ref(false)

async function handleSubmit() {
  isSubmitting.value = true
  try {
    await submitForm()
    toast({ title: '提交成功', variant: 'success' })
  } catch (error) {
    toast({ title: '提交失败', variant: 'destructive' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <!-- 表单内容 -->
    <Button type="submit" :loading="isSubmitting">提交</Button>
  </form>
</template>
```

## 4. Slot 使用

### 4.1 默认 Slot

```vue
<template>
  <Button>
    <IconDownload class="w-4 h-4" />
    下载文件
  </Button>
</template>
```

### 4.2 具名 Slot

```vue
<template>
  <!-- Input 的前置/后置插槽 -->
  <Input v-model="price" placeholder="0.00">
    <template #prepend>
      <span class="px-3 bg-brutal-muted border-r-3 border-brutal flex items-center">
        ¥
      </span>
    </template>
    <template #append>
      <span class="px-3 bg-brutal-muted border-l-3 border-brutal flex items-center">
        .00
      </span>
    </template>
  </Input>

  <!-- Alert 的操作插槽 -->
  <Alert variant="warning">
    <AlertTitle>注意</AlertTitle>
    <AlertDescription>此操作不可撤销</AlertDescription>
    <template #actions>
      <Button variant="outline" size="sm" @click="dismiss">忽略</Button>
      <Button variant="primary" size="sm" @click="confirm">确认</Button>
    </template>
  </Alert>
</template>
```

### 4.3 Card 复合插槽

```vue
<template>
  <Card>
    <CardHeader>
      <CardTitle>用户信息</CardTitle>
      <CardDescription>管理您的个人资料</CardDescription>
    </CardHeader>
    <CardContent>
      <!-- 主体内容 -->
    </CardContent>
    <CardFooter class="justify-end gap-2">
      <Button variant="outline">取消</Button>
      <Button variant="primary">保存</Button>
    </CardFooter>
  </Card>
</template>
```

## 5. 组合模式

### 5.1 复合组件使用

BrutxUI 的复合组件（如 Accordion、Tabs、Dialog）使用 `Root-Trigger-Content` 模式：

```vue
<template>
  <!-- Accordion 手风琴 -->
  <Accordion type="single" collapsible>
    <AccordionItem value="item-1">
      <AccordionTrigger>标题一</AccordionTrigger>
      <AccordionContent>内容一</AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-2">
      <AccordionTrigger>标题二</AccordionTrigger>
      <AccordionContent>内容二</AccordionContent>
    </AccordionItem>
  </Accordion>

  <!-- Tabs 标签页 -->
  <Tabs default-value="account">
    <TabsList>
      <TabsTrigger value="account">账户</TabsTrigger>
      <TabsTrigger value="password">密码</TabsTrigger>
    </TabsList>
    <TabsContent value="account">账户设置内容</TabsContent>
    <TabsContent value="password">密码修改内容</TabsContent>
  </Tabs>
</template>
```

### 5.2 组合式函数复用逻辑

```vue
<script setup lang="ts">
import { useToast, useClipboard, useDebounce } from 'brutx-ui-vue'

// 复用 Toast 逻辑
const { toast } = useToast()

// 复用剪贴板逻辑
const { copy, isSupported } = useClipboard()

// 复用防抖逻辑
const [debouncedSearch, isDebouncing] = useDebounce(async (query: string) => {
  const results = await searchApi(query)
  // 处理结果
}, 300)

async function handleCopy(text: string) {
  await copy(text)
  toast({ title: '已复制到剪贴板' })
}
</script>
```

### 5.3 Provide/Inject 共享状态

```vue
<!-- 父组件：提供主题配置 -->
<script setup lang="ts">
import { provide } from 'vue'

provide('formLayout', {
  labelWidth: '120px',
  labelPosition: 'right',
})
</script>

<!-- 子组件：注入配置 -->
<script setup lang="ts">
import { inject } from 'vue'

const layout = inject('formLayout', {
  labelWidth: '100px',
  labelPosition: 'left',
})
</script>
```

### 5.4 asChild 模式

BrutxUI 支持 `asChild` 模式，允许将组件样式应用到自定义元素：

```vue
<template>
  <!-- 将 Button 样式应用到 NuxtLink -->
  <Button as-child>
    <NuxtLink to="/dashboard">
      前往仪表盘
    </NuxtLink>
  </Button>

  <!-- 将 DialogTrigger 应用到自定义按钮 -->
  <DialogTrigger as-child>
    <Button variant="outline" size="sm">
      自定义触发器
    </Button>
  </DialogTrigger>
</template>
```

### 5.5 实例方法调用

部分组件暴露了实例方法：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const inputRef = ref<InstanceType<typeof Input>>()

function focusInput() {
  inputRef.value?.focus()
}

function selectAll() {
  inputRef.value?.select()
}
</script>

<template>
  <Input ref="inputRef" v-model="value" />
  <Button @click="focusInput">聚焦</Button>
  <Button @click="selectAll">全选</Button>
</template>
```
