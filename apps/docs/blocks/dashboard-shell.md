---
title: Dashboard Shell
description: 仪表盘外壳框架，提供左侧边栏、顶部导航和响应式内容区域。
---

# Dashboard Shell

新粗野主义风格的仪表盘布局，包含可折叠侧边栏、顶部栏和主内容区域。

## 预览

<ComponentPreview>
  <div class="flex h-64 border-3 border-brutal bg-brutal-bg overflow-hidden">
    <aside class="border-r-3 border-brutal bg-brutal-bg p-4 flex flex-col w-40">
      <div class="font-black text-lg tracking-tight mb-6">BrutxUI</div>
      <nav class="flex-1 space-y-1">
        <div class="px-2 py-1.5 text-xs font-bold bg-brutal-muted border-3 border-brutal shadow-brutal-sm">Dashboard</div>
        <div class="px-2 py-1.5 text-xs font-bold text-brutal-muted-foreground">Settings</div>
      </nav>
    </aside>
    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="border-b-3 border-brutal bg-brutal-bg px-4 py-2 flex items-center justify-between">
        <span class="text-xs font-bold">Page Title</span>
      </header>
      <main class="flex-1 overflow-y-auto p-4">
        <div class="text-xs text-brutal-muted-foreground">Main content area</div>
      </main>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx@latest add --block dashboard-shell
```

## 用法

```vue
<script setup>
import DashboardShell from '@/components/ui/dashboard-shell/DashboardShell.vue'

function handleSignOut() {
    console.log('Sign out clicked')
}
</script>

<template>
    <DashboardShell
        user-email="user@example.com"
        @sign-out="handleSignOut"
    >
        <template #sidebar>
            <a class="block px-2 py-1.5 text-sm font-bold bg-brutal-muted border-3 border-brutal shadow-brutal-sm" href="#">Dashboard</a>
            <a class="block px-2 py-1.5 text-sm font-bold text-brutal-muted-foreground" href="#">Analytics</a>
            <a class="block px-2 py-1.5 text-sm font-bold text-brutal-muted-foreground" href="#">Settings</a>
        </template>

        <template #header>
            <span class="font-bold">Dashboard</span>
        </template>

        <p>Main content goes here.</p>
    </DashboardShell>
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `userEmail` | `string` | `'user@example.com'` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `signOut` | `[]` |

## 插槽

| 插槽 | 描述 |
|------|------|
| `sidebar` | 侧边栏中的导航项 |
| `header` | 顶部栏中的内容 |
| `default` | 主内容区域 |

## 特性

- **可折叠侧边栏**：在移动端通过汉堡菜单切换
- **响应式**：侧边栏在移动端隐藏，桌面端可见
- **用户信息**：在侧边栏底部显示邮箱和退出按钮
- **移动端菜单**：在小屏幕上显示汉堡按钮
