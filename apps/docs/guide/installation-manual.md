---
title: 手动安装
description: 手动安装和配置 BrutxUI 组件库
---

# 手动安装

不使用 CLI 手动设置 BrutxUI，适用于需要对安装流程、代码落位与依赖版本拥有完全掌控权的项目。

## 前提条件

- **Node.js**：使用你的 Vue/Tailwind 工具链支持的版本；如后续运行 `brutx-vue` CLI，则需要 22.0+
- **Vue** 3.5+
- **Tailwind CSS** 4.3+

## 第 1 步：安装基础依赖

安装 BrutxUI 核心运行所需的必要依赖包：

```bash
pnpm add reka-ui class-variance-authority clsx tailwind-merge @lucide/vue
```

| 包名 | 用途 |
| :--- | :--- |
| `reka-ui` | 无障碍无头交互原语（弹窗、下拉、菜单等底层状态） |
| `class-variance-authority` | CVA 多变体组件样式声明引擎 |
| `clsx` | 条件类名拼接 |
| `tailwind-merge` | 智能合并 Tailwind 工具类避免冲突 |
| `@lucide/vue` | 官方图标库 |

### 可选组件依赖（按需安装）

如果使用特定高级组件，请按需安装对应依赖：

```bash
# 表单验证组件（Form）
pnpm add vee-validate @vee-validate/zod zod

# 日历组件（Calendar、YearPicker）
pnpm add v-calendar

# 虚拟滚动与大数据表格（VirtualScroll、DataTable）
pnpm add @tanstack/vue-virtual

# 走马灯轮播（Carousel）
pnpm add embla-carousel-vue

# 代码高亮块（CodeBlock）
pnpm add prismjs @types/prismjs
```

## 第 2 步：创建 cn() 工具函数与焦点常量

创建 `src/lib/utils.ts`。由于 BrutxUI 包含专属的粗野主义调色板与语义 Z-Index 标尺，必须通过 `extendTailwindMerge` 注册扩展，以确保颜色类名（如 `bg-brutal-primary` 与 `bg-red-500`）在冲突时能正确相互覆盖：

```ts
import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const BRUTAL_COLOR_NAMES = [
    'brutal-accent',
    'brutal-accent-foreground',
    'brutal-accent-subtle',
    'brutal-bg',
    'brutal-black',
    'brutal-destructive',
    'brutal-destructive-foreground',
    'brutal-destructive-subtle',
    'brutal-fg',
    'brutal-info',
    'brutal-info-foreground',
    'brutal-info-subtle',
    'brutal-muted',
    'brutal-muted-foreground',
    'brutal-overlay',
    'brutal-overlay-subtle',
    'brutal-placeholder',
    'brutal-primary',
    'brutal-primary-foreground',
    'brutal-primary-subtle',
    'brutal-ring',
    'brutal-secondary',
    'brutal-secondary-foreground',
    'brutal-secondary-subtle',
    'brutal-status-error',
    'brutal-status-error-foreground',
    'brutal-status-info',
    'brutal-status-info-foreground',
    'brutal-status-success',
    'brutal-status-success-foreground',
    'brutal-status-warning',
    'brutal-status-warning-foreground',
    'brutal-success',
    'brutal-success-foreground',
    'brutal-success-subtle',
    'brutal-yellow',
] as const

const BRUTAL_Z_INDEX_NAMES = [
    'dialog',
    'dropdown',
    'header',
    'loading',
    'modal',
    'notification',
    'popover',
    'sticky',
    'toast',
    'tooltip',
] as const

const customTwMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            'bg-color': [{ bg: [...BRUTAL_COLOR_NAMES] }],
            'text-color': [{ text: [...BRUTAL_COLOR_NAMES] }],
            'border-color': [{ border: [...BRUTAL_COLOR_NAMES] }],
            'ring-color': [{ ring: [...BRUTAL_COLOR_NAMES] }],
            z: [{ z: [...BRUTAL_Z_INDEX_NAMES] }],
        },
    },
})

export function cn(...inputs: ClassValue[]): string {
    return customTwMerge(clsx(inputs))
}

/**
 * 全局粗野主义键盘导航通用高亮环
 */
export const FOCUS_RING_CLASSES =
    'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-brutal-ring focus-visible:ring-offset-0'
```

## 第 3 步：配置 Tailwind CSS 4

安装 Tailwind CSS 4.x 与 Vite 插件：

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

在 `vite.config.ts` 中注册插件：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
```

## 第 4 步：注入 Tailwind v4 @theme 与设计令牌

Tailwind CSS v4 废弃了传统的 JavaScript 配置文件。**必须在 CSS 中使用 `@theme` 指令注册令牌**，Tailwind 编译器才能正常派生生成 `bg-brutal-primary`、`text-brutal-fg` 等工具类。

在你的主 CSS 文件（例如 `src/style.css`）中加入以下内容：

```css
@import 'tailwindcss';

@theme {
    /* 动态色彩映射：由运行时 CSS 变量驱动以支持暗黑模式和预设主题 */
    --color-brutal-bg: var(--brutal-bg, #ffffff);
    --color-brutal-fg: var(--brutal-fg, #000000);
    --color-brutal-primary: var(--brutal-primary, #FF6B6B);
    --color-brutal-primary-foreground: var(--brutal-primary-foreground, #000000);
    --color-brutal-secondary: var(--brutal-secondary, #4ECDC4);
    --color-brutal-secondary-foreground: var(--brutal-secondary-foreground, #000000);
    --color-brutal-accent: var(--brutal-accent, #FFE66D);
    --color-brutal-accent-foreground: var(--brutal-accent-foreground, #000000);
    --color-brutal-destructive: var(--brutal-destructive, #EF476F);
    --color-brutal-destructive-foreground: var(--brutal-destructive-foreground, #000000);
    --color-brutal-success: var(--brutal-success, #7FB069);
    --color-brutal-success-foreground: var(--brutal-success-foreground, #000000);
    --color-brutal-muted: var(--brutal-muted, #f3f4f6);
    --color-brutal-muted-foreground: var(--brutal-muted-foreground, #4B5563);
    --color-brutal-ring: var(--brutal-ring, #000000);
    --color-brutal-info: var(--brutal-info, #4A90D9);
    --color-brutal-info-foreground: var(--brutal-info-foreground, #000000);
    --color-brutal-overlay: var(--brutal-overlay, rgba(0, 0, 0, 0.5));
    --color-brutal-placeholder: var(--brutal-placeholder, #6e7788);

    /* 粗野主义硬边框与半径标尺 */
    --border-width-3: var(--brutal-border-width, 3px);
    --radius-brutal: var(--brutal-radius, 0px);

    /* 粗野主义实体投影 */
    --shadow-brutal: var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-shadow-color, #000000);
    --shadow-brutal-sm: calc(var(--brutal-shadow-offset-x, 4px) / 2) calc(var(--brutal-shadow-offset-y, 4px) / 2) 0px 0px var(--brutal-shadow-color, #000000);
    --shadow-brutal-lg: calc(var(--brutal-shadow-offset-x, 4px) * 1.5) calc(var(--brutal-shadow-offset-y, 4px) * 1.5) 0px 0px var(--brutal-shadow-color, #000000);
    --shadow-brutal-xl: calc(var(--brutal-shadow-offset-x, 4px) * 2) calc(var(--brutal-shadow-offset-y, 4px) * 2) 0px 0px var(--brutal-shadow-color, #000000);
    --shadow-brutal-primary: var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-primary, #FF6B6B);
    --shadow-brutal-secondary: var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-secondary, #4ECDC4);
}

@layer base {
    :root {
        --brutal-border-width: 3px;
        --brutal-border-color: #000000;
        --brutal-shadow-offset-x: 4px;
        --brutal-shadow-offset-y: 4px;
        --brutal-shadow-color: #000000;
        --brutal-radius: 0px;
        --brutal-bg: #ffffff;
        --brutal-fg: #000000;
        --brutal-primary: #FF6B6B;
        --brutal-primary-foreground: #000000;
        --brutal-secondary: #4ECDC4;
        --brutal-secondary-foreground: #000000;
        --brutal-accent: #FFE66D;
        --brutal-accent-foreground: #000000;
        --brutal-destructive: #EF476F;
        --brutal-destructive-foreground: #000000;
        --brutal-success: #7FB069;
        --brutal-success-foreground: #000000;
        --brutal-muted: #f3f4f6;
        --brutal-muted-foreground: #4B5563;
        --brutal-ring: #000000;
        --brutal-info: #4A90D9;
        --brutal-info-foreground: #000000;
        --brutal-overlay: rgba(0, 0, 0, 0.5);
        --brutal-placeholder: #6e7788;
    }

    .dark {
        --brutal-border-width: 3px;
        --brutal-border-color: #ffffff;
        --brutal-shadow-offset-x: 4px;
        --brutal-shadow-offset-y: 4px;
        --brutal-shadow-color: #ffffff;
        --brutal-radius: 0px;
        --brutal-bg: #141414;
        --brutal-fg: #ffffff;
        --brutal-primary: #FF6B6B;
        --brutal-primary-foreground: #000000;
        --brutal-secondary: #4ECDC4;
        --brutal-secondary-foreground: #000000;
        --brutal-accent: #FFE66D;
        --brutal-accent-foreground: #000000;
        --brutal-destructive: #EF476F;
        --brutal-destructive-foreground: #000000;
        --brutal-success: #7FB069;
        --brutal-success-foreground: #000000;
        --brutal-muted: #1e1e1e;
        --brutal-muted-foreground: #9CA3AF;
        --brutal-ring: #ffffff;
        --brutal-info: #3B82F6;
        --brutal-info-foreground: #ffffff;
        --brutal-overlay: rgba(0, 0, 0, 0.7);
        --brutal-placeholder: #767e8c;
    }
}

@layer utilities {
    .border-3 {
        border-width: var(--brutal-border-width, 3px);
    }

    .border-brutal {
        border-color: var(--brutal-border-color, #000000);
        border-style: solid;
    }

    .border-brutal-dashed {
        border-color: var(--brutal-border-color, #000000);
        border-style: dashed;
    }
}
```

## 第 5 步：引入组件文件

将所需组件目录（包含 `[ComponentName].vue`、`[name]-variants.ts` 及 `index.ts`）复制到项目的 `src/components/ui/<component-name>/` 目录下。

在页面中使用：

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
    <Button variant="primary">
        Hello BrutxUI
    </Button>
</template>
```
