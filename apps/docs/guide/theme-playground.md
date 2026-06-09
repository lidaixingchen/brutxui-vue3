---
aside: false
pageClass: theme-playground-page
---

# 主题实验室

在这里调试 BrutxUI 的核心视觉令牌。选择一个内置主题作为基底，调整色彩、边框、圆角和硬阴影，通过产品预览、组件矩阵、对比度检查和 token 覆盖率确认主题质量，然后复制生成的 CSS 到你的项目中。

<ThemePlayground />

## 使用生成的 CSS

将生成的 `.theme-custom` 代码粘贴到你的全局样式文件中，然后把类名应用到根容器：

```html
<div class="theme-custom">
    <!-- Your app -->
</div>
```

如果你的应用使用暗色模式，请在同一个元素或上层元素加上 `.dark`：

```html
<html class="dark">
    <body>
        <div class="theme-custom">
            <!-- Your app -->
        </div>
    </body>
</html>
```

这个实验室只生成 CSS 变量，不会修改 `useTheme()` 的内置主题类型。
