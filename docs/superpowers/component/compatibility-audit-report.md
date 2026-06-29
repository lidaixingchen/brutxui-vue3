# 兼容性包袱审查报告

全量扫描 96 个组件目录，按问题类别汇总。

---

## 一、defaultValue 双模式（4 处）

Vue 3 应只用 `v-model`，不需要 `defaultValue` 非受控模式。

| 组件 | 文件 | 当前代码 |
|---|---|---|
| Checkbox | `Checkbox.vue:15,53` | `defaultChecked` + `checked` 双模式 |
| Switch | `Switch.vue:13,42` | `defaultValue` + `modelValue` 双模式 |
| Toggle | `Toggle.vue:11,35` | `defaultValue` + `pressed` 双模式 |
| RadioGroup | `RadioGroup.vue:7,22` | `defaultValue` + `modelValue` 双模式（同时透传 `:default-value` + `:model-value`，非条件 v-bind，与其他 3 处模式略异） |

**修复**：删除 `defaultValue`/`defaultChecked`，只保留 `modelValue`。

---

## 二、命名不一致的 props（3 处）

| 组件 | 当前 | 应改为 |
|---|---|---|
| Input | `inputSize` | `size` |
| Textarea | `textareaSize` | `size` |
| Toggle | `pressed` / `update:pressed` | `modelValue` / `update:modelValue` |

---

## 三、emit 命名不一致（camelCase vs kebab-case）

| 组件 | 当前 emit | 应改为 |
|---|---|---|
| DashboardShell | `signOut` | `sign-out` |
| AuthCard | `loginSubmit`, `forgotPassword`, `googleClick`, `githubClick`, `registerClick` | `login-submit`, `forgot-password`, `google-click`, `github-click`, `register-click` |
| BrutalistHero | `primaryCta`, `secondaryCta` | `primary-cta`, `secondary-cta` |
| DataTable | `pageChange`, `pageSizeChange` | `page-change`, `page-size-change` |

---

## 四、空变体值（CVA 变体值为空字符串）

| 文件 | 变体键 | 说明 |
|---|---|---|
| `accordion-variants.ts:53-56` | `accordionContentVariants` 全部 4 个 variant | `''` |
| `pagination-variants.ts:6` | `paginationVariants.variant.default` | `''` |
| `marquee-variants.ts:13` | `marqueeContainerVariants.fade.false` | `''` |
| `marquee-variants.ts:47` | `marqueeTrackVariants.pauseOnHover.false` | `''` |
| `carousel-variants.ts:12` | `carouselRootVariants.size.auto` | `''` |
| `virtual-scroll-variants.ts:40` | `virtualScrollItemVariants.variant.default` | `''` |
| `number-input-variants.ts:12-13` | `numberInputRootVariants.layout.split/stacked` | `''` |
| `avatar-variants.ts:22` | `avatarVariants.shape.square` | `''` |
| `tree-view-variants.ts:16` | `treeViewNodeVariants.selected.false` | `''` |
| `kanban-variants.ts:14,33,37,60` | 4 个 boolean `false` 变体 | `''` |
| `data-table-variants.ts:40,49,75,103,107` | 5 个 boolean `false` 变体 | `''` |

**修复**：boolean `false` 的 `''` 可删掉整个键；Accordion content 需填充实际样式。

**TypeScript 副作用提示**：CVA 通过 variant 键推断类型，`{ true: '...', false: '' }` 推断为 `boolean`；若仅保留 `{ true: '...' }`，类型可能收窄为 `true | undefined`，调用方传 `false` 会触发类型错误。删除前需用 `pnpm typecheck` 验证，或保留 `false: ''` 维持 `boolean` 语义。对非 boolean 的空值（`default`/`auto`/`square`/`split`/`stacked`）不建议删除，其承担占位变体语义。

---

## 五、未使用的 props / exports / 死代码（7 处）

| 组件 | 问题 |
|---|---|
| DataTable | `resizable` prop 声明但从未使用 |
| DataTable | `virtualScroll` prop 仅设 CSS 变量与 `enabled` 门控（`DataTable.vue:188`），`overscan`/`threshold` 从未读取 |
| DataTable | `dataTableBodyVariants` 是空 CVA `cva([])` |
| DataTable | `dataTableFilterVariants` 导出但从未导入 |
| DataTable | `dataTableFooterVariants` 被 `src/index.ts` 再导出，但无任何组件实际导入 |
| DataTable | `DataTableProps` 接口仅测试导入（`data-table.test.ts:5,29`），组件代码未用 |
| Carousel | `CarouselEnhanced.vue` 存在但未从 `index.ts` 导出，且大量复制 `Carousel.vue` 逻辑 |

---

## 六、冗余类型断言（20+ 处）

| 组件 | 行号 | 代码 |
|---|---|---|
| RadioGroup | `:29` | `$event as string` |
| Stepper | `:57,99` | `event.target as HTMLElement`, `buttons[i] as HTMLElement` |
| ToggleGroup | `:58` | `$event as string \| string[]` |
| TreeView | `:100,101,119,121,123,130,132,136` | 8 处 `as HTMLElement` |
| Kanban | `:69,70,101` | `as HTMLElement`, `as Node` |
| DataTableSection | `:59,83,87,90` | 4 处 `as keyof T` |
| UploadCard | `:70,71,89,99` | 1 处 `as HTMLElement` + 1 处 `as Node` + 1 处 `as HTMLInputElement` + 1 处非空断言 `!` |
| OverviewPage | `:52` | `Activity as Component` |
| ColorModeSwitcher | `:70,71` | `value as ColorMode` |

---

## 七、硬编码魔法值

| 组件 | 行号 | 问题 |
|---|---|---|
| ScratchCard | `:43-45` | `#FF6B6B`, `#4ECDC4`, `#000000` 硬编码颜色（实为 fallback，`:48-50` 会被 CSS 变量 `--brutal-primary` 等覆盖） |
| ScratchCard | `:57-58` | `lineWidth: 10`, `spacing: 20` 魔法数字 |
| ScratchCard | `:18-21` | `percentage: 50`, `brushRadius: 20`, `fadeDuration: 300` 未抽常量 |
| DatePicker | `:129,139,144,146` | 尺寸三元表达式硬编码 `sm? 'w-3.5' : lg? 'w-5' : 'w-4'` |
| ColorPicker | `:139,155,160,162` | 同 DatePicker 尺寸硬编码 |
| DashboardStats | `:75` | `getTrendIconClasses` 中 `iconSizeVariants({ size: 'default' })` 忽略 `props.iconSize`（主图标 `:62-64` 已正确使用） |
| AuthCard | `:125,129` | Google/GitHub SVG 路径内联数百字符 |
| AuthCard | `:79` | `EMAIL_REGEX` 与 WaitlistPage `:42` 完全重复 |
| Combobox | `:111` | check 图标 `size: 'default'` 硬编码，忽略 `iconSize` prop |
| GallerySection | `:86` | `stroke-[2]` 与其他组件 `stroke-[3]` 不一致 |
| QuickActions | `:45` | `stroke-[2.5]` 同上 |
| Progress | `:56` | `text-white` 硬编码，应使用主题 token |
| ToastContainer | `:18-20` | `maxVisible: 5`, `gap: 12` 未抽常量 |

---

## 八、eslint-disable 注释（12 处）

| 组件 | 文件数 | 说明 |
|---|---|---|
| TagsInput | 5 个子组件 | `delegatedProps` 解构忽略变量 |
| Accordion | 4 个子组件 | 同上 |
| NumberInput | 1 | 同上 |
| AlertDialog | 1 | 同上 |
| CodeBlock | 1 | `vue/no-v-html`（非 `delegatedProps` 类，规则不同） |

**修复**：用 `_` 前缀命名忽略变量替代 `eslint-disable`。

---

## 九、重复代码（跨组件）

| 重复内容 | 出现位置 |
|---|---|
| overlay 样式 | `DialogOverlay.vue`, `SheetContent.vue:30-35`, `alert-dialog-variants.ts` |
| close 按钮样式 | `dialog-variants.ts:dialogCloseVariants`, `SheetContent.vue:42-55` |
| header/footer 样式 | Dialog/AlertDialog/Sheet 各自独立定义 |
| `EMAIL_REGEX` | AuthCard `:79`, WaitlistPage `:42` |
| Spinner color/size maps | `BarsSpinner.vue`, `BlockSpinner.vue`, `DotsSpinner.vue` 各自硬编码 |
| SkeletonAvatar size | `sizeClasses` 手写 map，`skeletonVariants` 已有相同值 |

---

## 十、默认值不一致

| 组件 | 默认值 | 多数组件默认值 |
|---|---|---|
| Stepper | `variant: 'primary'` | `'default'` |
| Marquee | `variant: 'accent'` | `'default'` |
| Carousel | `size: 'auto'` | `'default'` |
| GlitchButton | `size` 多了 `xl`, `icon` | `sm/default/lg` |
| VirtualScroll | `size` 多了 `xl`, `full` | `sm/default/lg` |
| TypewriterText | `size` 多了 `xl`, `2xl` | `sm/default/lg` |

---

## 十一、未国际化（3 处）

| 组件 | 问题 |
|---|---|
| ColorModeSwitcher | `labels` 硬编码英文 `Light/Dark/System` |
| WaitlistPage | `placeholder="you@example.com"` 硬编码 |
| PricingSection | i18n 命名空间混用：部分 key 用 `saasPricing.*`（118/159/172/181 行），部分用 `pricingSection.*`（title/popular/empty），应统一为 `pricingSection.*` |

---

## 十二、其他零散问题

| 组件 | 问题 |
|---|---|
| Form | `cn('', props.class)` 空字符串多余（Form/FormConditional/FormControl） |
| FormConditional | `console.warn` 生产代码残留 |
| FormWizard | 无参 CVA 函数用 `computed` 包装无意义 |
| Breadcrumb | 6 个 CVA 变体函数全部无参数，CVA 包装无意义 |
| Card3D | `card3dShadowVariants` 是原始字符串而非 CVA，命名 `*Variants` 误导 |
| Card3D | `4px` offset 在 JS 常量和 CSS 变体中重复定义 |
| ColorModeSwitcher | 缺少 `class` prop，唯一一个没有的组件 |
| ColorModeSwitcher | 接口名 `Props` 而非 `ColorModeSwitcherProps` |
| CookieConsent | 使用 `<style scoped>` 自定义 CSS，与全局 Tailwind 模式不一致 |
| ScrollArea | `variant`/`size` 类型在 ScrollArea.vue 内联定义，ScrollBar.vue 从 CVA 派生，不同步 |
| StepperSection | `modelValue` + `currentStep` 双 prop 兼容模式 |
| DataTable | `sortDirection` vs `direction` 命名不一致（types.ts 内部） |

---

## 统计

| 类别 | 问题数 |
|---|---|
| defaultValue 双模式 | 4 |
| 命名不一致的 props | 3 |
| emit 命名不一致 | 8 个 emit |
| 空变体值 | 11 处 / 25+ 个条目 |
| 未使用的 props/exports | 7 |
| 冗余类型断言 | 20+ |
| 硬编码魔法值 | 13 处 |
| eslint-disable | 12 |
| 跨组件重复代码 | 6 组 |
| 默认值不一致 | 6 |
| 未国际化 | 3 |
| 其他零散 | 12 |
| **合计** | **~96** |
