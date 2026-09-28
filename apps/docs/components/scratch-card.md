---
title: ScratchCard 刮刮卡
description: Canvas 覆盖层驱动的刮刮卡组件，支持自定义覆盖层、进度回调和键盘可访问。
---

# ScratchCard 刮刮卡

新粗野主义风格的刮刮卡组件，使用 HTML5 Canvas 覆盖在底稿内容上方，绘制斑驳条纹层。用户用鼠标/手指擦除一定面积后，Canvas 淡出并销毁，完全露出插槽中的 Vue 内容。

## 预览

<ComponentPreview>
  <ScratchCardDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="scratch-card" />

## 用法

```vue
<script setup>
import { ScratchCard } from 'brutx-ui-vue'
</script>

<template>
    <ScratchCard class="w-full max-w-sm h-48">
        <div class="flex items-center justify-center h-full bg-brutal-accent">
            <p class="text-2xl font-black">🎉 恭喜中奖！</p>
        </div>
    </ScratchCard>
</template>
```

### 自定义覆盖层

默认绘制 Neobrutalist 双色条纹图案（`--brutal-primary` + `--brutal-secondary`）。可通过 `overlayColor` prop 设置纯色覆盖层：

```vue
<ScratchCard overlay-color="#FFE66D">
    <p>底稿内容</p>
</ScratchCard>
```

## 程序化控制

```vue
<script setup>
import { ref } from 'vue'
import { ScratchCard } from 'brutx-ui-vue'

const scratchCardRef = ref()
</script>

<template>
    <ScratchCard ref="scratchCardRef" />
    <button @click="scratchCardRef?.revealAll()">全部揭开</button>
</template>
```

## API 参考

<span id="暴露的-api"></span>
<span id="事件"></span>
<span id="插槽"></span>

<ComponentApi name="scratch-card" />

## 可访问性

- **键盘操作**：组件设置了 `tabindex="0"`，按 `Enter` 或 `Space` 键可自动揭开全部内容
- **ARIA 属性**：组件设置了 `role="region"`，`aria-label` 默认使用本地化文本 `scratchCard.ariaLabel`（默认为"刮刮卡"）
- **动效降级**：当用户偏好 `prefers-reduced-motion: reduce` 时，淡出动画被跳过，Canvas 立即移除
- **交互提示**：Canvas 覆盖层使用 `cursor-crosshair` 光标提示可交互
