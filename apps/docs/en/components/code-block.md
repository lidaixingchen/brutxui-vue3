---
title: CodeBlock
description: Neo-Brutalist code block component with integrated Prism syntax highlighting, file name, language badge, and floating copy button.
translated: true
---

# CodeBlock

A card-style container designed for displaying formatted code or scripts. Features built-in Prism syntax highlighting, a high-contrast top bar, copy action feedback, and optional line numbers.

## Demo

<ComponentPreview>
  <CodeBlockDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="code-block" />

The syntax highlighting feature depends on `prismjs` (optional peer dependency). If not installed, the component automatically falls back to plain text rendering.

```bash
pnpm add prismjs
```

## Usage

```vue
<script setup>
import { CodeBlock } from 'brutx-ui-vue/code-block'

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

## Collapse and Expand

The `maxLines` prop limits the maximum visible lines in the code area. When the actual line count **exceeds** `maxLines`, the code area is clipped to the specified number of lines and an "Expand" button appears at the bottom. After expanding, the button switches to "Collapse", and clicking again restores the collapsed state. The expand/collapse button text is internationalized via `useLocale()` `t()`, defaulting to "Expand"/"Collapse".

```vue
<script setup>
import { CodeBlock } from 'brutx-ui-vue/code-block'

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

`maxLines` defaults to `undefined`, meaning no clipping is applied. The expand/collapse button only appears when the actual line count exceeds this value. Clipping applies to both the line number gutter and the code body. The button uses the `Button` component (`variant="outline"` `size="sm"`).

## Features

- **Syntax Highlighting**: Built-in Prism syntax highlighting engine supporting 20+ languages including JavaScript, TypeScript, Python, Rust, Go, etc. Language grammars are loaded on demand; unused languages have zero footprint.
- **One-Click Copy**: Seamlessly integrates a `CopyToClipboard` button in the top-right corner, providing tactile physics animation and text feedback on successful copy.
- **Line Numbers**: Set the `show-line-numbers` prop to `true` to display a line number list on the left side, with a classic solid line separator on the right edge of the gutter.
- **Collapse/Expand**: Use the `maxLines` prop to limit visible lines in the code area. Excess lines are automatically clipped with "Expand"/"Collapse" buttons, ideal for displaying long code in limited space.
- **Slot Extension**: Use the default slot to bypass built-in highlighting and render custom HTML content directly (e.g., when using other highlighters like Shiki).
- **Auto Fallback**: `prismjs` is an optional dependency. When not installed, the component automatically falls back to plain text rendering. Unsupported languages also fall back to plain text.

## Supported Languages

The `language` prop supports the following languages (including common aliases):

| Language | Available Values |
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

For additional languages, you can import the corresponding Prism grammar file:

```ts
import 'prismjs/components/prism-dart'
```

## Custom Highlight Colors

Highlight colors are controlled via `--brutal-code-*` CSS variables, decoupled from `--brutal-primary` and other design tokens, ensuring sufficient contrast across all themes. Customize colors by overriding these variables:

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

| Prop | Type | Default | Description |
|------|------|--------|------|
| `code` | `string` | — | Raw code text to display (required) |
| `language` | `string` | `'plaintext'` | Code language for syntax highlighting and top bar badge label. See the supported languages list above |
| `filename` | `string` | `""` | File name or path displayed on the left of the top bar |
| `showLineNumbers` | `boolean` | `false` | Whether to display line numbers on the left side of the code |
| `maxLines` | `number` | `undefined` | Maximum visible lines in the code area; clips and shows expand/collapse button when exceeded. No limit when unset |
| `class` | `string` | `""` | Custom CSS class for the card container |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Optional. Used for custom code content. When using this slot, built-in Prism syntax highlighting is skipped and slot content is rendered directly (suitable for other highlighters like Shiki) |

## Accessibility

- **Keyboard Operation**: Copy and expand/collapse buttons support Tab focus and Enter/Space activation
- **ARIA Attributes**: Copy button automatically sets `aria-label` for operation description
- **Semantic Markup**: Code content is wrapped in `<pre>` and `<code>` tags following semantic standards
- **High Contrast**: Syntax highlight colors are controlled via CSS variables, ensuring contrast requirements are met in both dark and light themes
