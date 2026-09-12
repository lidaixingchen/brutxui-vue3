---
title: 安装（Vite）
description: 在 Vite + Vue 3 项目中安装和配置 BrutxUI
---

# 安装（Vite）

在新建或现有的 Vite + Vue 3 项目中设置 BrutxUI。

## 前提条件

- **Node.js** 22.0+（运行 `brutx-vue` CLI）
- **Vue** 3.5+
- **Tailwind CSS** 4.3+

本文示例使用 pnpm；你也可以使用 npm、yarn 或 bun。`brutx-vue init` 会根据 lockfile 自动判断包管理器，也可以通过 `--package-manager` 显式指定。

## 第 1 步：创建 Vite 项目

如果你还没有项目，先创建一个：

```bash
pnpm create vite my-app --template vue-ts
cd my-app
```

## 第 2 步：安装 Tailwind CSS

安装 Tailwind CSS 4.x 和 Vite 插件：

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

在 `vite.config.ts` 中添加 Tailwind CSS 插件并配置别名：

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

将 Tailwind 导入添加到 `src/style.css`：

```css
@import 'tailwindcss';
```

## 第 3 步：初始化 BrutxUI

运行 init 命令来生成配置并注入粗野主义设计令牌：

```bash
npx brutx-vue@latest init
```

此命令将：

- 自动检测项目框架与 Tailwind 版本；
- 安装基础依赖（`reka-ui`、`class-variance-authority`、`clsx`、`tailwind-merge`、`@lucide/vue`）；
- 在 `src/lib/utils.ts` 中生成带粗野主义色彩扩展的 `cn()` 工具函数；
- 生成 `components.json` 契约文件；
- 将 `--brutal-*` CSS 自定义属性与 `@theme` 工具类注入到你的样式表中（支持交互式选择拆分到独立的 `brutx-tokens.css`）。

## 第 4 步：添加组件

按需添加所需组件：

```bash
npx brutx-vue@latest add button
npx brutx-vue@latest add card dialog
npx brutx-vue@latest add input label checkbox
```

或者一次性添加所有组件：

```bash
npx brutx-vue@latest add --all
```

## 第 5 步：使用组件

在你的 Vue 文件中导入并使用已添加的组件：

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/ui/card'
</script>

<template>
    <Card variant="default">
        <CardHeader>
            <CardTitle>Hello BrutxUI</CardTitle>
        </CardHeader>
        <CardContent>
            <Button variant="primary" size="default">
                Get Started
            </Button>
        </CardContent>
    </Card>
</template>
```

> [!TIP]
> 也可以通过子文件直接导入：  
> `import Button from '@/components/ui/button/Button.vue'`

## 配置语言（可选）

BrutxUI 默认展示中文文本。如果项目需要切换为英文或其他语言：

- **方案 A（安装依赖包）**：安装 `pnpm add brutx-ui-vue`，在 `main.ts` 中直接使用 `BrutxUIPlugin`：
  ```ts
  import { createApp } from 'vue'
  import App from './App.vue'
  import { BrutxUIPlugin, en } from 'brutx-ui-vue'
  import './style.css'

  const app = createApp(App)
  app.use(BrutxUIPlugin, { locale: en })
  app.mount('#app')
  ```
- **方案 B（源码模式全局注入）**：在 `App.vue` 顶层使用 `provideLocale` 注入语言包。

更多多语言配置选项请参考[国际化](/guide/locale)指南。
