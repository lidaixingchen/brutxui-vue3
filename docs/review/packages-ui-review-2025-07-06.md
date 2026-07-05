# BrutxUI Vue3 `packages/ui` 全面审查报告

> 审查日期：2026-07-06  
> 审查范围：`packages/ui/src` 所有非测试源代码文件  
> 审查类型：代码审查 + 安全审查（并行）  
> 深度阅读文件数：42 个核心源文件  
> 安全模式搜索：13 类安全模式全覆盖  

---

## 一、代码审查结果

### 🔴 严重问题（5 个）

#### 1. useMessage 模块级全局状态无生命周期清理

- **文件**：`src/composables/useMessage.ts` (L33, L40-41, L57-70)
- **问题**：`messageStore`（shallowRef）、`timerMap`、`graceTimer`、`messageIdCounter` 均为模块级变量。`messageIdCounter` 持续递增从未重置，理论上有溢出风险；`scheduleGC()` 依赖 500ms 的定时器延迟销毁实例，但若在消息队列不为空时整个应用卸载，这些模块级状态无法自动清理。
- **修复建议**：为 `useMessage` 添加 `destroyMessageSystem()` 导出函数，在应用级 `onUnmounted` 中调用，清理所有定时器和消息状态。

#### 2. showDialog/showMessageBox 内存泄漏风险

- **文件**：`src/components/dialog/functional.ts` (L85-108, L162-192)
- **问题**：`showDialog` 和 `showMessageBox` 中创建的 `container`（DOM 元素）、`watch`、`vnode` 仅在 `isOpen` 变为 false 后通过 `setTimeout(destroy, 300)` 延迟清理。若调用方在 dialog 仍然打开时卸载了组件或页面，这些资源将不会被清理。`rejectPromise('close')` 仍在 pending 状态的 Promise 也可能产生未处理的 rejection。
- **修复建议**：在返回的对象中暴露一个 `destroy()` 方法，依赖调用方在卸载时主动调用；或将 dialog 挂载到调用组件的 DOM 沙箱中。

#### 3. useToast fallbackInstance 缺少自动销毁

- **文件**：`src/composables/useToast.ts` (L210-217, L225-235)
- **问题**：`fallbackInstance` 和 `destroyFallback` 已导出，但 `destroyFallback` 在组件卸载时不会被自动调用。若应用从使用 `provideToast()` 切换到 fallback 模式，全局单例将继续持有 timerMap 中的定时器引用，造成内存泄漏。
- **修复建议**：在插件卸载或应用销毁时自动调用 `destroyFallback()`。

#### 4. useTheme fallbackInstance 类似全局状态泄漏

- **文件**：`src/composables/useTheme.ts` (L169-201)
- **问题**：`fallbackInstance` 创建时自动调用 `initTheme()`，注册了 `MediaQueryList` 事件监听器。`destroyFallback` 已导出，但同 `useToast.ts` 一样，没有在卸载时自动调用。
- **修复建议**：确保在应用级别提供统一的卸载钩子。

#### 5. ~~Toast.vue `startTime` 模块级变量多实例共享~~ ❌ 误报

- **文件**：`src/components/toast/Toast.vue` (L49)
- **代码**：
  ```typescript
  let startTime = 0  // 模块级，所有 Toast 实例共享
  ```
- **问题**：当多个 Toast 同时存在时，`pauseTimer()` 和 `resumeTimer()` 共享 `startTime`，导致 pause/resume 计时完全错乱。
- ~~**修复建议**：将 `startTime` 改为 `ref(0)` 或在组件 `setup` 内使用局部变量。~~
- **误报原因**：文件使用 `<script setup>`，Vue 3 将其编译到 `setup()` 函数内，`let startTime` 已是组件实例级变量，不存在多实例共享问题。

---

### 🟡 中等问题（10 个）

#### 6. 跨文件硬编码常量分散 — 应统一到 defaults.ts

| 文件 | 行号 | 硬编码值 |
|------|------|---------|
| `components/toast/ToastContainer.vue` | 9-11 | `DEFAULT_MAX_VISIBLE=5`, `DEFAULT_GAP=12` |
| `components/glitch-text/GlitchText.vue` | 32-33 | `AUTOPLAY_ACTIVE_DURATION_MS=1000`, `MIN_INTERVAL_MS=50` |
| `composables/useCanvasInteraction.ts` | 3-6 | `SAMPLE_GRID_SIZE=8`, `PROGRESS_CHECK_INTERVAL=10`, `PROGRESS_THROTTLE_MS=150` |
| `composables/useAudioEngine.ts` | 4-22 | 15 个 `TYPE_*`/`SUCCESS_*`/`FAIL_*` 音频常量 |
| `composables/useMessage.ts` | 35-36 | `DEFAULT_DURATION=3000`, `GRACE_PERIOD_MS=500` |
| `components/hardcore-input/HardcoreInput.vue` | 87 | `setTimeout(..., 10)` shake 动画延迟 |

**修复建议**：将这些跨文件共用的配置值统一迁移到 `lib/defaults.ts` 中，使其成为可维护的单一来源。

#### 7. dialog/functional.ts 硬编码过渡延迟

- **文件**：`src/components/dialog/functional.ts` (L107, L190)
- **问题**：`setTimeout(destroy, 300)` 出现两次，300ms 硬编码。如果 CSS 过渡时间被修改，此处会不同步。
- **修复建议**：从 `lib/defaults.ts` 引入共享常量。

#### 8. render-imperative.ts 默认 transitionDuration 硬编码

- **文件**：`src/lib/render-imperative.ts` (L67)
- **代码**：`const delay = options.transitionDuration ?? 300`
- **修复建议**：提取为 `DEFAULT_TRANSITION_DURATION_MS` 常量到 `lib/defaults.ts`。

#### 9. DataTable 列宽缺失警告重复触发

- **文件**：`src/components/data-table/DataTable.vue` (L239)
- **问题**：`gridTemplateColumns` 是一个 computed，每次访问时如果列没有显式 width，就会 `console.warn`。在虚拟滚动渲染过程中，每行每列都可能触发这个警告。
- **修复建议**：用 Set 记录已警告的列 ID，每个列只警告一次。

#### 10. useKanban 移动函数返回值未被消费

- **文件**：`src/composables/useKanban.ts` (L141-182)
- **问题**：`moveCardInColumn`、`moveCardToAdjacentColumn`、`moveColumn`、`onDrop` 都返回 `newColumns`，但这些函数是通过键盘事件触发的，调用方在模板或键盘处理函数中不会自动消费这些返回值来更新响应式数据，导致 UI 不会更新。
- **修复建议**：这些函数应直接修改 `options.columns.value` 或提供一个 `onUpdate:columns` emit 回调。

#### 11. useDataTableFilter `as any` 类型断言

- **文件**：`src/composables/useDataTableFilter.ts` (L55, L73)
- **代码**：
  ```typescript
  const filterArr = filterValue as any[]   // line 55
  const obj = filterValue as any           // line 73
  ```
- **问题**：使用了 `eslint-disable` 注释绕过类型检查。`DataTableFilterState` 的 `columns` 类型不够精确。
- **修复建议**：改进 `DataTableFilterState` 的类型定义，使 `columns` 的值为联合类型而非宽泛的 `unknown`。

#### 12. Cascader handleItemClick 中重复代码

- **文件**：`src/components/cascader/Cascader.vue` (L271-277)
- **问题**：`handleItemClick` 和 `handleMouseEnter` 前三行代码完全重复（设置 activeColumnIndex、activeItemIndex 和 activePath），可提取为辅助方法。

#### 13. Transfer 模板中硬编码尺寸

- **文件**：`src/components/transfer/Transfer.vue` (L213, L302)
- **代码**：`class="flex flex-col w-[260px] h-[400px] ..."`
- **修复建议**：改为 props 或 CSS 变量，增强灵活性。

#### 14. Watermark 使用已废弃的 `unescape()`

- **文件**：`src/components/watermark/Watermark.vue` (L83-84)
- **代码**：`window.btoa(unescape(encodeURIComponent(svg)))`
- **问题**：`unescape()` 在 JavaScript 中已被废弃。
- **修复建议**：使用 `TextEncoder` + base64 或纯 `btoa` + 正确处理 UTF-8 的方式。

#### 15. getRowKey 非 string/number 用 `String()` 转换

- **文件**：`src/composables/useDataTableSelection.ts` (L30-32)
- **问题**：`String()` 转换可能导致不同行的 key 意外相同。
- **修复建议**：对于非基础类型，使用 `JSON.stringify()` 或要求用户提供自定义 key 提取函数。

---

### 🟢 建议（7 个）

| # | 问题 | 文件 |
|---|------|------|
| 16 | `color.ts` 中魔法数字（60, 360, 100, 255）未引用 `defaults.ts` | `src/lib/color.ts` |
| 17 | `DEFAULT_PAGE_SIZE = 10` 与 `defaults.ts` 中 `DEFAULT_PAGE_SIZE_OPTIONS[0]` 隐式重复 | `src/composables/useDataTablePagination.ts` |
| 18 | `DEFAULT_AUTOPLAY_DELAY = 3000` 与 `defaults.ts` 重复 | `src/composables/useCarousel.ts` |
| 19 | 部分组件（GlitchButton 等）缺少 `prefers-reduced-motion` 适配 | 多个组件 |
| 20 | Cascader checkbox `checked` 表达式重复求值三次 `getOptionCheckState` | `src/components/cascader/Cascader.vue` (L465) |
| 21 | Cascader `open` computed setter 事件时序不一致 | `src/components/cascader/Cascader.vue` (L72-78) |
| 22 | Breadcrumb、Stepper、Slider 等组件键盘支持不完整 | 多个组件 |

---

## 二、安全审查结果

扫描覆盖 13 类安全模式：XSS、代码注入、敏感信息泄露、不安全随机数、客户端安全、URL 安全、原型污染、iframe 嵌入、路径遍历、Cookie 安全等。

### 🟡 中等风险（4 项）

| # | 问题 | 文件 |
|---|------|------|
| S1 | **Watermark SVG 注入风险** — SVG 内容直接拼接到 DOM，若 watermark text 来自用户输入可能 XSS | `src/components/watermark/Watermark.vue` |
| S2 | **UploadFileItem 潜在内存泄漏** — 文件预览 URL（`createObjectURL`）未调用 `revokeObjectURL` 释放 | `src/components/upload/UploadFileItem.vue` |
| S3 | **`v-html` 使用点** — 部分组件使用 v-html，需确保输入已转义 | 相关 Vue 组件 |
| S4 | **`Math.random()` 使用场景** — 非加密场景使用可接受，但需确认无安全上下文使用 | 多个文件 |

### 🟢 低风险（5 项）

| # | 问题 |
|---|------|
| L1 | `console.log/warn` 在开发模式下的使用（生产环境应移除） |
| L2 | `localStorage` 使用（确认无敏感数据存储） |
| L3 | 部分 `Object.assign` / 展开运算符使用（需关注原型污染风险） |
| L4 | `window.open` / `window.location` 使用（需确认无 URL 注入风险） |
| L5 | 动态样式设置（需确认无 CSS 注入风险） |

---

## 三、代码亮点

审查过程中也发现以下已做得很好的方面：

1. **SSR 安全防护**：所有浏览器 API 调用前都通过 `isClient` / `hasDocument` 进行环境检测。
2. **响应式优化**：DataTable 的 `expandedRowKeys`、`selectedRows`、TreeNode 的 `expandedIds` 正确使用了 `shallowRef<Set>` 避免深层响应式开销。
3. **国际化完善**：所有组件都通过 `useLocale()` 提供 `t()` 翻译函数，支持中英文。
4. **键盘导航**：Cascader、Combobox、TreeView、Transfer 等复杂组件提供了完整的箭头键导航和 ESC 关闭。
5. **ARIA 属性**：DataTable（`role="grid"`、`aria-sort`）、Toast（`role="alert"`、`aria-live`）、TreeView（`role="tree"`）的 ARIA 属性较完善。
6. **动画降级**：`useReducedMotion` composable 在 Carousel、GlitchText、InfiniteScroll 中正确使用。
7. **生命周期清理**：大部分 composable（useCarousel、useDebounce、useThrottle、useClipboard）都在 `onUnmounted` 中正确清理了定时器和事件监听器。
8. **默认值管理**：`lib/defaults.ts` 已经集中了大部分全局配置常量。

---

## 四、修复优先级建议

### 第一优先级（严重问题）
1. ~~Toast.vue `startTime` 模块级变量 → 误报，已排除~~
2. ✅ useMessage 添加 `destroyMessageSystem()` 清理函数
3. ✅ showDialog/showMessageBox 暴露 `destroy()` 方法
4. ✅ useToast / useTheme fallbackInstance 自动销毁机制（注册 `beforeunload`）

### 第二优先级（中等问题 + 安全中度风险）
5. ✅ 跨文件硬编码常量统一迁移至 `defaults.ts`
6. ✅ useKanban 返回值消费问题修复（直接更新 `options.columns.value`）
7. ✅ Watermark SVG 注入风险修复 + 废弃 `unescape()` 替换
8. ✅ UploadFileItem `revokeObjectURL` 补充
9. ✅ DataTable 重复 console.warn 优化（`warnedColumns` Set 去重）

### 第三优先级（建议优化）
10. ✅ 常量去重（DEFAULT_PAGE_SIZE、DEFAULT_AUTOPLAY_DELAY 等）
11. ✅ `as any` 类型断言改进（引入 `DataTableFilterValue` 联合类型）
12. ⏸️ `prefers-reduced-motion` 补全（需逐组件排查，工作量极大，留待后续）
13. ⏸️ 键盘导航补全（Breadcrumb、Stepper、Slider）（需逐组件排查，留待后续）
14. ✅ Cascader 性能优化（新增 `getCheckboxChecked` 缓存 `getOptionCheckState` 结果）
15. ✅ Cascader `open` computed setter 时序修正（仅在非受控模式下更新 internalOpen）
16. ✅ Cascader `handleItemClick`/`handleMouseEnter` 重复代码提取为 `setActiveItem`
17. ✅ Transfer 模板硬编码尺寸改为 `panelWidth`/`panelHeight` props
18. ✅ `getRowKey` 非 string/number 改用 `JSON.stringify` 提供稳定身份
19. ⏸️ `color.ts` 魔法数字（60/360/100/255 是 RGB/HSV 颜色空间数学常量，不属于配置默认值，不迁移）

---

## 五、修复验证

- **类型检查**：`pnpm typecheck` ✅ 全部通过
- **Lint**：`pnpm lint` ✅ 0 errors（49 个 pre-existing warnings）
- **测试**：`pnpm test` ✅ 3377 passed / 158 files / 0 failures
- **构建**：`pnpm build` ✅ 成功
- **完整门禁**：`pnpm release:check` ✅ "Release check passed."
