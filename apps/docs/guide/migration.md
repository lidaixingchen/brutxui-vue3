# 迁移指南

本文档记录 BrutxUI 的版本演进、公开 API 调整与破坏式变更迁移指引，帮助你平滑升级组件库。

---

## 概述与版本兼容性

BrutxUI 目前处于 `0.x` 快速迭代阶段。为了避免长期历史包袱，公开 API 会依据第一性原理持续精简并标准化。

| 变更模块 | 变更性质 | 影响范围 | 适用/引入版本 |
| --- | --- | --- | --- |
| **公开 API 契约收敛** | 结构优化 | 根入口导出的符号范围，子路径导入规则 | `v0.10.0+` |
| **Props 类型推导** | 推荐实践 | 组件 Props 类型定义方式 | `v0.10.0+` |
| **选择器内部 Helper** | 移除/收敛 | `useClearableSelection` 等内部函数 | `v0.10.0+` |
| **按钮动效（Glitch）控制** | 行为变更 | `Button` 特效属性与实例播放 | `v0.9.0+` |
| **CLI 源码安装类型落位** | 目录规范 | 源码安装模式下的共享类型生成路径 | `v0.9.0+` |
| **样式与产物消费** | 架构说明 | 子路径导入与样式文件分发边界 | 全版本 |

---

## 一、 公开 API 契约与规范导入

BrutxUI 采用统一的公开契约（API Contract）进行模块声明与导出投影。

### 1. 根入口与子路径

- **根入口 (`brutx-ui-vue`)**：导出基础通用组件（如 `Button`、`Card`、`Badge`、`Dialog` 等）、通用 variants 与无头工具函数。
- **具名子路径 (`brutx-ui-vue/<module>`)**：用于加载复合组件（如 `Combobox`、`TreeSelect`、`Cascader`、`DataTable` 等）及其专属业务类型与变体，亦用于独立 Composable（如 `brutx-ui-vue/useReducedMotion`）。

<<< @/.vitepress/examples/migration-api.ts#imports{ts}

### 2. Props 类型推导最佳实践

在以往版本中，部分组件单独导出了 `ButtonProps` 等命名类型。从 `v0.10.0` 起，为了确保类型始终与组件实现保持单一信源同步，**推荐使用 Vue 3 的 `InstanceType<typeof Component>['$props']`** 推导组件 Props 类型：

<<< @/.vitepress/examples/migration-api.ts#props-inference{ts}

---

## 二、 选择器内部 Helper 收敛

### 变更背景

在早期版本中，以下 4 个选择器相关的内部辅助函数曾被意外暴露于根入口或公共子路径：
- `useClearableSelection`
- `useSelectableTrigger`
- `useSelectionDisplayText`
- `useTransferPanelSelection`

这些函数属于组件内部私有实现细节，其实现与特定组件状态高度耦合。自 `v0.10.0` 起，它们已被从 npm 公共入口与公共子路径中正式移除。

### 迁移替代方案

应用层无需亦不建议直接调用这些内部 helper。所有的选择状态管理应完全通过对应组件（`Combobox`、`Cascader`、`TreeSelect`、`Transfer`）的标准 `v-model`、Props、插槽和事件来完成：

<<< @/.vitepress/examples/migration-api.ts#selector-usage{ts}

> [!NOTE]
> `ComboboxOption`、`CascaderOption`、`CascaderValue`、`TreeNode`、`SelectionMode`、`TransferDataItem` 等核心业务数据契约类型仍然保持公开，请从对应的子路径导入。

---

## 三、 按钮特效显式控制与生命周期

### 变更说明

自 `v0.9.0` 起，`Button` 组件对毛刺特效（Glitch Effect）的生命周期与触发条件进行了严格约束：
1. **显式启用**：必须显式声明 `effect="glitch"`。在默认的 `effect="none"` 状态下，即使配置了 `autoplay` 或通过模板引用调用实例的 `play()` 方法，特效也不会被启动。
2. **生命周期防护**：当按钮处于 `disabled`、`loading` 状态，或用户系统开启了 `prefers-reduced-motion`（减弱动态效果），或组件在 `<KeepAlive>` 中被停用时，特效将自动暂停；组件卸载时将彻底释放底层 WebGL / Canvas / Audio 资源。

<<< @/.vitepress/examples/migration-api.ts#button-effect{ts}

对于动效敏感场景，推荐配合 `useReducedMotion` 组合式函数进行平稳降级：

<<< @/.vitepress/examples/migration-api.ts#reduced-motion{ts}

---

## 四、 CLI 源码安装模式下的共享类型

通过 CLI（`brutx-vue add <component>`）采用源码引入模式的项目：
- 共享树型、选项等基础类型默认安装于项目 Composable 同级的 `types/` 目录下（如 `src/types/tree.ts`）。
- 若在 `brutx.json` 中配置了 `sharedBase`，则统一定位到该目录的 `types/` 下。
- 升级源码组件时，请使用 CLI 提供的 diff/update 流程进行版本审查，以保护你在本地对组件源码所做的个性化修改。

---

## 五、 样式消费与性能成本

BrutxUI 的样式是**集中编译为单一样式表**进行交付的：
- 通过按需子路径导入（如 `import { Combobox } from 'brutx-ui-vue/combobox'`）可以有效缩减最终构建产物的 JavaScript 依赖闭包。
- 但由于 Tailwind v4 新粗野主义设计令牌与原子类的聚合特性，样式表需在全局引入一次：
  ```ts
  import 'brutx-ui-vue/style.css'
  ```
- 评估构建成本时，应将 JS 树摇成果与 CSS 样式表体积分别独立核算。
