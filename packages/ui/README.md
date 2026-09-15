# Brutx UI

面向 Vue 3 + Tailwind CSS 的新粗野主义组件注册表。将组件复制到你的代码库中，获得完全的自定义和控制权。

**[English](./README-en.md)**

[![npm version](https://img.shields.io/npm/v/brutx-ui-vue.svg?style=flat-square&color=FF6B6B)](https://www.npmjs.com/package/brutx-ui-vue)
[![npm downloads](https://img.shields.io/npm/dm/brutx-ui-vue.svg?style=flat-square)](https://www.npmjs.com/package/brutx-ui-vue)
[![License: MIT](https://img.shields.io/badge/License-MIT-4ECDC4.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-FFE66D.svg?style=flat-square)](https://www.typescriptlang.org/)

## 特性

- **CLI 工具**：通过 `npx brutx-vue@latest` 进行初始化、添加、更新和检测等丰富操作。
- **完全控制**：组件直接复制到你的项目目录中，拥有并可随心自定义每一个组件的所有源码。
- **粗野主义风格**：经典粗边框、硬阴影、零妥协、鲜艳色彩。
- **Tailwind 就绪令牌**：基于 CSS 自定义属性构建，原生支持 `.dark` 暗色模式。
- **现代无头原语**：基于 reka-ui 的无头原语、CVA 变体、tailwind-merge `cn()` 合并。
- **国际化与多语言**：内置轻量 `useLocale()`，支持运行时切换。
- **四大主题预设**：内置经典（Classic）、柔和（Pastel）、单色（Mono）以及温暖（Warm）四套主题预设。

## 安装与使用

### 1. npm 包安装（开箱即用）

```bash
pnpm add brutx-ui-vue
```

在全局样式或入口文件中引入聚合样式表：

```ts
import 'brutx-ui-vue/style.css'
```

在 Vue 组件中直接导入使用：

```vue
<script setup lang="ts">
import { Button, Card, CardHeader, CardTitle, CardContent } from 'brutx-ui-vue'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Hello BrutxUI</CardTitle>
    </CardHeader>
    <CardContent>
      <Button variant="primary">开始使用</Button>
    </CardContent>
  </Card>
</template>
```

### 2. CLI 源码交付模式

如果你希望完全拥有组件源码并在本地自由扩展变体，可以使用官方 CLI 工具 [`brutx-vue`](../cli)：

```bash
npx brutx-vue@latest init
npx brutx-vue@latest add button card badge
```

## 架构与分发机制

- **设计令牌与生成**：设计令牌统一定义于 `brutx-shared-vue`，样式表由生成器编译派生。
- **公开 API 契约**：所有公开导出由 `api-contract.ts` 集中管理。
- **详细架构**：请参阅 [项目架构总览](../../docs/architecture/项目架构总览.md) 与 [分发与公开 API 契约](../../docs/architecture/分发与公开API契约.md)。

## Claude Code Skill

BrutxUI 提供了 Claude Code Skill，让 AI 助手能够参考本地规范并为你自动生成新粗野主义的组件代码。

### 安装方式

将 `skills/brutxui/` 目录复制到你的全局 Claude Code 配置目录：

```bash
# Windows
xcopy /E /I skills\brutxui %USERPROFILE%\.claude\skills\brutxui

# macOS / Linux
cp -r skills/brutxui ~/.claude/skills/brutxui
```

### 使用方式

在 Claude Code 中直接提问即可：
- "用 BrutxUI 创建一个登录表单"
- "帮我做一个新粗野主义风格的定价页面"

## 说明与定制

- **暗色模式**：在 `html` 或 `body` 上切换 `.dark` 类名即可。
- **自定义视觉参数**：在项目的 CSS 中覆盖自定义属性（如 `--brutal-border-width`, `--brutal-radius`, `--brutal-shadow-offset-x` 等）。
- **内置主题类名**：`.theme-classic`（经典）· `.theme-pastel`（柔和）· `.theme-mono`（单色）· `.theme-warm`（温暖）。

## 许可证

基于 [MIT 许可证](../../LICENSE) 开源。
