---
title: AI 集成
description: 了解如何将 BrutxUI 与 AI 编码助手集成
---

# AI 集成

BrutxUI 旨在与 AI 编码助手无缝协作。组件库提供结构化的、类型安全的 API，AI 工具可以理解并据此生成代码。

## AGENTS.md

项目根目录的 `AGENTS.md` 是 AI 编码助手的统一配置文件，为所有 AI 工具（Cursor、Copilot、Windsurf、Claude Code 等）提供项目特定的指令，包括：

- Monorepo 结构与命令
- Vue 3 `<script setup>` 组件约定
- 导入路径别名（`@/` 映射）
- CVA 变体模式与 `cn()` 类名合并工具
- 新粗野主义设计令牌与视觉规则
- 反模式清单（禁止软阴影、圆角边框等）
- 代码风格规则（4 空格缩进、单引号、无注释）
- 安全要求与 Registry Schema 规范

AI 助手可以使用 `AGENTS.md` 来：

- 了解项目结构与可用命令
- 生成符合项目约定的组件代码
- 遵循新粗野主义视觉规则
- 避免反模式（软阴影、圆角边框等）
- 正确使用导入路径和类名合并工具

## BrutxUI Skill

BrutxUI 提供了一个专用的 AI Skill 文件（`skills/brutxui/SKILL.md`），为 AI 编码助手提供完整的组件库知识。与 `AGENTS.md` 的项目级指令不同，Skill 专注于**代码生成**——告诉 AI 如何正确使用 BrutxUI 的每个组件。

### 使用方式

在支持 Skill 的 AI 工具中（如 Claude Code），输入 `/brutxui` 即可激活。Skill 会自动加载以下内容：

- 完整的组件列表（40+ 组件 + 30+ 区块模板）
- 导入方式（npm 包导入 / 复制粘贴导入）
- 样式规范（必须使用 / 禁止使用的类名）
- 主题系统（Classic / Pastel / Mono / Warm 四套预设）
- 国际化配置（`useLocale()`、语言切换、自定义语言包）
- 代码模板（表单、时间线、图表等常见场景）
- 分类参考文件（表单、布局、数据展示、反馈、区块等）

### Skill 与 AGENTS.md 的区别

| 维度 | AGENTS.md | BrutxUI Skill |
| --- | --- | --- |
| 作用范围 | 项目级（monorepo 结构、命令、发布流程） | 组件级（代码生成、样式规范、API 用法） |
| 触发方式 | 自动加载 | `/brutxui` 命令触发 |
| 适用场景 | 了解项目结构、运行命令 | 生成组件代码、选择正确的变体和样式 |
| 内容粒度 | 粗（约定和规则） | 细（每个组件的 Props/Events/Slots） |

### 参考文件结构

Skill 附带的参考文件按组件类别组织：

```text
skills/brutxui/
├── SKILL.md                          # 主文件（组件列表、规范、模板）
└── references/
    ├── design-tokens.md              # 设计令牌、主题、国际化
    ├── components/
    │   ├── form.md                   # 表单组件 Props
    │   ├── layout.md                 # 布局容器 Props
    │   ├── data.md                   # 数据展示 Props
    │   ├── feedback.md               # 浮层反馈 Props
    │   └── brutal.md                 # 新粗野特色组件 Props
    └── blocks/
        ├── layout-nav.md             # 页头/页脚/仪表盘外壳
        ├── marketing.md              # 英雄区/定价/博客/FAQ
        ├── dashboard.md              # 统计/图表/数据表格
        ├── pages.md                  # 登录/设置/404 等页面
        ├── feedback.md               # 空状态/错误/成功/反馈
        └── interactive.md            # 搜索/上传/快捷操作
```

AI 助手在生成代码时会根据场景自动读取对应的参考文件，确保生成的代码符合组件 API。

## AI 助手如何使用 BrutxUI

### 组件生成

AI 助手可以按照既定模式生成 BrutxUI 组件：

```vue
<script setup>
import { computed, ref } from 'vue'
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
8. 禁止使用软阴影（`shadow-md`、`shadow-lg`），只使用 `shadow-brutal*`
9. 禁止使用圆角（`rounded-md`、`rounded-lg`），只使用 `rounded-brutal`
10. 交互元素必须有按压反馈（`active:translate-y` + `active:shadow-none`）
