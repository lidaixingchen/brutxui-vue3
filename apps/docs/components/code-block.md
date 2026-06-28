---
title: CodeBlock 代码块
description: 新粗野主义风格的代码块组件，集成 Prism 语法高亮、文件名称、语言标签以及浮动复制按钮。
---

# CodeBlock 代码块

专门用于展示格式化代码或脚本的卡片式容器。内置 Prism 语法高亮，具有高对比度的顶栏、复制动作反馈、并支持开启行号。

## 预览

<ComponentPreview>
  <CodeBlockDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="code-block" />

::: tip 依赖提示
CodeBlock 的语法高亮功能依赖 `prismjs`（可选 peer 依赖）。如果未安装，组件会自动降级为纯文本渲染。

```bash
pnpm add prismjs
```
:::

## 用法

```vue
<script setup>
import { CodeBlock } from 'brutx-ui-vue'

const codeString = `const app = createApp(App)
app.mount('#app')`
</script>

<template>
    <CodeBlock
        :code="codeString"
        language="javascript"
        filename="main.js"
        show-line-numbers
    />
</template>
```

## 折叠与展开

通过 `maxLines` 属性可以限制代码区域的最大可见行数。当代码实际行数**大于** `maxLines` 时，代码区域会被裁剪到指定行数，并在底部展示"展开"按钮；展开后按钮切换为"收起"，再次点击可恢复折叠。展开/收起按钮的文本通过 `useLocale()` 的 `t()` 国际化，默认为"展开"/"收起"。

```vue
<script setup>
import { CodeBlock } from 'brutx-ui-vue'

const longCode = `function quickSort(arr) {
    if (arr.length <= 1) return arr
    const pivot = arr[0]
    const left = arr.slice(1).filter(x => x < pivot)
    const right = arr.slice(1).filter(x => x >= pivot)
    return [...quickSort(left), pivot, ...quickSort(right)]
}

const sorted = quickSort([3, 1, 4, 1, 5, 9, 2, 6])
console.log(sorted)`
</script>

<template>
    <CodeBlock
        :code="longCode"
        language="javascript"
        filename="quicksort.js"
        :max-lines="6"
    />
</template>
```

::: tip 说明
`maxLines` 默认为 `undefined`，此时不做任何裁剪；只有当代码实际行数超过该值时才会出现展开/收起按钮。裁剪同时作用于行号栏与代码主体，按钮使用 `Button` 组件（`variant="outline"` `size="sm"`）。
:::

## 功能特性

- **语法高亮**：内置 Prism 语法高亮引擎，支持 JavaScript、TypeScript、Python、Rust、Go 等 20+ 种语言。语言语法按需加载，未使用的语言零体积。
- **一键复制**：右上角无缝集成了 `CopyToClipboard` 按钮，并在复制成功后提供触感物理动画及文本反馈。
- **行号支持**：配置 `show-line-numbers` 属性为 `true` 后，会自动在左侧展示行号列表，且行号栏伴有经典的右侧实心线条分割。
- **折叠展开**：通过 `maxLines` 属性限制代码区域可见行数，超出部分自动裁剪并提供"展开"/"收起"按钮，适合在有限空间内展示长代码。
- **插槽扩展**：使用默认插槽可跳过内置高亮，直接渲染自定义 HTML 内容（如使用 Shiki 等其他高亮引擎时）。
- **自动降级**：`prismjs` 为可选依赖，未安装时组件自动降级为纯文本渲染；传入不支持的语言时同样降级为纯文本。

## 支持的语言

`language` 属性支持以下语言（含常见别名）：

| 语言 | 可用值 |
|------|--------|
| HTML / XML / SVG | `markup`, `html`, `xml`, `svg` |
| CSS | `css`, `scss` |
| JavaScript | `javascript`, `js` |
| TypeScript | `typescript`, `ts` |
| JSX / TSX | `jsx`, `tsx` |
| JSON | `json` |
| Bash / Shell | `bash`, `sh`, `shell` |
| Python | `python`, `py` |
| SQL | `sql` |
| Java | `java` |
| C / C++ | `c`, `cpp` |
| Go | `go` |
| Rust | `rust` |
| YAML | `yaml`, `yml` |
| Markdown | `markdown`, `md` |

如需额外语言，可自行导入对应的 Prism 语法文件：

```ts
import 'prismjs/components/prism-dart'
```

## 自定义高亮配色

高亮颜色通过 `--brutal-code-*` CSS 变量控制，与 `--brutal-primary` 等设计令牌解耦，确保所有主题下对比度达标。可通过覆盖这些变量自定义配色：

```css
:root {
    --brutal-code-keyword: #00838f;
    --brutal-code-function: #c62828;
    --brutal-code-string: #2e7d32;
    --brutal-code-number: #c0392b;
    --brutal-code-comment: #6b7280;
    --brutal-code-operator: #1565c0;
    --brutal-code-variable: #9c27b0;
    --brutal-code-punctuation: #4b5563;
}

.dark {
    --brutal-code-keyword: #26c6da;
    --brutal-code-function: #ff7043;
    --brutal-code-string: #66bb6a;
    --brutal-code-number: #ef5350;
    --brutal-code-comment: #9ca3af;
    --brutal-code-operator: #42a5f5;
    --brutal-code-variable: #ce93d8;
    --brutal-code-punctuation: #d1d5db;
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `code` | `string` | — | 需要展示的原始代码文本 (必填) |
| `language` | `string` | `'plaintext'` | 代码语言，用于语法高亮和顶栏徽章标签 |
| `filename` | `string` | `""` | 文件名或路径名，展示在顶栏左侧 |
| `showLineNumbers` | `boolean` | `false` | 是否在代码左侧展示行号 |
| `maxLines` | `number` | `undefined` | 代码区域最大可见行数；超出时裁剪并显示展开/收起按钮，未设置时不限制 |
| `class` | `string` | `""` | 组件卡片容器的自定义样式类 |
