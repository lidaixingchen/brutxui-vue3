# Tailwind CSS 集成指南

Brutx 基于 Vue 3 构建，使用 **Tailwind CSS** 进行样式管理。同时支持 **Tailwind CSS v3** 和 CSS 优先的 **Tailwind CSS v4** 工作流。

---

## Tailwind CSS v4 配置（CSS 优先）

Tailwind CSS v4 引入了 CSS 优先的配置流程。在大多数 v4 项目中，你不再需要 `tailwind.config.js` 文件。

### 1. `init` 时的样式集成
在 Tailwind v4 项目中运行 `npx brutx@latest init` 时，CLI 会自动检测版本，并在 `components.json` 中将配置值设为空（`"config": ""`）。

它会将 Neo-Brutalist 设计令牌直接追加到主 CSS 文件（`globals.css`）中：

```css
@import "tailwindcss";

/* Brutalist UI Styles */
.border-3 {
    border-width: 3px;
}

.shadow-brutal {
    box-shadow: 4px 4px 0px 0px #000;
}

.shadow-brutal-sm {
    box-shadow: 2px 2px 0px 0px #000;
}

.shadow-brutal-lg {
    box-shadow: 6px 6px 0px 0px #000;
}

.dark .shadow-brutal {
    box-shadow: 4px 4px 0px 0px #fff;
}

.dark .shadow-brutal-sm {
    box-shadow: 2px 2px 0px 0px #fff;
}

.dark .shadow-brutal-lg {
    box-shadow: 6px 6px 0px 0px #fff;
}
```

由于这些工具类以原生 CSS 编写，Tailwind v4 可以直接解析它们。

### 2. 在 Tailwind v4 中自定义主题颜色
要在 Tailwind v4 中自定义主题颜色，请在 `globals.css` 的 `@theme` 指令中声明：

```css
@import "tailwindcss";

@theme {
  /* Override default tailwind colors or add custom ones */
  --color-coral: #FF6B6B;
  --color-teal: #4ECDC4;
  --color-yellow: #FFE66D;

  /* Configure custom font */
  --font-sans: 'Outfit', sans-serif;
}
```

然后你可以在项目中使用 `bg-coral`、`text-teal` 和 `border-yellow`。

---

## Tailwind CSS v3 配置（基于 JS）

Tailwind CSS v3 依赖 JavaScript 配置文件。

### 1. `init` 时的配置
运行 `npx brutx@latest init` 会创建/更新 `tailwind.config.js`，并在全局 CSS 文件中追加 Neo-Brutalist CSS 工具类。

### 2. 在 Tailwind v3 中自定义主题颜色
要在 Tailwind v3 中自定义颜色，请在 `tailwind.config.js` 中添加：

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        coral: '#FF6B6B',
        teal: '#4ECDC4',
        yellow: '#FFE66D',
      },
    },
  },
}
```

---

## 暗色模式

Brutx 在 Tailwind v3 和 v4 上均完全支持暗色模式：

- **Tailwind v4**：暗色模式变体会自动处理。标准的类选择器如 `.dark` 开箱即用。
- **Tailwind v3**：如果你使用基于类的暗色模式，请确保在 `tailwind.config.js` 中进行了配置：
  ```javascript
  module.exports = {
    darkMode: 'class',
    // ...
  }
  ```
