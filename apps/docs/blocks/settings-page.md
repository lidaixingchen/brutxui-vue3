---
title: Settings Page 设置页
description: 设置页面区块，带有标签页导航和表单控件。
---

# Settings Page 设置页

新粗野主义风格的设置页面，包含标签页导航、表单控件（Input 和 Switch）和保存按钮。

## 预览

<ComponentPreview>
  <SettingsPageDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="settings-page" />

## 用法

```vue
<script setup>
import SettingsPage from '@/components/ui/settings-page/SettingsPage.vue'
import type { SettingsTab } from '@/components/ui/settings-page/SettingsPage.vue'

const tabs: SettingsTab[] = [
    { label: 'General', value: 'general' },
    { label: 'Notifications', value: 'notifications' },
    { label: 'Security', value: 'security' },
]

function handleSave(payload) {
    console.log('Save:', payload)
    // payload: { tab: string; values: Record<string, unknown> }
}
</script>

<template>
    <SettingsPage
        title="Settings"
        :tabs="tabs"
        default-tab="general"
        @save="handleSave"
    />
</template>
```

### 自定义标签页内容

```vue
<script setup>
import SettingsPage from '@/components/ui/settings-page/SettingsPage.vue'

const tabs = [
    { label: 'Profile', value: 'profile' },
    { label: 'Account', value: 'account' },
]
</script>

<template>
    <SettingsPage
        title="My Settings"
        :tabs="tabs"
        @save="handleSave"
    >
        <template #tab-profile="{ values, setValue }">
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <label class="font-bold text-sm">Display Name</label>
                    <input
                        class="h-10 max-w-xs border-3 border-brutal bg-brutal-bg px-3"
                        :value="values.displayName ?? ''"
                        @input="setValue('displayName', $event.target.value)"
                    />
                </div>
            </div>
        </template>
    </SettingsPage>
</template>
```

## 数据类型

```ts
interface SettingsTab {
    label: string
    value: string
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | locale: `settingsPage.defaultTitle` | 页面标题 |
| `tabs` | `SettingsTab[]` | `[]` | 标签页配置列表 |
| `modelValue` | `string` | — | 当前激活的标签页（v-model） |
| `defaultTab` | `string` | — | 默认激活的标签页 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `save` | `{ tab: string; values: Record<string, unknown> }` | 点击保存按钮时触发，包含当前标签页和表单值 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `header` | — | 替换/扩展区块头部 |
| `default` | — | 替换区块主体内容（含标签页和保存按钮） |
| `footer` | — | 替换/扩展区块底部 |
| `tab-{value}` | `{ values: Record<string, unknown>; setValue: (key: string, val: unknown) => void }` | 自定义标签页内容，提供表单值和设置函数 |

## 可访问性

- **键盘操作**：支持 `Tab` 在标签页和表单控件间导航，`Enter` / `Space` 切换标签页
- **ARIA 属性**：标签页使用 `role="tablist"` 和 `role="tab"`，内容区域使用 `role="tabpanel"`
- **焦点管理**：标签页切换时焦点保持在标签页触发器上
