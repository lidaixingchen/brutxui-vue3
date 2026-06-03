---
name: brutxui
description: >
  当用户要求创建、修改或优化新粗野主义 Vue 3 UI 组件、页面或表单时使用此技能。
  适用于：创建表单、卡片、数据表格、设置页面、定价页面、仪表盘、聊天界面、看板、时间线、轮播、树形视图等场景。
  也适用于用户询问 BrutxUI 组件用法、样式规范、设计令牌等问题时。
  当用户提到"brutxui"、"brutx"、"新粗野主义"、"neo-brutalist"时也应触发。
---

# BrutxUI 代码生成指南

BrutxUI 是面向 Vue 3 + Tailwind CSS 的新粗野主义（Neo-Brutalist）UI 组件库，采用复制粘贴式工作流。

**技术栈：** Vue 3.5+ · TypeScript 5.7+ · Tailwind CSS 3.4+ · reka-ui 2.9+ · CVA 0.7+

## 核心原则

1. **优先使用 BrutxUI 组件**，不要从头创建相似功能的组件
2. **遵循新粗野主义设计规范**，使用正确的边框、阴影和颜色系统
3. **支持国际化**，使用 `useLocale()` 获取文本，不要硬编码文案
4. **保持无障碍性**，组件基于 reka-ui 无障碍原语构建

## 导入方式

```typescript
import { Button, Card, Badge, cn } from 'brutx-ui-vue'
import type { PricingPlan, TreeNode, KanbanColumn } from 'brutx-ui-vue'
```

## 组件列表

### 表单

| 组件 | 中文名 |
|------|--------|
| Button | 按钮 |
| SubmitButton | 提交按钮 |
| Input | 输入框 |
| NumberInput | 数字输入框 |
| HardcoreInput | 硬核输入框 |
| Textarea | 文本域 |
| Checkbox | 复选框 |
| Switch | 开关 |
| RadioGroup | 单选组 |
| Select | 选择器 |
| Combobox | 搜索选择器 |
| Slider | 滑块 |
| Toggle | 切换按钮 |
| ToggleGroup | 切换按钮组 |
| TagsInput | 标签输入 |
| Calendar | 日历 |
| Form | 表单 |

### 布局与容器

| 组件 | 中文名 |
|------|--------|
| Card | 卡片 |
| Separator | 分隔线 |
| ScrollArea | 滚动区域 |
| Sheet | 侧边抽屉 |
| Tabs | 标签页 |
| Accordion | 手风琴 |
| Breadcrumb | 面包屑 |
| Stepper | 步骤条 |
| Timeline | 时间线 |
| Carousel | 轮播 |
| TreeView | 树形视图 |

### 数据展示

| 组件 | 中文名 |
|------|--------|
| Table | 表格 |
| Badge | 徽章 |
| Avatar | 头像 |
| Progress | 进度条 |
| Pagination | 分页 |
| Counter | 数字动画 |
| Kbd | 键盘按键 |
| CodeBlock | 代码块 |
| Marquee | 跑马灯 |
| BeforeAfter | 对比图 |
| ChatBubble | 聊天气泡 |
| Skeleton | 骨架屏 |
| Spinner | 加载动画 |

### 反馈与浮层

| 组件 | 中文名 |
|------|--------|
| Dialog | 对话框 |
| AlertDialog | 确认弹窗 |
| Alert | 提示 |
| Toast | 通知 |
| Popover | 弹出框 |
| Tooltip | 工具提示 |
| DropdownMenu | 下拉菜单 |
| Command | 命令面板 |

### 新粗野主义特色

| 组件 | 中文名 |
|------|--------|
| Card3D | 3D 卡片 |
| GlitchText | 故障文字 |
| ScratchCard | 刮刮卡 |
| SketchyChart | 手绘图表 |
| CopyToClipboard | 复制到剪贴板 |
| KanbanBoard | 看板 |

### 区块/页面

| 组件 | 中文名 |
|------|--------|
| SaaSPricing | SaaS 定价 |
| PricingSection | 定价区域 |
| DashboardStats | 仪表盘统计 |
| DashboardShell | 仪表盘外壳 |
| BrutalistHero | 英雄区块 |
| AuthCard | 登录卡片 |
| HeaderSection | 页头导航 |
| FooterSection | 页脚 |
| FaqSection | FAQ 区块 |
| TestimonialCard | 评价卡片 |
| BlogCard | 博客卡片 |
| BlogListPage | 博客列表页 |
| FileCard | 文件卡片 |
| UploadCard | 上传卡片 |
| DataTableSection | 数据表格区块 |
| SettingsPage | 设置页面 |
| ProfilePage | 个人资料页 |
| ActivityLogPage | 活动日志页 |
| OverviewPage | 总览页面 |
| ChartSection | 图表区块 |
| GallerySection | 画廊区块 |
| StepperSection | 步骤区块 |
| EmptyState | 空状态 |
| ErrorCard | 错误卡片 |
| SuccessCard | 成功卡片 |
| NotFoundPage | 404 页面 |
| LoadingPage | 加载页面 |
| WaitlistPage | 等待名单页 |
| CookieConsent | Cookie 同意 |
| QuickActions | 快捷操作 |
| TabsNav | 标签导航 |
| SearchWidget | 搜索组件 |
| FeedbackForm | 反馈表单 |

> 完整 Props / Events / Slots 参考 `references/components/` 下的分类文件。
> 区块组件详细用法参考 `references/blocks/` 下的分类文件。

## 样式规范

### 必须使用

```vue
class="border-3 border-brutal rounded-brutal"           <!-- 边框 -->
class="shadow-brutal shadow-brutal-sm shadow-brutal-lg" <!-- 阴影 -->
class="bg-brutal-primary text-brutal-fg"                <!-- 颜色 -->
class="hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5"          <!-- 悬停 -->
class="active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none"      <!-- 按压 -->
```

### 禁止使用

```vue
<!-- ❌ 软阴影 -->   class="shadow-md shadow-lg shadow-xl"
<!-- ❌ 圆角 -->     class="rounded-md rounded-lg rounded-xl"
<!-- ❌ 浅色边框 --> class="border-slate-200 border-gray-300"
<!-- ❌ 硬编码颜色 --> class="bg-[#FF6B6B]"
```

> 完整设计令牌参考 `references/design-tokens.md`。

## 代码模板

### 表单

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent, CardFooter } from 'brutx-ui-vue'

const form = ref({ name: '', email: '' })
function handleSubmit() { /* 处理提交 */ }
</script>

<template>
  <Card class="max-w-md mx-auto">
    <CardHeader><CardTitle>用户信息</CardTitle></CardHeader>
    <CardContent>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="name">姓名</Label>
          <Input id="name" v-model="form.name" placeholder="请输入姓名" />
        </div>
        <div class="space-y-2">
          <Label for="email">邮箱</Label>
          <Input id="email" v-model="form.email" type="email" placeholder="请输入邮箱" />
        </div>
      </form>
    </CardContent>
    <CardFooter class="justify-end gap-2">
      <Button variant="outline">取消</Button>
      <Button variant="primary" @click="handleSubmit">提交</Button>
    </CardFooter>
  </Card>
</template>
```

### 数据表格

```vue
<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from 'brutx-ui-vue'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'brutx-ui-vue'
import { Badge } from 'brutx-ui-vue'

const items = [
  { id: 1, name: '项目 A', status: '进行中', progress: 60 },
  { id: 2, name: '项目 B', status: '已完成', progress: 100 },
]
</script>

<template>
  <Card>
    <CardHeader><CardTitle>项目列表</CardTitle></CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>项目名称</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>进度</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in items" :key="item.id">
            <TableCell>{{ item.name }}</TableCell>
            <TableCell>
              <Badge :variant="item.status === '已完成' ? 'success' : 'primary'">{{ item.status }}</Badge>
            </TableCell>
            <TableCell>{{ item.progress }}%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
```

### 定价页面

```vue
<script setup lang="ts">
import { SaaSPricing } from 'brutx-ui-vue'
import type { PricingPlan } from 'brutx-ui-vue'

const plans: PricingPlan[] = [
  {
    name: 'Starter', description: '适合个人开发者',
    priceMonthly: '¥0', priceAnnually: '¥0',
    features: [
      { text: '5个组件', included: true },
      { text: '优先更新', included: false },
    ],
    buttonText: '开始使用', buttonVariant: 'outline',
  },
  {
    name: 'Pro', description: '适合专业团队',
    priceMonthly: '¥99', priceAnnually: '¥79',
    features: [
      { text: '所有组件', included: true },
      { text: '优先支持', included: true },
    ],
    popular: true, buttonText: '升级 Pro', buttonVariant: 'primary',
  },
]
</script>

<template>
  <SaaSPricing :plans="plans" title="选择方案" subtitle="所有方案包含14天试用" />
</template>
```

## 生成规则

1. **优先使用 BrutxUI 组件**，不要从头创建功能相同的组件
2. **遵循样式规范**，使用 `border-3`、`shadow-brutal`、`rounded-brutal` 和设计令牌颜色
3. **添加交互效果**，所有可交互元素必须有 `hover` 和 `active` 状态
4. **支持国际化**，使用 `useLocale()` 的 `t()` 函数获取文案，不要硬编码
5. **使用 `cn()` 合并类名**，不要拼接字符串
6. **使用 `computed()` 处理动态类**，不要在模板中直接调用 `cn()`

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
