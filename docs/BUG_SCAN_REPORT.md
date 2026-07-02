## Bug Scan Report — 2026-07-02

全面扫描 `packages/ui/` 下组件、composables 和工具函数，共发现 **12 个 bug**（1 Critical / 3 High / 6 Medium / 2 Low），已全部修复。

基础门禁状态：lint 0 error · typecheck pass · 3330 test pass。

---

### Critical

#### 1. CarouselEnhanced 完全不可用 — 缺少 emblaRef ✅

**文件：** `packages/ui/src/components/carousel/CarouselEnhanced.vue`

**问题：** 解构 `useCarouselEnhanced()` 时遗漏了 `emblaRef`，template 中 `ref="emblaRef"` 无绑定变量，embla 永远无法初始化。轮播、指示器、自动播放全部失效。

**修复：** 解构中加入 `emblaRef`，添加 `@ts-expect-error` 抑制 vue-tsc TS6133 误报（与 Carousel.vue 保持一致）。

---

### High

#### 2. DialogEnhanced destroyOnClose 属性失效 — 条件恒为 true ✅

**文件：** `packages/ui/src/components/dialog/DialogEnhanced.vue`

**问题：** `!destroyOnClose || true` 恒为 true，slot 内容永远渲染，`destroyOnClose` prop 形同虚设。

**修复：** 通过 `injectDialogRootContext(null)` 获取 dialog 打开状态，条件改为 `v-if="!destroyOnClose || dialogContext?.open.value"`。`destroyOnClose=true` 且 dialog 关闭时不渲染 slot 内容。传入 `null` 作为 fallback 以支持独立使用场景。

#### 3. Form provide 传递快照而非响应式引用 — prop 变更不传播 ✅

**文件：** `packages/ui/src/components/form/Form.vue`、`form-context.ts`、`FormConditional.vue`

**问题：** `provide(formContextKey, formContext.value)` 传递 computed 的一次性快照。`inline`、`labelPosition`、`labelWidth`、`size` 等 prop 变更后，子组件仍使用旧值。

**修复：** 传递 computed ref 本身 `provide(formContextKey, formContext)`；`formContextKey` 类型更新为 `InjectionKey<ComputedRef<VeeFormContext & {...}>>`；消费端 `FormConditional.vue` 改用 `form.value.values.value`。

#### 4. formatDate 不校验 Invalid Date — 输出 NaN 字符串 ✅

**文件：** `packages/ui/src/lib/date.ts`

**问题：** 仅检查 `!date` 排除 null/undefined，但 `new Date('invalid')` 是 truthy 对象，最终输出 `"NaN-NaN-NaN"`。

**修复：** 合并守卫条件为 `if (!date || Number.isNaN(date.getTime())) return ''`。

---

### Medium

#### 5. Popconfirm 描述区用错 slot 条件 — 产生幽灵 margin ✅

**文件：** `packages/ui/src/components/popconfirm/Popconfirm.vue`

**问题：** `v-if="$slots.default"` 检查的是触发器 slot（几乎必然存在），但渲染的是 `description` slot。

**修复：** 改为 `v-if="$slots.description"`。

#### 6. KanbanBoard 拖拽在 Firefox 中失效 — 缺少 setData() ✅

**文件：** `packages/ui/src/components/kanban/KanbanBoard.vue`

**问题：** `dragstart` 事件中未调用 `dataTransfer.setData()`，Firefox 严格按 HTML5 DnD 规范取消拖拽操作。

**修复：** 函数签名增加 `DragEvent` 参数，调用 `e.dataTransfer.setData('text/plain', cardId)` 和 `e.dataTransfer.effectAllowed = 'move'`，模板传 `$event`。

#### 7. DatePicker/ColorPicker/SelectTrigger 嵌套 button — 无效 HTML ✅

**文件：** `DatePicker.vue`、`DatePickerRange.vue`、`ColorPicker.vue`、`SelectTrigger.vue`

**问题：** 清除按钮 `<button>` 嵌套在触发器 `<button>` 内部，违反 HTML 规范。

**修复：** 内部 `<button>` 改为 `<span role="button" tabindex="-1">` 并增加 `@keydown.enter.prevent` 和 `@keydown.space.prevent` 键盘支持（参考 TreeSelect.vue）。同步更新 `useDatePicker.ts`、`useColorPicker.ts`、`useClearable.ts` 中 `handleClearClick`/`handleClear` 参数类型从 `MouseEvent` 改为 `Event`。

#### 8. useDialogEnhanced contentStyle 覆盖居中 transform ✅

**文件：** `packages/ui/src/composables/useDialogEnhanced.ts`、`DialogEnhanced.vue`

**问题：** 内联 `style.transform` 覆盖了 Tailwind 的 `translate-x-[-50%] translate-y-[-50%]`，对话框从居中变为左上角对齐。

**修复：** 改为 `translate(calc(-50% + Xpx), calc(-50% + Ypx))`，保持居中基线同时支持拖拽偏移。`useDialogEnhanced.ts` 和 `DialogEnhanced.vue` 两份重复的 contentStyle 逻辑均已修复。

#### 9. useDevtools() 永远返回 null — 死代码 ✅

**文件：** `packages/ui/src/lib/devtools-plugin.ts`

**问题：** 通过 `window.__VUE_APP__` 获取 devtools 上下文，但 Vue 3 不存在此全局变量。

**修复：** 改为 `inject<BrutxUIDevtoolsContext | null>('__BRUTX_UI_DEVTOOLS__', null)`，与插件 `install` 中的 `app.provide` 配对。测试同步更新为在组件 setup 上下文中调用。

#### 10. exportDebugData 对循环引用 payload 抛出 TypeError ✅

**文件：** `packages/ui/src/lib/devtools-plugin.ts`

**问题：** `eventLog` 和 `components` 中的 payload 类型为 unknown，可能含循环引用，`JSON.stringify` 直接序列化会抛出 `TypeError`。

**修复：** 添加 `WeakSet` 实现的 replacer 函数，循环引用处输出 `'[Circular]'`。

---

### Low

#### 11. useDialogEnhanced requestAnimationFrame 未在卸载时清理 ✅

**文件：** `packages/ui/src/composables/useDialogEnhanced.ts`

**问题：** `initSize()` 中的 rAF 回调可能在组件卸载后执行。

**修复：** 存储 rAF ID 为 `sizeRafId`，在 `onBeforeUnmount` 中调用 `cancelAnimationFrame(sizeRafId)`。

#### 12. 12 个 Locale 子类型未从 locales/index.ts 导出 ✅

**文件：** `packages/ui/src/locales/index.ts`

**问题：** `TreeSelectLocale`、`AvatarLocale`、`DataTableLocale`、`FormWizardLocale`、`ChatBubbleLocale`、`TimelineLocale`、`TabsLocale`、`ColorModeSwitcherLocale`、`VirtualScrollLocale`、`PopconfirmLocale`、`UploadLocale`、`InfiniteScrollLocale` 共 12 个类型未在 `locales/index.ts` 的 re-export 列表中。

**注意：** 这些类型已通过主入口 `src/index.ts` 直接从 `./locales/types` 导出，消费者通过包根导入不受影响。此修复为代码卫生问题，使中间桶文件保持完整。

**修复：** 在 `locales/index.ts` 的 `export type` 语句中补充全部 12 个类型名。
