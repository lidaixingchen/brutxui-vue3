# Brutx UI

面向 Vue 3 + Tailwind CSS 的新粗野主义组件注册表。将组件复制到你的代码库中，获得完全的自定义和控制权。

**[English](/packages/ui/README-en.md)**

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

## 快速开始

使用 CLI 初始化你的项目并添加组件：

```bash
# 初始化你的项目（生成 components.json 并配置路径）
npx brutx-vue@latest init

# 添加指定组件
npx brutx-vue@latest add button card badge

# 或一键添加全部组件
npx brutx-vue@latest add --all
```

## 用法

添加组件后，直接从你项目的相应文件夹（默认是 `@/components/ui`）中导入并使用它们：

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>欢迎使用 Brutx</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <Input placeholder="邮箱" />
      <Button variant="primary">开始使用</Button>
      <Button variant="outline" size="sm">
        了解更多
      </Button>
    </CardContent>
  </Card>
</template>
```

## CLI 详细命令

`brutx-vue` CLI 提供了丰富的命令来帮助你维护和操作组件：

| 命令 | 参数/选项 | 说明 |
| :--- | :--- | :--- |
| `init` | - | 在项目根目录下初始化 `components.json` 配置文件 |
| `add <components...>` | `--all`, `--overwrite`, `--yes` | 将指定组件（或全部组件）复制到项目中，使用 `--overwrite` 可覆盖已存在的本地组件 |
| `remove <components...>` | `--dry-run`, `--yes` | 安全地移除项目中的组件，并会自动检测并提示清理不再被引用的孤儿文件（如 composable / locale） |
| `list` | - | 列出所有可添加的组件，以及当前项目已安装的组件列表 |
| `info <component>` | - | 查看指定组件的详细元数据，包括描述、类型和外部/内部依赖项 |
| `diff <component>` | - | 对比本地组件和注册表中最新组件的行级代码差异 |
| `update` | `--dry-run`, `--all`, `--yes` | 一键检测并更新本地组件，使用 `--dry-run` 可只进行差异预览 |
| `doctor` | `--fix`, `--yes` | 项目健康度诊断，检测并自动修复配置、依赖、工具函数和 CSS token 等 8 类问题 |
| `create <name>` | - | 快速为本地的自定义新组件或区块生成模板骨架代码 |

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

基于 [MIT 许可证](https://opensource.org/licenses/MIT) 开源。
