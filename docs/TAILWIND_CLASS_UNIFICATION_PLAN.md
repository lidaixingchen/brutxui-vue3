# Tailwind Class 重复统一方案

> 撰写日期：2026-07-03
> 适用项目：`brutxui-vue3`
> 目标：消除 98+ 处直接内联的交互 Tailwind 类字符串，统一抽取到 `src/lib/` 下的常量文件
> 预估工作量：5 个 PR、约 8-10 小时、净减 ~70 行重复字符串

---

## 1. 现状摘要

### 1.1 已有抽取

`packages/ui/src/lib/brutal-interaction-variants.ts` 已导出 3 个常量：

| 常量 | 值 |
|---|---|
| `brutalHoverLift` | `'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5'` |
| `brutalHighlightLift` | `'data-[highlighted]:shadow-brutal-lg data-[highlighted]:-translate-x-0.5 data-[highlighted]:-translate-y-0.5'` |
| `brutalPress` | `'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'` |

### 1.2 引用现状

| 常量 | 被 import 次数 | 内联重复次数 |
|---|---|---|
| `brutalHoverLift` | 1（`select-variants.ts`） | 21 |
| `brutalHighlightLift` | 1（`command-variants.ts`） | 0 |
| `brutalPress` | 2（`command-variants.ts`、`select-variants.ts`） | **44** |

合计 65 处内联字符串与现有常量**完全一致**，可直接替换。

### 1.3 重复热点

- `brutalPress`（44 处）：`accordion-variants.ts`、`button-variants.ts`、`card-variants.ts`、`code-block-variants.ts`、`data-table-variants.ts`、`date-picker-variants.ts`、`pagination-variants.ts`、`slider-variants.ts`、`stepper-variants.ts`、`tabs-variants.ts`、`toggle-variants.ts`、`FooterSection.vue`、`PricingSection.vue`、`UploadCard.vue`、`DataTableSection.vue` 等 38+ 个文件
- `brutalHoverLift`（21 处）：`shared-button-variants.ts`（7 处）、`card-variants.ts`、`color-picker-variants.ts`、`data-table-variants.ts`、`dialog-variants.ts`、`kanban-variants.ts`、`radio-group-variants.ts`、`tree-view-variants.ts`、`BlogListPage.vue`、`OverviewPage.vue` 等
- `brutalPressWithTransition`（19 处，**新派生常量候选**）：press + `transition-all` 的固定组合，分散在多个 variants 文件中

---

## 2. 分类框架

把所有重复点按"可替换程度"分为三类，对应不同的处理策略：

| 类别 | 描述 | 数量 | 处理策略 |
|---|---|---|---|
| **A** | 字符串与现有常量**完全一致** | 65 | 直接替换为 import 引用 |
| **B** | 与常量相似但有微调 | 47 | 新建派生常量后替换 |
| **C** | 组件私有（仅出现一次或布局强耦合） | 13 | 保留内联，添加注释说明 |

---

## 3. 分类详表

### 3.1 类别 A：精确匹配（65 处）

#### A-1：`brutalPress` 精确匹配（44 处）

**目标常量**：`brutalPress`（已存在）

**涉及文件**（按目录聚合）：

- **lib 层**：`form-toggle-base.ts`、`modal-variants.ts`、`tree-variants.ts`
- **variants 层**：`accordion-variants.ts`、`button-variants.ts`、`card-variants.ts`、`code-block-variants.ts`、`color-picker-variants.ts`、`copy-to-clipboard-variants.ts`、`date-picker-variants.ts`、`dropdown-menu-variants.ts`、`glitch-button-variants.ts`、`glitch-text-variants.ts`、`input-variants.ts`、`kanban-variants.ts`、`number-input-variants.ts`、`pagination-variants.ts`（2 处）、`radio-group-variants.ts`、`slider-variants.ts`、`stepper-variants.ts`、`tabs-variants.ts`、`textarea-variants.ts`、`toggle-variants.ts`、`carousel-shared.ts`（2 处）
- **Vue 层**：`BlogListPage.vue`、`ActivityLogPage.vue`、`Calendar.vue`、`CarouselEnhanced.vue`、`DatePickerPanel.vue`、`DatePickerRangePanel.vue`、`DateTimePickerPanel.vue`、`MonthPickerPanel.vue`、`WeekPickerPanel.vue`、`YearPickerPanel.vue`、`DataTableSection.vue`（2 处）、`FooterSection.vue`、`GallerySection.vue`、`OverviewPage.vue`、`PricingSection.vue`（2 处）、`TagsInputItemDelete.vue`、`UploadCard.vue`

#### A-2：`brutalHoverLift` 精确匹配（21 处）

**目标常量**：`brutalHoverLift`（已存在）

**涉及文件**：

- `shared-button-variants.ts`（7 处，每个 variant 选项 1 处）
- `card-variants.ts`、`color-picker-variants.ts`、`copy-to-clipboard-variants.ts`、`data-table-variants.ts`、`date-picker-variants.ts`、`dialog-variants.ts`、`kanban-variants.ts`、`radio-group-variants.ts`、`select-variants.ts`（已引用，仅 1 处）、`stepper-variants.ts`、`tabs-variants.ts`、`tree-view-variants.ts`、`form-toggle-base.ts`
- `BlogListPage.vue`、`OverviewPage.vue`

#### A-3：`brutalHighlightLift` 精确匹配（0 处）

当前无内联重复，保持现状。

### 3.2 类别 B：需新建派生常量（41 处）

按"微调模式"聚合为 6 个派生常量候选：

#### B-1：`brutalPressWithTransition`（19 处，**最优先**）

**值**：`brutalPress + ' transition-all'`

**涉及文件**：`button-variants.ts`、`glitch-button-variants.ts`、`data-table-variants.ts`、`tabs-variants.ts`、`kanban-variants.ts`、`pagination-variants.ts`、`BlogListPage.vue`、`PricingSection.vue`、`ActivityLogPage.vue` 等

#### B-2：`brutalHoverLiftSm`（6 处）

**值**：`'hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5'`（小阴影版本）

**涉及文件**：`badge-variants.ts`、`card-variants.ts`（hover 小阴影变体）、`kbd-variants.ts`、部分 `Card.vue` 内联

#### B-3：`brutalHoverLiftWithTransition`（5 处）

**值**：`brutalHoverLift + ' transition-all'`

**涉及文件**：`carousel-variants.ts`、`dialog-variants.ts`、`tabs-variants.ts`

#### B-4：`brutalHoverLiftNoX`（4 处）

**值**：`'hover:shadow-brutal-lg hover:-translate-y-0.5'`（仅垂直 lift，无水平偏移）

**涉及文件**：`carousel-shared.ts`、`Card.vue`（垂直浮起变体）

#### B-5：`brutalPressWithShadowSm`（4 处）

**值**：`'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-brutal-sm'`（按下保留小阴影）

**涉及文件**：`button-variants.ts`（ghost 变体）、`toggle-variants.ts`

#### B-6：`brutalHighlightLiftWithBorder`（3 处）

**值**：`brutalHighlightLift + ' data-[highlighted]:border-brutal'`

**涉及文件**：`command-variants.ts`、`tree-view-variants.ts`

### 3.3 类别 C：组件私有（19 处）

**保留内联，添加注释说明原因**。典型例子：

- `carousel-variants.ts`：`active:translate-y-[calc(50%+2px)]` 配合 `top-1/2` 绝对定位，强耦合布局（3 处）
- `AuthCard.vue`：`active:translate-y-[2px]` 与 `active:scale-[0.98]`，不使用 CSS 变量或具备特有缩放效果，不满足全局主题压下偏移量（2 处）
- `WaitlistPage.vue`：`active:translate-y-[2px]`，不继承全局主题变量（1 处）
- `scratch-card-variants.ts`：`active:cursor-grabbing` 配合拖拽语义
- `sketchy-chart-variants.ts`：`hover:z-10` 仅用于图表数据点悬浮层级

---

## 4. 执行方案

### 4.1 阶段 1：扩充常量库（PR #1，预计 1h）

**修改文件**：`packages/ui/src/lib/brutal-interaction-variants.ts`

**新增 6 个派生常量**（按 §3.2 的 B-1 到 B-6）：

```ts
// 已有
export const brutalHoverLift = 'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5'
export const brutalHighlightLift = 'data-[highlighted]:shadow-brutal-lg data-[highlighted]:-translate-x-0.5 data-[highlighted]:-translate-y-0.5'
export const brutalPress = 'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'

// 新增
export const brutalPressWithTransition = `${brutalPress} transition-all`
export const brutalHoverLiftWithTransition = `${brutalHoverLift} transition-all`
export const brutalHoverLiftSm = 'hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5'
export const brutalHoverLiftNoX = 'hover:shadow-brutal-lg hover:-translate-y-0.5'
export const brutalPressWithShadowSm = 'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-brutal-sm'
export const brutalHighlightLiftWithBorder = `${brutalHighlightLift} data-[highlighted]:border-brutal`
```

**注意事项**：

- 派生常量**优先用模板字符串组合基础常量**（如 `${brutalPress} transition-all`），保证"基础值修改时派生值自动跟随"
- 不能用模板字符串的情况（如 `brutalHoverLiftSm` 的 shadow 尺寸不同）才写完整字符串，并在 JSDoc 注释里说明"派生自 brutalHoverLift，差异：shadow 从 -lg 改为 -sm"
- 文件头补一行注释：`// Tailwind 交互反馈（hover/press/highlight）基础常量与派生常量`

### 4.2 阶段 2：类别 A 精确替换（PR #2，预计 2h）

**范围**：65 处

**执行策略**：

1. **按文件批量替换**：用脚本（Python + regex）扫描每个文件中的精确字符串，替换为常量引用 + 自动添加 import
2. **保留字符串顺序**：如果原字符串在 CVA 数组中是独立元素（如 `'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'`），替换为 `brutalPress`
3. **合并到相邻类**：如果原字符串在 CVA 数组中与其它类合并为一个长字符串（如 `'bg-brutal-bg active:translate-y-... active:shadow-none'`），拆分为独立数组元素后再替换
4. **处理 Vue 文件**：`.vue` 文件中直接内联的类（如 `<Button class="active:translate-y-...">`）替换为 `:class="cn('...', brutalPress)"`，需要 `<script setup>` 中 import

**示例**：

```ts
// Before（button-variants.ts）
export const buttonVariants = cva([
    'inline-flex items-center justify-center gap-2',
    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
], ...)

// After
import { brutalPress } from '@/lib/brutal-interaction-variants'
export const buttonVariants = cva([
    'inline-flex items-center justify-center gap-2',
    brutalPress,
], ...)
```

**约束遵守**：

- ✅ 新常量文件放在 `src/lib/`，组件用 `@/lib/brutal-interaction-variants` import → 满足 C1/C2
- ✅ 文件名不在 `LIB_FILE_EXCLUDE` 中 → 满足 C3
- ✅ 不需要改 `component-files.ts` → 满足 C4
- ✅ 不需要改 `package.json` exports → 满足 C7
- ✅ 不需要改 barrel `lib/index.ts`（保持内部使用）→ 与现有 `brutal-interaction-variants` 一致

### 4.3 阶段 3：类别 B 派生常量替换（PR #3，预计 2h）

**范围**：47 处

**执行策略**：

1. **按"派生常量热度"排序**：先替换 `brutalPressWithTransition`（19 处），再处理其他
2. **每个派生常量一个 commit**：便于 review 和 revert
3. **与 PR #2 使用相同的替换脚本**，仅调整 regex 模式和目标常量名

**示例**：

```ts
// Before（tabs-variants.ts）
'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all'

// After
import { brutalPressWithTransition } from '@/lib/brutal-interaction-variants'
brutalPressWithTransition
```

### 4.4 阶段 4：类别 C 添加注释（PR #4，预计 0.5h）

**范围**：19 处

**执行策略**：

每处添加 `/* 组件私有：XXX 原因，不抽取 */` 注释。示例：

```ts
// carousel-variants.ts
'active:translate-y-[calc(50%+2px)]' /* 组件私有：配合 top-1/2 绝对定位，强耦合布局 */,

// AuthCard.vue
'active:translate-y-[2px]' /* 组件私有：不使用 CSS 变量，不继承全局主题压下偏移量 */,
```

### 4.5 阶段 5：验证与回归（PR #5，预计 1h）

**验证清单**：

1. **视觉回归**：
   - `pnpm docs:dev` 启动文档站
   - 人工走查 10 个核心组件（Button、Card、Select、Command、Tabs、Accordion、Dialog、Pagination、DatePicker、DataTable）的 hover/press/highlight 效果
   - 截图对比修改前后

2. **测试回归**：
   - `pnpm vitest run` 3318 个测试全过
   - 重点观察 dialog/carousel/select 相关测试（这些组件交互最复杂）

3. **类型检查**：
   - `pnpm tsc --noEmit` 零错误

4. **构建产物**：
   - `pnpm build` 成功
   - `dist/lib/brutal-interaction-variants.js` 存在且被保留
   - `dist/index.js` 体积变化 < 1%（预期：略减，因为字符串重复被常量引用替代）

5. **CLI 安装回归**：
   - `pnpm registry:build` 重建注册表
   - 抽样检查 `packages/registry/registry/button.json`、`select.json`、`tabs.json` 的 `files` 数组是否包含 `lib/brutal-interaction-variants.ts`
   - 在临时目录跑本地编译好的 CLI 程序（如 `node <workspace_path>/packages/cli/dist/index.js add button`），验证安装后的 `@/lib/brutal-interaction-variants.ts` 存在且内容正确

6. **Lint**：
   - `pnpm lint` 零错误

---

## 5. 约束清单（来自构建/发布/CLI 链路调研）

| # | 约束 | 方案中的对应动作 |
|---|---|---|
| C1 | 新常量文件必须放在 `packages/ui/src/lib/` 目录下 | 阶段 1 文件路径遵守 |
| C2 | 组件必须用 `@/lib/新文件名` 或相对路径 `../../lib/新文件名` import | 阶段 2/3 替换脚本统一生成 `@/lib/` 路径 |
| C3 | 文件名不能加入 `build-registry.ts` 的 `LIB_FILE_EXCLUDE` | `brutal-interaction-variants` 不在排除集合中 |
| C4 | 不需要在 `component-files.ts` 中登记 | 跳过 |
| C5 | `@/lib/*` import 不会被 CLI 重写 | 已知限制，无需处理 |
| C6 | 多组件安装同一 lib 文件时后装覆盖前装 | 内容相同无影响 |
| C7 | 内部常量无需改 `vite.config.ts` 或 `package.json` exports | 跳过 |
| C8 | 如需 npm 消费者独立 import，必须 barrel 导出 | 当前方案**不**对外暴露常量，跳过 |
| C9 | 如需独立子路径导出，需同时改 `vite.config.ts` + `package.json` | 当前方案不做 |
| C10 | 命名用 `kebab-case.ts` | `brutal-interaction-variants.ts` 已遵守 |
| C11 | CVA 已是直接依赖 | 派生常量无需 CVA（都是纯字符串），跳过 |
| C12 | `utils.ts` 在排除集合中 | 本方案不依赖 `utils.ts` |

---

## 6. 风险与回滚

### 6.1 主要风险

| 风险 | 概率 | 影响 | 缓解措施 |
|---|---|---|---|
| Tailwind purge 把常量引用的字符串当作动态类名而剔除 | 低 | 高 | CVA 会把数组/字符串字面量作为静态类名处理，与直接内联等效；阶段 5 视觉回归验证 |
| 替换脚本误改非目标字符串（如注释、变量名） | 中 | 中 | regex 加 `\b` 边界 + 仅处理 `.ts`/`.vue` 文件 + 阶段 5 人工 review 每个 diff |
| 派生常量的模板字符串求值时机导致构建时优化失效 | 低 | 低 | 模板字符串在 JS 运行时求值，对 Tailwind JIT 透明（JIT 只扫描最终字符串） |
| CLI 安装路径与用户 alias 配置不匹配（C5 已知限制） | 中 | 中 | 文档说明 + 后续可改 `resolveImportAlias` 处理所有 `@/lib/*`（独立议题，不在本方案范围） |

### 6.2 回滚策略

- 每个 PR 保持**原子提交**（一个派生常量一个 commit），便于 cherry-pick 回滚
- PR #1（扩充常量）独立可用，即使后续 PR 回滚也不影响现有代码
- 所有替换走 git，必要时 `git revert` 即可

---

## 7. 不做的事

明确不在本方案范围内的项目：

1. **不抽取 shadow CSS 定义重复**（`styles.css` / `brutalist.css` / `style.css` 三份 shadow 定义）：这是 CSS 层问题，应单独议题处理（考虑统一到 `@theme` + 删掉 `@layer utilities` 手工类和 `!important` fallback）
2. **不动 `--brutal-pressed-offset` 的 4 处声明**：各主题未覆盖，2px 是全局共识，可保留
3. **不抽 `focus:` / `disabled:` 等其它状态类**：本次聚焦 hover/press/highlight 三大交互状态；其它状态类（如 `focus:outline focus:outline-brutal-ring`）的重复模式需要先独立调研
4. **不对外暴露常量 API**：`brutal-interaction-variants` 保持内部实现细节，不加入 barrel 也不新增 `package.json` exports 子路径
5. **不做一次性 PR**：按阶段 1-5 分 5 个 PR，每个可独立 review/merge/revert

---

## 8. 交付清单

| PR | 标题 | 文件变更数 | 新增行数 | 删除行数 |
|---|---|---|---|---|
| #1 | `refactor(ui): 扩充 brutal-interaction-variants 派生常量` | 1 | ~20 | 0 |
| #2 | `refactor(ui): 替换 65 处精确匹配的 Tailwind 交互类为常量引用` | 38 | ~70 | ~70 |
| #3 | `refactor(ui): 替换 41 处派生常量匹配的 Tailwind 交互类` | 23 | ~45 | ~45 |
| #4 | `docs(ui): 为 19 处组件私有交互类添加保留原因注释` | 10 | ~20 | 0 |
| #5 | `chore(ui): Tailwind 交互类统一后的视觉与测试回归` | 0 | 0 | 0 |

**预期净收益**：

- 减少 ~70 行重复字符串
- 交互反馈集中到 1 个文件，未来调整"press 效果"或"hover 浮起"只需改 1 处
- 为后续"焦点环样式统一"、"禁用态样式统一"等议题沉淀了可复用的抽取方法论
