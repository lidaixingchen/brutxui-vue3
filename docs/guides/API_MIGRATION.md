# 公开 API 迁移指南

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
