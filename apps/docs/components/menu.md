---
title: Menu 导航菜单
description: 导航菜单组件，支持水平/垂直模式、子菜单嵌套、折叠动画以及 Vue Router 路由跳转。
---

# Menu 导航菜单

用于网站顶部或侧边的导航栏，支持 `mode: 'horizontal' | 'vertical'` 布局、多级嵌套 `SubMenu` 折叠动画以及与 `vue-router` 联动路由跳转。

## 预览

<ComponentPreview>
  <MenuDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="menu" />

## 用法

### 垂直模式

```vue
<script setup>
import { ref } from 'vue'
import { Menu, MenuItem, SubMenu } from 'brutx-ui-vue'

const active = ref('1')
</script>

<template>
    <Menu default-active="1" mode="vertical" @select="idx => active = idx">
        <MenuItem index="1">首页</MenuItem>
        <SubMenu index="sub-admin" title="管理面板">
            <MenuItem index="admin-users">用户管理</MenuItem>
            <MenuItem index="admin-settings">系统设置</MenuItem>
        </SubMenu>
        <MenuItem index="3" disabled>禁用项目</MenuItem>
    </Menu>
</template>
```

### 水平模式

设置 `mode="horizontal"` 可以调整菜单布局为水平横排。在此模式下，嵌套的 `SubMenu` 会以悬浮框（绝对定位）的形式显示。

指针进入或离开子菜单时，展开与收起使用短暂延迟；快速移回会取消待处理的收起动作。按 Escape、选择菜单项、点击外部、禁用或卸载时会清理待处理的悬停动作。

```vue
<script setup>
import { ref } from 'vue'
import { Menu, MenuItem, SubMenu } from 'brutx-ui-vue'

const active = ref('home')
</script>

<template>
    <Menu default-active="home" mode="horizontal" @select="idx => active = idx">
        <MenuItem index="home">首页</MenuItem>
        <SubMenu index="products" title="产品中心">
            <MenuItem index="product-1">云服务器</MenuItem>
            <MenuItem index="product-2">数据库</MenuItem>
        </SubMenu>
        <MenuItem index="about">关于我们</MenuItem>
    </Menu>
</template>
```

### 路由联动

设置 `router` 属性为 `true` 后，点击 `MenuItem` 会自动利用 Vue Router 进行路由跳转。绑定的目标可以是 `route` 属性，如果没有指定，则默认使用菜单项的 `index` 作为路径。

```vue
<template>
    <Menu router default-active="/home" mode="vertical">
        <MenuItem index="/home">首页</MenuItem>
        <MenuItem index="/users" :route="{ name: 'UsersList' }">用户中心</MenuItem>
        <MenuItem index="/settings">系统设置</MenuItem>
    </Menu>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Menu` | 菜单根组件，提供上下文状态 |
| `MenuItem` | 菜单项组件 |
| `SubMenu` | 子菜单组件，用于嵌套及折叠内容 |

## API 参考

<span id="menu"></span>
<span id="menuitem"></span>
<span id="submenu"></span>
<span id="事件"></span>
<span id="menu-1"></span>
<span id="插槽"></span>
<span id="submenu-1"></span>

<ComponentApi name="menu" />

## 可访问性

- **键盘操作**：支持使用 `Enter` 或 `Space` 键激活 `MenuItem` 或展开/收起 `SubMenu`。
- **ARIA 属性**：根组件自动设置 `role="menubar"`，各菜单项使用 `role="menuitem"`。子菜单触发器自动管理 `aria-haspopup="true"` 和 `aria-expanded` 属性。
- **动效降级**：垂直模式下的折叠动画支持 `prefers-reduced-motion` 自动降级（如适用）。
