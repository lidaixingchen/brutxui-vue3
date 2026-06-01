# BrutxUI（完整上下文）

BrutxUI 是一个高保真 Neo-Brutalist Vue 3 和 Tailwind CSS 组件库。它将粗犷的黑色漫画风边框、偏移阴影和饱和高亮直接映射为无障碍的 Vue 3 组件。

---

## 完整设计令牌与工具类

BrutxUI 暴露可动态自定义的 CSS 自定义属性。整个系统围绕以下核心令牌构建：

```css
:root {
  /* 尺寸边框 */
  --brutal-border-width: 3px;
  --brutal-border-color: #000000;

  /* 阴影 */
  --brutal-shadow-offset-x: 4px;
  --brutal-shadow-offset-y: 4px;
  --brutal-shadow-color: #000000;

  /* 圆角 */
  --brutal-radius: 0px;

  /* 按压位移深度 */
  --brutal-pressed-offset: 2px;

  /* 颜色 */
  --brutal-primary: #FF6B6B;     /* 珊瑚红 */
  --brutal-secondary: #4ECDC4;   /* 薄荷青 */
  --brutal-accent: #FFE66D;      /* 霓虹黄 */
  --brutal-destructive: #EF476F; /* 危险红 */
  --brutal-success: #7FB069;     /* 饱和绿 */
  --brutal-ring: #000000;        /* 焦点指示器 */
}

.dark {
  --brutal-border-color: #ffffff;
  --brutal-shadow-color: #ffffff;
  --brutal-bg: #141414;
  --brutal-fg: #ffffff;
  --brutal-ring: #ffffff;
}
```

---

## 架构蓝图：CVA 变体配置

每个 BrutxUI 组件都利用 `class-variance-authority`（cva）来干净地声明变体，通过 `cn` 合并用户自定义类。

### Button 组件蓝图：
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-black ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
  {
    variants: {
      variant: {
        default: 'bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal hover:bg-brutal-muted',
        primary: 'bg-brutal-primary text-white border-3 border-brutal shadow-brutal hover:bg-brutal-primary/90',
        secondary: 'bg-brutal-secondary text-black border-3 border-brutal shadow-brutal hover:bg-brutal-secondary/90',
        accent: 'bg-brutal-accent text-black border-3 border-brutal shadow-brutal hover:bg-brutal-accent/90',
        outline: 'bg-transparent text-brutal-fg border-3 border-brutal hover:bg-brutal-muted',
        ghost: 'hover:bg-brutal-muted text-brutal-fg border-3 border-transparent',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-3 py-1',
        lg: 'h-14 px-8 py-3',
        xl: 'h-16 px-10 py-4',
        icon: 'h-11 w-11 p-0',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

interface Props {
  variant?: NonNullable<ButtonVariants['variant']>
  size?: NonNullable<ButtonVariants['size']>
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
})

const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)
)
</script>

<template>
  <button :class="classes">
    <slot />
  </button>
</template>
```

---

## 单体仓库目录与代码位置

- **文档网站：** `/apps/docs/`（VitePress）
- **核心包：** `/packages/ui/`
  - 组件文件位于：`/packages/ui/src/components/`
  - 组合式函数位于：`/packages/ui/src/composables/`
  - 工作区导出映射：`/packages/ui/package.json`
- **注册表构建器：** `/packages/registry/`
  - 组件模式配置：`/packages/registry/registry/`
- **CLI 工具：** `/packages/cli/`
  - CLI 操作：`/packages/cli/src/commands/`
  - 测试套件覆盖：`/packages/cli/tests/`

---

## 反模式（禁止）

在为 BrutxUI 编写代码时：
1. **禁止软阴影：** 不要使用 Tailwind 默认的 `shadow-md` 或 `shadow-lg`。使用 `shadow-brutal` 或 `shadow-brutal-lg`。
2. **禁止圆角边框：** 不要将 `rounded-md` 或 `rounded-lg` 用作默认变体，除非通过主题自定义样式类明确柔化。使用 `rounded-none` 或 `rounded-brutal`。
3. **禁止暗淡边框：** 不要将 `border-slate-100` 或 `border-slate-200` 等浅色边框用于主边框。边框必须保持粗重（`border-3 border-brutal`）。
4. **禁止缺少按压反馈：** 交互式按钮必须在点击时产生位移。不要让激活状态感觉迟钝或无生气。
5. **禁止路径穿越：** 在编译或编辑 CLI 依赖时，绝不允许相对路径遍历（`..`）逃逸安全工作区。请规范化并检查路径。
6. **禁止字符串拼接类名：** 始终使用 `cn()` 合并类。切勿拼接类字符串。
7. **禁止在模板中调用 cn()：** 始终使用 `computed()` 进行动态类合并。切勿在模板表达式中直接调用 `cn()`。
