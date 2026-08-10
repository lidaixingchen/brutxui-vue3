# BrutxUI Composables 内部状态只读化重构方案

> 方案类型：重构
> 状态：done
> 日期：2026-08-10
> 落地说明：M1-M7 全量回归通过（完整套件 3371 + SSR 195 + typecheck 全绿）
> 关联文档：`.ocr-reports/ui-composables-part1.md` #27（内部可变状态直接暴露为可写引用）
> 目标范围：`packages/ui/src/composables/*`

---

## 1. 背景与问题

### 1.1 问题本质

多个 composable 将**内部维护的可变状态**（`Set`/`Array`/对象）直接暴露为可写引用。外部代码可绕过 composable 提供的修改方法：

- 原地修改集合/数组（`selectedRows.value.add(...)`、`checked.value.push(...)`）
- 直接替换引用（`sortState.value = {...}`、`toasts.value = []`）
- 写入绕过内部校验的非法值（如绕过 `selectable` 校验、`MAX_TOASTS` 上限、排序方向约束）

这破坏两类不变量：
1. **校验/语义不变量**：方法内建的约束（禁用态校验、上限裁剪、方向三态循环）被绕过。
2. **响应式更新不变量**：`ref` 深响应时原地改集合元素（`position.value.x = n`）虽能触发更新，但跳过内部 clamp 逻辑；`ShallowRef<Set>` 原地改则完全不触发更新。

### 1.2 已有范本

`useColorHistory` 已是正确形态的先行者：

```ts
export interface UseColorHistoryReturn {
    history: DeepReadonly<Ref<string[]>>
    addToHistory: (color: string) => void
    clearHistory: () => void
}
// 实现
return { history: readonly(history), addToHistory, clearHistory }
```

已实证 Vue `readonly()` 对 `Set`/`Array`/对象是**运行时深度只读代理**：`rs.value.add(...)` 与 `rs.value = newSet` 均被拦截（dev 警告 + 不生效，prod no-op 不生效），读操作 `.has()`/`.size`/spread 全部兼容。本次重构即把该模式推广到全库同类状态。

---

## 2. 改造原则

### 2.1 统一约定

> **内部可变 + 边界只读 + 仅方法修改。**

1. **内部保持可变**：composable 内部继续用 `ref`/`shallowRef`，更新一律 immutable 替换（现有代码绝大多数已是 `state.value = newValue` 模式，无需改内部）。
2. **返回边界只读化**：`return { state: readonly(state), ... }`。
3. **类型声明只读化**：集合/数组/对象状态改为 `DeepReadonly<Ref<T>>`（Vue 内置类型，与 `useColorHistory.history` 一致）；`ShallowRef<Set>` 改为 `Readonly<ShallowRef<ReadonlySet<K>>>`。
4. **写路径收敛**：外部只能通过 composable 返回的方法修改；缺失的修改方法在本方案中补齐。

### 2.2 分类标准（改 / 不改）

| 类别 | 判定 | 处置 |
|---|---|---|
| A. 内部维护的可变集合/对象 | 由 composable 自己创建、原地修改会破坏不变量 | **只读化** |
| B. 内部维护的标量状态 | `number`/`boolean`/`string`，有配套方法 | 只读化（P2，优先级低） |
| C. DOM 引用 ref | `containerRef`/`canvasRef`/`emblaRef`/`contentRef` 等 | **保持可写**（绑定语义） |
| D. 公开可绑定状态 | `open`/`displayValue`/`isOpen`/`theme`/`colorMode`/`currentPage` 等 v-model 风格 | **保持可写**（设计意图） |
| E. 入参 Ref | `useKanban.columns`、`useStepper.steps` 等由调用方传入的 Ref | 不属于返回状态，改调用方侧 |

---

## 3. 现状盘点

### 3.1 A 类候选（本次重构对象）

| composable | 状态 | 形态 | 已有修改方法 | 测试直写 | v-model 直写 | 优先级 |
|---|---|---|---|---|---|---|
| `useDataTableSelection` | `selectedRows` | `ShallowRef<Set>` | ✅ toggle/clear/getSelectedRows | 无 | 无 | **P0** |
| `useDataTableSort` | `sortState` | `Ref<DataTableSortState>` | ✅ toggleSort | 2 处 | 无 | **P0** |
| `useTransferPanelSelection` | `checked` | `Ref<TransferPanelKey[]>` | ✅ toggle/remove/prune/all | 1 处 | 待查（Transfer 组件） | **P0** |
| `useDataTableFilter` | `filterState` | `Ref<DataTableFilterState>` | ❌ 无 setter | 11 处 | ✅ DataTable.vue | **P1（高风险）** |
| `useToast` | `toasts` | `Ref<ToastItem[]>` | ✅ add/remove/clear | 无 | 无 | **P1** |
| `useDialogEnhanced` | `position`/`size`/`contentStyle` | `Ref<{...}>`/`Ref<CSSProperties>` | ⚠️ 拖拽/缩放方法，无独立 setter | 待查 | 待查 | **P1（决策点）** |
| `useColorHistory` | `history` | `DeepReadonly<Ref<string[]>>` | ✅ | — | — | **已完成（范本）** |

### 3.2 B 类候选（已全部纳入）

> 原为"可选、本次不强制"，经 M5 + M7 全部落地，仅 `useCanvasInteraction`/`useCarousel` 的部分内部标量因语义判定豁免。

- `useStepper.currentStep` ✅（M5，有 `goToStep`/`nextStep`/`previousStep`）
- `useFormFieldValidation.validationState` / `errorMessage` ✅（M5，有 `validate`/`reset`）
- `useKanban` 拖拽临时状态（`draggingCard`/`grabbedCard`/`dragOverColumn`/`isDragging`，标量/null）✅（M5）
- `useReducedMotion` 返回值（根依赖）✅（M7）
- `useAnimation.prefersReduced`、`useGlitchEffect.isActive`、`useCarouselEnhanced.autoplayProgress` ✅（M7）
- `useClearable.isHovering/isFocused`、`useClipboard.copied/isSupported` ✅（M7，均有配套方法）
- `useTheme.isSystemDark` ✅（M7，mediaQuery 驱动的系统派生状态）
- `useCanvasInteraction` / `useCarousel` 的若干内部标量：`isRevealed`/`selectedIndex` 等已只读化（M5）；`brushRadius`/`percentage`/`fadeDuration` 为公开配置入参、`ctx` 为能力引用，豁免

### 3.3 明确不改

- **C 类 DOM ref**：`useCanvasInteraction.containerRef/canvasRef`、`useCarousel.emblaRef`、`useDialogEnhanced.contentRef` 等。
- **D 类公开绑定**：`useColorPicker.open/displayValue`、`useDatePicker.open/displayValue`、`useDialog.isOpen`、`useTheme.theme/colorMode`、`useDataTablePagination.currentPage/currentPageSize`、`useDialogEnhanced.isDragging/isResizing`（行为开关）。
- **E 类入参 Ref**：`useKanban.columns`、`useStepper.steps`、`useClearable.modelValue` 等（调用方所有）。

---

## 4. 逐项改造方案

> 统一模式（以 `selectedRows` 为例）：
> ```ts
> // 返回类型
> selectedRows: Readonly<ShallowRef<ReadonlySet<string | number>>>
> // 实现
> return { selectedRows: readonly(selectedRows), ... }
> ```

### 4.1 P0：报告点名三件套（低风险）

**`useDataTableSelection.selectedRows`**（P0）
- 返回 `readonly(selectedRows)`；类型改 `Readonly<ShallowRef<ReadonlySet<string | number>>>`。
- 内部 `toggleRowSelection`/`toggleAllSelection`/`clearSelection` 已是 immutable 替换，无需动。
- 影响：DataTable.vue 仅读 `.has()`/`.size`，`defineExpose` 暴露只读 ref 兼容；测试无直写。

**`useDataTableSort.sortState`**（P0）
- 返回 `readonly(sortState)`；类型改 `Readonly<Ref<DataTableSortState>>`。
- 内部 `toggleSort` 已是整体替换（三态循环），无需动。
- 影响：DataTable.vue 仅读 `.value.column/.direction`；`useDataTableSort.test.ts` 2 处直写需改为用 `toggleSort` 构造状态（如 `toggleSort('name')` 两次达到 `direction:'desc'`）。

**`useTransferPanelSelection.checked`**（P0）
- 返回 `readonly(checked)`；类型改 `DeepReadonly<Ref<TransferPanelKey[]>>`（与 `history` 一致）。
- 内部 `handleAllCheckChange`/`toggleItem`/`removeKeys`/`pruneKeys` 已是 immutable 替换。
- 影响：需确认 Transfer 组件是否直接写 `checked.value`（见 §4.3 检查清单）；`useTransferPanelSelection.test.ts` 1 处直写适配。

### 4.2 P1：toasts 与 dialog 状态

**`useToast.toasts`**（P1）
- 返回 `readonly(toasts)`；类型改 `DeepReadonly<Ref<readonly ToastItem[]>>`。
- 内部 `addToast`/`removeToast`/`clearToasts` 已是 immutable 替换。
- 影响：Toast.vue 渲染仅读；测试无直写。

**`useDialogEnhanced.position/size/contentStyle`**（P1，**决策点见 §8**）
- 拖拽/缩放逻辑由内部 `onDragStart`/`onResizeStart` 维护并 clamp；`initPosition`/`initSize` 复位。
- 但**无独立 setter**：若外部需要"恢复上次位置"等自定义位置，目前只能直接写 `position.value`。
- 选项 A：只读化 + 新增 `setPosition({x,y})`/`setSize({w,h})`（把 bounds/min/max clamp 收进方法）。
- 选项 B：`position`/`size` 判定为"公开可配置状态"（D 类），仅只读化 `contentStyle`（纯派生样式，无方法）。
- 倾向 **A**，需评审确认。

### 4.3 P1：filterState（高风险，涉及 v-model 通信重构）

**`useDataTableFilter.filterState`**（P1）

现状更新链路（与只读化直接冲突）：
1. `DataTableColumnFilter.vue` 通过 `emit('update:filterState', newState)` 上报完整新状态；
2. `DataTable.vue` 用 `v-model:filter-state="filter.filterState.value"`（2 处）接收并写 `filterState.value`；
3. `DataTable.vue:340` `setGlobalFilter` 内联写 `filter.filterState.value = {...}`；
4. `DataTable.vue:422` `v-model="filter.filterState.value.global"`（全局搜索框双向绑定）；
5. `useDataTableFilter.test.ts` 11 处 `filterState.value.global = ...` / `filterState.value.columns = ...` 直写。

改造步骤：
1. `useDataTableFilter` 新增 setter：
   - `setGlobalFilter(value: string)`
   - `setColumnFilter(columnId: string, value: DataTableFilterValue)`
   - `setFilterState(state: DataTableFilterState)`（承接 DataTableColumnFilter 的完整对象上报）
   - `clearFilters()`（可选）
2. `DataTable.vue`：
   - `v-model:filter-state`（2 处）改为 `:filter-state="filter.filterState.value"` + `@update:filter-state="filter.setFilterState"`；
   - `v-model="filter.filterState.value.global"` 改为 `:value` + `@update:model-value="filter.setGlobalFilter"`；
   - `setGlobalFilter` 内联逻辑删除，改调 `filter.setGlobalFilter`。
3. `useDataTableFilter.test.ts` 11 处直写改调对应 setter。
4. 返回 `readonly(filterState)`；类型改 `DeepReadonly<Ref<DataTableFilterState>>`。

> 若评审认为 v-model 通信改造成本不可接受，可降级为：**保留 `filterState` 可写（D 类豁免）**，仅新增 setter 并文档声明"filterState 为受控状态，更新请走 setter"——作为已知限制记录。此为 §8 决策点二。

### 4.4 类型声明统一建议

- 集合/数组/对象状态：`DeepReadonly<Ref<T>>`（Vue 内置 `DeepReadonly`，`useColorHistory` 已用）。
- `ShallowRef<Set<K>>`：`Readonly<ShallowRef<ReadonlySet<K>>>`。
- 具体泛型以 `vue-tsc` 推断为准，避免手写与运行时不一致。

---

## 5. 消费方联动清单

| 文件 | 现状 | 改造 |
|---|---|---|
| `DataTable.vue` | 读 sortState/selectedRows；写 filterState（v-model + 内联） | filterState 改经 setter；其余只读消费不变 |
| `DataTableColumnFilter.vue` | emit 完整 filterState | 无需改（通信协议不变，只是接收方改 setter） |
| `Transfer.vue`（待确认） | `checked` 读写方式 | 若直写则改调方法 |
| `Toast.vue` | 只读渲染 toasts | 无需改 |
| `Kanban.vue`/`Stepper.vue`（若入 P2） | 拖拽/步骤状态 | 只读消费不变 |
| 各 `.test.ts` | 直写 ref | 改调方法（统计见 §3） |

---

## 6. Breaking 影响与兼容策略

- **Breaking 本质**：返回类型从 `Ref<T>`/`ShallowRef<Set>` 变为只读视图。只读消费（模板、`.value.map/.has/.size`）零影响；**直接写 ref 的下游编译期失败**——这正是期望的收敛。
- **发布时机**：当前 `0.9.x`（0.x 阶段 semver 允许 minor breaking）。建议随下一次 minor 一起发布，并在 CHANGELOG 标注"composables 状态只读化（breaking）"。
- **迁移指南**（发布说明）：写 ref → 改为调用对应方法（`toggleXxx`/`setXxx`/`clearXxx`）；只读消费无需改动。
- **豁免清单**：C/D/E 类（§3.3）明确不参与，避免误伤 v-model 与 DOM ref。

---

## 7. 测试与验证计划

1. **既有契约**：完整 UI 套件（当前 3372 测试）在改造后必须全绿。读路径兼容，失败只可能来自直写 ref 的测试（§3.1 已统计，逐一改调方法）。
2. **新增只读拦截测试**（dev 环境）：对每个只读化状态断言
   - `state.value = newValue` 被拦截（内层不变）；
   - `state.value.add()/push()/原地赋值` 被拦截；
   - 读操作 `.size/.has/.map` 正常。
3. **`vue-tsc --noEmit`**：验证类型声明与运行时一致，无 TS2358 等类型错误。
4. **pre-commit registry 重新生成**：改造不涉及组件结构，产物应不变（现有 hook 已覆盖）。
5. **SSR 冒烟**：`useColorHistory` 已是 readonly 形态且通过 ssr-smoke，确认其余无 SSR 差异。

---

## 8. 风险与决策点

### 决策点一：`useDialogEnhanced.position/size` 是否只读化
- **已决策（2026-08-10）**：**只读化**。补 `setPosition({x,y})` / `setSize({width,height})`；`contentStyle`（纯派生样式）一并只读化（类型修正为 `ComputedRef<CSSProperties>`，本就是 computed）。
- **实现修正**：`setPosition`/`setSize` **不强制 clamp**——与 `initPosition`/`initSize` 的"程序化精确设置"语义一致（`setSize(0,0)` 表示隐藏，不应被 `DIALOG_MIN_WIDTH_PX` 拦截）。bounds/min/max/aspectRatio 约束仅保留在拖拽/缩放交互路径（`onDragMove`/`onResizeMove`）；`constrainSize` 从 `onResizeMove` 抽取复用。

### 决策点二：`filterState` 的 v-model 通信改造
- **已决策（2026-08-10）**：**彻底方案**。DataTable 的 v-model 改只读 prop + setter 回调，`useDataTableFilter` 补齐 `setGlobalFilter`/`setColumnFilter`/`setFilterState`/`clearFilters`。

### 决策点三：B 类标量状态是否纳入
- **已决策（2026-08-10）**：**纳入**。B 类标量内部状态（currentStep/validationState/errorMessage/useKanban 拖拽状态等）一并只读化，作为 P2 阶段；执行时逐个判定"内部状态 vs 公开配置"，公开配置（如画笔半径）豁免。

### 风险
- `filterState` v-model 改造影响 DataTable 列过滤交互，需组件级验证（DataTable 有 filter 用例）。
- `readonly()` 在 **production 下是 no-op**（修改被静默丢弃而非抛错），类型层面已挡住编译期，运行时仍可能被强类型绕过（`as any`）；接受为已知边界。

---

## 9. 执行记录与里程碑（已完成）

| 里程碑 | 内容 | 提交 |
|---|---|---|
| M1 | P0 三件套（selectedRows/sortState/checked）只读化 + 测试适配 | `5695853f` |
| M2 | `useToast.toasts` 只读化 | `02e4709a` |
| M3 | `useDialogEnhanced` position/size 只读化 + 补 setter | `edeb706c` |
| M4 | `useDataTableFilter.filterState` 补 setter + DataTable v-model 改 setter 回调 | `66514cd0` |
| M5 | B 类标量状态只读化（validationState/currentStep/拖拽状态/selectedIndex/isRevealed） | `d96d4d13` |
| M6 | 全量回归 + 方案文档收尾 | 回归通过 |
| M7 | 同类遗留收尾：`messageStore` + 8 个 B 类标量只读化 | 见下 |

**回归基线**：完整套件 147 文件 / 3371 测试 + SSR 195 + `vue-tsc --noEmit` 全绿。相较 M1-M6 后 3366 测试净增 5 个（含用户提交的 data-table 列过滤/全局搜索 UI 链路测试）；M7 自身未删/增测试。

**M7（同类遗留收尾，2026-08-10）**——方案 §3 未覆盖的同类"内部可变状态暴露为可写 ref"：

| 状态 | 处理 | 测试适配 |
|---|---|---|
| `useMessage.messageStore`（A 类，模块级 `shallowRef<MessageItem[]>`） | 内部改名 `messageStoreRef` 保持可变，导出 `readonly(messageStoreRef)` 为 `DeepReadonly<Ref<MessageItem[]>>`（与 `useToast.toasts` 同构）；`addMessage`/`removeMessage`/`destroyMessageSystem` 操作内部 ref | 消费方 MessageContainer/测试仅读，零改动 |
| `useReducedMotion`（B 类，根依赖） | `readonly(prefersReduced)` + `Readonly<Ref<boolean>>` | `useReducedMotion.test`/`browser.test` 类型标注改 `Readonly<Ref<boolean>>` |
| `useAnimation.prefersReduced` | 转发只读视图，接口改 `Readonly<Ref<boolean>>` | `useAnimation.test` 6 处直写改 vi.mock `useReducedMotion` + 动态 import（vi.hoisted 引用 vue `ref` 触发 TDZ，改用惰性 vi.mock 工厂） |
| `useGlitchEffect.isActive` | `readonly(isActive)` | 消费方 Button 只读解构，零改动 |
| `useClearable.isHovering/isFocused` | `readonly()` + `Readonly<Ref<boolean>>` | 消费方 Input/SelectTrigger 不接收该状态，零改动 |
| `useClipboard.copied/isSupported` | `readonly()` + `Readonly<Ref<boolean>>` | 消费方 CopyToClipboard 只读，测试只读断言 |
| `useCarouselEnhanced.autoplayProgress` | `readonly()` | 消费方 Carousel 模板只读，测试只读断言 |
| `useTheme.isSystemDark` | `readonly()` + `Readonly<Ref<boolean>>` | `useTheme.test` 3 处直写改经 `initTheme` + `mockAddEventListener` 回调驱动（与 `onSystemDarkChange` 测试同模式） |

**关键修正**：

- `messageStore` 是**模块级**导出，不能像 composables 那样"内部可变 + 返回边界只读"——必须在模块内拆出 `messageStoreRef`（内部可变）+ 导出 `messageStore`（只读视图），否则内部写入也被拦截。
- `vi.hoisted` 回调引用 vue 的 `ref` 会在提升阶段触发 TDZ（`Cannot access '__vi_import_0__' before initialization`）；改用顶层 `let reducedMotionMock = ref(false)` + 惰性 `vi.mock` 工厂 + **动态 import** 被测模块，确保 ref 先于工厂初始化。

**执行中的关键修正**：

- `useCanvasInteraction.ctx` **豁免**：画布 2D 上下文是能力引用，外部绘制需写上下文属性，readonly 会拦截。
- `draggingColumn`（useKanban）在实现中从未被设置，其防御分支测试靠直写构造，readonly 后删除；如需列拖拽能力，应新增独立实现而非暴露可写 ref。
- `isRevealed`（useCanvasInteraction）在生命周期内只由 `revealAll` 置 true、无重置路径，依赖 `vm.isRevealed = false` 的测试删除；如需重置能力，应补 `resetReveal()` 方法。
- `DataTable` 的 `emit('filter')` 与 `DataTableColumnFilter` 的 prop 均改为接收/断言只读视图；`emit('update:filterState')` 的 columns 在构造处断言回可变类型。
