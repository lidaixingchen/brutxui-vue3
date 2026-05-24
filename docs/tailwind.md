# Tailwind CSS Integration Guide

Brutalist UI is built on React and styling is fully powered by **Tailwind CSS**. It is fully compatible with both the traditional **Tailwind CSS v3** and the new CSS-first **Tailwind CSS v4**.

---

## 🎨 Tailwind CSS v4 Configuration (CSS-First)

Tailwind CSS v4 introduces a fully CSS-first configuration pipeline. There is **no longer a need** for a `tailwind.config.js` file.

### 1. Style Integration on `init`
When you run `npx brutx@latest init` in a Tailwind v4 project, the CLI automatically detects the version and configures your `components.json` with an empty config value (`"config": ""`).

It automatically appends the Neo-Brutalist design tokens directly to your main CSS file (`globals.css`):

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

Since these utility classes are written in native CSS, they are automatically parsed and compatible with Tailwind v4!

### 2. Customizing Theme Colors in Tailwind v4
To customize theme colors in Tailwind v4, declare them inside the `@theme` directive in your `globals.css`:

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

Now you can use `bg-coral`, `text-teal`, `border-yellow` inside your project!

---

## 🎨 Tailwind CSS v3 Configuration (JS-Based)

Tailwind CSS v3 relies on JavaScript config files.

### 1. Configuration on `init`
Running `npx brutx@latest init` creates/updates `tailwind.config.js` and appends the Neo-Brutalist CSS utilities inside your globals CSS file.

### 2. Customizing Theme Colors in Tailwind v3
To custom colors in Tailwind v3, add them inside `tailwind.config.js`:

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

## 🌓 Dark Mode

Brutalist UI fully supports dark mode on both Tailwind v3 and v4:

- **Tailwind v4:** Dark mode variants are automatically handled. Standard class selectors like `.dark` work out of the box.
- **Tailwind v3:** If you are using class-based dark mode, ensure you have configured it in `tailwind.config.js`:
  ```javascript
  module.exports = {
    darkMode: 'class',
    // ...
  }
  ```
