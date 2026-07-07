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

在 `vite.config.ts` 中添加 Tailwind CSS 插件：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
    ],
})
```

将 Tailwind 导入添加到 `src/style.css`：

```css
@import 'tailwindcss';
```

## 第 3 步：初始化 BrutxUI

运行 init 命令来注入 CSS 自定义属性和样式：

```bash
npx brutx-vue@latest init
```

此命令将：

- 安装所需依赖（`reka-ui`、`class-variance-authority`、`clsx`、`tailwind-merge`、`@lucide/vue`）
- 将 `--brutal-*` CSS 自定义属性注入到你的样式表中
- 创建 `cn()` 工具函数
- 将 BrutxUI 样式（包括 Tailwind 工具类层）添加到你的 `style.css` 中（`main.ts` 中已有的 `import './style.css'` 会自动加载这些样式）

## 第 4 步：添加组件

只添加你需要的组件：

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

在你的 Vue 文件中导入并使用组件：

```vue
<script setup>
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
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

## 配置语言（可选）

BrutxUI 默认显示中文文本。如需切换为英文或其他语言，在 `main.ts` 中配置 `BrutxUIPlugin`：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { BrutxUIPlugin, en } from 'brutx-ui-vue'
import './style.css'

const app = createApp(App)
app.use(BrutxUIPlugin, { locale: en })
app.mount('#app')
```

更多语言配置选项请参考[国际化](/guide/locale)指南。
