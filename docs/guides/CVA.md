# 架构蓝图：CVA 组件模式

> 本文件是 CVA 变体声明的**模式蓝图**；视觉规则（边框/阴影/圆角/按压/悬停/颜色/焦点）不在此重复定义，一律以 [VISUAL_SYSTEM.md](VISUAL_SYSTEM.md) 的 R1-R7 为**单一权威**。权威的**活范例**是真实组件 `packages/ui/src/components/button/button-variants.ts` 与 `shared-button-variants.ts`；规则或范例与真实代码冲突时，以真实代码为准并回改本文与规则。

## 模式三要素

1. **变体定义**：独立 `*-variants.ts`、与组件同目录，用 `cva()` 声明。
2. **类合并**：始终经 `cn(buttonVariants({...}), props.class)`，禁止字符串拼接（见 COMPONENT_GUIDE cn() 规则）。
3. **动态计算**：`computed(() => cn(...))`，禁止在模板调用 `cn()`（见 COMPONENT_GUIDE computed 规则）。

共享变体（variant/size 等跨组件列表）放入 `shared-*-variants.ts`，组件文件用 `...baseButtonVariants.variants` 展开后追加组件私有变体。

## 正确范例（以真实 button-variants.ts 为活范例）

```ts
import { cva } from 'class-variance-authority'
import { baseButtonVariants } from './shared-button-variants'
import { brutalPress } from '@/lib/brutal-interaction-variants'
import { FOCUS_OUTLINE_CLASSES } from '@/lib/utils'

export const buttonVariants = cva(
    [
        'inline-flex items-center justify-center gap-2',
        'border-3 border-brutal',      // R1
        'rounded-brutal',              // R3
        'font-black tracking-wide',
        'transition-all duration-150', // 过渡规则见 COMPONENT_GUIDE r13
        FOCUS_OUTLINE_CLASSES,         // R7 焦点类唯一入口
        'disabled:opacity-50 disabled:pointer-events-none',
        brutalPress,                   // R4 按压反馈（位移 + 去影）
    ],
    {
        variants: {
            ...baseButtonVariants.variants, // variant(9)/size(5) 定义于 shared-button-variants.ts
            effect: { /* 组件私有变体在此扩展 */ },
        },
        defaultVariants: { ...baseButtonVariants.defaultVariants },
    }
)
```

**base 层必须遵守**：边框 `border-3 border-brutal`（R1）、阴影 `shadow-brutal*`（R2）、圆角 `rounded-brutal`（R3）、按压 `brutalPress`（R4）、焦点 `FOCUS_OUTLINE_CLASSES`（R7）、颜色走令牌（R6）。

**前景色令牌对照**（shared-button-variants.ts 的 9 个 variant；键名 `danger` 映射 `brutal-destructive`，勿重命名）：

| variant | 前景令牌 |
| ------- | -------- |
| default / outline / ghost / link | `text-brutal-fg` |
| primary | `text-brutal-primary-foreground` |
| secondary | `text-brutal-secondary-foreground` |
| accent | `text-brutal-accent-foreground` |
| danger | `text-brutal-destructive-foreground` |
| success | `text-brutal-success-foreground` |

> 真实实现对照：`packages/ui/src/components/button/button-variants.ts`、`shared-button-variants.ts`、`packages/ui/src/lib/brutal-interaction-variants.ts`。
