---
title: 最佳实践
description: BrutxUI 使用建议与设计模式。
---

# 最佳实践

本文档提供 BrutxUI 的使用建议，帮助你构建高质量的 Neo-Brutalism 应用。

---

## Blocks vs Components

### 何时使用 Components

Components 是单一功能的 UI 原语，适合：

- 按钮、输入框、卡片等独立元素
- 需要高度自定义的场景
- 构建自己的业务组件

```vue
<template>
  <Button variant="primary" @click="handleClick">
    提交
  </Button>
</template>
```

### 何时使用 Blocks

Blocks 是由多个 Components 组合而成的业务片段，适合：

- 快速搭建页面
- 常见的 UI 模式（定价卡片、登录表单、仪表盘）
- 减少重复代码

```vue
<template>
  <!-- 直接使用预设的定价卡片 Block -->
  <SaaSPricing :plans="plans" />
</template>
```

**选择建议**：

| 场景 | 推荐 |
|------|------|
| 需要完全自定义样式 | Components |
| 快速搭建原型 | Blocks |
| 学习组件用法 | 参考 Blocks 源码 |
| 构建可复用的业务组件 | Components + 组合 |

---

## 样式管理

### 优先使用 CSS 变量

```css
/* ✅ 推荐：使用 CSS 变量 */
.my-component {
  background: var(--brutal-primary);
  border: var(--brutal-border-width) solid var(--brutal-fg);
}

/* ❌ 避免：硬编码值 */
.my-component {
  background: #ff6b6b;
  border: 3px solid #222;
}
```

### 使用 `cn()` 组合类名

根据组件开发指南，始终使用 `computed()` 进行动态类合并，切勿在模板中直接调用 `cn()`：

```ts
import { computed } from 'vue'
import { cn } from 'brutx-ui-vue'
import { buttonVariants } from './button-variants'

// ✅ 在 computed 中使用 cn()
const classes = computed(() => cn(
  buttonVariants({ variant: 'primary', size: 'md' }),
  props.class
))

// ❌ 避免在模板中调用 cn()
// <div :class="cn(base, props.class)">
```

---

## TypeScript 最佳实践

### 使用泛型约束 Props

```ts
interface Props<T> {
  items: T[]
  keyExtractor: (item: T) => string
  renderItem: (item: T) => VNode
}

const props = defineProps<Props<User>>()
```

### 类型安全的事件处理

```ts
// ✅ 明确事件载荷类型
function handleSort(column: string, direction: 'asc' | 'desc') {
  // ...
}

// ❌ 避免 any
function handleSort(...args: any[]) {
  // ...
}
```

---

## 可访问性

### 键盘导航

确保所有交互组件支持键盘操作：

- `Tab` / `Shift+Tab`：焦点切换
- `Space` / `Enter`：激活/触发
- `Escape`：关闭/取消

### ARIA 属性

```vue
<template>
  <Button
    :aria-expanded="isOpen"
    aria-haspopup="dialog"
    @click="toggle"
  >
    打开面板
  </Button>
</template>
```

### 焦点管理

```vue
<script setup>
import { ref, nextTick } from 'vue'

const inputRef = ref()

async function openDialog() {
  isOpen.value = true
  await nextTick()
  inputRef.value?.$el?.focus()
}
</script>
```

---

## 性能优化

### 按需导入

```ts
// ✅ 按需导入
import { Button, Card } from 'brutx-ui-vue'

// ❌ 全量导入
import * as BrutxUI from 'brutx-ui-vue'
```

### 虚拟滚动

大数据列表使用 VirtualScroll 组件：

```vue
<template>
  <VirtualScroll
    :items="largeList"
    :item-height="48"
    :buffer="5"
  >
    <template #default="{ item }">
      <div>{{ item.name }}</div>
    </template>
  </VirtualScroll>
</template>
```

### 懒加载组件

```ts
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)
```

---

## 常见陷阱

### 1. 响应式丢失

```ts
// ❌ 解构会丢失响应性
const { value } = defineProps({ value: String })

// ✅ 使用 toRefs 或直接访问 props
const props = defineProps({ value: String })
```

### 2. 事件多次绑定

```vue
<!-- ❌ 内联函数每次渲染都会创建新引用 -->
<Button @click="() => handleClick(id)">点击</Button>

<!-- ✅ 使用具名函数 -->
<Button @click="handleClick(id)">点击</Button>
```

### 3. 组件命名冲突

```vue
<!-- ❌ 使用 HTML 原生标签名 -->
<template>
  <button>自定义按钮</button>
</template>

<!-- ✅ 使用 PascalCase -->
<template>
  <BrutalButton>自定义按钮</BrutalButton>
</template>
```
