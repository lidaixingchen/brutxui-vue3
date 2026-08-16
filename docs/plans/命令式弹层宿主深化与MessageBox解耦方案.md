# 命令式弹层宿主深化与MessageBox解耦方案

> 方案类型：底层架构重构与模块深化
> 状态：**active**
> 日期：2026-08-17
> 关联文档：[架构优化方案-v3](架构优化方案-v3.md)；[CONTEXT.md](../../CONTEXT.md)；[VISUAL_SYSTEM.md](../guides/VISUAL_SYSTEM.md)
> 修订记录：
> - 2026-08-17：初稿定稿。确立全生命周期 Imperative Overlay Host 核心模块、剥离独立 MessageBox 组件、规范确定性 Promise 句柄契约与自动 AppContext 继承机制。
> - 2026-08-17：审查修订。补充两阶段受控关闭（Two-Phase Controlled Closing）时序与 GC 调度机制；收敛 `z-index` 步进常量至 `defaults.ts`；明确 ESC 路由与 Reka UI 事件协同策略；纠偏 `message-box/index.ts` 自动生成规则；补齐 `MessageBoxLocale` 多语言与 Composable 状态只读（Readonly）契约。

---

## 一、 背景与第一性原理

### 1. 现状痛点分析

在 BrutxUI Vue 3 当前的底层基础设施中，命令式 UI 弹层挂载链路存在明显的**浅模块（Shallow Module）**与**职责泄漏（Leakage）**问题：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          当前命令式挂载架构现状                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. packages/ui/src/lib/render-imperative.ts (浅模块 & 时序脆弱)             │
│    ├─ 仅 89 行，只做 document.body.appendChild 与 render(vnode, container)  │
│    ├─ destroy() 时立即 render(null) 导致 Vue Transition 离场动画被瞬间切断  │
│    └─ 缺少层级管理、ESC 键盘路由、多实例活动栈与 Promise 状态机调度         │
│                                                                             │
│ 2. packages/ui/src/components/dialog/functional.ts (职责膨胀与边界倒置)      │
│    ├─ 重复手写 DOM 创建、过渡定时器与 GC 逻辑（397 行）                     │
│    ├─ 强行塞入 MessageBox / Alert / Prompt 表单校验（inputPattern/error）   │
│    └─ 导致 Dialog 模块反向依赖 Button / Input 组件                          │
│                                                                             │
│ 3. packages/ui/src/composables/useMessageBox.ts & useDialog.ts (浅层透传)   │
│    ├─ 仅作为极其单薄的 pass-through wrapper 转发给 dialog/functional        │
│    └─ useDialog 的 isOpen 状态未完全实施只读封装，且 API 对称性不足         │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **宿主层过于浅薄且时序脆弱，导致消费方重复造轮子**：
   `render-imperative.ts` 接口暴露面过小且无行为深度。在调用 `destroy()` 时立即执行 `render(null, container)` 会强制销毁 Vue 组件树，导致组件内的 `<Transition>` 离场动画被切断，动画无法完整展现；调用方必须在外部自行管理过渡时序、关闭延时定时器与 Promise 闭包，造成严重的逻辑复制与潜在泄漏。
2. **Dialog 与 MessageBox 领域边界严重耦合**：
   MessageBox 本质上属于结构化反馈浮层（Feedback），而 Dialog 属于通用容器与拖拽浮层（Overlay）。将 MessageBox、Prompt 输入框与按钮校验逻辑硬编码在 Dialog 内部，破坏了模块正交性并造成反向依赖。
3. **缺少统一的多实例层叠（z-index）与 ESC 路由机制**：
   当多层弹窗或 MessageBox 嵌套出现时，各实例独立挂载，缺少后进先出（LIFO）的统一调度栈，导致 ESC 按键事件无法精准分发给栈顶活跃弹层，且容易与 Reka UI 底层的 `DismissableLayer` 发生事件穿透或冲突。

---

## 二、 架构设计与核心契约

### 1. 全生命周期宿主深模块（Imperative Overlay Host）

将 `render-imperative.ts` 重构升级为深模块控制器，对外暴露简洁确定的单一 Seam：

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Callers & Composables                           │
│     useDialog()        useMessageBox()       useMessage()   useToast() │
└────────────┬───────────────────┬───────────────────┬─────────────┬─────┘
             │                   │                   │             │
             ▼                   ▼                   ▼             ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Imperative Overlay Host Controller (深模块 Seam)         │
│  • mountOverlay(component, propsFactory, options): OverlayHandle<T>    │
│  • 自动 AppContext 继承 (options.appContext ?? globalAppContext)       │
│  • Active Overlay Stack Manager (LIFO 栈 / z-Index 步进 / ESC 路由)    │
│  • 两阶段受控关闭 (Two-Phase Controlled Closing) & 动画安全 GC 清理     │
│  • SSR 安全门禁 (环境探测统一守卫)                                      │
└────────────────────────────────────────────────────────────────────────┘
```

#### 核心机制设计：

1. **两阶段受控关闭与 GC 时序（Two-Phase Controlled Closing）**：
   - **Phase A（触发关闭 / 动画阶段）**：调用 `handle.close()` 时，宿主将注入给组件的响应式 `open` 状态更新为 `false`，由组件驱动 `<Transition>` 或 `DialogRoot` 的离场动效。
   - **Phase B（物理 GC 阶段）**：宿主等待过渡动画完成（通过 `transitionDuration` 守护定时器或组件触发的 `after-leave` 钩子），再执行 `render(null, container)` 并在微任务/下个事件循环安全移除 DOM 容器节点（`container.remove()`），从根本上保证离场动画完整展示且零内存泄漏。
2. **活动弹层栈（Active Overlay Stack）与 ESC 精准路由**：
   - 内部维护全局 LIFO 活动栈。后开弹层基于基准值与步长自动计算递增 `z-index`。
   - 基准常量收敛在 `packages/ui/src/lib/defaults.ts`（`DEFAULT_OVERLAY_Z_INDEX = 1000`，`OVERLAY_Z_INDEX_STEP = 10`），杜绝魔法数字。
   - 宿主统一监听顶层 `keydown` 事件（捕获阶段），当按 `ESC` 且栈顶弹层允许 ESC 关闭（`enableEsc !== false`）时，精准触发栈顶活跃实例的 `close()` 并阻止事件冒泡（`e.stopPropagation()`），避免与底层 Reka UI `DismissableLayer` 或声明式弹层冲突。
3. **自动 AppContext 继承**：
   - 优先级：`options.appContext ?? getCurrentInstance()?.appContext ?? getGlobalAppContext()`。无论在组件 setup 内还是在独立 pinia store、业务工具函数中调用，均能无缝继承 i18n 与主题上下文。
4. **SSR 安全门禁**：
   - 统一由 `canUseDocumentBody()` 守卫。在非客户端环境下直接返回安全的空操作句柄与已兑现的 Promise。

```typescript
export interface MountOverlayOptions {
    appContext?: AppContext
    transitionDuration?: number
    zIndex?: number
    enableEsc?: boolean
    onClose?: () => void
    onDestroy?: () => void
}

export interface OverlayInstanceHandle<R = unknown> {
    close: () => void
    destroy: () => void
    promise: Promise<R>
}
```

---

### 2. MessageBox 独立领域模块设计

在 `packages/ui/src/components/message-box/` 下构建独立的组件与调度体系：

- **原语与组件复用**：
  基于 Reka UI 原语及库内已有组件搭建（组合 `DialogRoot`、`DialogOverlay`、`DialogContent`、`Button`、`Input`），严禁使用原生模态或生写遮罩。
- **`MessageBox.vue`**：
  符合 Neo-Brutalist 风格的结构化确认对话框，内建类型图标（`info` | `success` | `warning` | `error`）、内容渲染、可选 Input 输入框与实时正则校验（`inputPattern`）。
- **`message-box-variants.ts`**：
  提取状态图标、边框与操作按钮的 CVA 变体。
- **`functional.ts`**：
  - `showMessageBox(options): MessageBoxInstance`
  - 便捷异步方法：`showConfirm(options): Promise<boolean>`、`showAlert(message, options): Promise<void>`、`showPrompt(message, options): Promise<MessageBoxResult>`。
- **国际化（i18n）**：
  在 `packages/ui/src/locales/types.ts` 定义 `MessageBoxLocale` 契约，并在 `zh-CN.ts` 与 `en.ts` 中补齐默认词条（`confirm`、`cancel`、`inputError` 等），通过 `pnpm check:i18n` 门禁校验。
- **COMPONENTS 元数据注册**：
  在 `packages/shared/src/components.ts` 中注册 `message-box`（`category: 'feedback'`, dependencies: `['reka-ui', '@lucide/vue']`）。
- **组件索引文件生成**：
  遵循 `AGENTS.md` 规范，通过 `pnpm prebuild:component-index` 自动生成 `packages/ui/src/components/message-box/index.ts`，禁止手动创建。

---

### 3. 确定性返回值契约（OverlayInstanceHandle）

所有交互型弹层统一返回混合句柄对象：

```typescript
export type MessageBoxAction = 'confirm' | 'cancel' | 'destroy'

export interface MessageBoxResult {
    /** 关闭路径：confirm=确认按钮；cancel=取消/ESC/遮罩/关闭按钮；destroy=手动销毁 */
    action: MessageBoxAction
    /** 输入框确认时的值（showInput / showPrompt 场景） */
    value?: string
}
```

- **非拒绝状态机（Non-rejecting）**：无论用户点击确认、取消、ESC 键还是遮罩关闭，均以明确的对象 `{ action, value }` 兑现（resolve），彻底消除控制台未捕获的 UnhandledPromiseRejection。
- **异常边界防御**：若组件在 setup 或挂载期抛出未捕获的运行时异常，句柄将把错误向外抛出或 reject，保证异常可观测。

---

### 4. 组合式函数（Composables）规范与只读契约

- **`useMessageBox.ts`**：
  提供与 `functional.ts` 完全对称的组合式 API：
  ```typescript
  export interface UseMessageBoxReturn {
      show: (options?: MessageBoxOptions) => MessageBoxInstance
      alert: (message: string, options?: MessageBoxOptions) => Promise<void>
      confirm: (message: string | MessageBoxOptions, options?: MessageBoxOptions) => Promise<boolean>
      prompt: (message: string | MessageBoxOptions, options?: MessageBoxOptions) => Promise<MessageBoxResult>
  }
  ```
- **`useDialog.ts`**：
  返回的响应式状态 `isOpen` 强制通过 `readonly(isOpen)` 暴露为 `Readonly<Ref<boolean>>`，符合 Composable 边界只读规范。

---

## 三、 实施阶段与任务拆解

### 阶段一：宿主深模块核心构建与单测（Phase 1）
1. [ ] 在 `packages/ui/src/lib/defaults.ts` 中定义 `DEFAULT_OVERLAY_Z_INDEX` 与 `OVERLAY_Z_INDEX_STEP` 常量。
2. [ ] 重构 `packages/ui/src/lib/render-imperative.ts`，实现 `mountOverlay`、两阶段关闭时序、LIFO 活动栈、z-index 步进与 ESC 路由。
3. [ ] 编写 `packages/ui/src/lib/render-imperative.test.ts`，全面验证多实例栈、ESC 分发、受控动画时序、自动 GC 与 SSR 安全性。

### 阶段二：MessageBox 独立组件与 Functional 建设（Phase 2）
1. [ ] 在 `packages/ui/src/locales/` 中补齐 `MessageBoxLocale` 类型定义与中英文语言包。
2. [ ] 创建 `packages/ui/src/components/message-box/message-box-variants.ts`。
3. [ ] 创建 `packages/ui/src/components/message-box/MessageBox.vue`（复用 Reka UI 原语与 DialogContent / Button / Input）。
4. [ ] 创建 `packages/ui/src/components/message-box/functional.ts`（接入 `mountOverlay`）。
5. [ ] 运行 `pnpm prebuild:component-index` 自动生成 `packages/ui/src/components/message-box/index.ts`。
6. [ ] 编写 `packages/ui/src/components/message-box/message-box.test.ts`。

### 阶段三：Dialog 纯粹化与去耦合重构（Phase 3）
1. [ ] 重构 `packages/ui/src/components/dialog/functional.ts`，移除所有 MessageBox 逻辑与反向依赖，全面接入 `mountOverlay`。
2. [ ] 更新 `packages/ui/src/components/dialog/functional-dialog.test.ts`。

### 阶段四：Composables、Shared 与包导出更新（Phase 4）
1. [ ] 重构 `packages/ui/src/composables/useMessageBox.ts`，对接 `message-box/functional`，补齐 `alert` / `confirm` / `prompt`。
2. [ ] 重构 `packages/ui/src/composables/useDialog.ts`，落实 `isOpen` 的 `Readonly<Ref<boolean>>` 规范。
3. [ ] 更新 `packages/ui/src/composables/useMessage.ts`，接入统一的宿主能力。
4. [ ] 在 `packages/shared/src/components.ts` 中注册 `message-box` 元数据。
5. [ ] 更新 `packages/ui/src/index.ts` 导出。

### 阶段五：最小化自检与门禁校验（Phase 5）
1. [ ] 运行 `pnpm check:i18n` 确保多语言词条 100% 完整。
2. [ ] 运行 `pnpm --filter brutx-ui-vue test src/lib/render-imperative.test.ts` 与相关组件单测。
3. [ ] 运行 `pnpm --filter brutx-ui-vue typecheck` 与 `pnpm --filter brutx-shared-vue typecheck`。
4. [ ] 运行 `node scripts/docs/check-doc-links.mjs check` 确保文档链接 100% 畅通。

---

## 四、 收益与验证指标

| 维度 | 重构前 (Before) | 重构后 (After) | 收益类型 |
| :--- | :--- | :--- | :--- |
| **代码内聚性 (Locality)** | DOM 挂载、过渡定时器与 GC 散落在 4+ 个文件中 | 集中收敛在 `render-imperative.ts`（`mountOverlay`）宿主控制器中 | **Locality** |
| **复用杠杆率 (Leverage)** | Dialog 与 MessageBox 各自重复实现挂载与状态机 | 1 个宿主接口同时驱动 Dialog / MessageBox / Message / Toast | **Leverage** |
| **模块正交性 (Depth)** | Dialog 强依赖 Button/Input 与表单正则校验（397 行） | Dialog 纯粹化（行数缩减 75%），MessageBox 独立为 Feedback 组件 | **Depth** |
| **时序与动画保真** | `destroy()` 立即销毁组件树导致离场动效被直接切断 | 两阶段受控关闭机制保证 Leave 动画完整播放后再执行物理 GC | **Reliability** |
| **交互确定性** | 多弹层下 ESC 键盘事件冲突，层级 z-index 容易错乱 | 集中式 LIFO 栈管理 + 规范常量步进 + 精确路由至栈顶活跃实例 | **Reliability** |
