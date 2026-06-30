# 可访问性指南

BrutxUI 内置了完善的可访问性支持。本指南介绍如何正确使用 ARIA 属性和键盘导航，确保所有用户都能顺畅使用你的应用。

## 1. ARIA 属性使用

### 1.1 语义化标签优先

BrutxUI 组件基于 reka-ui 构建，已内置正确的 ARIA 属性。使用时无需手动添加：

```vue
<template>
  <!-- Dialog 自动设置 role="dialog" 和 aria-modal -->
  <Dialog>
    <DialogTrigger as-child>
      <Button>打开对话框</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>确认操作</DialogTitle>
        <DialogDescription>此操作不可撤销，请确认。</DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>

  <!-- AlertDialog 自动设置 role="alertdialog" -->
  <AlertDialog>
    <AlertDialogTrigger as-child>
      <Button variant="danger">删除</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认删除</AlertDialogTitle>
        <AlertDialogDescription>
          删除后数据将无法恢复，是否继续？
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction>确认删除</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
```

### 1.2 表单标签关联

```vue
<template>
  <!-- 使用 Label 组件关联表单控件 -->
  <div class="space-y-2">
    <Label for="username">用户名</Label>
    <Input id="username" v-model="username" placeholder="请输入用户名" />
    <p class="text-sm text-brutal-muted-foreground">
      用于登录和显示的唯一标识
    </p>
  </div>

  <!-- FormField 自动处理标签关联 -->
  <FormField name="email" v-slot="{ field }">
    <FormItem>
      <FormLabel>邮箱地址</FormLabel>
      <FormControl>
        <Input v-bind="field" type="email" placeholder="your@email.com" />
      </FormControl>
      <FormDescription>用于接收通知和找回密码</FormDescription>
      <FormMessage />
    </FormItem>
  </FormField>
</template>
```

### 1.3 状态通知

```vue
<template>
  <!-- 使用 aria-live 通知动态内容变化 -->
  <div aria-live="polite" aria-atomic="true">
    <Alert v-if="showSuccess" variant="success">
      <AlertTitle>操作成功</AlertTitle>
      <AlertDescription>数据已保存</AlertDescription>
    </Alert>
  </div>

  <!-- 加载状态 -->
  <Button :disabled="isLoading">
    <Spinner v-if="isLoading" class="mr-2" aria-hidden="true" />
    <span>{{ isLoading ? '提交中...' : '提交' }}</span>
  </Button>
</template>
```

### 1.4 图标按钮的标签

```vue
<template>
  <!-- 图标按钮必须提供 aria-label -->
  <Button variant="ghost" size="icon" aria-label="关闭">
    <IconClose class="h-4 w-4" />
  </Button>

  <Button variant="outline" size="icon" aria-label="搜索">
    <IconSearch class="h-4 w-4" />
  </Button>

  <!-- 带文本的按钮无需额外标签 -->
  <Button>
    <IconPlus class="h-4 w-4" />
    添加项目
  </Button>
</template>
```

## 2. 键盘导航

### 2.1 内置键盘支持

BrutxUI 组件已内置完整的键盘导航：

| 组件 | 按键 | 行为 |
|------|------|------|
| Button | Enter / Space | 触发点击 |
| Dialog | Escape | 关闭对话框 |
| Select | Arrow Up/Down | 切换选项 |
| Select | Enter | 确认选择 |
| Tabs | Arrow Left/Right | 切换标签 |
| Accordion | Arrow Up/Down | 切换面板 |
| Combobox | Arrow Up/Down | 导航选项 |
| Combobox | Enter | 选择选项 |
| DropdownMenu | Arrow Up/Down | 导航菜单项 |
| Command | Arrow Up/Down | 导航命令 |

### 2.2 焦点管理

```vue
<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Input } from 'brutx-ui-vue'

const inputRef = ref<InstanceType<typeof Input>>()
const dialogOpen = ref(false)

async function handleDialogClose() {
  dialogOpen.value = false
  // 对话框关闭后恢复焦点
  await nextTick()
  inputRef.value?.focus()
}
</script>

<template>
  <Input ref="inputRef" v-model="searchQuery" placeholder="搜索..." />
  
  <Dialog v-model:open="dialogOpen">
    <DialogTrigger as-child>
      <Button>打开</Button>
    </DialogTrigger>
    <DialogContent @close="handleDialogClose">
      <!-- 内容 -->
    </DialogContent>
  </Dialog>
</template>
```

### 2.3 自定义键盘快捷键

```vue
<script setup lang="ts">
import { useEventListener } from 'brutx-ui-vue'

// 全局快捷键
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  // Ctrl+K 打开命令面板
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    commandOpen.value = true
  }
  
  // Escape 关闭弹窗
  if (event.key === 'Escape') {
    closeAllModals()
  }
})
</script>

<template>
  <!-- 显示快捷键提示 -->
  <Button variant="outline" @click="openSearch">
    <IconSearch class="h-4 w-4" />
    搜索
    <Kbd class="ml-2">Ctrl</Kbd>
    <Kbd>K</Kbd>
  </Button>
</template>
```

## 3. 屏幕阅读器支持

### 3.1 提供替代文本

```vue
<template>
  <!-- Avatar 提供替代文本 -->
  <Avatar>
    <AvatarImage src="/avatar.jpg" alt="用户头像" />
    <AvatarFallback>张三</AvatarFallback>
  </Avatar>

  <!-- 图标提供 aria-hidden -->
  <div class="flex items-center gap-2">
    <IconStar class="h-4 w-4 text-brutal-warning" aria-hidden="true" />
    <span>收藏</span>
  </div>

  <!-- 装饰性元素隐藏 -->
  <div aria-hidden="true">
    <NoiseBackground />
  </div>
</template>
```

### 3.2 状态描述

```vue
<template>
  <!-- 开关状态 -->
  <div class="flex items-center gap-2">
    <Switch
      v-model:checked="notifications"
      aria-label="接收通知"
    />
    <span>{{ notifications ? '已开启' : '已关闭' }}</span>
  </div>

  <!-- 进度描述 -->
  <div>
    <Progress :value="75" aria-label="上传进度" />
    <span class="sr-only">上传进度：75%</span>
    <span aria-hidden="true">75%</span>
  </div>

  <!-- 加载状态 -->
  <Button disabled aria-busy="true">
    <Spinner class="mr-2" aria-hidden="true" />
    加载中...
  </Button>
</template>
```

### 3.3 列表和导航

```vue
<template>
  <!-- 面包屑导航 -->
  <Breadcrumb aria-label="导航路径">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">首页</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="/products">产品</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>详情</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>

  <!-- 标签页导航 -->
  <Tabs default-value="tab1" aria-label="设置选项">
    <TabsList aria-label="设置分类">
      <TabsTrigger value="tab1">基本设置</TabsTrigger>
      <TabsTrigger value="tab2">高级设置</TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">基本设置内容</TabsContent>
    <TabsContent value="tab2">高级设置内容</TabsContent>
  </Tabs>
</template>
```

## 4. 高对比度模式

### 4.1 使用高对比度主题

BrutxUI 内置高对比度主题，自动响应系统设置：

```vue
<script setup lang="ts">
import { useTheme } from 'brutx-ui-vue'

const { theme, setTheme } = useTheme()
</script>

<template>
  <!-- 主题切换 -->
  <Select v-model="theme" @update:model-value="setTheme">
    <SelectTrigger>
      <SelectValue placeholder="选择主题" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="default">默认</SelectItem>
      <SelectItem value="dark">深色</SelectItem>
      <SelectItem value="high-contrast">高对比度</SelectItem>
    </SelectContent>
  </Select>
</template>
```

### 4.2 响应系统偏好

```vue
<script setup lang="ts">
import { useReducedMotion } from 'brutx-ui-vue'

// 检测用户是否偏好减少动画
const prefersReducedMotion = useReducedMotion()
</script>

<template>
  <div :class="{ 'motion-safe:animate-bounce': !prefersReducedMotion }">
    <!-- 根据用户偏好控制动画 -->
  </div>
</template>
```

### 4.3 自定义高对比度样式

```css
/* 自定义高对比度变量 */
@media (prefers-contrast: high) {
  :root {
    --brutal-border-width: 4px;
    --brutal-border-color: #000000;
    --brutal-shadow-offset-x: 6px;
    --brutal-shadow-offset-y: 6px;
    --brutal-bg: #ffffff;
    --brutal-fg: #000000;
    --brutal-primary: #0000cc;
    --brutal-primary-foreground: #ffffff;
  }
}
```

## 5. 可访问性检查清单

### 5.1 组件使用

- [ ] 所有交互元素可通过键盘访问
- [ ] 图标按钮提供 `aria-label`
- [ ] 表单控件关联 `<Label>`
- [ ] 对话框使用 `DialogTitle` 和 `DialogDescription`
- [ ] 动态内容使用 `aria-live` 通知
- [ ] 加载状态使用 `aria-busy`

### 5.2 视觉设计

- [ ] 文本与背景对比度符合 WCAG AA 标准（4.5:1）
- [ ] 焦点指示器清晰可见
- [ ] 不仅依赖颜色传达信息
- [ ] 支持高对比度模式
- [ ] 支持用户偏好减少动画

### 5.3 内容结构

- [ ] 页面标题使用正确的标题层级
- [ ] 列表使用语义化标签（`<ul>`, `<ol>`）
- [ ] 导航使用 `<nav>` 标签
- [ ] 主要内容区域使用 `<main>` 标签
- [ ] 提供跳过导航链接

```vue
<template>
  <div>
    <!-- 跳过导航链接 -->
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4">
      跳过导航
    </a>
    
    <nav aria-label="主导航">
      <!-- 导航内容 -->
    </nav>
    
    <main id="main-content">
      <!-- 主要内容 -->
    </main>
  </div>
</template>
```

## 6. 测试工具推荐

| 工具 | 用途 |
|------|------|
| axe DevTools | 浏览器扩展，检测可访问性问题 |
| Lighthouse | Chrome 内置，综合性能和可访问性评估 |
| NVDA / VoiceOver | 屏幕阅读器测试 |
| 键盘测试 | 纯键盘操作验证 |

```bash
# 使用 axe-core 进行自动化测试
npm install --save-dev @axe-core/vue

# 在测试中使用
import { mount } from '@vue/test-utils'
import axe from '@axe-core/vue'

describe('Button accessibility', () => {
  it('should have no accessibility violations', async () => {
    const wrapper = mount(Button, { slots: { default: '点击' } })
    const results = await axe(wrapper.element)
    expect(results.violations).toHaveLength(0)
  })
})
```
