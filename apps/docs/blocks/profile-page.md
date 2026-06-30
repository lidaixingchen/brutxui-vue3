---
title: Profile Page
description: 带有头像、表单编辑和保存操作的个人资料页面区块。
---

# Profile Page 个人资料页

新粗野主义风格的个人资料页面，包含自动生成首字母缩写的头像、姓名/邮箱/简介表单和保存按钮。支持通过插槽自定义页面结构。

## 预览

<ComponentPreview>
  <ProfilePageDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="profile-page" />

## 用法

```vue
<script setup>
import ProfilePage from '@/components/ui/profile-page/ProfilePage.vue'

function handleSave(payload: { name: string; email: string; bio: string }) {
    console.log('Save profile:', payload)
}
</script>

<template>
    <ProfilePage
        name="John Doe"
        email="john@example.com"
        bio="Full-stack developer"
        @save="handleSave"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | locale: `profilePage.defaultTitle` | 页面标题 |
| `name` | `string` | — | 姓名 |
| `email` | `string` | — | 邮箱 |
| `bio` | `string` | — | 简介 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `save` | `[{ name: string; email: string; bio: string }]` | 点击保存按钮时触发，携带当前表单数据 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `header` | — | 自定义页面标题区域 |
| `default` | — | 自定义主内容区域（替换头像和表单） |
| `footer` | — | 页面底部内容 |

## 可访问性

- **键盘操作**：表单输入框支持 `Tab` 键顺序切换，保存按钮支持 `Space` / `Enter` 触发
- **ARIA 属性**：表单字段通过 `label` 与 `id` 关联，确保屏幕阅读器可识别
- **焦点管理**：页面加载后焦点可自然流转至表单输入框
