---
title: Theme Playground
description: An interactive tool for visually debugging BrutxUI theme CSS variables
translated: true
aside: false
pageClass: theme-playground-page
---

# Theme Playground

Debug BrutxUI's core visual tokens here. Choose a built-in theme as your base, adjust colors, borders, radius, and hard shadows, confirm theme quality through product preview, component matrix, contrast check, and token coverage, then copy the generated CSS into your project.

<ThemePlayground />

## Using the Generated CSS

Paste the generated `.theme-custom` code into your global stylesheet, then apply the class name to the root container:

```html
<div class="theme-custom">
    <!-- Your app -->
</div>
```

If your application uses dark mode, add `.dark` to the same element or a parent element:

```html
<html class="dark">
    <body>
        <div class="theme-custom">
            <!-- Your app -->
        </div>
    </body>
</html>
```

This playground only generates CSS variables and does not modify the built-in theme types of `useTheme()`.
