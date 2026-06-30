---
name: brutxui
description: >
  当用户要求创建、修改或优化新粗野主义 Vue 3 UI 组件、页面或表单时使用此技能。
  适用于：创建表单、卡片、数据表格、设置页面、定价页面、仪表盘、聊天界面、看板、时间线、轮播、树形视图等场景。
  也适用于用户询问 BrutxUI 组件用法、样式规范、设计令牌、主题切换、国际化等问题时。
  当用户提到"brutxui"、"brutx"、"新粗野主义"、"neo-brutalist"时也应触发。
---

# BrutxUI 代码生成指南

BrutxUI 是面向 Vue 3 + Tailwind CSS 的新粗野主义（Neo-Brutalist）UI 组件库，采用**复制粘贴式**工作流。

**技术栈：** Vue 3.5+ · TypeScript 6.0+ · Tailwind CSS 4.3+ · reka-ui 2.9+ · CVA 0.7+ · vee-validate 4+

## 核心原则

1. **优先使用 BrutxUI 组件**，不要从头创建相似功能的组件。禁止用 native HTML 元素替代已有组件：用 `Button` 而非 `<button>`、用 `Select` 系列而非 `<select>`/`<option>`、用 `Badge` 而非手写 badge `<div>`、用 `Input` 而非 `<input>`（除非有特殊 ARIA 角色、内联图标切换等特殊场景）
2. **遵循新粗野主义设计规范**，使用正确的边框、阴影和颜色系统
3. **支持国际化**，使用 `useLocale()` 获取文本，不要硬编码文案。默认语言为中文（zh-CN）
4. **保持无障碍性**，组件基于 reka-ui 无障碍原语构建。所有交互组件支持 `ariaLabel` prop；动画组件尊重 `prefers-reduced-motion` 系统设置
5. **支持主题切换**，使用 CSS 变量和 `useTheme()` 组合式函数

## 导入方式

BrutxUI 支持两种导入方式：

### npm 包导入（推荐用于快速原型）

```typescript
import { Button, Card, Badge, cn } from 'brutx-ui-vue'
import type { PricingPlan, TreeNode, KanbanColumn } from 'brutx-ui-vue'
```

### 复制粘贴导入（推荐用于生产项目）

```typescript
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { cn } from '@/lib/utils'
```

> 复制粘贴模式下，使用 CLI 添加组件：`npx brutx-vue@latest add button card`

## 组件列表

### 表单与输入

| 组件 | 中文名 | 说明 |
|------|--------|------|
| Button | 按钮 | 9 种变体、5 种尺寸、加载状态 |
| SubmitButton | 提交按钮 | 支持加载/等待状态 |
| Input | 输入框 | 支持变体/尺寸/ARIA 无障碍属性、readonly 只读、errorMessage 错误消息、defineExpose 暴露 ref/focus/blur/select 方法 |
| Textarea | 文本域 | 多行文本输入，支持 ARIA 无障碍属性、readonly 只读、errorMessage 错误消息、defineExpose 暴露 ref/focus/blur/select 方法 |
| NumberInput | 数字输入框 | 带 +/- 按钮，支持 split/stacked 布局、variant 边框样式变体、errorMessage 错误消息 |
| HardcoreInput | 硬核输入框 | 8-bit 音效 + 表情反馈 + 物理震动 |
| Checkbox | 复选框 | 通过 v-model:checked 绑定、ariaLabel 无障碍标签、indeterminate 状态使用 Minus 图标 |
| Switch | 开关 | 通过 v-model:checked 绑定、ariaLabel 无障碍标签 |
| RadioGroup | 单选组 | 支持 v-model、ariaLabel 无障碍标签 |
| Select | 选择器 | 支持子组件组合，SelectTrigger 支持 variant 边框样式变体和 errorMessage 错误消息 |
| Combobox | 搜索选择器 | 可搜索的单选/多选，支持加载状态与创建选项，defineExpose 暴露 open/searchQuery/selectedValue/focus |
| TreeSelect | 树形选择器 | 支持单选/多选/搜索/任意深度树结构，defineExpose 暴露 open/searchQuery/selectedNodes/expandedIds/focus |
| Slider | 滑块 | 支持 v-model，支持 variant/size/范围模式/方向/刻度/提示，通过 v-model 进行受控，defineExpose 暴露 currentVal/setValue |
| Toggle | 切换按钮 | 支持 v-model:pressed、loading 加载状态、ariaLabel 无障碍标签 |
| ToggleGroup | 切换按钮组 | 支持单选/多选/方向，通过 v-model 进行受控 |
| TagsInput | 标签输入 | 支持子组件组合、ariaLabel 无障碍标签 |
| Calendar | 日历 | 日期选择器，支持范围模式 |
| ColorPicker | 颜色选择器 | 支持 HEX/RGB/HSL、透明度、预设与历史记录、defineExpose({ open }) 程序化控制面板 |
| DatePicker | 日期选择器 | 单日期/范围/日期时间/周/月/年，支持 v-model、displayFormat 格式化、快捷选项、defineExpose({ open }) 程序化控制面板 |
| Form | 表单 | 集成 vee-validate + Zod 校验 |
| Label | 标签 | 表单字段标签，支持尺寸/必填标记 |

### 布局与容器

| 组件 | 中文名 | 说明 |
|------|--------|------|
| Card | 卡片 | 6 种变体，支持 Header/Title/Description/Content/Footer，interactive 可点击模式支持 role="button" 和键盘事件 |
| Card3D | 3D 卡片 | 3D 物理悬浮，鼠标悬停偏转与反向阴影，支持变体/可点击 |
| Separator | 分隔线 | 支持水平/垂直方向/变体/尺寸/文字分隔线 |
| ScrollArea | 滚动区域 | 自定义滚动条，支持 ScrollBar 子组件/变体/尺寸 |
| Sheet | 侧边抽屉 | 4 个方向变体（top/right/bottom/left） |
| Tabs | 标签页 | 支持 list/trigger/content、orientation 垂直布局，通过 v-model 进行受控 |
| Accordion | 手风琴 | 支持单选/多选模式、content 变体（flat/ghost/interactive） |
| Breadcrumb | 面包屑 | 支持 Link/Page/Separator/Ellipsis |
| Stepper | 步骤条 | 支持水平/垂直方向，step-click 事件，垂直内容插槽，变体/尺寸/可点击，defineExpose 暴露 currentStep/goToStep/nextStep/previousStep 等方法 |
| Timeline | 时间线 | 支持垂直/水平布局，3 种节点形状，交替布局，role="list" 和 role="listitem" 无障碍语义 |
| Carousel | 轮播 | 支持循环/自动播放/箭头/圆点、defineExpose 暴露滚动方法、useCarousel composable、prefers-reduced-motion 动效降级 |
| TreeView | 树形视图 | 支持展开/选中/复选选择模式 |

### 数据展示

| 组件 | 中文名 | 说明 |
|------|--------|------|
| Table | 表格 | 8 个子组件（Header/Body/Footer/Row/Head/Cell/Caption）、ariaLabel 无障碍标签 |
| DataTable | 数据表格 | 支持排序/筛选/分页/选择/虚拟滚动、defineExpose 暴露排序/筛选/选择/分页方法 |
| VirtualScroll | 虚拟滚动 | 基于 @tanstack/vue-virtual，支持大数据列表高性能滚动，暴露 scrollToIndex 方法 |
| Badge | 徽章 | 7 种变体、3 种尺寸（sm/default/lg）、closable/dot/pulse、icon 插槽 |
| Avatar | 头像 | 支持 image/fallback、尺寸、形状、变体、状态 |
| Progress | 进度条 | 支持 v-model、不确定状态、百分比标签 |
| Pagination | 分页 | 支持 v-model、计算算法、首尾页、可点击省略号 jump 事件 |
| Counter | 数字动画 | 支持前缀/后缀/分隔符/缓动函数，5 种变体，自动尊重 prefers-reduced-motion |
| Kbd | 键盘按键 | 3 种尺寸、4 种变体 |
| CodeBlock | 代码块 | 支持语言高亮、行号、折叠展开 |
| Marquee | 跑马灯 | 支持方向/速度/暂停/淡出、变体/尺寸、prefers-reduced-motion 动效降级 |
| BeforeAfter | 对比图 | 前后对比滑块，支持 v-model、水平/垂直方向、prefers-reduced-motion 动效降级 |
| ChatBubble | 聊天气泡 | 支持 sent/received/system 变体、颜色/尺寸 |
| Skeleton | 骨架屏 | 支持 Text/Avatar/Card/Table 子组件、尺寸/形状/宽度 |
| Spinner | 加载动画 | 4 种变体（Spinner/Block/Dots/Bars） |
| DashboardStats | 仪表盘统计 | 支持趋势指标 |

### 反馈与浮层

| 组件 | 中文名 | 说明 |
|------|--------|------|
| Dialog | 对话框 | 支持 Header/Footer/Title/Description、size 变体（sm/default/lg/xl/full） |
| AlertDialog | 确认弹窗 | 支持 Action/Cancel |
| Alert | 提示 | 7 种变体、closable、actions 插槽 |
| Toast | 通知 | 搭配 useToast 组合式函数、pauseOnHover 悬停暂停 |
| Popover | 弹出框 | 支持对齐/偏移 |
| Tooltip | 工具提示 | 支持偏移 |
| DropdownMenu | 下拉菜单 | 支持子菜单项/复选/单选/分隔符 |
| Command | 命令面板 | 支持搜索/分组/快捷键、defineExpose({ filterSearch }) 程序化搜索 |

### 新粗野主义特色

| 组件 | 中文名 | 说明 |
|------|--------|------|
| GlitchText | 故障文字 | CSS clip-path 驱动，支持 hover/click/autoplay，横向/纵向/双向撕裂，自动尊重 prefers-reduced-motion |
| GlitchButton | 故障按钮 | 继承 Button 所有变体，支持 hover/click/autoplay 触发故障动画，横向/纵向/双向撕裂，自动尊重 prefers-reduced-motion |
| TypewriterText | 打字机文本 | 逐字符显示动画，支持循环/光标/尺寸/粗细，自动尊重 prefers-reduced-motion |
| NoiseBackground | 噪点背景 | SVG feTurbulence 滤镜，支持动画/类型/圆角、prefers-reduced-motion 静态降级 |
| ScratchCard | 刮刮卡 | Canvas 覆盖层擦除 |
| SketchyChart | 手绘图表 | 支持折线/柱状/饼图，SVG + 分形噪声 |
| CopyToClipboard | 复制到剪贴板 | 支持自定义持续时间、变体/尺寸 |
| KanbanBoard | 看板 | 支持拖拽排序、列拖拽/添加卡片、键盘拖拽（Space 抓取、方向键移动）、defineExpose 暴露 moveCard/moveColumn/addCard 等方法 |

### 区块/页面模板

| 组件 | 中文名 | 说明 |
|------|--------|------|
| PricingSection | 统一定价区域 | 支持 v-model、一次性价格、订阅切换和功能状态 |
| SaaSPricing | SaaS 定价 | 基于 PricingSection 的 SaaS 兼容封装 |
| BrutalistHero | 英雄区块 | 支持主/次操作按钮 |
| HeaderSection | 页头导航 | 支持导航项/Logo |
| FooterSection | 页脚 | 支持链接分组/版权 |
| DashboardShell | 仪表盘外壳 | 含侧边栏和顶栏 |
| DashboardStats | 仪表盘统计 | 支持趋势指标 |
| OverviewPage | 总览页面 | 支持统计卡片 |
| DataTableSection | 数据表格 | 支持搜索/分页/排序 |
| ChartSection | 图表区块 | 内置柱状/折线/饼图切换 |
| ActivityLogPage | 活动日志 | 支持时间戳/类型标记 |
| StepperSection | 步骤区块 | 支持当前步骤 |
| AuthCard | 登录卡片 | 内置国际化文案，支持 texts prop 批量覆盖 |
| ProfilePage | 个人资料 | 支持头像/邮箱/简介 |
| SettingsPage | 设置页面 | 支持 v-model、标签切换 |
| WaitlistPage | 等待名单 | 支持等待人数 |
| NotFoundPage | 404 页面 | 支持返回按钮 |
| LoadingPage | 加载页面 | 支持进度条 |
| BlogCard | 博客卡片 | 支持标签/日期/链接 |
| BlogListPage | 博客列表 | 支持分类/分页 |
| TestimonialCard | 评价卡片 | 支持引用/作者/角色 |
| FaqSection | FAQ 区块 | 支持问答列表 |
| GallerySection | 画廊区块 | 支持图片/标题/描述 |
| FileCard | 文件卡片 | 支持文件名/大小/类型 |
| UploadCard | 上传卡片 | 支持进度条/文件限制 |
| EmptyState | 空状态 | 支持图标/操作按钮 |
| ErrorCard | 错误卡片 | 支持重试/关闭操作 |
| SuccessCard | 成功卡片 | 支持确认按钮 |
| CookieConsent | Cookie 同意 | 支持接受/拒绝 |
| FeedbackForm | 反馈表单 | 支持标题/描述、加载/成功状态 |
| QuickActions | 快捷操作 | 支持图标/变体 |
| SearchWidget | 搜索组件 | 支持建议/分组、加载/最近搜索 |
| TabsNav | 标签导航 | 支持默认值 |

> 完整 Props / Events / Slots 参考 `references/components/` 下的分类文件。
> 区块组件详细用法参考 `references/blocks/` 下的分类文件。

## 样式规范

### 必须使用

```vue
<!-- 边框 -->
class="border-3 border-brutal rounded-brutal"

<!-- 阴影 -->
class="shadow-brutal"
class="shadow-brutal-sm"
class="shadow-brutal-lg"
class="shadow-brutal-xl"
class="shadow-brutal-primary"    <!-- 主色阴影 -->
class="shadow-brutal-secondary"  <!-- 辅助色阴影 -->

<!-- 颜色 -->
class="bg-brutal-primary text-brutal-fg"
class="bg-brutal-secondary text-brutal-fg"
class="bg-brutal-accent text-brutal-fg"
class="bg-brutal-destructive text-brutal-fg"
class="bg-brutal-success text-brutal-fg"
class="bg-brutal-info text-brutal-fg"
class="bg-brutal-muted text-brutal-fg"

<!-- 悬停效果（所有可交互元素必须添加） -->
class="hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5"

<!-- 按压效果（所有可交互元素必须添加） -->
class="active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none"

<!-- 完整交互效果（推荐） -->
class="hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none"
```

### 禁止使用

```vue
<!-- ❌ 软阴影 -->   class="shadow-md shadow-lg shadow-xl"
<!-- ❌ 圆角 -->     class="rounded-md rounded-lg rounded-xl"
<!-- ❌ 浅色边框 --> class="border-slate-200 border-gray-300"
<!-- ❌ 硬编码颜色 --> class="bg-[#FF6B6B]"
```

> 完整设计令牌参考 `references/design-tokens.md`。

## 主题系统

### 内置主题预设

| 主题 | 类名 | 特征 |
|------|------|------|
| Classic | `theme-classic` | 粗 3px 边框、硬 4px 阴影、零圆角、鲜艳色彩 |
| Pastel | `theme-pastel` | 2px 边框、3px 阴影、8px 圆角、柔和粉彩 |
| Mono | `theme-mono` | 4px 边框、5px 阴影、零圆角、黑白灰度 |
| Warm | `theme-warm` | 3px 边框、4px 阴影、4px 圆角、暖色橙棕米色调 |

### 主题实验室

当用户想调试自定义主题、生成 CSS 变量、检查主题对比度或确认 token 覆盖率时，引导使用 docs 的“主题实验室”（`/guide/theme-playground`）。主题实验室是 docs-only 工具，输出 `.theme-custom` CSS，不改变 `useTheme()` 的 `classic | pastel | mono` 内置主题类型。

### 暗色模式

所有主题均支持暗色模式，通过 `.dark` 类激活：

```html
<html class="dark">
  <!-- 暗色模式生效 -->
</html>
```

### useTheme 组合式函数

```typescript
import { useTheme } from 'brutx-ui-vue'

const { theme, colorMode, setTheme, toggleColorMode, applyColorMode, initTheme, setCustomVariable, removeCustomVariable } = useTheme()

// 应用入口恢复用户偏好
initTheme()

// 切换主题
setTheme('pastel')

// 切换暗色模式
toggleColorMode()

// 运行时定制单个 CSS 变量
setCustomVariable('--brutal-primary', '#8B5CF6')
// 移除
removeCustomVariable('--brutal-primary')
```

## 国际化

BrutxUI 内置轻量多语言支持，**默认语言为中文（zh-CN）**，同时提供英文（en）语言包。

### 优先级链

```
组件 props > 全局 locale 配置 > 默认中文（zh-CN）
```

### 全局切换语言

通过 `BrutxUIPlugin` 的 `locale` 选项切换：

```typescript
import { createApp } from 'vue'
import { BrutxUIPlugin, en } from 'brutx-ui-vue'

const app = createApp(App)
app.use(BrutxUIPlugin, { locale: en })
app.mount('#app')
```

### 局部子树覆盖

使用 `provideLocale` 在某个组件子树内使用不同语言：

```vue
<script setup>
import { provideLocale, en } from 'brutx-ui-vue'

provideLocale(en)
</script>
```

### useLocale 组合式函数

```typescript
import { useLocale } from 'brutx-ui-vue'

const { t, locale } = useLocale()

// 使用翻译（点号路径）
const title = t('saasPricing.title')

// 带插值
const message = t('combobox.selectedCount', { count: 3 })
```

### 自定义语言包

```typescript
import { zhCN, mergeLocale } from 'brutx-ui-vue/locales'

const customLocale = mergeLocale(zhCN, {
    command: { placeholder: '请输入...' },
})
app.use(BrutxUIPlugin, { locale: customLocale })
```

### 通过 props 或 texts 覆盖

```vue
<!-- 单个 prop 覆盖 -->
<CommandInput placeholder="自定义搜索..." />

<!-- texts prop 批量覆盖 -->
<AuthCard :texts="{
    google: '使用 Google 登录',
    github: '使用 GitHub 登录',
    signIn: '登 录',
}" />
```

### 自定义 Fallback Locale

当 key 在当前 locale 中找不到时，可以自定义回退链：

```typescript
import { provideLocale, en } from 'brutx-ui-vue'

// 回退顺序：en → customFallback → zhCN → 返回 path 原文
provideLocale({
    locale: en,
    fallbackLocale: {
        button: { confirm: 'OK', cancel: 'Cancel' },
    },
})
```

## 组合式函数

BrutxUI 导出以下可复用组合式函数，可在自定义组件中独立使用：

| Composable | 说明 |
|------------|------|
| `useCarousel` | 轮播逻辑（embla 初始化、autoplay、状态管理），自动尊重 prefers-reduced-motion |
| `useDatePicker` | 日期选择逻辑（面板开关、显示值、选择确认） |
| `useColorPicker` | 颜色选择逻辑（面板开关、颜色转换、选择确认） |
| `useColorHistory` | 颜色历史记录管理（localStorage 持久化、去重、最大数量限制） |
| `useAnimation` | 统一动画降级策略，自动尊重 prefers-reduced-motion |
| `useReducedMotion` | 检测用户 prefers-reduced-motion 系统设置 |
| `useFormFieldValidation` | 通用表单验证（rules、validateOn、validationState） |
| `useTheme` | 主题切换与运行时定制（setCustomVariable/removeCustomVariable） |
| `useLocale` | 国际化文本获取 |
| `useToast` | Toast 通知管理 |
| `useClipboard` | 剪贴板复制功能（isSupported、copied 状态） |
| `useAudioEngine` | Web Audio API 音效引擎（type/success/fail 音效） |
| `useCanvasInteraction` | Canvas 交互逻辑（涂抹进度、阈值自动揭示） |
| `useKanban` | 看板拖拽逻辑（鼠标/键盘拖拽、列/卡片移动） |
| `useStepper` | 步骤条逻辑（步骤导航、键盘处理） |
| `useDataTableSort` | DataTable 排序状态管理 |
| `useDataTableFilter` | DataTable 筛选状态管理 |
| `useDataTableSelection` | DataTable 行选择管理 |
| `useDataTablePagination` | DataTable 分页状态管理 |

## 代码模板

### 表单（带 vee-validate 校验）

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

### 时间线

```vue
<script setup lang="ts">
import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent } from 'brutx-ui-vue'
</script>

<template>
  <!-- 自动添加 role="list" 和 aria-label -->
  <Timeline orientation="vertical">
    <TimelineItem>
      <!-- 自动添加 role="listitem" -->
      <TimelineSeparator>
        <TimelineDot variant="primary" shape="circle">1</TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>
        <div class="font-black">第一阶段</div>
        <p class="font-normal text-sm mt-1">需求分析与设计</p>
      </TimelineContent>
    </TimelineItem>

    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot variant="accent" shape="square">2</TimelineDot>
      </TimelineSeparator>
      <TimelineContent>
        <div class="font-black">第二阶段</div>
        <p class="font-normal text-sm mt-1">开发与测试</p>
      </TimelineContent>
    </TimelineItem>
  </Timeline>
</template>
```

### 手绘图表

```vue
<script setup lang="ts">
import { SketchyChart } from 'brutx-ui-vue'

const chartData = [
  { label: '1月', value: 4000 },
  { label: '2月', value: 3000 },
  { label: '3月', value: 5000 },
]
</script>

<template>
  <!-- 柱状图 -->
  <SketchyChart type="bar" :data="chartData" :sketchiness="2" />

  <!-- 折线图 -->
  <SketchyChart type="line" :data="chartData" :grid="true" />

  <!-- 饼图 -->
  <SketchyChart type="pie" :data="chartData" :width="400" :height="400" />
</template>
```

## 生成规则

1. **优先使用 BrutxUI 组件**，不要从头创建功能相同的组件。禁止用 native HTML 元素替代已有组件：用 `Button` 而非 `<button>`、用 `Select` 系列而非 `<select>`/`<option>`、用 `Badge` 而非手写 badge `<div>`、用 `Input` 而非 `<input>`（除非有特殊 ARIA 角色、内联图标切换等特殊场景）
2. **遵循样式规范**，使用 `border-3`、`shadow-brutal`、`rounded-brutal` 和设计令牌颜色
3. **添加交互效果**，所有可交互元素必须有 `hover` 和 `active` 状态
4. **支持国际化**，使用 `useLocale()` 的 `t()` 函数获取文案，不要硬编码。默认中文
5. **使用 `cn()` 合并类名**，不要拼接字符串
6. **使用 `computed()` 处理动态类**，不要在模板中直接调用 `cn()`
7. **支持主题切换**，使用 CSS 变量而非硬编码颜色值
8. **使用 `<script setup>` 语法**，不要使用 Options API
9. **使用 `v-model` 进行双向绑定**，不要使用 `onChange`/`onInput`
10. **使用 `@click` 事件处理器**，不要使用 `onClick`

## 参考文件指引

| 场景 | 读取文件 |
|------|----------|
| 表单组件 Props | `references/components/form.md` |
| 布局容器 Props | `references/components/layout.md` |
| 数据展示 Props | `references/components/data.md` |
| 浮层反馈 Props | `references/components/feedback.md` |
| 新粗野特色组件 Props | `references/components/brutal.md` |
| 页头/页脚/仪表盘外壳 | `references/blocks/layout-nav.md` |
| 英雄区/定价/博客/FAQ | `references/blocks/marketing.md` |
| 统计/图表/数据表格 | `references/blocks/dashboard.md` |
| 登录/设置/404 等页面 | `references/blocks/pages.md` |
| 空状态/错误/成功/反馈 | `references/blocks/feedback.md` |
| 搜索/上传/快捷操作 | `references/blocks/interactive.md` |
| 设计令牌/主题/国际化 | `references/design-tokens.md` |

## 相关资源

- [组件文档](https://lidaixingchen.github.io/brutxui-vue3/)
- [NPM 包](https://www.npmjs.com/package/brutx-ui-vue)
- [GitHub 仓库](https://github.com/lidaixingchen/brutxui-vue3)
