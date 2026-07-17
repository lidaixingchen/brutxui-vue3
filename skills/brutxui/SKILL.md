---
name: brutxui
description: >
  在创建、修改、优化基于 BrutxUI 组件库的 Vue 3 页面与表单，或者配置其样式规范、主题切换和国际化时使用此技能。
  当提及 "brutxui"、"brutx"、"新粗野主义"、"neo-brutalist"、"粗野风格" 时载入。
---

# BrutxUI 使用指南

BrutxUI 是面向 Vue 3 + Tailwind CSS 的新粗野主义（Neo-Brutalist）组件库。本指南定义了在业务项目中导入、使用和定制 BrutxUI 组件的核心规范。

## 渐进式参考导航

为了保持极简的上下文大小，组件及 API 的详细定义已拆分至以下文件，请根据开发场景按需读取：
- **完整组件 API 及功能词典**：参见 [组件词典](./references/components-dictionary.md)（含表单、数据、反馈、布局等组件清单）
- **系统组合式函数词典**：参见 [组合式函数词典](./references/composables.md)（含 `useTheme`、`useLocale` 等的用法说明）
- **设计令牌与定制化**：参见 [设计令牌参考](./references/design-tokens.md)（CSS 变量映射、Tailwind v4 绑定方法）
- **常用区块模板用法**：
  - 页头/页脚/外壳：参见 [layout-nav.md](./references/blocks/layout-nav.md)
  - 英雄区/定价/FAQ 等：参见 [marketing.md](./references/blocks/marketing.md)
  - 统计/图表/数据表：参见 [dashboard.md](./references/blocks/dashboard.md)
  - 认证/设置/404 等页面：参见 [pages.md](./references/blocks/pages.md)
  - 反馈/空状态/反馈表单：参见 [feedback.md](./references/blocks/feedback.md)
  - 搜索/上传/操作卡片：参见 [interactive.md](./references/blocks/interactive.md)

---

## 核心使用与代码生成规则 (Rules & Guidelines)

1. **优先复用组件，避免重复造轮子**：在构建业务页面与表单时，优先导入并使用 BrutxUI 已有的组件（如 `Button`、`Input`、`Select` 等），而非手动编写原生 HTML 元素或重复自定义样式，以维持新粗野主义视觉的一致性。
2. **样式一致性**：如果需要编写自定义 HTML 结构，必须遵循新粗野主义样式规范（使用 `border-3 border-brutal`、`rounded-brutal`、`shadow-brutal` 及其大小变体），保证与 BrutxUI 组件风格统一。
3. **主题切换支持**：在页面中若需要支持多主题，应配合 CSS 变量或使用 `useTheme` 提供的 API（如 `theme.value`、`colorMode.value`、`setTheme`）进行主题与暗色模式的切换，避免直接在代码中硬编码颜色值。
4. **国际化语言切换**：若需要让 BrutxUI 的组件切换语言，使用库提供的 `BrutxUIPlugin` 插件配置全局 `locale`，或者使用 `provideLocale(en)` 注入局部子树，无需在业务层强行使用库内部的 `useLocale()` 来管理您自身的业务翻译。
5. **TypeScript 类型标注**：项目开启 TS 严格模式下，对于复杂组件（如看板 `KanbanBoard`、树形选择 `TreeSelect`、定价组件等）的数据结构，必须从 `brutx-ui-vue` 导入对应的 TypeScript 类型进行类型标注，严禁使用 `any`。
6. **类名合并最佳实践**：合并动态类名时使用 `cn(...)`。为了性能与代码可读性，**禁止在 template 内直接写 `cn(...)`**，必须使用 `computed(...)` 派生类名。
7. **SSR 服务端渲染安全**：若在 Nuxt / VitePress 等 SSR 框架下使用包含 Canvas、音效或宿主 API 的特色组件（如 `ScratchCard`、`Tour`、`SketchyChart`），需在模板中使用 `<ClientOnly>`（或框架对应客户端组件）包裹，避免 Hydration 报错。
8. **动效降级**：注意尊重系统 `prefers-reduced-motion` 设置，编写过渡动画时提供对应的 `@media (prefers-reduced-motion: reduce)` 条件，支持平稳降级。

---

## 导入规范

BrutxUI 包含两种开发模式，根据项目环境选择：

### 1. npm 包导入（快速原型开发）
```typescript
import { Button, Card, Badge, cn } from 'brutx-ui-vue'
import type { PricingPlan, TreeNode } from 'brutx-ui-vue'
```
> [!IMPORTANT]
> **导入路径规范：**
> - **子路径导入限制**：
>   - `DatePicker` 与 `useDatePicker` 必须从 `brutx-ui-vue/date-picker` 导入。
>   - `useCarousel` 必须从 `brutx-ui-vue/carousel` 导入。

### 2. 复制粘贴导入（生产级组件定制）
```typescript
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { cn } from '@/lib/utils'
```

---

## 新粗野极致视觉（Premium Aesthetic）使用规范

新粗野主义（Neo-brutalism）如果设计不当容易显得杂乱廉价。请在编写页面样式时执行以下高阶限制，以保障界面整体质感：

### 1. 物理阴影与位移的映射关系（Why & How）
在编写您自定义的悬停与按压状态时，**位移与阴影变化必须符合物理映射关系**：
- **悬停离开表面**：当 hover 发生向左上方偏移动画时（如 `hover:-translate-x-0.5 hover:-translate-y-0.5`），由于物体离接触面变远，其硬阴影必须增大（`hover:shadow-brutal-lg`）。
- **按压贴合表面**：当 active 被按下时（如 `active:translate-y-[var(--brutal-pressed-offset,2px)]`），元素与地面重合，其硬阴影必须消失（`active:shadow-none`）。
> **物理谬误**：严禁只声明向下位移，但在按压状态下仍然保留悬空阴影，这在三维视觉中是错误的。

### 2. 噪点物理材质与 3D 悬浮的应用
- **纸张质感**：在大卡片、主要面板的背景上组合使用 `NoiseBackground`（噪点背景）来增强复古的纸张感。通过设置 `:animated="false"` 保持静态以防晃眼。
- **3D 交互**：核心业务卡片（如定价卡片、核心功能入口）应优先使用 `Card3D` 组件，提供重力倾斜与随光阴影，消除单纯 2D 扁平的廉价感。
- **色彩 60-30-10 比例**：60% 的背景低饱和度中性色（`bg-brutal-muted`）、30% 的结构白/黑底色分区、10% 的高饱和主色（`bg-brutal-primary` 或 `bg-brutal-accent`）点缀于按钮、徽章等关键触点上，聚焦用户视线。

---

## 典型代码模板

### 1. 表单验证（Vee-Validate + Zod）
```vue
<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, Input, Button } from 'brutx-ui-vue'

const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
})

const schema = toTypedSchema(formSchema)

function onSubmit(values: z.infer<typeof formSchema>) {
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

    <Button type="submit" variant="primary">提交</Button>
  </Form>
</template>
```

### 2. 时间线 (Timeline)
```vue
<script setup lang="ts">
import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent } from 'brutx-ui-vue'
</script>

<template>
  <Timeline orientation="vertical">
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot variant="primary" shape="circle">1</TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>
        <div class="font-black">设计阶段</div>
        <p class="font-normal text-sm mt-1">新粗野主义排版及色板设计</p>
      </TimelineContent>
    </TimelineItem>

    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot variant="accent" shape="square">2</TimelineDot>
      </TimelineSeparator>
      <TimelineContent>
        <div class="font-black">发布阶段</div>
        <p class="font-normal text-sm mt-1">生成注册表发布包</p>
      </TimelineContent>
    </TimelineItem>
  </Timeline>
</template>
```

---

## 相关资源

- [组件文档](https://lidaixingchen.github.io/brutxui-vue3/)
- [NPM 包](https://www.npmjs.com/package/brutx-ui-vue)
- [GitHub 仓库](https://github.com/lidaixingchen/brutxui-vue3)
