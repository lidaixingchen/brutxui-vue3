---
title: Result 结果
description: 结果反馈页组件，采用高饱和彩底盒展示成功、警告、普通、失败等结果信息。
---

# Result 结果

用于向用户反馈操作结果（如操作成功、系统警告、交易失败等状态）。组件配有强对比的正方形硬边框图标底盘，醒目的标题与内容，以及操作区插槽。

## 预览

<ComponentPreview>
  <ResultDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="result" />

## 用法

### 基础成功状态

展示成功的操作回执。

```vue
<script setup>
import { Result } from 'brutx-ui-vue'
</script>

<template>
    <Result
        status="success"
        title="付款成功"
        sub-title="我们已经收到您的款项，将于2小时内配货出库。"
    />
</template>
```

### 带有底部操作按钮

利用默认或 `#extra` 插槽，添加跳转或重新提交的操作按钮。

```vue
<template>
    <Result
        status="error"
        title="网络连接失败"
        sub-title="由于网关解析超时，数据未能成功上报，请修改后点击重试。"
    >
        <template #extra>
            <button class="btn btn-primary" @click="retry">立即重试</button>
        </template>
    </Result>
</template>
```

## Props

### Result

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `status` | `'success' \| 'error' \| 'info' \| 'warning'` | `'info'` | 结果状态类型，决定顶部硬边框图标的色彩和图案 |
| `title` | `string` | `''` | 结果标题文本 |
| `subTitle` | `string` | `''` | 结果副标题描述文本 |
| `variant` | `'plain' \| 'card'` | `'card'` | 是否渲染卡片边框和硬投影 |
| `iconSize` | `IconSize` | — | 状态图标尺寸 |

## Slots

### Result

| 插槽名 | 说明 |
|--------|------|
| `icon` | 覆盖顶部的状态图标与硬边框盒 |
| `title` | 自定义标题结构 |
| `subTitle` | 自定义副标题描述区 |
| `extra` | 自定义底部辅助操作控制区域 |
