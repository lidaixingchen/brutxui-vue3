---
title: NoiseBackground 噪点背景
description: 基于 SVG feTurbulence 滤镜的噪点纹理背景组件，支持动画效果和多种配置。
---

# NoiseBackground 噪点背景

新粗野主义风格的噪点纹理背景组件，使用 SVG `<feTurbulence>` 滤镜生成噪点效果。适用于卡片背景、页面装饰、复古风格设计等场景。

## 安装

<InstallationTabs componentName="noise-background" />

## 用法

```vue
<script setup>
import { NoiseBackground } from 'brutx-ui-vue'
</script>

<template>
    <NoiseBackground :opacity="0.3">
        <div class="p-8">
            <h2>带噪点背景的内容</h2>
            <p>噪点纹理为设计增添质感。</p>
        </div>
    </NoiseBackground>
</template>
```

## 动画效果

```vue
<template>
    <NoiseBackground
        :opacity="0.4"
        animated
        :animation-duration="6"
    >
        <div class="p-8 text-center">
            <h2>动态噪点背景</h2>
        </div>
    </NoiseBackground>
</template>
```

## 自定义噪点类型

```vue
<template>
    <!-- 分形噪声（默认） -->
    <NoiseBackground type="fractalNoise" :frequency="0.65">
        <div class="p-4">分形噪声</div>
    </NoiseBackground>

    <!-- 湍流 -->
    <NoiseBackground type="turbulence" :frequency="0.8">
        <div class="p-4">湍流效果</div>
    </NoiseBackground>
</template>
```

## 圆角变体

```vue
<template>
    <NoiseBackground rounded="default" :opacity="0.3">
        <div class="p-6">圆角卡片</div>
    </NoiseBackground>

    <NoiseBackground rounded="lg" :opacity="0.3">
        <div class="p-6">大圆角卡片</div>
    </NoiseBackground>
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'fractalNoise' \| 'turbulence'` | `'fractalNoise'` | 噪点类型 |
| `frequency` | `number` | `0.65` | 噪点频率（0-1） |
| `octaves` | `number` | `3` | 噪点层数（越多越复杂） |
| `opacity` | `number` | `0.5` | 噪点不透明度（0-1） |
| `animated` | `boolean` | `false` | 是否启用动画效果 |
| `animationDuration` | `number` | `8` | 动画周期（秒） |
| `rounded` | `'none' \| 'default' \| 'lg' \| 'full'` | `'none'` | 圆角变体 |
| `class` | `string` | — | 自定义类名 |

## 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 嵌套内容，会显示在噪点背景上方 |

## 噪点类型说明

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `fractalNoise` | 分形噪声，柔和自然 | 通用背景、卡片装饰 |
| `turbulence` | 湍流效果，纹理更明显 | 特殊效果、艺术风格 |

## 圆角变体

| 变量 | CSS 类 |
|------|--------|
| `none` | `rounded-none` |
| `default` | `rounded-brutal` |
| `lg` | `rounded-brutal-lg` |
| `full` | `rounded-full` |

## 技术实现

- 使用 SVG `<feTurbulence>` 滤镜生成噪点（性能最佳）
- 动画通过 JavaScript 定时修改 `baseFrequency` 属性实现
- 组件使用 Vue ref 引用 SVG 元素，避免直接 DOM 操作
- 支持 SSR 环境，动画仅在客户端启动
- 组件卸载时自动清理动画帧，避免内存泄漏

## 注意事项

- SVG 滤镜在部分低端设备上可能有性能问题，建议提供降级方案
- 动画模式下会持续消耗 CPU 资源，谨慎在大量实例中使用
- `frequency` 值越大，噪点越密集；值越小，噪点越稀疏
- `octaves` 值越大，噪点细节越丰富，但性能开销也越大
