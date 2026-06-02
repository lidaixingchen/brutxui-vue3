---
title: Profile Page
description: 带有头像、表单编辑和保存操作的个人资料页面区块。
---

# Profile Page

新粗野主义风格的个人资料页面，包含头像、姓名/邮箱/简介表单和保存按钮。

## 预览

<ComponentPreview>
  <div class="min-h-screen bg-brutal-bg p-4 sm:p-8">
    <div class="w-full max-w-2xl mx-auto">
      <h1 class="text-3xl font-black tracking-tight mb-8">Profile</h1>
      <div class="bg-brutal-bg border-3 border-brutal shadow-brutal-lg">
        <div class="p-6 flex flex-col items-center text-center border-b-3 border-brutal">
          <div class="h-16 w-16 flex items-center justify-center bg-brutal-primary border-3 border-brutal shadow-brutal text-xl font-black">JD</div>
          <h3 class="mt-4 text-xl font-black">John Doe</h3>
        </div>
        <div class="p-6 space-y-6">
          <div class="space-y-2">
            <label class="font-bold text-sm">Name</label>
            <input class="w-full px-3 py-2 border-3 border-brutal bg-brutal-bg font-medium" value="John Doe">
          </div>
          <div class="space-y-2">
            <label class="font-bold text-sm">Email</label>
            <input class="w-full px-3 py-2 border-3 border-brutal bg-brutal-bg font-medium" type="email" value="john@example.com">
          </div>
          <div class="space-y-2">
            <label class="font-bold text-sm">Bio</label>
            <textarea class="w-full px-3 py-2 border-3 border-brutal bg-brutal-bg font-medium min-h-[80px]">Developer</textarea>
          </div>
          <div class="flex justify-end">
            <button class="px-5 py-2 bg-brutal-primary text-brutal-fg border-3 border-brutal shadow-brutal font-black text-sm active:translate-y-[2px] active:shadow-none transition-all">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block profile-page
```

## 用法

```vue
<script setup>
import ProfilePage from '@/components/ui/profile-page/ProfilePage.vue'

function handleSave(payload) {
    console.log('Save profile:', payload)
    // payload: { name: string; email: string; bio: string }
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

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | locale: `profilePage.defaultTitle` |
| `name` | `string` | — |
| `email` | `string` | — |
| `bio` | `string` | — |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `save` | `[{ name: string; email: string; bio: string }]` |

## 插槽

| 插槽 | 说明 |
|------|------|
| `header` | 自定义页面标题区域 |
| `default` | 自定义主内容区域（替换头像和表单） |
| `footer` | 页面底部内容 |

## 布局

ProfilePage 包含：
- **标题**：加粗页面标题，可通过 `header` 插槽自定义
- **头像**：根据姓名自动生成首字母缩写的大尺寸头像
- **表单**：姓名输入框、邮箱输入框、简介文本域
- **保存按钮**：primary 变体按钮，点击时触发 `save` 事件
