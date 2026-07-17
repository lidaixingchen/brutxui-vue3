# 布局与容器组件

## Card

卡片容器，支持 6 种变体。

```vue
<Card variant="default" padding="default">
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>内容</CardContent>
  <CardFooter>底部</CardFooter>
</Card>

<!-- 可点击卡片 -->
<Card interactive @activate="handleClick">
  <CardContent>
    <p>点击此卡片触发 activate 事件</p>
  </CardContent>
</Card>
```

子组件：Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter

### Card Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'elevated' \| 'flat' \| 'interactive' \| 'primary' \| 'secondary'` | `'default'` | 卡片变体类型 |
| `padding` | `'none' \| 'sm' \| 'default' \| 'lg'` | `'default'` | 卡片内边距 |
| `interactive` | `boolean` | `false` | 是否可点击，添加 `role="button"`、`tabindex="0"` 和键盘支持 |
| `class` | `string` | — | 自定义样式类 |

### Card 事件

| 事件 | 说明 |
|------|------|
| `activate` | 当 `interactive=true` 时，点击或按 Enter/Space 键触发 |

### CardTitle Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `as` | `string` | `'h3'` | 渲染的 HTML 元素 |
| `class` | `string` | — | 自定义样式类 |

## Separator

分隔线，支持水平/垂直方向和文字分隔线。

```vue
<Separator />
<Separator orientation="vertical" />
<Separator variant="primary" size="lg">文字分隔线</Separator>
```

### Separator Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'muted'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 控制粗细 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 方向 |
| `decorative` | `boolean` | `true` | 是否为装饰性（无语义角色） |
| `class` | `string` | — | 自定义样式类 |

### Separator 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 文字分隔线内容；仅在 `orientation="horizontal"` 且有内容时渲染 |

## ScrollArea

自定义滚动区域，基于 reka-ui ScrollArea 原语构建。

```vue
<ScrollArea class="h-72 w-48" variant="primary" size="lg">
  <div class="p-4">长内容...</div>
</ScrollArea>
```

子组件：ScrollArea, ScrollBar

### ScrollArea Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'accent'` | `'default'` | 滚动条颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 滚动条粗细 |
| `class` | `string` | — | 自定义样式类 |

### ScrollBar Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | 方向 |
| `variant` | `'default' \| 'primary' \| 'accent'` | `'default'` | 滚动条颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 滚动条粗细 |
| `class` | `string` | — | 自定义样式类 |

## Sheet

侧边抽屉，基于 Dialog 原语构建。

```vue
<Sheet>
  <SheetTrigger as-child><Button>打开</Button></SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>标题</SheetTitle>
      <SheetDescription>描述</SheetDescription>
    </SheetHeader>
    内容
    <SheetFooter>底部</SheetFooter>
  </SheetContent>
</Sheet>
```

子组件：Sheet, SheetTrigger, SheetPortal, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription

### Sheet Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | — | 受控的打开状态 |
| `defaultOpen` | `boolean` | — | 非受控的默认打开状态 |
| `modal` | `boolean` | `true` | 是否为模态对话框 |

### SheetContent Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'right'` | 面板滑出方向 |
| `class` | `string` | — | 自定义样式类 |

### Sheet 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:open` | `boolean` | 打开状态变化时触发 |

## Tabs

标签页，基于 reka-ui Tabs 原语构建。

```vue
<Tabs v-model="activeTab" orientation="horizontal">
  <TabsList size="default">
    <TabsTrigger value="account" variant="default">账户</TabsTrigger>
    <TabsTrigger value="password">密码</TabsTrigger>
  </TabsList>
  <TabsContent value="account">账户内容</TabsContent>
  <TabsContent value="password">密码内容</TabsContent>
</Tabs>
```

子组件：Tabs, TabsList, TabsTrigger, TabsContent

### Tabs Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | — | 当前激活标签页的值 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 标签页排列方向 |
| `class` | `string` | — | 自定义样式类 |

### TabsList Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 容器尺寸 |
| `orientation` | `'horizontal' \| 'vertical'` | 继承自 Tabs | 排列方向 |
| `class` | `string` | — | 自定义样式类 |

### TabsTrigger Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | —（必填） | 标签页唯一标识 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success'` | `'default'` | 激活状态颜色变体 |
| `class` | `string` | — | 自定义样式类 |

### TabsContent Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | —（必填） | 对应标签页的值 |
| `class` | `string` | — | 自定义样式类 |

### Tabs 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string` | 激活标签页变化时触发 |

## Accordion

折叠面板，基于 reka-ui 原语构建。

```vue
<Accordion type="single" collapsible>
  <AccordionItem value="item-1" variant="default">
    <AccordionTrigger>问题 1</AccordionTrigger>
    <AccordionContent>回答 1</AccordionContent>
  </AccordionItem>
</Accordion>
```

子组件：Accordion, AccordionItem, AccordionTrigger, AccordionContent

### Accordion Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'single' \| 'multiple'` | — | 展开模式 |
| `collapsible` | `boolean` | `false` | 是否允许关闭全部子项 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `modelValue` | `string \| string[]` | — | 当前选中的面板值 |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | 排列方向 |
| `unmountOnHide` | `boolean` | `true` | 关闭时是否卸载内容 DOM |
| `class` | `string` | — | 自定义样式类 |

### AccordionItem Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | —（必填） | 唯一标识 |
| `variant` | `'default' \| 'flat' \| 'ghost' \| 'interactive'` | `'default'` | 视觉风格变体 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `class` | `string` | — | 自定义样式类 |

### AccordionTrigger Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'lg'` | 展开/折叠图标尺寸 |
| `class` | `string` | — | 自定义样式类 |

### Accordion 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string \| string[] \| undefined` | 展开状态改变时触发 |

### Accordion 插槽

| 插槽 | 说明 |
|------|------|
| `AccordionTrigger#icon` | 自定义展开/折叠图标，默认为 ChevronDown |

## Breadcrumb

面包屑导航，基于 reka-ui 原语构建。

```vue
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">首页</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>当前页</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

子组件：Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis

### BreadcrumbLink Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `as` | `string` | `'a'` | 渲染的 HTML 标签 |
| `asChild` | `boolean` | `false` | 是否开启 asChild |
| `class` | `string` | — | 自定义样式类 |

### BreadcrumbEllipsis Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `iconSize` | `IconSize` | `'default'` | 图标尺寸 |
| `class` | `string` | — | 自定义样式类 |

### Breadcrumb 插槽

| 插槽 | 说明 |
|------|------|
| `BreadcrumbSeparator#default` | 默认渲染 `/`，可自定义 |
| `BreadcrumbEllipsis#default` | 默认渲染 MoreHorizontal 图标 |

## Stepper

步骤条，支持水平/垂直方向。

```vue
<Stepper
  :steps="[
    { id: 1, title: '基本信息', description: '填写基本资料' },
    { id: 2, title: '验证', description: '验证邮箱' },
  ]"
  v-model="currentStep"
  orientation="horizontal"
  variant="default"
  size="default"
  :clickable="true"
/>
```

### StepperStep 类型

```typescript
interface StepperStep {
  id: string | number
  title: string
  description?: string
}
```

### Stepper Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `steps` | `StepperStep[]` | —（必填） | 步骤数据列表 |
| `modelValue` | `number` | — | 当前步骤索引（0 开始） |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 布局方向 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 步骤点尺寸 |
| `variant` | `'default' \| 'primary' \| 'accent'` | `'default'` | 激活步骤的颜色变体 |
| `clickable` | `boolean` | `true` | 是否允许点击步骤点跳转 |
| `class` | `string` | — | 自定义样式类 |

### Stepper 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `number` | 步骤变更 |
| `step-click` | `number` | 点击某步骤节点时触发 |

### Stepper 插槽

垂直模式下，每个步骤可通过 `#step-{id}` 插槽注入内容。

### Stepper 暴露的 API

通过 `ref` 访问组件实例后可调用以下方法：

| 属性/方法 | 类型 | 说明 |
| --- | --- | --- |
| `currentStep` | `ComputedRef<number>` | 当前步骤索引（只读） |
| `totalSteps` | `ComputedRef<number>` | 总步骤数（只读） |
| `isFirstStep` | `ComputedRef<boolean>` | 是否为第一步（只读） |
| `isLastStep` | `ComputedRef<boolean>` | 是否为最后一步（只读） |
| `goToStep` | `(index: number) => void` | 跳转到指定步骤 |
| `nextStep` | `() => void` | 前进一步 |
| `previousStep` | `() => void` | 后退一步 |

## Timeline

时间线，支持垂直/水平方向和交替布局。

```vue
<Timeline orientation="vertical" :alternate="false">
  <TimelineItem>
    <TimelineSeparator>
      <TimelineDot variant="primary" shape="circle">1</TimelineDot>
      <TimelineConnector />
    </TimelineSeparator>
    <TimelineContent>
      <div class="font-black">第一阶段</div>
      <p>描述信息</p>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

子组件：Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent

### Timeline Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | 时间线排版方向 |
| `alternate` | `boolean` | `false` | 是否启用交替布局（仅 vertical 生效） |
| `class` | `string` | — | 自定义样式类 |

### TimelineDot Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'success' \| 'danger'` | `'accent'` | 配色变体 |
| `shape` | `'circle' \| 'square' \| 'diamond'` | `'circle'` | 几何形态变体 |
| `class` | `string` | — | 自定义样式类 |

## Carousel

轮播图，基于 Embla Carousel 驱动。

```vue
<Carousel :loop="true" :autoplay="true" :autoplay-delay="5000" show-arrows show-dots size="md">
  <CarouselItem>幻灯片 1</CarouselItem>
  <CarouselItem>幻灯片 2</CarouselItem>
</Carousel>
```

子组件：Carousel, CarouselItem

### Carousel Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loop` | `boolean` | `false` | 是否开启首尾循环滚动 |
| `autoplay` | `boolean` | `false` | 是否自动播放 |
| `autoplayDelay` | `number` | `3000` | 自动播放间隔（毫秒） |
| `showArrows` | `boolean` | `true` | 是否显示左右切换箭头 |
| `showDots` | `boolean` | `true` | 是否显示底部导航圆点 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'full' \| 'default'` | `'default'` | 轮播容器高度预设 |
| `class` | `string` | — | 自定义样式类 |

### Carousel 暴露的 API

| 方法/属性 | 类型 | 说明 |
|-----------|------|------|
| `scrollPrev` | `() => void` | 滚动到上一张 |
| `scrollNext` | `() => void` | 滚动到下一张 |
| `scrollTo` | `(index: number) => void` | 滚动到指定索引 |
| `selectedIndex` | `ComputedRef<number>` | 当前选中索引 |
| `canScrollPrev` | `ComputedRef<boolean>` | 是否可向前滚动 |
| `canScrollNext` | `ComputedRef<boolean>` | 是否可向后滚动 |

### useCarousel composable

```typescript
import { useCarousel } from 'brutx-ui-vue'

const {
  emblaRef, selectedIndex, scrollSnaps,
  canScrollPrev, canScrollNext,
  scrollPrev, scrollNext, scrollTo,
  startAutoplay, stopAutoplay,
} = useCarousel({ loop: true, autoplay: true, autoplayDelay: 3000 })
```

## TreeView

树形目录，支持单选和复选模式。

```vue
<TreeView
  :nodes="[
    { id: '1', label: '节点 1', children: [
      { id: '1-1', label: '子节点 1-1' },
    ]},
  ]"
  v-model="selectedNode"
  :default-expanded="['1']"
  selection-mode="checkbox"
  v-model:checked-ids="checkedIds"
/>
```

### TreeNode 类型

```typescript
interface TreeNode {
  id: string
  label: string
  icon?: string
  children?: TreeNode[]
  disabled?: boolean
  data?: unknown
}
```

### TreeView Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `nodes` | `TreeNode[]` | —（必填） | 树形数据源 |
| `modelValue` | `string \| null` | `null` | 当前选中节点的 id |
| `selectionMode` | `'single' \| 'checkbox'` | `'single'` | 选择模式 |
| `checkedIds` | `string[]` | `[]` | 复选模式下勾选的节点 id 列表 |
| `defaultExpanded` | `string[]` | `[]` | 初始展开的节点 id 列表 |
| `class` | `string` | — | 自定义样式类 |

### TreeView 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string \| null` | 选中节点 id 变更 |
| `update:checkedIds` | `string[]` | 勾选项变更（checkbox 模式） |
| `update:expanded` | `string[]` | 展开节点列表变更 |
| `select` | `TreeNode` | 点击任意节点时触发 |
| `expand` | `[id: string, expanded: boolean]` | 展开/折叠节点时触发 |
| `check` | `[node: TreeNode, checked: boolean]` | 勾选/取消勾选节点时触发 |

### TreeView 高级用法与防错示例

在业务系统中集成 `TreeView` 时，为了避免数据流混乱并提供更好的交互体验，可参考以下最佳实践模板。

#### 1. 懒加载与错误重试
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { TreeView, type TreeNode } from 'brutx-ui-vue'

const treeNodes = ref<TreeNode[]>([
  { id: '1', label: '项目 A', children: [], data: { isLeaf: false } },
  { id: '2', label: '项目 B', children: [], data: { isLeaf: false } },
])

// 懒加载节点函数
async function handleLoadNode(node: TreeNode): Promise<TreeNode[]> {
  try {
    const response = await fetch(`/api/nodes/${node.id}`)
    if (!response.ok) throw new Error('加载失败')
    const data = await response.json()
    return data.map((item: any) => ({
      id: item.id,
      label: item.name,
      children: item.hasChildren ? [] : undefined,
      data: item
    }))
  } catch (err) {
    // 抛出错误以使节点置为加载失败状态，组件会自动渲染重试按钮
    throw err
  }
}
</script>

<template>
  <TreeView
    :nodes="treeNodes"
    :lazy="true"
    :load="handleLoadNode"
  />
</template>
```

#### 2. 节点拖拽排序与局部数据流控制
在开启拖拽 (`draggable`) 时，组件在拖拽释放后会自动更新传入的 `v-model:nodes`。业务侧若需要与后端接口同步，应通过监听事件来捕获最新状态：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { TreeView, type TreeNode } from 'brutx-ui-vue'

const treeNodes = ref<TreeNode[]>([
  {
    id: '1',
    label: '文件夹 1',
    children: [
      { id: '1-1', label: '子项 1-1' },
      { id: '1-2', label: '子项 1-2' }
    ]
  }
])

// 节点拖放发生变化时的事件，用于同步后端
function handleNodeDrop(event: { node: TreeNode; parent: TreeNode | null; index: number }) {
  const { node, parent, index } = event
  console.log(`节点 ${node.id} 移动到了父节点 ${parent?.id || '根节点'} 的第 ${index} 位`)
  
  // 发送网络请求更新后端关系树
  fetch('/api/nodes/move', {
    method: 'POST',
    body: JSON.stringify({
      nodeId: node.id,
      targetParentId: parent?.id || null,
      targetIndex: index
    })
  })
}
</script>

<template>
  <TreeView
    v-model:nodes="treeNodes"
    :draggable="true"
    @node-drop="handleNodeDrop"
  />
</template>
```

#### 3. 程序化搜索与过滤
```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { TreeView, Input } from 'brutx-ui-vue'

// 使用 Vue 3.5+ 的 useTemplateRef 获取组件实例
const treeRef = useTemplateRef<InstanceType<typeof TreeView>>('tree')
const searchQuery = ref('')

function handleSearch(val: string) {
  // 调用 TreeView 暴露的 filter 方法实现本地模糊过滤
  treeRef.value?.filter(val)
}
</script>

<template>
  <div class="space-y-4">
    <Input 
      v-model="searchQuery" 
      placeholder="输入关键字过滤..." 
      clearable
      @update:model-value="handleSearch"
    />
    <TreeView
      ref="tree"
      :nodes="treeNodes"
    />
  </div>
</template>
```

## Menu 导航菜单

导航菜单组件，支持横向 (horizontal) 与纵向 (vertical) 排版，支持嵌套 `SubMenu` 及 router 自动跳转。

```vue
<Menu mode="vertical" :default-active="activeKey" :router="true">
  <MenuItem index="dashboard">仪表盘</MenuItem>
  <SubMenu index="settings">
    <template #title>设置</template>
    <MenuItem index="profile">个人资料</MenuItem>
    <MenuItem index="security">安全设置</MenuItem>
  </SubMenu>
</Menu>
```

### Menu Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mode` | `'horizontal' \| 'vertical'` | `'vertical'` | 菜单展示模式 |
| `defaultActive` | `string` | `''` | 默认选中的激活索引值 |
| `router` | `boolean` | `false` | 是否开启 Vue Router 自动跳转 |
| `class` | `string` | — | 自定义样式类 |

### SubMenu 插槽

| 插槽 | 说明 |
|------|------|
| `title` | 定义子菜单标题（支持文本及 Icon 自定义） |
| `default` | 嵌套的子菜单项 |

## Watermark

新粗野主义平铺水印容器。支持防物理篡改、防 VDOM 更新 Diff 异常、防高分屏失真，以及测试环境（无 Canvas 浏览器）自动向 SVG Fallback 降级。

```vue
<script setup>
import { Watermark } from 'brutx-ui-vue'
</script>

<template>
  <Watermark content="内部机密 严禁外传">
    <div class="h-96 border-3 border-brutal rounded-brutal bg-white p-6">
      <h4>核心客户资料表</h4>
      <p>客户信息等敏感数据...</p>
    </div>
  </Watermark>
</template>
```

### Watermark Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `width` | `number` | `120` | 单个水印图形宽度（单位 px） |
| `height` | `number` | `64` | 单个水印图形高度（单位 px） |
| `rotate` | `number` | `-22` | 水印旋转角度 |
| `zIndex` | `number` | `9999` | 水印图层的 CSS z-index 层级 |
| `image` | `string` | — | 水印图片源地址（若设置此项则优先渲染图片） |
| `content` | `string \| string[]` | `'BrutxUI'` | 水印文本内容（为数组时表示多行渲染） |
| `font` | `{ color?: string; fontSize?: number; fontWeight?: string; fontFamily?: string }` | `{ color: 'rgba(0,0,0,0.15)', fontSize: 16 }` | 水印文本字体样式定义 |
| `gap` | `[number, number]` | `[100, 100]` | 水印横纵平铺间距（单位 px） |
| `offset` | `[number, number]` | — | 水印偏离左上角的偏移量 |
| `class` | `string` | — | 自定义 CSS 类 |

---

## Backtop

回到顶部组件。带有节流保护、跨沙箱 Window 构造探测、自定义显示高度以及硬核浮角定位。

```vue
<script setup>
import { Backtop } from 'brutx-ui-vue'
</script>

<template>
  <div class="container h-[2000px]">
    <p>向下滚动页面...</p>
    <Backtop :visibility-height="300" :right="40" :bottom="40" />
  </div>
</template>
```

### Backtop Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `target` | `string` | — | 滚动监听目标选择器（为空时默认监听最近的 scroll 容器或 window） |
| `visibilityHeight` | `number` | `200` | 滚动高度达到此数值（px）时才显示组件 |
| `right` | `number` | `40` | 距离视口右侧的像素间距 |
| `bottom` | `number` | `40` | 距离视口底部的像素间距 |
| `class` | `string` | — | 自定义 CSS 类 |

### Backtop 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `click` | `MouseEvent` | 点击回到顶部按钮时触发 |

