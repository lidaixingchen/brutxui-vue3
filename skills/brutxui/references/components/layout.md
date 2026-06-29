# 布局与容器组件

## Card

```vue
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>内容</CardContent>
  <CardFooter>底部</CardFooter>
</Card>
```

子组件：Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter

## Separator

```vue
<Separator />
<Separator orientation="vertical" />
<Separator variant="primary" size="lg">
  <template #label>文字</template>
</Separator>
```

- `orientation`: `'horizontal' | 'vertical'`
- `variant`: `'default' | 'primary' | 'muted'` — 默认 `'default'`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`，控制粗细
- 插槽 `label`: 居中文字分隔线（仅 orientation=horizontal 且有内容时渲染）

## ScrollArea

```vue
<ScrollArea class="h-72 w-48" variant="primary" size="lg">
  <div class="p-4">长内容...</div>
</ScrollArea>
```

- `variant`: `'default' | 'primary' | 'accent'` — 默认 `'default'`，控制滚动条颜色
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`，控制滚动条粗细

子组件：ScrollArea, ScrollBar

## Sheet

侧边抽屉，基于 Dialog。

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

- `SheetContent.side`: `'top' | 'right' | 'bottom' | 'left'` — 默认 `'right'`

子组件：Sheet, SheetTrigger, SheetPortal, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription

## Tabs

```vue
<Tabs default-value="account">
  <TabsList>
    <TabsTrigger value="account">账户</TabsTrigger>
    <TabsTrigger value="password">密码</TabsTrigger>
  </TabsList>
  <TabsContent value="account">账户内容</TabsContent>
  <TabsContent value="password">密码内容</TabsContent>
</Tabs>
```

- `Tabs.default-value`: `string`
- `TabsTrigger.value`: `string`

## Accordion

```vue
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>问题 1</AccordionTrigger>
    <AccordionContent>回答 1</AccordionContent>
  </AccordionItem>
</Accordion>
```

子组件：Accordion, AccordionItem, AccordionTrigger, AccordionContent

## Breadcrumb

```vue
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">首页</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>当前页</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

子组件：Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis

## Stepper

```vue
<Stepper
  :steps="[
    { id: 1, title: '基本信息', description: '填写基本资料' },
    { id: 2, title: '验证', description: '验证邮箱' },
  ]"
  v-model="currentStep"
  orientation="horizontal"
/>
```

- `steps`: `StepperStep[]` — `{ id: string|number; title: string; description?: string }[]`
- `modelValue`: `number`（0-indexed）
- `orientation`: `'horizontal' | 'vertical'` — 默认 `'horizontal'`
- `variant`: `'default' | 'primary' | 'accent'` — 默认 `'default'`，影响 active 状态颜色
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`，步骤点尺寸
- `clickable`: `boolean` — 默认 `true`，false 时步骤点不可点击
- Events: `update:modelValue`, `step-click`（点击步骤节点时触发）

垂直模式支持内容插槽：

```vue
<Stepper v-model="current" :steps="steps" orientation="vertical">
  <template #step-1>
    <p>第一步的内容...</p>
  </template>
  <template #step-2>
    <p>第二步的内容...</p>
  </template>
</Stepper>
```

## Timeline

```vue
<Timeline orientation="vertical">
  <TimelineItem>
    <TimelineSeparator>
      <TimelineDot />
      <TimelineConnector />
    </TimelineSeparator>
    <TimelineContent><p>事件 1</p></TimelineContent>
  </TimelineItem>
</Timeline>
```

- `orientation`: `'vertical' | 'horizontal'` — 默认 `'vertical'`
- `alternate`: `boolean` — 默认 `false`，仅 vertical 生效，交替左右排列（偶数项左、奇数项右）

子组件：Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent

## Carousel

```vue
<Carousel :loop="true" :autoplay="true" :autoplay-delay="5000" show-arrows show-dots>
  <CarouselItem>幻灯片 1</CarouselItem>
  <CarouselItem>幻灯片 2</CarouselItem>
</Carousel>
```

- `loop`: `boolean` — 默认 `false`
- `autoplay`: `boolean` — 默认 `false`
- `autoplayDelay`: `number` — 默认 `3000`
- `showArrows`: `boolean` — 默认 `true`
- `showDots`: `boolean` — 默认 `true`
- `size`: `'sm' | 'md' | 'lg' | 'full' | 'auto'` — 默认 `'auto'`

## TreeView

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

- `nodes`: `TreeNode[]` — `{ id: string; label: string; icon?: string; children?: TreeNode[]; disabled?: boolean; data?: unknown }[]`
- `modelValue`: `string | null`
- `defaultExpanded`: `string[]`
- `selectionMode`: `'single' | 'checkbox'` — 默认 `'single'`，checkbox 模式下每节点前渲染 Checkbox
- `checkedIds`: `Set<string>` — `v-model:checked-ids`，checkbox 模式的选中节点 id 集合（父节点状态通过后代推导，支持级联选中与半选）
- Events: `update:modelValue`, `update:checkedIds`, `check(checkedIds: Set<string>)`
