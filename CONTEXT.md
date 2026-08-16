# 领域词汇表 (Domain Glossary) — BrutxUI Vue 3

本文件记录 BrutxUI Vue 3 核心架构与底层基础设施的通用领域术语（Ubiquitous Language）。

---

## 核心架构与基础设施 (Infrastructure & Architecture)

### 命令式宿主控制器 (Imperative Host Controller)
- **定义**：负责在 Vue 主应用根节点之外动态创建、挂载、调度和安全销毁 UI 弹层的全生命周期深模块（Deep Module）。
- **职责**：
  - 统一管理宿主 DOM 容器（`<div>`）的生命周期与自动垃圾回收（GC）。
  - 自动捕获与继承 Vue `appContext`（支持局部组件树上下文与全局 App 上下文回退）。
  - 驱动基于定时器与 `<Transition>` 钩子的优雅离场动画与内存清理。
  - 屏蔽 SSR 环境差异与能力缺失。

### 弹层栈管理器 (Active Overlay Stack Manager)
- **定义**：位于命令式宿主控制器内部的后进先出（LIFO）活动弹层调度器。
- **职责**：
  - 维护当前页面活跃弹层实例列表。
  - 基于设计令牌（Design Tokens）基础层级自动分配递增的 `z-index`。
  - 将全局键盘事件（如 `ESC` 键关闭）与遮罩点击事件精确路由分发给栈顶（Topmost）弹层。
  - 在弹层销毁时自动退栈并协调焦点归还。

### 弹层实例句柄 (Overlay Instance Handle)
- **定义**：调用命令式挂载接口时同步返回的控制实体。
- **结构**：
  - `close()`：触发弹层优雅关闭动画。
  - `destroy()`：立即强制销毁 DOM 节点与清理定时器（幂等）。
  - `promise`：承载用户最终交互决策结果的 Promise 对象（非拒绝状态机，通过 `{ action: 'confirm' | 'cancel' | 'destroy', value?: any }` 表达终态）。

---

## 领域实体与组件 (Domain Entities & Components)

### 对话框 (Dialog)
- **定义**：用于承载复杂自定义内容、支持自由拖拽（Draggable）与缩放（Resizable）的高级交互浮层。
- **归属**：`packages/ui/src/components/dialog/`，属于 `overlay` 类别。

### 消息弹框 (MessageBox)
- **定义**：用于执行确定性操作确认、系统重要告警提示（Alert）或轻量文本输入（Prompt）的标准结构化反馈浮层。
- **特性**：具备明确的语义状态（info / success / warning / error）、内建输入校验器（`inputPattern`）以及标准确认/取消动作。
- **归属**：`packages/ui/src/components/message-box/`，属于 `feedback` 类别，与 Dialog 完全正交解耦。
