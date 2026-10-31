# 公开 API 迁移指南

## 0.11.4 升级迁移

UI 包 `brutx-ui-vue` 与 CLI 包 `brutx-vue` 同步使用 `0.11.4`。本轮包含以下主题、状态与首帧行为调整，升级时应按实际使用方式迁移。

### 自定义主题高亮色

**影响范围**：手工构造完整 `ThemeTokens` 对象的工具，以及覆盖集合选项高亮颜色的自定义主题。内置主题预设已提供新增字段。

**变更原因**：集合选项使用独立的背景、前景色对，使鼠标当前项与键盘焦点在亮暗主题中保持清晰。

升级前，自定义主题仅包含既有字段：

```ts
const tokens = { ...customTokens }
```

升级后，完整对象补齐两项高亮令牌；以下示例复用自定义主题的强调色对：

```ts
const tokens = {
  ...customTokens,
  itemHighlight: customTokens.accent,
  itemHighlightForeground: customTokens.accentForeground,
}
```

直接覆盖 CSS 变量时，升级前的强调色仍控制原有强调区域：

```css
.theme-custom {
  --brutal-accent: var(--app-accent);
  --brutal-accent-foreground: var(--app-accent-foreground);
}
```

升级后，集合选项的高亮色单独配置：

```css
.theme-custom {
  --brutal-accent: var(--app-accent);
  --brutal-accent-foreground: var(--app-accent-foreground);
  --brutal-item-highlight: var(--app-accent);
  --brutal-item-highlight-foreground: var(--app-accent-foreground);
}
```

**自动迁移可行性**：可以为完整令牌对象和自定义 CSS 主题批量补齐字段；具体色值需结合各主题的前景对比度审查。

### 集合选项样式

**影响范围**：Select、Command、Combobox、Cascader、TreeSelect、TreeView、Transfer 与 DropdownMenu 的自定义选项行样式。值绑定和选择事件沿用各组件原有契约。

**变更原因**：当前项高亮、业务选中与键盘可见焦点分别表达，交互期间保持行位置、字重、边框宽度和投影稳定。

升级前，应用可能按旧高亮色和交互字重覆盖 CommandItem：

```vue
<CommandItem value="settings" class="data-[highlighted]:bg-brutal-secondary data-[highlighted]:font-black">
  设置
</CommandItem>
```

升级后，使用配对的集合高亮令牌，字重由普通行样式统一提供：

```vue
<CommandItem value="settings" class="data-[highlighted]:bg-brutal-item-highlight data-[highlighted]:text-brutal-item-highlight-foreground">
  设置
</CommandItem>
```

自定义焦点样式应同时考虑真实焦点的 `:focus-visible` 与虚拟焦点的 `data-focus-visible`。业务选中状态仍依据各原语的选中属性和独立标记判断。CLI 源码安装用户通过 `brutx-vue update` 审查组件及共享依赖的差异。

**自动迁移可行性**：可以统一替换已知高亮类；自定义位移、字重、选中判断和焦点选择器需要人工审查。

### Countdown 首帧与 Calendar 语言

**影响范围**：Countdown 自定义默认插槽，以及依赖 Calendar 默认语言的页面。

**变更原因**：Countdown 在挂载后按当前时钟计算剩余时间，首帧显示占位状态；Calendar 默认沿用提供的语言包。

Countdown 升级前，自定义插槽直接展示数值：

```vue
<Countdown :value="targetTime" v-slot="{ remaining }">
  {{ remaining }}
</Countdown>
```

升级后，通过 `isReady` 区分占位状态和已计算值：

```vue
<Countdown :value="targetTime" v-slot="{ remaining, isReady }">
  {{ isReady ? remaining : '正在准备倒计时' }}
</Countdown>
```

Calendar 升级前，页面可能直接依赖默认语言：

```vue
<Calendar v-model="date" />
```

需要固定中文的页面在升级后显式指定语言：

```vue
<Calendar v-model="date" locale="zh-CN" />
```

**自动迁移可行性**：Calendar 的固定语言可以批量补充；Countdown 的占位文案与业务数值分支需要按页面语义审查。

### 开发环境

仓库开发和构建要求 Node.js `^22.13.0 || ^24.0.0 || >=26.0.0`。维护本仓库的开发与发布流水线时，按该范围选择运行时并重新安装依赖。

## 公开入口与类型

BrutxUI 的 npm 根入口、组件子路径与组合式函数子路径均由 [API 契约](../../packages/ui/api-contract.ts) 显式登记。组件 Props 通过组件类型推导；业务输入类型使用公开具名类型。

```ts
import { Button, type ComboboxOption, type TransferDataItem } from 'brutx-ui-vue'
import { TreeSelect, type TreeNode, type SelectionMode } from 'brutx-ui-vue/tree-select'
import { Loading, vLoading } from 'brutx-ui-vue/loading'
import { useReducedMotion } from 'brutx-ui-vue/useReducedMotion'

type ButtonProps = InstanceType<typeof Button>['$props']
```

## 选择器辅助函数

`useClearableSelection`、`useSelectableTrigger`、`useSelectionDisplayText`、`useTransferPanelSelection` 属于组件内部实现，从根入口、组合式函数聚合入口和 npm 子路径移除。应用使用 Combobox、Cascader、TreeSelect、Transfer 的 props、v-model、事件和插槽完成选择交互。应用自定义的选择逻辑由应用维护，这四个函数没有一对一公共替代入口。

`ComboboxOption`、`CascaderOption`、`CascaderValue`、`TreeNode`、`SelectionMode`、`TransferDataItem` 继续公开。`useClearable`、`useDialogGeometry` 等已登记组合式函数保持公开。

CLI 源码安装仍包含上述内部 helper；组件 index 仅导出契约登记的符号。共享类型安装在组合式函数目录同级的 `types/` 下；配置 `sharedBase` 时安装到其 `types/` 子目录。升级源码组件时使用 CLI 的 diff/update 流程审查变更及本地修改保护。

## 按钮特效

`Button` 保留 `effect="glitch"`。`effect="none"` 下，即使设置 autoplay 或调用实例 `play()`，也不会启动特效。需要播放时先启用 `effect="glitch"`。禁用、loading、减少动态效果及 KeepAlive 停用都会约束播放，卸载释放资源。

独立使用 `useGlitchEffect` 时，显式 `play()` 的强制播放语义保持不变。`useReducedMotion({ enabled })` 支持响应式启停媒体监听；缺省启用。

## 样式消费

按子路径导入可以缩小 JavaScript 依赖闭包。样式仍通过 `brutx-ui-vue/style.css` 聚合交付，应单独计入成本。生产资源与字节口径见 [第三批验收报告](../reports/audits/第三批架构交付契约验收报告.md)。
