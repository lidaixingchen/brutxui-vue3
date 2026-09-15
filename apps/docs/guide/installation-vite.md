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

本文示例使用 pnpm；你也可以使用 npm、yarn 或 bun。

## 安装模式选型

你可以根据项目的架构诉求选择适用的安装方式：
- **模式 A：npm 包模式（开箱即用）**：运行 `pnpm add brutx-ui-vue` 并引入样式，由包管理器统一维护版本与依赖，适合绝大多数常规业务开发。
- **模式 B：CLI 源码模式（完全掌控）**：运行 `npx brutx-vue init` 将组件源码与样式令牌下载到项目本地，适合需要深度修改变体或免除依赖锁定的团队。

---

## 模式 A：npm 包极速引入

如果你希望通过 npm 包直接使用 BrutxUI：

### 1. 安装组件库
```bash
pnpm add brutx-ui-vue
```

### 2. 导入组件与样式
<<< @/.vitepress/examples/installation-modes.ts#npm-installation{ts}

### 3. 在入口文件引入样式 (`src/main.ts`)
```ts
import { createApp } from 'vue'
import App from './App.vue'
import 'brutx-ui-vue/style.css'

createApp(App).mount('#app')
```

### 4. 直接在组件中使用
```vue
<script setup lang="ts">
import { Button } from 'brutx-ui-vue'
</script>

<template>
  <Button variant="primary">Hello BrutxUI</Button>
</template>
```

---

## 模式 B：CLI 源码引入

如果你希望将组件源码完全托管在自己的代码库中：

### 第 1 步：创建 Vite 项目与配置 Tailwind

如果还没有项目，先创建一个：

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

通过本地路径导入已添加的组件：

<<< @/.vitepress/examples/installation-modes.ts#cli-installation{ts}

在你的 Vue 单文件组件中使用：

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
