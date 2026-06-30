---
title: 常见问题
description: BrutxUI 使用过程中常见问题及解答。
---

# 常见问题

## 安装与配置

### 安装后样式不生效？

确保在项目入口文件中引入了 BrutxUI 的样式文件：

```ts
// main.ts
import 'brutx-ui-vue/dist/style.css'
```

如果使用 CLI 安装（`npx brutx-vue add`），样式会自动配置。

### 与 Tailwind CSS 冲突？

BrutxUI 基于 Tailwind CSS 构建，需确保项目中 Tailwind 版本为 4.3+。BrutxUI 使用 CSS 自定义属性（设计令牌）系统，通过 `--brutal-*` 前缀的变量控制样式，与 Tailwind 的配置互不干扰。

---

## 组件使用

### 如何自定义主题？

通过覆盖 CSS 变量实现主题定制：

```css
:root {
  --brutal-primary: #ff6b6b;
  --brutal-secondary: #4ecdc4;
  --brutal-border-width: 3px;
  --brutal-shadow-offset-x: 4px;
  --brutal-shadow-offset-y: 4px;
}
```

详见 [主题定制指南](/guide/theme)。

### 组件支持哪些主题预设？

BrutxUI 内置四套主题预设：

| 预设 | 说明 |
|------|------|
| Classic | 默认主题，鲜艳色彩对比 |
| Pastel | 柔和粉彩风格 |
| Mono | 黑白灰单色风格 |
| Warm | 温暖色调风格 |

使用方式：

```vue
<template>
  <div class="theme-pastel">
    <Button>柔和风格按钮</Button>
  </div>
</template>
```

### 组件支持国际化吗？

支持。使用 `useLocale` 组合式函数和 `provideLocale` 切换语言：

```ts
import { provideLocale, enUS } from 'brutx-ui-vue'

// 在根组件中提供英文语言包
provideLocale(enUS)
```

在组件中获取当前语言：

```ts
import { useLocale } from 'brutx-ui-vue'

const { locale, t } = useLocale()
// t('button.submit') 获取本地化文本
```

---

## CLI 工具

### `npx brutx-vue add` 报错？

确保在项目根目录下执行，且项目已初始化（`components.json` 存在）。如果未初始化，先运行：

```bash
npx brutx-vue init
```

如果网络问题导致下载失败，可尝试使用自定义注册表：

```bash
npx brutx-vue add button -r https://your-registry-url
```

---

## 构建与部署

### 打包体积过大？

BrutxUI 支持按需导入，确保使用具名导入而非全量导入：

```ts
// ✅ 按需导入
import { Button, Card } from 'brutx-ui-vue'

// ❌ 全量导入（不推荐）
import * as BrutxUI from 'brutx-ui-vue'
```

### SSR 渲染问题？

部分组件依赖浏览器 API（如 `window`、`document`），在 SSR 环境下需使用 `<ClientOnly>` 包裹：

```vue
<template>
  <ClientOnly>
    <Carousel :autoplay="true">
      <CarouselItem>...</CarouselItem>
    </Carousel>
  </ClientOnly>
</template>
```

---

## 其他问题

### 如何参与贡献？

请阅读 [贡献指南](/guide/contributing)。

### 在哪里报告 Bug？

在 [GitHub Issues](https://github.com/lidaixingchen/brutxui-vue3/issues) 提交问题，请包含：

1. 复现步骤
2. 期望行为与实际行为
3. 环境信息（Vue 版本、浏览器、操作系统）
4. 最小复现链接（推荐使用 StackBlitz）
