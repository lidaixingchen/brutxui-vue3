# 样式定制指南

BrutxUI 提供了灵活的样式定制系统。本指南介绍如何通过 CSS 变量、主题系统和 Tailwind 扩展来自定义组件外观。

## 1. CSS 变量覆盖

### 1.1 变量体系概览

BrutxUI 使用 CSS 自定义属性（CSS 变量）构建样式系统。所有变量以 `--brutal-` 为前缀：

```css
/* 颜色系统 */
--brutal-bg                    /* 背景色 */
--brutal-fg                    /* 前景色（文字） */
--brutal-primary               /* 主色调 */
--brutal-primary-foreground    /* 主色调上的文字 */
--brutal-secondary             /* 次要色调 */
--brutal-secondary-foreground  /* 次要色调上的文字 */
--brutal-accent                /* 强调色 */
--brutal-accent-foreground     /* 强调色上的文字 */
--brutal-destructive           /* 危险/错误色 */
--brutal-destructive-foreground
--brutal-success               /* 成功色 */
--brutal-success-foreground
--brutal-info                  /* 信息色 */
--brutal-info-foreground
--brutal-muted                 /* 柔和色 */
--brutal-muted-foreground
--brutal-ring                  /* 焦点环颜色 */
--brutal-overlay               /* 遮罩层颜色 */
--brutal-placeholder           /* 占位符颜色 */

/* 边框与阴影 */
--brutal-border-width          /* 边框宽度，默认 3px */
--brutal-border-color          /* 边框颜色 */
--brutal-shadow-offset-x       /* 阴影 X 偏移 */
--brutal-shadow-offset-y       /* 阴影 Y 偏移 */
--brutal-shadow-color          /* 阴影颜色 */
--brutal-radius                /* 圆角，默认 0px */
--brutal-pressed-offset        /* 按下时偏移量 */
```

### 1.2 全局变量覆盖

```css
/* 在你的全局样式文件中覆盖变量 */
:root {
  --brutal-primary: #6366f1;
  --brutal-primary-foreground: #ffffff;
  --brutal-border-width: 2px;
  --brutal-radius: 8px;
  --brutal-shadow-offset-x: 4px;
  --brutal-shadow-offset-y: 4px;
}
```

### 1.3 局部变量覆盖

```vue
<template>
  <!-- 在特定容器内覆盖变量 -->
  <div
    class="custom-section"
    style="--brutal-primary: #10b981; --brutal-radius: 12px;"
  >
    <Button variant="primary">绿色按钮</Button>
    <Card>圆角卡片</Card>
  </div>
</template>

<style scoped>
.custom-section {
  --brutal-primary: #10b981;
  --brutal-primary-foreground: #ffffff;
  --brutal-radius: 12px;
}
</style>
```

### 1.4 深色模式变量

```css
/* 深色模式变量覆盖 */
.dark {
  --brutal-bg: #0a0a0a;
  --brutal-fg: #fafafa;
  --brutal-primary: #818cf8;
  --brutal-primary-foreground: #0a0a0a;
  --brutal-border-color: #404040;
  --brutal-shadow-color: #262626;
}
```

## 2. 主题定制

### 2.1 使用预设主题

BrutxUI 内置 4 个预设主题：

```vue
<script setup lang="ts">
import { useTheme } from 'brutx-ui-vue'

const { theme, setTheme } = useTheme()
</script>

<template>
  <div :class="theme">
    <!-- 主题切换 -->
    <Select v-model="theme" @update:model-value="setTheme">
      <SelectTrigger class="w-[180px]">
        <SelectValue placeholder="选择主题" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">默认主题</SelectItem>
        <SelectItem value="dark">深色主题</SelectItem>
        <SelectItem value="high-contrast">高对比度</SelectItem>
        <SelectItem value="minimal">极简主题</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
```

### 2.2 创建自定义主题

```typescript
// themes/custom.ts
import { createCustomTheme, type ThemeVariables } from 'brutx-ui-vue'

export const customTheme = createCustomTheme('default', {
  primary: '#8b5cf6',
  'primary-foreground': '#ffffff',
  accent: '#f59e0b',
  'accent-foreground': '#000000',
  'border-width': '2px',
  radius: '8px',
  'shadow-offset-x': '3px',
  'shadow-offset-y': '3px',
})
```

### 2.3 CSS 类主题

```css
/* 定义自定义主题类 */
.theme-corporate {
  --brutal-bg: #f8fafc;
  --brutal-fg: #1e293b;
  --brutal-primary: #0f172a;
  --brutal-primary-foreground: #f8fafc;
  --brutal-secondary: #475569;
  --brutal-secondary-foreground: #f8fafc;
  --brutal-border-color: #cbd5e1;
  --brutal-border-width: 1px;
  --brutal-radius: 6px;
  --brutal-shadow-offset-x: 2px;
  --brutal-shadow-offset-y: 2px;
  --brutal-shadow-color: #94a3b8;
}

.theme-vibrant {
  --brutal-bg: #fef3c7;
  --brutal-fg: #78350f;
  --brutal-primary: #f43f5e;
  --brutal-primary-foreground: #ffffff;
  --brutal-accent: #8b5cf6;
  --brutal-accent-foreground: #ffffff;
  --brutal-border-color: #fbbf24;
  --brutal-border-width: 4px;
  --brutal-radius: 0px;
  --brutal-shadow-offset-x: 6px;
  --brutal-shadow-offset-y: 6px;
  --brutal-shadow-color: #f43f5e;
}
```

### 2.4 运行时主题切换

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const themes = [
  { name: '默认', value: 'default' },
  { name: '企业', value: 'theme-corporate' },
  { name: '活力', value: 'theme-vibrant' },
]

const currentTheme = ref('default')

watch(currentTheme, (newTheme) => {
  document.documentElement.className = newTheme
})
</script>

<template>
  <div class="flex gap-2">
    <Button
      v-for="t in themes"
      :key="t.value"
      :variant="currentTheme === t.value ? 'primary' : 'outline'"
      @click="currentTheme = t.value"
    >
      {{ t.name }}
    </Button>
  </div>
</template>
```

## 3. Tailwind 扩展

### 3.1 使用内置工具类

BrutxUI 扩展了 Tailwind，提供了专用工具类：

```vue
<template>
  <!-- 边框 -->
  <div class="border-3 border-brutal">3px 粗野边框</div>
  
  <!-- 阴影 -->
  <div class="shadow-brutal">粗野阴影</div>
  
  <!-- 颜色 -->
  <div class="bg-brutal-primary text-brutal-primary-foreground">
    主色调背景
  </div>
  
  <!-- 组合使用 -->
  <div class="border-3 border-brutal shadow-brutal bg-brutal-bg text-brutal-fg">
    完整粗野风格
  </div>
</template>
```

### 3.2 自定义 Tailwind 配置

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/brutx-ui-vue/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a5f',
        },
      },
      borderWidth: {
        '4': '4px',
        '5': '5px',
      },
      boxShadow: {
        'brutal-lg': '8px 8px 0px 0px var(--brutal-shadow-color)',
        'brutal-xl': '12px 12px 0px 0px var(--brutal-shadow-color)',
      },
    },
  },
} satisfies Config
```

### 3.3 使用 cn() 合并类名

```vue
<script setup lang="ts">
import { cn } from 'brutx-ui-vue'

interface Props {
  variant?: 'default' | 'highlighted'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const classes = cn(
  'px-4 py-2 border-3 border-brutal',
  props.variant === 'highlighted' && 'bg-brutal-primary text-brutal-primary-foreground shadow-brutal',
  props.class
)
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
```

### 3.4 条件样式

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { cn } from 'brutx-ui-vue'

interface Props {
  isActive?: boolean
  isError?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  isError: false,
  size: 'md',
})

const classes = computed(() => cn(
  'border-3 border-brutal transition-all',
  {
    'bg-brutal-bg': !props.isActive && !props.isError,
    'bg-brutal-primary text-brutal-primary-foreground': props.isActive,
    'bg-brutal-destructive text-brutal-destructive-foreground': props.isError,
    'text-sm px-2 py-1': props.size === 'sm',
    'text-base px-4 py-2': props.size === 'md',
    'text-lg px-6 py-3': props.size === 'lg',
  }
))
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
```

## 4. 自定义样式

### 4.1 组件级样式覆盖

```vue
<template>
  <!-- 通过 class prop 覆盖 -->
  <Button
    variant="primary"
    class="w-full text-lg font-bold tracking-wider uppercase"
  >
    自定义按钮
  </Button>
  
  <!-- 通过 style prop 覆盖 -->
  <Card class="border-4 border-dashed border-brutal-primary">
    <CardContent class="p-8">
      自定义卡片样式
    </CardContent>
  </Card>
</template>
```

### 4.2 深度选择器

```vue
<style scoped>
/* 覆盖子组件样式 */
:deep(.brutal-button) {
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

:deep(.brutal-input) {
  font-family: 'Courier New', monospace;
}
</style>
```

### 4.3 创建可复用样式类

```css
/* styles/custom-components.css */

/* 自定义卡片变体 */
.card-featured {
  @apply border-4 border-brutal-primary shadow-brutal-lg;
  background: linear-gradient(135deg, var(--brutal-bg) 0%, var(--brutal-primary) 100%);
}

.card-minimal {
  @apply border border-brutal-border;
  box-shadow: none;
}

/* 自定义按钮变体 */
.btn-glow {
  @apply border-3 border-brutal shadow-brutal;
  transition: all 0.3s ease;
}

.btn-glow:hover {
  box-shadow: 0 0 20px var(--brutal-primary), var(--brutal-shadow-offset-x) var(--brutal-shadow-offset-y) 0 0 var(--brutal-shadow-color);
}

/* 自定义输入框 */
.input-dashed {
  @apply border-2 border-dashed border-brutal-border;
  border-radius: var(--brutal-radius);
}

.input-dashed:focus {
  @apply border-solid border-brutal-primary;
  outline: 2px solid var(--brutal-ring);
}
```

### 4.4 响应式样式

```vue
<template>
  <!-- 响应式布局 -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <Card v-for="item in items" :key="item.id">
      <CardContent class="p-4 md:p-6">
        {{ item.name }}
      </CardContent>
    </Card>
  </div>
  
  <!-- 响应式可见性 -->
  <Button class="hidden md:inline-flex">
    桌面端按钮
  </Button>
  <Button class="md:hidden" size="icon">
    <IconMenu />
  </Button>
</template>
```

## 5. 样式架构建议

### 5.1 项目结构

```
src/
├── assets/
│   └── styles/
│       ├── main.css           # 主入口
│       ├── variables.css      # CSS 变量定义
│       ├── themes/
│       │   ├── default.css    # 默认主题
│       │   ├── dark.css       # 深色主题
│       │   └── custom.css     # 自定义主题
│       └── utilities/
│           ├── buttons.css    # 按钮工具类
│           └── cards.css      # 卡片工具类
├── components/
│   └── ...
└── App.vue
```

### 5.2 变量优先级

```css
/* 优先级从低到高 */
:root {
  --brutal-primary: #6366f1;  /* 全局默认 */
}

.theme-custom {
  --brutal-primary: #8b5cf6;  /* 主题覆盖 */
}

.section-special {
  --brutal-primary: #10b981;  /* 局部覆盖 */
}
```

### 5.3 性能优化

```css
/* 避免在组件中重复定义变量 */
:root {
  /* 将常用变量集中在根级别定义 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}

/* 使用 CSS 简写属性 */
.badge {
  /* 推荐 */
  border: var(--brutal-border-width) solid var(--brutal-border-color);
  
  /* 避免 */
  border-width: var(--brutal-border-width);
  border-style: solid;
  border-color: var(--brutal-border-color);
}
```

## 6. 常见问题

### Q: 如何让按钮有圆角？

```css
/* 全局设置圆角 */
:root {
  --brutal-radius: 8px;
}

/* 或仅对特定组件设置 */
.my-button {
  --brutal-radius: 8px;
}
```

### Q: 如何移除阴影？

```css
.no-shadow {
  --brutal-shadow-offset-x: 0px;
  --brutal-shadow-offset-y: 0px;
}
```

### Q: 如何使用自定义字体？

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');

:root {
  font-family: 'Space Grotesk', sans-serif;
}
```

### Q: 如何创建渐变背景？

```vue
<template>
  <div class="bg-gradient-to-br from-brutal-primary to-brutal-accent p-8">
    <Card class="bg-brutal-bg/90 backdrop-blur-sm">
      <CardContent>渐变背景上的卡片</CardContent>
    </Card>
  </div>
</template>
```
