# AI 集成

BrutxUI 旨在与 AI 编码助手无缝协作。组件库提供结构化的、类型安全的 API，AI 工具可以理解并据此生成代码。

## llms.txt

BrutxUI 在仓库根目录提供了 `llms.txt` 文件。这个机器可读文件以针对大语言模型优化的格式描述了组件库的 API、约定和使用模式。

AI 助手可以使用此文件来：

- 了解可用组件及其 props
- 生成正确的导入路径和使用模式
- 遵循项目的编码约定
- 生成一致的 Vue 3 + TypeScript 代码

## .cursorrules

项目根目录的 `.cursorrules` 文件为 Cursor AI 提供了项目特定的指令，包括：

- Vue 3 `<script setup>` 约定
- 导入路径别名（`@/` 映射）
- CVA 变体模式
- `cn()` 类名合并工具
- 新粗野主义设计令牌用法
- 代码风格规则（4 空格缩进、单引号、无注释）

## AI 助手如何使用 BrutxUI

### 组件生成

AI 助手可以按照既定模式生成 BrutxUI 组件：

```vue
<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button.vue'

const isLoading = ref(false)

const buttonClasses = computed(() =>
    cn('custom-class')
)
</script>

<template>
    <Button variant="primary" size="lg" :loading="isLoading">
        Submit
    </Button>
</template>
```

### 变体用法

所有变体值都是字符串字面量，AI 可以自动补全：

- **Button 变体**：`default`、`primary`、`secondary`、`accent`、`danger`、`success`、`outline`、`ghost`、`link`
- **Button 尺寸**：`sm`、`default`、`lg`、`xl`、`icon`
- **Alert 变体**：`default`、`primary`、`secondary`、`success`、`warning`、`danger`、`info`
- **Badge 变体**：`default`、`primary`、`secondary`、`accent`、`danger`、`success`、`outline`

### 表单模式

AI 可以使用 Form 组件配合 vee-validate 生成完整的表单实现：

```vue
<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import Form from '@/components/ui/Form.vue'
import FormField from '@/components/ui/FormField.vue'
import FormItem from '@/components/ui/FormItem.vue'
import FormLabel from '@/components/ui/FormLabel.vue'
import FormControl from '@/components/ui/FormControl.vue'
import FormMessage from '@/components/ui/FormMessage.vue'
import Input from '@/components/ui/Input.vue'
import SubmitButton from '@/components/ui/SubmitButton.vue'

const schema = toTypedSchema(z.object({
    email: z.string().email(),
    password: z.string().min(8),
}))

function onSubmit(values) {
    console.log(values)
}
</script>

<template>
    <Form :validation-schema="schema" @submit="onSubmit">
        <FormField name="email" v-slot="{ componentField }">
            <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input v-bind="componentField" type="email" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
        <SubmitButton variant="primary">Sign In</SubmitButton>
    </Form>
</template>
```

### 组合式函数用法

AI 可以正确使用 BrutxUI 的组合式函数，如 `useToast`：

```vue
<script setup>
import { useToast } from '@/composables/useToast'

const { success, error, warning, info } = useToast()

function handleSave() {
    success('Saved!', 'Your changes have been saved.')
}

function handleError() {
    error('Error', 'Something went wrong.')
}
</script>
```

## AI 辅助开发的最佳实践

1. 始终使用 `v-model` 而非 `onChange`/`onInput` 进行双向绑定
2. 使用 `@click` 而非 `onClick` 作为事件处理器
3. 使用 `<script setup>` 语法，而非 Options API
4. 在本地项目文件中导入组件时带上 `.vue` 扩展名
5. 使用 `ref()` 和 `computed()` 而非 `useState` 和 `useMemo`
6. 使用 `cn()` 合并类名，绝不拼接字符串
7. 使用 `--brutal-*` CSS 变量，绝不硬编码颜色
