---
title: Menu 导航菜单
description: 导航菜单组件，支持水平/垂直模式、子菜单嵌套、折叠动画以及 Vue Router 路由跳转。
---

# Menu 导航菜单

用于网站顶部或侧边的导航栏，支持 `mode: 'horizontal' | 'vertical'` 布局、多级嵌套 `SubMenu` 折叠动画以及与 `vue-router` 联动路由跳转。

## 预览

因为 VitePress 运行环境原因，此组件的预览可以在对应的 Demo 包中查阅。

## 安装

<InstallationTabs componentName="menu" />

## 用法

### 垂直模式 (Vertical)

```vue
<script setup>
import { ref } from 'vue'
import { Menu, MenuItem, SubMenu } from 'brutx-ui-vue'

const active = ref('1')
</script>

<template>
    <Menu default-active="1" mode="vertical" v-model:active="active">
        <MenuItem index="1">首页</MenuItem>
        <SubMenu index="sub-admin" title="管理面板">
            <MenuItem index="admin-users">用户管理</MenuItem>
            <MenuItem index="admin-settings">系统设置</MenuItem>
        </SubMenu>
        <MenuItem index="3" disabled>禁用项目</MenuItem>
    </Menu>
</template>
```

### 水平模式 (Horizontal)

设置 `mode="horizontal"` 可以调整菜单布局为水平横排。在此模式下，嵌套的 `SubMenu` 会以悬浮框（绝对定位）的形式显示。

```vue
<template>
    <Menu default-active="home" mode="horizontal">
        <MenuItem index="home">首页</MenuItem>
        <SubMenu index="products" title="产品中心">
            <MenuItem index="product-1">云服务器</MenuItem>
            <MenuItem index="product-2">数据库</MenuItem>
        </SubMenu>
        <MenuItem index="about">关于我们</MenuItem>
    </Menu>
</template>
```

### 路由联动 (Router)

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

## API

### Menu 属性 (Props)

| 属性名 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `mode` | `'horizontal' \| 'vertical'` | `'vertical'` | 菜单的排列模式 |
| `defaultActive` | `string` | `''` | 默认激活的菜单项 key |
| `router` | `boolean` | `false` | 是否开启 vue-router 路由跳转模式 |
| `class` | `string` | `undefined` | 自定义类名 |

### Menu 事件 (Events)

| 事件名 | 参数 | 说明 |
|---|---|---|
| `select` | `(index: string) => void` | 菜单项被选中时的事件回调 |

---

### MenuItem 属性 (Props)

| 属性名 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `index` | `string` | 必填 | 菜单项唯一标识，用于高亮和跳转 |
| `disabled` | `boolean` | `false` | 是否禁用该项 |
| `route` | `string \| object` | `undefined` | 路由跳转的路线（配合 Menu 的 `router` 模式） |
| `class` | `string` | `undefined` | 自定义类名 |

---

### SubMenu 属性 (Props)

| 属性名 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `index` | `string` | 必填 | 子菜单唯一标识 |
| `title` | `string` | `''` | 子菜单的显示标题，也可使用 `title` 插槽 |
| `disabled` | `boolean` | `false` | 是否禁用整个子菜单 |
| `class` | `string` | `undefined` | 自定义包围盒类名 |
| `triggerClass` | `string` | `undefined` | 自定义头部触发栏类名 |

### SubMenu 插槽 (Slots)

| 插槽名 | 说明 |
|---|---|
| `default` | 子菜单内的嵌套内容，可放入 `MenuItem` 或嵌套 `SubMenu` |
| `title` | 自定义子菜单的触发器标题（比 `title` 属性优先级更高） |
