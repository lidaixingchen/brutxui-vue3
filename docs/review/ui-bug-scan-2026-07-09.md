# BrutxUI Vue3 包 Bug 扫描报告

- **扫描日期**：2026-07-09
- **扫描范围**：`packages/ui/src/` 全量（composables、directives、lib、components/*）
- **覆盖文件**：~200+ 个 `.vue`/`.ts` 源文件（不含 `.test.ts`）
- **扫描方式**：6 个并行扫描代理按区域分工，部分代理交叉复核
- **总发现**：约 **80 个 bug**（去重后）

## 统计

| 严重度 | 数量 |
|---|---|
| 高 | 11 |
| 中 | ~40 |
| 低 | ~29 |

---

## 🔴 高严重度（11 个，建议立即修复）

### 1. Menu.vue — `getCurrentInstance()` 在事件回调中返回 null
- **文件**：[Menu.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\menu\Menu.vue#L35-L57)
- **行号**：L35-57
- **类型**：类型/边界
- **描述**：`selectItem` 在点击事件回调中调用 `getCurrentInstance()`。Vue 3 中此函数仅在 setup 同步阶段有效，事件回调中返回 null。当 `router=true` 时，`instance?.appContext` 为 undefined，随后 `undefined.config` 抛出 TypeError，**导致点击菜单项崩溃、路由跳转完全失效**。
- **修复建议**：在 setup 顶层缓存 `const instance = getCurrentInstance()`，事件处理函数中使用缓存引用。

### 2. Pagination.vue — `total=0` 时 emit 非法 page=0
- **文件**：[Pagination.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\pagination\Pagination.vue#L221-L228)
- **行号**：L221-228
- **类型**：分页边界
- **描述**：`onPageSizeChange` 中 `props.total ? Math.ceil(...) : computedTotalPages.value`，当 `total=0`（falsy）时回退到 `computedTotalPages`（=0），随后 `if (modelValue > 0)` 触发 `emit('update:modelValue', 0)`，**输出非法页码 0**。
- **修复建议**：使用 `props.total !== undefined` 判断而非真值检测，并对 `newTotalPages` 做 `Math.max(1, ...)` 钳制。

### 3. FormWizard.vue — linear 模式校验失败后永久卡死
- **文件**：[FormWizard.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\form\FormWizard.vue#L54-L57)
- **行号**：L54-57, L185-193
- **类型**：逻辑错误/状态机
- **描述**：`canGoNext` 在 `stepErrors.has(currentStep)` 时禁用 Next 按钮，但 `stepErrors` 只能在 `validateCurrentStep`（由 Next/Complete 触发）中清除。**按钮一旦禁用便无法再次校验，用户被永久卡住**，组件未 expose 任何清除入口。
- **修复建议**：watch `modelValue` 变化时清除对应 step 的 `stepErrors`，或移除 `:disabled` 改在 `nextStep` 内部判断。

### 4. Cascader.vue — 清除按钮事件冒泡触发 Popover 切换
- **文件**：[Cascader.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\cascader\Cascader.vue#L490-L500)
- **行号**：L490-500
- **类型**：事件冒泡
- **描述**：清除按钮 `<span>` 的 `@click`/`@keydown.enter`/`@keydown.space` 均未加 `.stop`。该 span 位于 `PopoverTrigger as-child` 包裹的 combobox div 内，**点击/键盘事件冒泡到 trigger，导致清除值的同时错误地切换 Popover 开合**；Enter 还会冒泡到 `handleKeyDown` 再次打开面板。
- **修复建议**：三个事件全部加 `.stop` 修饰符（参考 SelectTrigger.vue L92 的 `@click.stop`）。

### 5. ColorPicker.vue — 清除按钮冒泡 + 嵌套 interactive role
- **文件**：[ColorPicker.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\color-picker\ColorPicker.vue#L135-L147)
- **行号**：L135-147
- **类型**：事件冒泡/HTML 规范
- **描述**：清除 `<span role="button">` 嵌套在 `PopoverTrigger as-child` 包裹的外层 `<button>` 内，`@click` 未加 `.stop`，**点击事件冒泡到外层 button 触发 Popover 切换，清除时意外开关面板**。同时 button 内嵌 interactive role 违反 HTML 规范。
- **修复建议**：`@click.stop="handleClearClick"`；或将清除按钮移出 trigger，用绝对定位覆盖。

### 6. Rate.vue — `role="slider"` 无 tabindex 无 keydown
- **文件**：[Rate.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\rate\Rate.vue#L88-L96)
- **行号**：L88-96
- **类型**：可访问性/键盘
- **描述**：根元素声明 `role="slider"` 但无 `tabindex` 也无 `@keydown` 处理，**键盘用户完全无法操作评分**。
- **修复建议**：添加 `tabindex="0"` 并实现 ArrowLeft/ArrowRight（及半星步进）的 keydown 处理。

### 7. Upload.vue — `handleFileSelect` 串行 await 阻塞列表渲染
- **文件**：[Upload.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\upload\Upload.vue#L218-L221)
- **行号**：L218-221
- **类型**：逻辑错误/上传
- **描述**：`handleFileSelect` 在 `for` 循环内 `await doUpload(uploadFile)`，**只有当前一个文件上传完成后，下一个文件才会被验证、加入列表并上传**。用户选择多个文件时，后续文件不会立即出现在列表中（若上传慢，用户会以为只选中了一个文件）。
- **修复建议**：先循环把所有合法文件加入 `internalFileList` 并 emit，再统一启动上传（可并发或串行但不阻塞列表渲染）。

### 8. Upload.vue — `maxRetries` 未使用导致无限重试
- **文件**：[Upload.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\upload\Upload.vue#L19)
- **行号**：L19, L146-149
- **类型**：逻辑错误/上传重试
- **描述**：`maxRetries` prop 已定义（默认值为 3），但 `retryUpload` 从未检查重试次数，**导致重试无限进行**。
- **修复建议**：在 `UploadFile` 中增加 `retryCount` 字段，在 `retryUpload` 中与 `maxRetries` 进行校验。

### 9. TypewriterText.vue — 空文本 + loop 导致无限循环
- **文件**：[TypewriterText.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\typewriter-text\TypewriterText.vue#L70-L85)
- **行号**：L70-85, L114-116
- **类型**：逻辑错误/定时器泄漏
- **描述**：当 `text` 变为空字符串且 `loop=true` 时，`watch` 在没有空值检查的情况下调用 `init()`（`onMounted` 中有此检查）；`typeNextChar` 会立即触发 `complete` 并安排下一次循环，**从而导致无限空转和定时器泄漏**。
- **修复建议**：在 `watch` 中增加 `if (props.text)` 守卫，或在 `typeNextChar` 中处理空文本。

### 10. functional.ts — `showMessageBox.close()` 不结算 Promise
- **文件**：[functional.ts](file:///e:\project\brutxui-vue3\packages\ui\src\components\dialog\functional.ts#L254-L267)
- **行号**：L254-267
- **类型**：命令式调用/Promise 未 resolve
- **描述**：`showMessageBox` 内部 `destroy`（258 行）只移除 DOM，不调用 `resolvePromise`/`rejectPromise`；当用户直接调用 `instance.close()`（非 confirm/cancel 路径）时，**Promise 永久悬挂，`.then()` 永不执行，造成内存泄漏**。
- **修复建议**：在内部 `destroy` 中补 `rejectPromise('close')`，或在 `close` 函数中先 `rejectPromise` 再设 `isOpen=false`。

### 11. useDialog.ts — 多次调用 `show()` 状态错乱
- **文件**：[useDialog.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useDialog.ts#L19-L28)
- **行号**：L19-28
- **类型**：状态管理/命令式调用
- **描述**：连续调用 `show()` 时，前一个实例的 `promise.finally` 会在关闭时把 `isOpen` 置 false、`currentInstance` 置 null，**即使后一个实例仍处于打开状态，导致 `close()` 失效、`isOpen` 与实际不符**。
- **修复建议**：在 `finally` 回调中加 `if (currentInstance === instance)` 守卫，或在 `show` 开头先 `currentInstance?.close()`。

---

## 🟡 中严重度（约 40 个，按区域分组）

### 日期/日历（7）

#### 1. lib/date.ts — DST 时段解析失败
- **文件**：[date.ts](file:///e:\project\brutxui-vue3\packages\ui\src\lib\date.ts#L88-L95)
- **行号**：L88-95
- **描述**：`parseFormattedDate` 用 `new Date(year, month, day, hours, minutes, seconds)` 构造后校验 `getHours() !== hours`。DST 春季前进时本地 02:00-02:59 不存在，`new Date(2024,2,10,2,30)` 实际为 03:30，**校验失败返回 null，合法时间无法解析**。
- **修复建议**：移除时分秒的严格回等校验，仅校验年月日（闰年/溢出）。

#### 2. Calendar.vue — isSameDay 字符串时区错位
- **文件**：[Calendar.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\calendar\Calendar.vue#L154-L164)
- **行号**：L154-164
- **描述**：`isSameDay` 假设字符串为 `YYYY-MM-DD`。若 event.date 是 ISO 字符串（如 `2024-01-15T23:30:00Z`），`parseFormattedDate` 返回 null，fallback `new Date(date1)` 解析为 UTC；与 v-calendar 的 `day.date`（本地）比较 `getDate()` 时，在跨时区下会错位一日，**事件点不显示**。
- **修复建议**：明确约定事件日期格式，或对 ISO 字符串统一转本地再比较。

#### 3. Calendar.vue — handleDrag 不校验 start ≤ end
- **文件**：[Calendar.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\calendar\Calendar.vue#L96-L101)
- **行号**：L96-101
- **描述**：`handleDrag` 直接 `emit('update:modelValue', [value.start, value.end])`，**未保证 start ≤ end**。若 v-calendar 在拖动方向反转时返回 start > end，下游消费 [start,end] 的逻辑（比较、格式化）可能出错。
- **修复建议**：emit 前做 `[start,end].sort((a,b)=>a-b)` 归一化。

#### 4. TimePicker.vue — step 不整除 60 时缺失值
- **文件**：[TimePicker.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\date-picker\TimePicker.vue#L43-L53)
- **行号**：L43-53, L86-88
- **描述**：`buildOptions(max, step)` 用 `for (let i=0; i<max; i+=step)` 生成选项。当 step 不能整除 60/24（如 minute step=7 → [0,7,…,56]，缺 59）时，若 `modelValue` 的分钟/秒恰好是缺失值，`currentMinute` 不在 `minuteOptions` 中，`SelectRoot` 的 `model-value` 找不到匹配 `SelectItem`，**显示空白且用户无法选择该值**。
- **修复建议**：用 `Math.floor(max/step)` 生成，或在末尾补上 `max-1`；亦或在 `handleXxxChange` 里把当前值 snap 到最近的合法 step。

#### 5. DatePickerRangePanel.vue — isShortcutActive 部分范围崩溃
- **文件**：[DatePickerRangePanel.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\date-picker\DatePickerRangePanel.vue#L90-L97)
- **行号**：L90-97
- **描述**：`isShortcutActive` 仅判断 `!props.modelValue` 就直接访问 `modelValue[0]/[1].toDateString()`。若 modelValue 为部分范围 `[Date]` 或 `[Date, null]`（v-calendar 拖拽过程中或父组件传入），`modelValue[1]` 为 undefined/null → **TypeError 崩溃**。与同文件 `vCalendarModelValue`（L64-67）已对 `length!==2` 做防御形成不一致。
- **修复建议**：增加 `if (!props.modelValue || props.modelValue.length !== 2 || !props.modelValue[0] || !props.modelValue[1]) return false`。

#### 6. YearPickerPanel.vue — 翻页步长硬编码 ±10 与 yearRange 不对齐
- **文件**：[YearPickerPanel.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\date-picker\YearPickerPanel.vue#L85-L91)
- **行号**：L85-91, L54-60
- **描述**：`handlePrevDecade/handleNextDecade` 硬编码 `±10`，但 `yearRange` 默认 12（可配置）。视图显示 `[start, start+11]`，翻页后变为 `[start+10, start+21]`，**与上一页重叠 2 年、且与 `yearRange` 不对齐**；用户自定义 `yearRange: 15` 时错位更明显。
- **修复建议**：翻页步长改为 `props.yearRange`（或其整数倍），与显示范围对齐。

#### 7. 多个 Panel — first-day-of-week 硬编码 1 与 WeekPicker 不一致
- **文件**：[DatePickerPanel.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\date-picker\DatePickerPanel.vue#L150) L150、[DateTimePickerPanel.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\date-picker\DateTimePickerPanel.vue#L191) L191、[DatePickerRangePanel.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\date-picker\DatePickerRangePanel.vue#L181) L181、[Calendar.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\calendar\Calendar.vue#L183) L183
- **描述**：这些面板硬编码 `:first-day-of-week="1"`（v-calendar 中 1=周日），而 `WeekPickerPanel` 默认按周一开头（`weekStartsOn=1`→v-calendar 2）。**库内"周首日"约定不一致**，用户在日期/范围/周日历之间切换时观感不统一。
- **修复建议**：统一为周一（`2`）或抽成可配置 prop。

### Composables / lib / 指令（7）

#### 8. useGlitchEffect.ts — setInterval stop-timer 堆积
- **文件**：[useGlitchEffect.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useGlitchEffect.ts#L40-L46)
- **行号**：L40-46
- **描述**：setInterval 回调内 `autoplayStopTimer.value = setTimeout(...)` 覆盖前一个引用但未 clearTimeout。当 interval < AUTOPLAY_ACTIVE_DURATION_MS(1000ms，interval 最小 100ms)时，最多 10 个 stop-timer 堆积。`stopAutoplay` 只清最后一个，其余在 stop 后继续触发 `isActive.value = false`，**可能覆盖用户随后调用的 `play()`**。
- **修复建议**：设置新 stop-timer 前先 `clearTimeout(autoplayStopTimer.value)`。

#### 9. directives/loading.ts — Spinner 组件未卸载，内存泄漏
- **文件**：[loading.ts](file:///e:\project\brutxui-vue3\packages\ui\src\directives\loading.ts#L31-L37)
- **行号**：L31-37, L93-108
- **描述**：`mounted` 中通过 `render(spinnerVnode, spinnerContainer)` 挂载 Spinner，但 `spinnerContainer` 未存入 `el._loading`；`unmounted` 中仅 `mask.remove()` 移除 DOM，未调用 `render(null, spinnerContainer)` 卸载组件。**Spinner 的 watchers、onUnmounted 钩子均不执行，每次 v-loading 元素卸载都泄漏一个组件实例**。
- **修复建议**：将 `spinnerContainer` 存入 `el._loading`，在 `unmounted` 中先 `render(null, spinnerContainer)` 再移除 mask。

#### 10. theme-variables.ts — 浅展开污染模块常量
- **文件**：[theme-variables.ts](file:///e:\project\brutxui-vue3\packages\ui\src\lib\theme-variables.ts#L542-L545)
- **行号**：L542-545
- **描述**：`reactive({ ...DEFAULT_THEMES, ...customThemes })` 浅展开，DEFAULT_THEME 等模块级常量对象以引用形式进入 reactive。通过 `themes.default.colors.primary = 'red'` 等修改会**穿透到模块常量，污染后续所有调用**。
- **修复建议**：改为 `structuredClone(DEFAULT_THEMES)` 深拷贝后再合并。

#### 11. useDataTableFilter.ts — parseDateValue 类型强转
- **文件**：[useDataTableFilter.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useDataTableFilter.ts#L88-L89)
- **行号**：L88-89, L16-40
- **描述**：`parseDateValue(val as string | number | Date)` 对 `unknown` 类型强转。`getCellValue` 可返回任意值；若 date-range 列单元格值为非 Date 对象或布尔值，进入 `value.trim()` 分支抛 TypeError，**导致整个过滤崩溃**。
- **修复建议**：在 parseDateValue 增加非 string/number/Date 类型守卫返回 null。

#### 12. useDialog.ts — 缺少 onUnmounted 清理
- **文件**：[useDialog.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useDialog.ts)
- **行号**：L15-41
- **描述**：组件卸载时不会关闭仍打开的 dialog 实例，**造成孤儿 dialog（无法通过 `useDialog` 关闭）**。
- **修复建议**：注册 `onUnmounted(() => currentInstance?.close())`。

#### 13. useToast.ts — 分组合并后定时器时长丢失 existing.duration
- **文件**：[useToast.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useToast.ts#L95)
- **行号**：L95（grouping 分支内）
- **描述**：分组命中时 `updatedToast` 通过 `...existing, ...toast` 保留 `existing.duration`，但定时器用 `toast.duration ?? DEFAULT_TOAST_DURATION`，**忽略了 `existing.duration`**。若首条 toast 自定义了 `duration` 而新合并条未传，定时器会按默认 5000ms 而非原 duration 重置，toast 提前消失。
- **修复建议**：改为 `toast.duration ?? existing.duration ?? DEFAULT_TOAST_DURATION`。

#### 14. Watermark.vue — recreateWatermark 图片竞态条件
- **文件**：[Watermark.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\watermark\Watermark.vue#L139-L154)
- **行号**：L139-154, L185-199
- **描述**：`renderWatermark` 中 `props.image` 走异步 `img.onload` 路径，无版本/取消守卫。若 `image` 在 onload 触发前变化，旧的 onload 仍会执行并覆盖 `watermarkUrl`；`recreateWatermark` 的 `isRecreating` 标志在同步返回前就被重置，**无法防止异步重入**。组件卸载后 onload 仍可能写入状态。
- **修复建议**：引入自增 version 标识，onload 回调内校验 version；卸载时置 `isUnmounted` 守卫。

### 数据展示/导航（10）

#### 15. useKanban.ts — requestAnimationFrame 未清理
- **文件**：[useKanban.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useKanban.ts#L57)
- **行号**：L57
- **描述**：`onDragEnd` 中 `requestAnimationFrame(() => { isDragging.value = false })` 未保存返回 ID，composable 无 `onUnmounted` 清理，**组件卸载后 rAF 仍可能执行**。
- **修复建议**：保存 rAF ID 并在 `onUnmounted` 中 `cancelAnimationFrame`。

#### 16. KanbanBoard.vue — rAF 与新拖拽竞态
- **文件**：[KanbanBoard.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\kanban\KanbanBoard.vue#L51-L55)
- **行号**：L51-55
- **描述**：`onDragEnd` 通过 rAF 延迟设置 `isDragging=false`，但 `onDragStart` 未取消未完成的 rAF；**若用户快速结束一次拖拽后立即开始新拖拽，旧 rAF 回调会将新拖拽的 `isDragging` 错误置为 false**。
- **修复建议**：在 `onDragStart` 中检查并 `cancelAnimationFrame(dragEndRafId)`。

#### 17. useCarouselEnhanced.ts — reducedMotion 切换后进度条不重启
- **文件**：[useCarouselEnhanced.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useCarouselEnhanced.ts#L75-L77)
- **行号**：L75-77（配合 useCarousel.ts L126-135）
- **描述**：`useCarousel` 内 watch `prefersReducedMotion` 从 true→false 时调用的是内部 `startAutoplay()`（不启动进度计时器），而增强版 `startAutoplay` 仅通过 `onAutoplayChange` 回调触发——**该回调在 reducedMotion 分支中不被调用，导致进度条不更新**。
- **修复建议**：在 `useCarousel` 的 reducedMotion watch 中也触发 `onAutoplayChange` 回调，或在增强版中单独 watch reducedMotion。

#### 18. TreeSelect.vue — 焦点检查仅扫描顶层节点
- **文件**：[TreeSelect.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\tree-select\TreeSelect.vue#L198-L208)
- **行号**：L198-208
- **描述**：watch `filteredNodes` 中 `nodes.some(node => node.id === focusedId.value)` 仅检查 `filteredNodes` 顶层元素（`filterTree` 返回树结构），**当焦点在子节点时检查失败，错误重置焦点到第一个顶层节点**，破坏 roving tabindex。
- **修复建议**：用 `flattenNodes(nodes).some(n => n.id === focusedId.value)` 递归检查。

#### 19. DataTable.vue — getRowKeyValue 无 fallback 校验
- **文件**：[DataTable.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\data-table\DataTable.vue#L98-L103)
- **行号**：L98-103
- **描述**：`row[props.rowKey] as string | number` 直接断言，若属性不存在返回 undefined（被当作 string|number 使用），与 `useDataTableSelection.getRowKey` 的 JSON.stringify 兜底逻辑不一致，**可能导致展开行/选择键冲突**。
- **修复建议**：复用 `selection.getRowKey(row)` 或添加相同的兜底逻辑。

#### 20. DataTableColumnFilter.vue — 多选过滤直接 mutate props
- **文件**：[DataTableColumnFilter.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\data-table\DataTableColumnFilter.vue#L71-L90)
- **行号**：L71-90
- **描述**：`handleMultiSelectChange` 中 `const vals = Array.isArray(current) ? current : []` 获取的是 `props.filterState.columns[id]` 的数组引用（浅拷贝不复制数组），随后 `vals.push/splice` **直接修改 props 内部数组**，违反单向数据流。
- **修复建议**：`const vals = Array.isArray(current) ? [...current] : []` 创建副本。

#### 21. useDataTablePagination.ts — pageSize=0 导致 totalPages=Infinity
- **文件**：[useDataTablePagination.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useDataTablePagination.ts#L25-L28)
- **行号**：L25-28, L55-58
- **描述**：`Math.ceil(total / 0)` = Infinity，`Math.max(1, Infinity)` = Infinity；`setPageSize` 不校验入参，**pageSize<=0 时分页彻底异常**（totalPages=Infinity，paginatedData 返回空）。
- **修复建议**：`setPageSize` 校验 `size > 0`，totalPages 计算前 `Math.max(1, currentPageSize.value)`。

#### 22. SubMenu.vue — 水平模式点击展开无 click-outside 关闭
- **文件**：[SubMenu.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\menu\SubMenu.vue#L128-L135)
- **行号**：L128-135, L213-219
- **描述**：水平模式下 `handleTriggerClick` 切换 `isOpenClick`，**但无外部点击监听，点击页面其他区域时下拉菜单不关闭**。
- **修复建议**：添加 `onClickOutside`（VueUse）或手动监听 document click 关闭。

#### 23. DataTable.vue — 空状态 colspan 未计入 expandable 列
- **文件**：[DataTable.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\data-table\DataTable.vue#L748-L753)
- **行号**：L748-753
- **描述**：原生表格空状态 `colspan="visibleColumns.length + (selectable ? 1 : 0)"`，未计入 `expandable` 列。表头已渲染 expand 列占位，**空行 colspan 比表头少 1，导致表格列错位**。
- **修复建议**：改为 `visibleColumns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0)`。

#### 24. TreeView.vue — 直接 mutate props.nodes
- **文件**：[TreeView.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\tree-view\TreeView.vue#L239-L244)
- **行号**：L239-244, L333-381, L401-412
- **描述**：`triggerLoad`、`filter`、`reloadNode` 直接修改 `props.nodes` 上的节点属性（`node.children`、`node.hidden`、`node.loaded` 等），**违反 Vue 单向数据流**。父组件若用不可变数据或 `shallowRef`，这些 mutation 不触发更新且破坏父状态。
- **修复建议**：通过 `emit('update:nodes', clonedAndMutatedTree)` 让父组件决定是否接受变更；过滤用局部副本而非 props 节点。

### 表单/输入（5）

#### 25. Textarea.vue — 缺 IME composition 处理
- **文件**：[Textarea.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\textarea\Textarea.vue#L76-L90)
- **行号**：L76-90
- **描述**：`@input` 直接 emit，缺少 `compositionstart`/`compositionend` 处理（Input.vue L226-228 有处理）。**CJK IME 输入时会反复 emit 中间态字符串**，触发 watcher/校验/maxlength 误判。
- **修复建议**：仿照 Input.vue 增加 `isComposing` ref 与 composition 事件处理。

#### 26. SelectTrigger.vue — 清除按钮 tabindex=-1
- **文件**：[SelectTrigger.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\select\SelectTrigger.vue#L87-L97)
- **行号**：L87-97
- **描述**：清除 `<span>` 使用 `tabindex="-1"`，**键盘用户无法聚焦清除按钮，只能鼠标操作**，`@keydown.enter/space` 处理器是死代码。同时 `<button>` 内嵌 `role="button"` 违反规范。
- **修复建议**：改为 `tabindex="0"` 或使用 `<button>` 元素，并提供触发器键盘清除路径。

#### 27. HardcoreInput.vue — rulesEmpty 跳过 formField 错误清除
- **文件**：[HardcoreInput.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\hardcore-input\HardcoreInput.vue#L62-L100)
- **行号**：L62-100
- **描述**：`validate` 在 `rulesEmpty` 时于 L72 提前 return，跳过 L91 的 `formField.setError(...)`。**若先前校验失败已写入 formField 错误，之后动态移除全部 rules，formField 错误不会被清除**。
- **修复建议**：在 early return 前调用 `formField?.setError(undefined)`。

#### 28. Cascader.vue — ARIA 结构问题
- **文件**：[Cascader.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\cascader\Cascader.vue#L478)
- **行号**：L478, L510-538
- **描述**：触发器为 `role="combobox"` 但列容器无 `role="listbox"`、选项用 `role="menuitem"`（应为 `option`/`treeitem`），且无 `aria-controls`、`aria-activedescendant`，**屏幕阅读器无法感知键盘导航的高亮项**。
- **修复建议**：列容器加 `role="listbox"`，选项改 `role="option"`，触发器加 `aria-activedescendant` 指向当前 active 项 id。

#### 29. ColorPicker.vue — 清除按钮不可键盘聚焦
- **文件**：[ColorPicker.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\color-picker\ColorPicker.vue#L135-L147)
- **行号**：L135-147
- **描述**：同 SelectTrigger 问题，清除 `span role="button" tabindex="-1"` 不可键盘聚焦，`handleClearClick` 已 stopPropagation 但键盘无法触达。
- **修复建议**：使其可聚焦或提供触发器键盘清除路径。

### 弹层/模态（4）

#### 30. functional.ts — showDialog/showMessageBox watch 未停止
- **文件**：[functional.ts](file:///e:\project\brutxui-vue3\packages\ui\src\components\dialog\functional.ts#L139-L143)
- **行号**：L139-143（showDialog），L263-267（showMessageBox）
- **描述**：`watch(isOpen, ...)` 在组件 setup 外创建，是独立 watcher，**dialog 销毁后不会被自动停止，持续持有 `isOpen`、`destroy`、`resolvePromise` 闭包引用**。
- **修复建议**：保存 `watch` 返回的 stop 函数，在 `destroy` 中调用 `stop()`。

#### 31. ToastContainer.vue — maxVisible 选项被静默忽略
- **文件**：[ToastContainer.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\toast\ToastContainer.vue#L20-L24)
- **行号**：L20-24（定义），全文（未使用）
- **描述**：`stack.maxVisible` prop 在 `withDefaults` 中定义且有默认值 `DEFAULT_TOAST_MAX_VISIBLE`(5)，**但在任何 computed 或 template 中均未读取，用户设置该值无效果**。
- **修复建议**：在 template 中用 `slice` 或 computed 限制可见 toast 数量，或删除该 prop。

#### 32. DialogEnhanced.vue — beforeClose 钩子被 ESC/点击遮罩绕过
- **文件**：[DialogEnhanced.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\dialog\DialogEnhanced.vue#L137-L153)
- **行号**：L137-153（模板），配合 useDialogEnhanced.ts L266-285
- **描述**：`handleClose`（含 `beforeClose` 拦截）仅绑定在关闭按钮 `@click.prevent` 上；ESC 和遮罩点击由 reka-ui `DialogContentPrimitive` 直接触发 `update:open`，**绕过了 `beforeClose`，用户设置的关闭前确认逻辑失效**。
- **修复建议**：在 `DialogContentPrimitive` 上监听 `@escape-key-down` 和 `@pointer-down-outside`，调用 `handleClose` 并 `preventDefault` 阻止默认关闭。

#### 33. Stepper.vue — 键盘导航收集所有按钮
- **文件**：[Stepper.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\stepper\Stepper.vue#L89-L135)
- **行号**：L89-135
- **描述**：`handleStepKeydown` 用 `container.querySelectorAll('button')` 收集所有按钮，但 vertical 布局在 L268-270 渲染了具名插槽 `step-${step.id}`，插槽内的按钮也会被收集，**导致箭头键导航跳到非步骤按钮、索引错乱**。
- **修复建议**：用更精确的选择器如 `container > [role="listitem"] button` 或给步骤按钮加 `data-step-button` 属性后用属性选择器过滤。

### 杂项（7）

#### 34. Upload.vue — handleFileRemove 未终止上传
- **文件**：[Upload.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\upload\Upload.vue#L225-L237)
- **行号**：L101-143, L225-237
- **描述**：`doUpload` 不支持取消操作；`handleFileRemove` 在上传过程中移除文件**会导致上传继续，并触发已移除文件的 `file-success` 或 `file-error` 事件**。
- **修复建议**：在 `UploadFile` 中存储 `AbortController`，在移除时调用 `abort()`，并在回调函数中过滤掉已移除的文件。

#### 35. UploadFileItem.vue — formatFileSize 超过 TB 时越界
- **文件**：[UploadFileItem.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\upload\UploadFileItem.vue#L48-L54)
- **行号**：L48-54
- **描述**：`sizes` 数组仅包含 `['B','KB','MB','GB']` (4 项)；对于 >= 1TB 的文件，`i` 会变为 4，`sizes[4]` 为 undefined，**导致输出 "x undefined"**。
- **修复建议**：增加 'TB'/'PB' 单位，或将 `i` 限制在 `sizes.length - 1`。

#### 36. Tour.vue — isZh 使用脆弱的字符串匹配
- **文件**：[Tour.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\tour\Tour.vue#L57-L59)
- **行号**：L57-59
- **描述**：`isZh` 通过 `locale.value.dialog.close === '关闭'` 检测中文，**这种做法很脆弱**；任何翻译变动或其他中文本地化变体都会导致按钮文本中断。
- **修复建议**：使用显式的本地化标识符（例如 `locale.value.name === 'zh-CN'`）或通过 `useLocale` 的 `t()` 函数获取文本。

#### 37. ChatContainer.vue — groupInterval prop 未使用
- **文件**：[ChatContainer.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\chat-bubble\ChatContainer.vue#L28)
- **行号**：L28, L52-89
- **描述**：`groupInterval` prop（默认值为 5，推测为分钟）已定义但 `groupMessages` 从未使用它；**分组仅按日期标签进行，忽略了时间间隔**。
- **修复建议**：在 `groupMessages` 中实现基于时间间隔的分组，或者移除该 prop。

#### 38. Image.vue — currentIndex 越界
- **文件**：[Image.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\image\Image.vue#L97-L102)
- **行号**：L97-102, L122-127
- **描述**：`currentPreviewSrc` 直接访问 `previewSrcList[currentIndex.value]`；如果 `previewSrcList` 动态缩小或 `initialIndex` 越界，**`currentIndex` 可能会越界，返回 `undefined` 并导致 `<img :src="undefined">`**。缺少监听器来限制 `currentIndex`。
- **修复建议**：监听 `previewSrcList` 并限制 `currentIndex`；在访问时增加边界检查。

#### 39. useColorPicker.ts — 取消时触发 'change' 事件
- **文件**：[useColorPicker.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useColorPicker.ts#L34-L44)
- **行号**：L34-44
- **描述**：当 `open` 变为 `false`（用户点击外部）时，如果 `displayValue` 与 `modelValue` 不同，会触发 `change` 事件；**这会在未确认的临时面板值上触发，绕过了 `handlePanelConfirm`**。
- **修复建议**：取消时将 `displayValue` 重置为 `modelValue`，而不是触发 `change`；仅通过确认路径触发 `change`。

#### 40. useDebounce.ts — immediate:true 后续调用被静默丢弃
- **文件**：[useDebounce.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useDebounce.ts#L77-L87)
- **行号**：L77-87
- **描述**：`immediate: true` 时，setTimeout 回调里 `if (!immediate)` 永不执行，**导致首次调用后的后续调用被静默丢弃**，与文档"后续调用在 delay 后才执行"矛盾。
- **修复建议**：回调内移除 `if (!immediate)` 守卫，或改为 leading-only 语义并修正文档。

#### 41. SketchyChart.vue — 单切片饼图渲染为空
- **文件**：[SketchyChart.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\sketchy-chart\SketchyChart.vue#L149-L165)
- **行号**：L149-165
- **描述**：饼图仅有一个数据项时，`sliceAngle = 2π`，`startAngle` 与 `endAngle` 计算出的弧端点坐标完全相同，SVG `A` 命令在起止点重合时不绘制任何图形，**导致 100% 单切片饼图渲染为空**。
- **修复建议**：检测单切片场景，改用完整 `<circle>` 或将弧拆分为两段半圆绘制。

#### 42. Tour.vue — handleScrollOrResize 未节流
- **文件**：[Tour.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\tour\Tour.vue#L333-L338)
- **行号**：L333-338, L357-361, L82-135
- **描述**：`handleScrollOrResize` 未做节流，每次 scroll/resize 都调用 `recalculatePosition` → `drawCanvas`（重设 canvas.width 清空画布）+ `getComputedStyle`（强制回流）+ `updatePopoverPosition`（读 offsetWidth 强制布局）。**滚动时性能严重下降**。
- **修复建议**：用 `useThrottle`/`requestAnimationFrame` 包裹 `handleScrollOrResize`。

---

## 🟢 低严重度（约 29 个，按区域分组）

### 日期/日历（6）

#### 1. useDatePicker.ts — confirm 路径潜在重复 change
- **文件**：[useDatePicker.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useDatePicker.ts#L46-L56)
- **行号**：L46-56，DatePickerRange.vue L53-66
- **描述**：`handlePanelConfirm` 先 `emit('change', value)` 再 `open.value=false` 触发 `watch(open)`，关闭分支再次比较 displayValue 与 modelValue；**在父组件异步更新或单向绑定时会重复 emit change**。
- **修复建议**：关闭分支用「打开时初始值」作比较基准，或 confirm 时不 emit change 由关闭分支统一 emit。

#### 2. MonthPickerPanel/YearPickerPanel — Invalid Date 导致 NaN
- **文件**：[MonthPickerPanel.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\date-picker\MonthPickerPanel.vue#L35) L35 / [YearPickerPanel.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\date-picker\YearPickerPanel.vue#L39) L39
- **描述**：`props.modelValue?.getFullYear() ?? new Date().getFullYear()` 中 `getFullYear()` 返回 NaN 时 `??` 不 fallback（NaN 非 null/undefined），**导致 viewYear=NaN，渲染异常**。
- **修复建议**：改用 `Number.isFinite` 校验后 fallback。

#### 3. YearPicker/MonthPickerPanel — setup 顶层 new Date() SSR hydration
- **文件**：[YearPickerPanel.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\date-picker\YearPickerPanel.vue#L39) L39 / [MonthPickerPanel.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\date-picker\MonthPickerPanel.vue#L35) L35
- **描述**：`modelValue` 为 null 时在 setup 顶层调用 `new Date().getFullYear()` 初始化视图。**SSR 下服务器与客户端时间跨年/跨月时会导致 hydration mismatch**。
- **修复建议**：改为 `onMounted` 中初始化，或用 `ref(null)` + 懒计算。

#### 4. Calendar.vue — dayClassesCache 无界增长
- **文件**：[Calendar.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\calendar\Calendar.vue#L130-L134)
- **行号**：L130-134, L136-152
- **描述**：`dayClassesCache` 仅在 `dayBaseClasses/dayOutsideClasses/dayDisabledClasses` 变化时清空，而这些仅依赖 `props.mode`。**月份翻页时 `dayPropsClass` 若变化，缓存不会被清理，长期使用下 Map 持续增长**（虽每实例独立，仍属无界增长）。
- **修复建议**：翻页/视图变化时也清空缓存，或限制缓存大小。

#### 5. useDatePicker.ts — 受控/非受控切换 internalOpen 陈旧
- **文件**：[useDatePicker.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useDatePicker.ts#L33-L42)
- **行号**：L33-42
- **描述**：`open` 的 setter 在受控模式下仍写 `internalOpen.value = val`，但 getter 在 `openProp !== undefined` 时完全忽略 `internalOpen`。**若父组件中途从受控切换为非受控，`internalOpen` 的陈旧值会突然生效，弹窗开合状态错乱**。
- **修复建议**：受控时不要写 `internalOpen`，或在切换回非受控时同步一次 `internalOpen = controlled`。

### Composables / lib / 指令（5）

#### 6. useClipboard.ts — await 期间卸载导致 setTimeout 无法清理
- **文件**：[useClipboard.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useClipboard.ts#L25-L32)
- **行号**：L25-32
- **描述**：`await navigator.clipboard.writeText` 期间若组件卸载，`onUnmounted` 此时 `timeoutId` 仍为 null 不会清理；await 返回后新建的 `setTimeout` 无法被取消，**回调仍会执行（在已卸载组件上写 ref）**。
- **修复建议**：引入 `let disposed = false` 标志，`onUnmounted` 置 true，await 后判断 `if (disposed) return`。

#### 7. theme-variables.ts — destroy 未移除 dark class
- **文件**：[theme-variables.ts](file:///e:\project\brutxui-vue3\packages\ui\src\lib\theme-variables.ts#L652-L658)
- **行号**：L652-658
- **描述**：`destroy()` 移除 CSS 变量但**未移除 documentElement 上的 `dark` class**，清理不完整。
- **修复建议**：destroy 中补充 `document.documentElement.classList.remove('dark')`。

#### 8. theme-editor.ts — importTheme 未深拷贝
- **文件**：[theme-editor.ts](file:///e:\project\brutxui-vue3\packages\ui\src\lib\theme-editor.ts#L355)
- **行号**：L355, L380, L547
- **描述**：`importTheme` / `importThemeFromFile` / `importAllThemes` 将解析后的对象直接赋值给 `themes[name]` 未深拷贝，**调用方修改原对象会污染编辑器内部状态**。
- **修复建议**：赋值前 `structuredClone(parsed)`。

#### 9. directives/loading.ts — unmounted 还原 position 与 togglePosition 不一致
- **文件**：[loading.ts](file:///e:\project\brutxui-vue3\packages\ui\src\directives\loading.ts#L96-L103)
- **行号**：L96-103 vs L122-131
- **描述**：`originalPosition` 通过 `el.style.position || getComputedStyle().position` 捕获，当元素原本无 inline position 时被记为 `'static'`；`unmounted` 中 `if (originalPosition)` 分支会写入 `el.style.position = 'static'`，**给元素新增原本不存在的 inline 样式，可能覆盖外部 CSS**。而 `togglePosition` 中对 `'static'` 是清空 inline 样式，两者不一致。
- **修复建议**：`unmounted` 复用 `togglePosition(el, false)` 或对 `'static'`/`''` 统一走 `el.style.position = ''`。

#### 10. render-imperative.ts — onClose 抛错导致 DOM 泄漏
- **文件**：[render-imperative.ts](file:///e:\project\brutxui-vue3\packages\ui\src\lib\render-imperative.ts#L35-L40)
- **行号**：L35-40
- **描述**：`handleClose` 先执行 `options.onClose()` 再 `destroy()`；**若 `onClose` 抛异常，`destroy()` 不会执行，容器 DOM 永久残留**。
- **修复建议**：用 `try { options.onClose?.() } finally { destroy() }`。

### 数据展示/导航（6）

#### 11. useDataTableSort.ts — Date 与非 Date 混合比较降级为字符串
- **文件**：[useDataTableSort.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useDataTableSort.ts#L56-L64)
- **行号**：L56-64
- **描述**：仅当 valueA 和 valueB 均为 Date 实例才走日期分支；若一列中部分值为 Date、部分为时间戳数字，Date 项走不到 number 分支（typeof Date !== 'number'），**降级为 `String(date)` 字符串比较，结果错误**。
- **修复建议**：将 Date 转为 number 后统一走数值比较分支。

#### 12. tree-view-utils.ts — 递归栈溢出风险
- **文件**：[tree-view-utils.ts](file:///e:\project\brutxui-vue3\packages\ui\src\components\tree-view\tree-view-utils.ts#L5-L22)
- **行号**：L5-13, L15-22
- **描述**：`getAllDescendantIds` 和 `getCheckState` 均为递归实现，且 `getCheckState` 对每个节点调用 `getAllDescendantIds`，**深层树存在栈溢出风险与 O(n²) 性能问题**。
- **修复建议**：改为迭代实现，或缓存 descendant id 集合。

#### 13. VirtualScroll.vue — scroll-end 无去重持续触发
- **文件**：[VirtualScroll.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\virtual-scroll\VirtualScroll.vue#L97-L108)
- **行号**：L97-108
- **描述**：`handleScroll` 在接近底部时每次 scroll 事件都 emit `scroll-end`，**无 loading 标志或节流，父组件若直接加载更多会重复请求**。
- **修复建议**：增加 emitting 标志或在 emit 后临时禁用直到 items.length 变化。

#### 14. tree-view-utils.ts — moveNode 浪费克隆
- **文件**：[tree-view-utils.ts](file:///e:\project\brutxui-vue3\packages\ui\src\components\tree-view\tree-view-utils.ts#L92-L94)
- **行号**：L92-94
- **描述**：`moveNode` 中 `dragId === dropId` 时调用 `cloneTreeAndExtract(nodes, '')` 做了一次完整深克隆然后丢弃，纯属浪费。应直接 `return nodes`（或浅拷贝）。
- **修复建议**：`if (dragId === dropId) return nodes`。

#### 15. DataTable.vue — gridTemplateColumns computed 副作用
- **文件**：[DataTable.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\data-table\DataTable.vue#L252-L273)
- **行号**：L252-273
- **描述**：`gridTemplateColumns` computed 内对 `warnedColumns` Set 做 `has/add` 副作用，**违反 computed 应纯净的约定**；在 SSR 或多次求值场景下行为不确定。
- **修复建议**：将告警逻辑移到 `watchEffect` 或初始化阶段。

#### 16. Pagination.vue — v-for 用 index 作 key
- **文件**：[Pagination.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\pagination\Pagination.vue#L309)
- **行号**：L309
- **描述**：`v-for="(pageNumber, index) in paginationRange" :key="index"` 用索引作 key。**页码范围会随当前页变化而重排，索引 key 导致 Vue 复用错误的 DOM 节点，dots 按钮状态可能错乱**。
- **修复建议**：用 `` :key="`${pageNumber}-${index}`" `` 保证唯一稳定。

### 表单/输入（3）

#### 17. Input.vue — compositionend 双发
- **文件**：[Input.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\input\Input.vue#L226-L228)
- **行号**：L226-228
- **描述**：`compositionend` 设置 `isComposing=false` 并 emit 后，浏览器紧随其后触发的 `input` 事件检测到 `!isComposing` 再次 emit 同一值，**造成双发（同值，无功能错误，仅冗余更新）**。
- **修复建议**：compositionend 内不主动 emit，仅置 `isComposing=false`，由后续 input 事件统一 emit；或 input 内增加"刚刚 compositionend"标志位。

#### 18. Combobox.vue — open setter 受控模式下写 internalOpen
- **文件**：[Combobox.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\combobox\Combobox.vue#L71-L77)
- **行号**：L71-77
- **描述**：`open` computed setter 在受控模式（`props.open` 已定义）下仍写 `internalOpen.value`，与 Cascader.vue L78 的 `if (props.open === undefined)` 守卫不一致；**功能无碍，仅内部状态冗余分歧**。
- **修复建议**：setter 内加 `if (props.open === undefined) internalOpen.value = val`。

#### 19. Slider.vue — activeThumb 混用 focus 与 pointer 状态
- **文件**：[Slider.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\slider\Slider.vue#L139-L148)
- **行号**：L139-148, L181-182
- **描述**：`activeThumb` 同时承载 focus 与 pointer 状态，`@pointerleave` 调用 `handleThumbBlur` 会把 `activeThumb` 置 -1，**即使该 thumb 仍被键盘聚焦，tooltip 会提前消失**。
- **修复建议**：分别维护 `focusedThumb` 与 `hoveredThumb`，tooltip 显示条件为两者任一非空。

### 杂项（7）

#### 20. Watermark.vue — fontStyle: 'none' 无效 CSS
- **文件**：[Watermark.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\watermark\Watermark.vue#L9)
- **行号**：L9, L169, L81
- **描述**：`WatermarkFont.fontStyle` 类型允许 `'none'`，但 `'none'` 不是有效的 CSS `font-style` 值；**在字体字符串中使用时会导致渲染异常**。
- **修复建议**：从类型中移除 `'none'` 或将其归一化为 `'normal'`。

#### 21. Backtop.vue — target prop 变化未 watch
- **文件**：[Backtop.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\backtop\Backtop.vue#L41-L47)
- **行号**：L41-47, L79-85
- **描述**：`target` 仅在 `onMounted` 读取一次，未 watch。**`target` prop 变化后滚动容器不更新，旧监听器残留，新容器无监听**。
- **修复建议**：watch `props.target`，清理旧容器监听并重新绑定。

#### 22. Button.vue — type 默认 undefined 在 form 内意外 submit
- **文件**：[Button.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\button\Button.vue#L42)
- **行号**：L42, L129
- **描述**：`type` 默认 `undefined`，原生 `<button>` 在 `<form>` 内默认为 `submit`，**可能触发意外提交**。
- **修复建议**：默认 `type: 'button'`。

#### 23. useCanvasInteraction.ts — CANVAS_PROGRESS_CHECK_INTERVAL_MS 语义不一致
- **文件**：[useCanvasInteraction.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useCanvasInteraction.ts#L171)
- **行号**：L171
- **描述**：`CANVAS_PROGRESS_CHECK_INTERVAL_MS`（注释为毫秒）被用作帧计数取模（`drawFrameCount % 10`），**语义不一致，易误导维护者**。
- **修复建议**：新增独立的帧计数常量，或重命名为 `CANVAS_PROGRESS_CHECK_FRAME_INTERVAL`。

#### 24. Counter.vue — formatNumber 负数分隔符
- **文件**：[Counter.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\counter\Counter.vue#L79-L85)
- **行号**：L79-85
- **描述**：`formatNumber` 的千分位正则 `/\B(?=(\d{3})+(?!\d))/g` 对负数（如 `-1000`）会在负号后错误插入分隔符（`-1,000` 正确，但 `from` 为负且 `to` 为正时中间值格式异常）。
- **修复建议**：先分离符号位再格式化整数部分。

#### 25. ScratchCard.vue — reduced motion 仅触发 onCompleted 但 fade 仍按原时长
- **文件**：[ScratchCard.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\scratch-card\ScratchCard.vue#L115-L118)
- **行号**：L115-118, L184
- **描述**：`prefersReducedMotion` 仅使 `onCompleted` 立即触发（`REVEAL_COMPLETED_FALLBACK_DURATION=0`），但 canvas 的 `transition: opacity ${fadeDuration}ms` 仍按原时长淡出，**与"减少动画"偏好不一致**。
- **修复建议**：reduced motion 时同步将 canvas transition 置零或直接隐藏。

#### 26. TreeSelect.vue — Space 键未 preventDefault
- **文件**：[TreeSelect.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\tree-select\TreeSelect.vue#L326-L328)
- **行号**：L326-328
- **描述**：`@keydown.space="!disabled && (open = !open)"` 未调用 `e.preventDefault()`，**Space 键默认行为（页面滚动）与切换并存**；同时该表达式无法阻止默认事件。
- **修复建议**：改为 `@keydown.space.prevent="!disabled && (open = !open)"`。

### 弹层/模态（3）

#### 27. DialogEnhanced.vue — destroyOnClose 关闭动画期间清空内容
- **文件**：[DialogEnhanced.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\dialog\DialogEnhanced.vue#L144)
- **行号**：L144
- **描述**：`<slot v-if="!destroyOnClose || dialogContext?.open.value" />` 中 `dialogContext.open.value` 在关闭触发瞬间即变 false，**slot 立即卸载，导致关闭退场动画期间 dialog 内容为空白**。
- **修复建议**：改用 reka-ui 的 `data-state` 属性或 `forceMount` + CSS 控制可见性，延迟到动画结束再卸载 slot。

#### 28. Toast.vue — duration prop 变更后计时器不同步
- **文件**：[Toast.vue](file:///e:\project\brutxui-vue3\packages\ui\src\components\toast\Toast.vue#L48)
- **行号**：L48, L84-89
- **描述**：`remainingTime` 仅在 `onMounted` 中赋值为 `props.duration`，无 watch；当 useToast 分组（grouping）更新 toast 并传入新 `duration` 时，**JS 计时器仍用旧值，而进度条 CSS 动画用新值，两者不同步**。
- **修复建议**：`watch(() => props.duration, ...)` 重置 `remainingTime` 并重启计时器。

#### 29. MessageContainer 销毁延迟期间可能显示重复消息
- **文件**：[render-imperative.ts](file:///e:\project\brutxui-vue3\packages\ui\src\lib\render-imperative.ts#L56-L72) L56-72 + [useMessage.ts](file:///e:\project\brutxui-vue3\packages\ui\src\composables\useMessage.ts#L55-L68) L55-68
- **描述**：`renderImperative.destroy` 延迟 300ms 才执行 `render(null, container)` 卸载组件；**此期间旧 `MessageContainer` 仍挂载并响应 `messageStore` 变化，若此时新增消息，会在旧容器和新容器中同时显示（重复渲染）**。
- **修复建议**：`destroy` 中立即 `render(null, container)` 卸载组件，仅延迟 `container.remove()`；或给 `MessageContainer` 加销毁标志停止响应 store。

---

## 修复优先级建议

### P0（立即修复，影响核心功能）

1. **Menu.vue `getCurrentInstance()`** — router 模式必崩
2. **FormWizard.vue linear 卡死** — 用户无法继续
3. **functional.ts showMessageBox Promise 泄漏** — 内存泄漏
4. **useDialog.ts 多次 show 状态错乱** — 命令式 API 不可靠
5. **Upload.vue maxRetries 无限重试 + 串行阻塞** — 上传体验严重劣化

### P1（重要，影响交互正确性）

6. Cascader/ColorPicker 清除按钮冒泡
7. Rate 键盘不可操作
8. Pagination total=0 输出 page=0
9. TypewriterText 空文本无限循环
10. DialogEnhanced beforeClose 被绕过

### P2（应修复，影响边界场景）

- 日期/时区系列（DST、isSameDay、first-day-of-week 不一致）
- DataTable 系列（colspan、mutate props、pageSize=0）
- 内存泄漏系列（loading 指令、theme 浅污染、useToast duration）

### P3（可选优化，低风险）

- 低严重度各项

---

## 备注

- 部分组件（Select/Combobox/Checkbox/RadioGroup/Switch/Label/NumberInput/HardcoreInput/form 子组件等）未发现确认的功能性 bug。
- 含 `IntersectionObserver`/`ResizeObserver`/`AudioContext`/`requestAnimationFrame`/`setTimeout`/`setInterval`/`URL.createObjectURL` 的组件大多已在 `onUnmounted`/`onBeforeUnmount` 做了清理，未发现遗漏（除上文已列出的 Watermark 异步路径、useKanban rAF、useClipboard await 等）。
- 本报告基于静态代码分析，部分 bug（如时区相关）需结合实际运行环境验证。
