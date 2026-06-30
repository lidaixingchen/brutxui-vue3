---
title: Dashboard Shell 仪表盘框架
description: 新粗野主义风格的仪表盘布局，包含可折叠侧边栏、顶部栏和主内容区域。
---

# Dashboard Shell 仪表盘框架

新粗野主义风格的仪表盘布局，包含可折叠侧边栏、顶部栏和主内容区域。提供左侧边栏、顶部导航和响应式内容区域。

## 预览

<ComponentPreview>
  <DashboardShellDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="dashboard-shell" />

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

### DashboardShell

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `userEmail` | `string` | locale: `dashboardShell.defaultEmail` | 用户邮箱 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `signOut` | — | 点击退出按钮时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
| ---- | ---- | ---- |
| `sidebar` | — | 侧边栏中的导航项 |
| `header` | — | 顶部栏中的内容 |
| `default` | — | 主内容区域 |

## 可访问性

- **键盘操作**：支持 `Tab` 在导航项间导航，`Escape` 关闭移动端菜单
- **ARIA 属性**：汉堡菜单按钮使用 `aria-expanded` 指示菜单状态
- **焦点管理**：移动端菜单打开时焦点锁定在侧边栏内
