# BrutxUI 设计令牌与主题参考

本文件包含完整的 CSS 变量定义、主题预设说明和国际化 API。当需要自定义主题、查看设计令牌或配置多语言时读取此文件。

## 目录

- [CSS 变量](#css-变量)
- [Tailwind 工具类](#tailwind-工具类)
- [主题预设](#主题预设)
- [国际化](#国际化)

---

## CSS 变量

BrutxUI 使用 CSS 自定义属性定义设计令牌，便于主题切换和自定义：

```css
:root {
  /* 边框 */
  --brutal-border-width: 3px;
  --brutal-border-color: #000000;

  /* 阴影 */
  --brutal-shadow-offset-x: 4px;
  --brutal-shadow-offset-y: 4px;
  --brutal-shadow-color: #000000;

  /* 圆角 */
  --brutal-radius: 0px;

  /* 背景与前景 */
  --brutal-bg: #ffffff;
  --brutal-fg: #000000;

  /* 品牌色 */
  --brutal-primary: #FF6B6B;     /* 珊瑚红 */
  --brutal-secondary: #4ECDC4;   /* 薄荷青 */
  --brutal-accent: #FFE66D;      /* 黄色 */

  /* 语义色 */
  --brutal-destructive: #EF476F; /* 危险红 */
  --brutal-success: #7FB069;     /* 成功绿 */
  --brutal-info: #4A90D9;        /* 信息蓝 */

  /* 中性色 */
  --brutal-muted: #f3f4f6;

  /* 焦点环 */
  --brutal-ring: #000000;

  /* 交互 */
  --brutal-pressed-offset: 2px;
}
```

### 自定义主题

通过覆盖 CSS 变量实现自定义主题：

```css
.my-brand {
  --brutal-primary: #6366f1;     /* 改为紫色 */
  --brutal-secondary: #22d3ee;   /* 改为青色 */
  --brutal-accent: #f59e0b;      /* 改为琥珀色 */
  --brutal-border-width: 4px;    /* 更粗的边框 */
  --brutal-shadow-offset-x: 6px; /* 更大的阴影 */
  --brutal-shadow-offset-y: 6px;
}
```

```vue
<template>
  <div class="my-brand">
    <Button variant="primary">自定义主题按钮</Button>
  </div>
</template>
```

---

## Tailwind 工具类

### 边框

```vue
<div class="border-3 border-brutal rounded-brutal">
```

| 类名 | 效果 |
|------|------|
| `border-3` | 3px 边框宽度 |
| `border-brutal` | 使用 `--brutal-border-color` |
| `rounded-brutal` | 使用 `--brutal-radius`（默认 0px） |

### 阴影

```vue
<div class="shadow-brutal">      <!-- 标准阴影 -->
<div class="shadow-brutal-sm">   <!-- 小阴影 -->
<div class="shadow-brutal-lg">   <!-- 大阴影 -->
<div class="shadow-brutal-xl">   <!-- 超大阴影 -->
```

| 类名 | 偏移量 |
|------|--------|
| `shadow-brutal` | 4px 4px |
| `shadow-brutal-sm` | 2px 2px |
| `shadow-brutal-lg` | 6px 6px |
| `shadow-brutal-xl` | 8px 8px |

> 注意：所有阴影都是硬偏移（无模糊），这是新粗野主义的核心视觉特征。

### 颜色

```vue
<!-- 背景色 + 文字色 -->
<div class="bg-brutal-bg text-brutal-fg">        <!-- 白底黑字 -->
<div class="bg-brutal-primary text-brutal-fg">    <!-- 珊瑚红 -->
<div class="bg-brutal-secondary text-brutal-fg">  <!-- 薄荷青 -->
<div class="bg-brutal-accent text-brutal-fg">     <!-- 黄色 -->
<div class="bg-brutal-destructive text-brutal-fg"> <!-- 危险红 -->
<div class="bg-brutal-success text-brutal-fg">    <!-- 成功绿 -->
<div class="bg-brutal-info text-brutal-fg">       <!-- 信息蓝 -->
<div class="bg-brutal-muted text-brutal-fg">      <!-- 柔和灰 -->
```

### 交互效果

```vue
<!-- 悬停：阴影增大 + 微偏移 -->
<button class="hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5">

<!-- 按压：向下偏移 + 阴影消失 -->
<button class="active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none">

<!-- 完整交互效果（推荐用于所有可点击元素） -->
<button class="hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none">
```

---

## 主题预设

BrutxUI 提供三个内置主题预设，通过 CSS 类名切换：

### theme-classic（默认）

经典粗野主义风格，深黑阴影、霓虹强调色、锐利直角。

```vue
<div class="theme-classic">
  <Button variant="primary">经典风格</Button>
</div>
```

特征：
- 纯黑阴影（`#000000`）
- 霓虹感的强调色（珊瑚红、薄荷青、黄色）
- 0px 圆角（完全直角）
- 3px 边框

### theme-pastel

柔和新粗野风格，降低对比度，增加圆角。

```vue
<div class="theme-pastel">
  <Button variant="primary">柔和风格</Button>
</div>
```

特征：
- 较轻的阴影对比度
- 8px 圆角
- 柔和的色彩变体
- 保留粗边框

### theme-mono

纯粹单色风格，灰度色彩、更粗线条。

```vue
<div class="theme-mono">
  <Button variant="primary">单色风格</Button>
</div>
```

特征：
- 灰度色彩方案
- 4px 边框（更粗）
- 更强的黑白对比
- 0px 圆角

### 主题切换

```vue
<script setup lang="ts">
import { ref } from 'vue'

const currentTheme = ref('theme-classic')
</script>

<template>
  <div :class="currentTheme">
    <select v-model="currentTheme">
      <option value="theme-classic">经典</option>
      <option value="theme-pastel">柔和</option>
      <option value="theme-mono">单色</option>
    </select>
    <Button variant="primary">主题切换示例</Button>
  </div>
</template>
```

---

## 国际化

BrutxUI 内置国际化支持，通过 `useLocale()` composable 实现。

### 基本用法

```typescript
import { useLocale } from 'brutx-ui-vue'

const { t, locale } = useLocale()

// 使用翻译
const title = t('saasPricing.title')
const subtitle = t('saasPricing.subtitle')

// 带插值的翻译
const message = t('welcome', { name: '用户' })
```

### 切换语言

```typescript
import { useLocale } from 'brutx-ui-vue'
import { en, zh } from 'brutx-ui-vue'

const { locale } = useLocale()

// 切换到英文
locale.value = en

// 切换到中文
locale.value = zh
```

### 在组件中使用

```vue
<script setup lang="ts">
import { useLocale } from 'brutx-ui-vue'

const { t } = useLocale()
</script>

<template>
  <SaaSPricing
    :plans="plans"
    :title="t('saasPricing.title')"
    :subtitle="t('saasPricing.subtitle')"
  />
</template>
```

### 最佳实践

1. **文本 props 默认值设为 `undefined`**，通过 `t()` 提供默认文本
2. **不要硬编码文案**，始终使用 `t()` 函数
3. **支持插值**，使用 `{变量名}` 语法：`t('greeting', { name: '用户' })`
