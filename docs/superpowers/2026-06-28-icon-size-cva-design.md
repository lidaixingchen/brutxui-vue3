# 图标尺寸硬编码统一修复设计

* 日期：2026-06-28

* 范围：`packages/ui/src/lib/`、`packages/ui/src/components/` 下约 40+ 个组件，共约 50 处图标尺寸硬编码

* 类型：重构 + API 增强（向后兼容；默认零视觉回归，模式 A 部分组件为 intentional fix，见 §2/§6）

## 1. 背景与问题

代码库中大量组件在模板里把图标尺寸写死为 `h-4 w-4` / `h-5 w-5` / `h-6 w-6` / `h-8 w-8`，无法按用量缩放。典型示例：

```vue
<!-- SelectTrigger.vue:32 —— 有 size 变体但图标不联动 -->
<ChevronDown class="h-5 w-5 stroke-[3]" />
```

`SelectTrigger` 已有 `size` prop（`sm`/`default`/`lg` → `h-9`/`h-11`/`h-14`）和 `iconClass` prop，但图标尺寸与 `size` 完全脱钩，小尺寸触发器里的箭头仍然占 `h-5 w-5`。

全量审计发现约 50 处同类硬编码，分布在 40+ 组件中。现有代码库已有两种局部处理范式，但未统一：

- **Checkbox（金标准）**：在 `checkbox-variants.ts` 定义独立的 `checkboxIndicatorVariants` CVA，按同一 `size` prop 联动，图标用 `h-full w-full` 填充
- **Button（单图标映射）**：在 `Button.vue` 内用 `LOADER_SIZE_MAP` Record 映射 `size` → 图标类
- **SelectTrigger（损坏）**：有 `size` 与 `iconClass`，但图标仍写死

两种范式的尺寸阶梯实际完全一致（`sm=h-3` / `default=h-4` / `lg=h-5` / `xl=h-6`），具备提炼为共享事实源的条件。

## 2. 目标

* 建立单一事实源的共享图标尺寸 CVA，全库 50 处硬编码统一消费

* 组件图标尺寸可通过 prop 控制，按用量缩放

* 零视觉回归（默认）：不传任何新 prop 时，模式 B/C/D 组件及模式 A 中图标已随 `size` 联动的组件（Button loader、Checkbox 指示图标）外观与现状完全一致

* 模式 A 联动修正（intentional fix）：模式 A 中图标当前不随 `size` 缩放的组件（`SelectTrigger`、`Pagination` 等），本次使其图标随 `size` 联动——sm 档图标略变小、lg 档略变大。这是对"损坏"状态的有意修正，不属于零回归范畴，需在测试中补充前/后断言并做视觉检查

* 迁移 Checkbox / Button 到共享 CVA，消除重复定义

## 3. 非目标

* 不改变图标的描边宽度（`stroke-[3]` / `stroke-[2.5]` 是视觉风格而非尺寸，保持各组件现状）

* 不改变组件已有的 `size` prop 语义与默认值

* 不重构图标本身的颜色、动画、布局

* 不调整 reka-ui 原语的内部结构

## 4. 共享 CVA 设计

### 4.1 新建文件

`packages/ui/src/lib/icon-size-variants.ts`：

```ts
import { cva, type VariantProps } from 'class-variance-authority'

export const iconSizeVariants = cva('', {
    variants: {
        size: {
            xs: 'h-2.5 w-2.5',
            sm: 'h-3 w-3',
            default: 'h-4 w-4',
            lg: 'h-5 w-5',
            xl: 'h-6 w-6',
            '2xl': 'h-8 w-8',
        },
    },
    defaultVariants: { size: 'default' },
})

export type IconSize = NonNullable<VariantProps<typeof iconSizeVariants>['size']>
```

### 4.2 尺寸阶梯依据

| IconSize | 类名 | 现有出处 | 用途 |
|----------|------|----------|------|
| `xs` | `h-2.5 w-2.5` | （新增补齐） | 极小场景 |
| `sm` | `h-3 w-3` | Button sm loader / Checkbox sm | 小号按钮/复选框 |
| `default` | `h-4 w-4` | Button default / Checkbox default / 40+ 处硬编码 | 主流尺寸 |
| `lg` | `h-5 w-5` | Button lg / Checkbox lg / SelectTrigger 等 6 处 | 大号触发器/按钮 |
| `xl` | `h-6 w-6` | Button xl / CookieConsent / FileCard / Toast | 特大图标 |
| `2xl` | `h-8 w-8` | SuccessCard / TestimonialCard | 页面级强调图标 |

`sm`/`default`/`lg`/`xl` 与 Button `LOADER_SIZE_MAP` 及 Checkbox `checkboxIndicatorVariants` 完全一致（h-3 / h-4 / h-5 / h-6），确保迁移零回归；`xs` 补齐极小场景，`2xl` 覆盖页面级 `h-8 w-8`。

### 4.3 从 src/index.ts 导出

`IconSize` 类型与 `iconSizeVariants` 一并从 `packages/ui/src/index.ts` 导出，供外部消费者按需复用同一阶梯。

## 5. 四种消费模式

### 5.1 模式 A：组件已有 `size` prop —— size 自动联动

适用组件的 `size` prop 已有 `sm`/`default`/`lg`(/`xl`) 语义，**且 `size` 语义与整体刻度（含图标）相关**。组件内部建立 `size → IconSize` 映射，图标自动缩放，**不新增 prop**。

> 说明：`Toast` 虽有 `size` prop，但其 `size` 控制的是容器宽度（`w-72`/`w-80`/`w-96`），与图标刻度无关，故归入模式 B。判断模式 A 的关键是 `size` 是否表达"整体放大/缩小"，而非仅是否名为 size。

```ts
// 示例：SelectTrigger
const SIZE_TO_ICON: Record<NonNullable<SelectTriggerVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'default',
    lg: 'lg',
}

const iconClasses = computed(() =>
    cn(
        iconSizeVariants({ size: SIZE_TO_ICON[props.size] }),
        'stroke-[3]',
        props.iconClass,
    )
)
```

### 5.2 模式 B：组件无 `size` prop 但属可复用原语 —— 新增 `iconSize?: IconSize`

```ts
interface NumberInputProps extends NumberFieldRootProps {
    layout?: 'split' | 'stacked'
    iconSize?: IconSize          // 新增
    placeholder?: string
    class?: string
}

const props = withDefaults(defineProps<NumberInputProps>(), {
    layout: 'split',
    iconSize: 'default',         // 默认 = 当前视觉尺寸（h-4 w-4）
    placeholder: undefined,
    class: undefined,
})

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
```

模板内所有写死尺寸的图标统一改用 `:class="iconClasses"`。

> 注：示例中的 `'stroke-[3]'` 仅为示意，实际描边宽度按各组件现状保留（如 `Toast` 主图标为 `stroke-[2.5]`、多数图标为 `stroke-[3]`），不纳入 CVA，见 §3 非目标。

### 5.3 模式 C：页面/区段组件一次性图标 —— 新增 `iconSize?: IconSize`

API 形态与模式 B 一致。默认值映射到当前硬编码尺寸：

* 当前 `h-4 w-4` → 默认 `iconSize: 'default'`
* 当前 `h-5 w-5` → 默认 `iconSize: 'lg'`
* 当前 `h-6 w-6` → 默认 `iconSize: 'xl'`
* 当前 `h-8 w-8` → 默认 `iconSize: '2xl'`

**多图标组件的明确规则**：`iconSize` 只控制**主内容图标**（如 `ErrorCard` 的 `AlertTriangle`、`BrutalistHero` 的 `ArrowRight`、`FileCard` 的文件图标、`Toast` 的状态图标）。**装饰性/铬元素图标**（关闭按钮 `X`、下载按钮等标准 UI 操作图标）保持当前固定尺寸 `h-4 w-4`，不随 `iconSize` 变化——这类图标是窗口铬，不应随内容缩放。这样既保证零回归，又避免为每个图标引入独立 prop 导致 prop 爆炸。

若用户确需同时缩放铬图标，可通过现有 `class` prop 或具名 slot 覆盖，不在本设计引入额外 prop。

### 5.4 模式 D：仅含铬图标的原语 —— 内部消费 CVA，不暴露 prop

部分原语（如 `DialogContent`、`SheetContent`）模板内**唯一的图标就是关闭按钮 `X`**，属铬元素，按 §5.3 规则不随 `iconSize` 变化。这类组件不新增 `iconSize` prop（prop 无主图标可控，形同虚设），但其模板内的裸 `h-4 w-4` 仍需消除：改为内部以固定值消费共享 CVA——`cn(iconSizeVariants({ size: 'default' }), 'stroke-[3]')`，不暴露 prop。如此既满足"单一事实源"（尺寸定义集中在 CVA 文件），又避免给无主图标的组件强加无意义 prop。

## 6. 向后兼容与零回归策略

* **默认值 = 当前视觉**：每处 `iconSize` 默认值严格映射到当前硬编码尺寸，不传 prop 时外观零变化

* **保留 `iconClass` prop**：`SelectTrigger` 等已有 `iconClass` 的组件保持兼容，`cn(iconSizeVariants(...), 'stroke-[3]', props.iconClass)` 让用户仍可覆盖

* **Checkbox 迁移**：将 `checkboxIndicatorVariants` 的尺寸值改为复用 `iconSizeVariants`（`sm`/`default`/`lg` 三档值完全一致：`h-3`/`h-4`/`h-5`），消除重复定义，行为不变

* **Button 迁移**：用 `iconSizeVariants` 替换 `LOADER_SIZE_MAP` Record（`sm`/`default`/`lg`/`xl` 四档值完全一致：`h-3`/`h-4`/`h-5`/`h-6`），行为不变

* **模式 A 联动修正（非零回归）**：`SelectTrigger`、`Pagination` 等当前图标不随 `size` 缩放的组件，本次使其联动。这是 intentional visual fix：sm 档图标略变小、lg 档略变大。需在 §9 测试中补充联动前/后断言，并在对应批次做视觉检查

* **描边保留**：`stroke-[3]` / `stroke-[2.5]` 等保持原样，不纳入 CVA

## 7. 组件清单与分组

### 7.1 模式 A（已有 `size` prop，size 联动图标）

| 组件 | 当前硬编码 | size → IconSize 映射 |
|------|-----------|---------------------|
| `SelectTrigger` | h-5 w-5 | sm→sm / default→default / lg→lg |
| `Pagination` | h-4 w-4 ×4 | sm→sm / default→default / lg→lg |
| `Button`（已迁移） | 原 `LOADER_SIZE_MAP` 已删除，改用 `iconSizeVariants` | sm→sm / default→default / lg→lg / xl→xl / icon→default |
| `Checkbox`（已迁移） | 原 `checkboxIndicatorVariants` size 变体已移除（`stroke-[3]` 移至 base），size 改用 `iconSizeVariants` | sm→sm / default→default / lg→lg |
| `GlitchButton` | LOADER_SIZE_MAP（sm/default/lg/xl/icon） | sm→sm / default→default / lg→lg / xl→xl / icon→default |

> **零回归 vs 联动修正**：`Button`（loader）、`Checkbox`、`GlitchButton` 的图标本就随 `size` 联动且值与 `iconSizeVariants` 完全一致，迁移后外观不变。`SelectTrigger`、`Pagination` 当前图标**不随 `size` 变化**（分别恒为 `h-5`、`h-4`），本次使其联动属 intentional visual fix：`SelectTrigger` 的 default 档由 `h-5` 变 `h-4`、`Pagination` 的 sm/lg 档由 `h-4` 分别变 `h-3`/`h-5`。这两个组件需在 §9 补前/后断言并在批次 1 做视觉检查。

> **批次 4 迁移说明**：`Button` 删除了内部 `LOADER_SIZE_MAP` 常量，改用 `BUTTON_SIZE_TO_ICON` 映射 + `iconSizeVariants`（含 `icon→default` 回退，对应原 `LOADER_SIZE_MAP[props.size] ?? LOADER_SIZE_MAP.default` 行为）。`Checkbox` 将 `checkboxIndicatorVariants` 的 `size` 变体（`h-3`/`h-4`/`h-5`，与 `iconSizeVariants` 重复）移除，`stroke-[3]` 上移至 base 类，尺寸由 `CHECKBOX_SIZE_TO_ICON` + `iconSizeVariants` 在调用点组合；`checkboxIndicatorVariants` 仍保留导出（仅含 base 类，无变体），向后兼容。两者行为零回归。

> **排除组件说明**：`Spinner`、`DotsSpinner`、`RadioGroup`、`Switch` 虽有 `size` prop，但其 `size` 控制的是容器/圆点/滑块本身尺寸（非独立图标），且尺寸阶梯与 `iconSizeVariants` 不一致（如 `Spinner` 容器 sm=h-5/default=h-8、`DotsSpinner` 圆点 sm=h-1.5、`RadioGroup` 圆框 sm=h-5、`Switch` thumb 含 `translate-x` 耦合）。强行套用 `iconSizeVariants` 会造成视觉回归，故从模式 A 移除，不在本次改造范围。

### 7.2 模式 B（无 `size`，新增 `iconSize`，可复用原语）

| 组件 | 当前硬编码 | 默认 iconSize（主图标） |
|------|-----------|--------------|
| `AccordionTrigger` | h-5 w-5（含装饰边框） | `lg` |
| `NumberInput` | h-4 w-4 ×4 | `default` |
| `Combobox` | h-4 w-4 | `default`（主图标跟随 prop；Check 固定 `default`） |
| `ComboboxMulti` | h-4 w-4 | `default`（主图标跟随 prop；Check 固定 `sm`） |
| `SelectItem` | h-4 w-4（Check） | `default` |
| `SelectScrollUpButton` | h-4 w-4 | `default` |
| `SelectScrollDownButton` | h-4 w-4 | `default` |
| `DropdownMenuSubTrigger` | h-4 w-4 | `default` |
| `DropdownMenuCheckboxItem` | h-4 w-4 | `default` |
| `TreeSelect` | h-4 w-4 | `default`（触发器图标跟随 prop；清除 X 固定 `sm`） |
| `TreeSelectNode` | h-4 w-4 | 内部固定 `default`，不暴露 prop |
| `Toast` | h-4 w-4（关闭 X）+ h-6 w-6（主图标） | 主图标 `xl`、关闭按钮 `default` |
| `CopyToClipboard` | h-4 w-4 ×2 | `default` |
| `BreadcrumbEllipsis` | h-4 w-4 | `default` |
| `SearchWidget` | h-4 w-4 | `default` |
| `BeforeAfter` | h-4 w-4 | `default` |
| `DashboardShell` | h-4 w-4（菜单按钮） | `default` |

> 说明：`TagsInputItemDelete`、`Carousel` / `CarouselEnhanced`、`ColorModeSwitcher`、`Stepper` 经核实模板内无 `h-N w-N` 硬编码图标尺寸（图标使用 `h-full` 或无固定尺寸），不在本次改造范围。`CopyToClipboard` 的复制/已复制图标是该组件的核心主内容（非窗口铬），故归模式 B 而非模式 D。

> **批次 2 实施决策（修订）**：
> - **`DropdownMenuRadioItem` 从模式 B 移除**：其 `Circle` 指示图标实际为 `h-2 w-2`，不在 `iconSizeVariants` 阶梯上（最小档 `xs=h-2.5`），套用会造成视觉回归。保留原硬编码，不纳入本次改造。
> - **`TreeSelectNode` 内部固定 `default`，不暴露 prop**：作为递归内部组件，所有图标原为 `h-4 w-4`，内部统一消费 `iconSizeVariants({ size: 'default' })` 即可消除硬编码，无需通过 prop 暴露（避免递归传递复杂化）。
> - **`Combobox` / `ComboboxMulti` 的 `Check` 图标固定内部消费**：`Check` 是列表项选中指示器（铬），不跟随 `iconSize` prop。`Combobox` 的 `Check` 固定 `default`（与原 `h-4 w-4` 一致），`ComboboxMulti` 的 `Check` 固定 `sm`（与原 `h-3 w-3` 一致，若跟随默认 `default` 会从 `h-3` 变 `h-4` 造成回归）。仅触发器主图标 `ChevronsUpDown` 跟随 `iconSize` prop。
> - **`Toast` / `TreeSelect` 的关闭/清除 X 图标固定内部消费**：按 §5.3 铬图标规则，`Toast` 关闭 X 固定 `default`、`TreeSelect` 清除 X 固定 `sm`，不跟随 `iconSize` prop。
> - **`AccordionTrigger` `iconSize` 从 `delegatedProps` 剥离**：该组件用 `useForwardProps` 转发 props 到 reka-ui `AccordionTrigger` 原语，自定义 `iconSize` 必须从 `delegatedProps` 中剥离，防止作为未知 attribute 落到 DOM。

### 7.3 模式 C（页面/区段组件，新增 `iconSize`）

| 组件 | 主图标（受 iconSize 控制） | 铬图标（固定不变） | 默认 iconSize |
|------|---------------------------|-------------------|--------------|
| `BrutalistHero` | ArrowRight h-5 w-5 | Sparkles h-4 w-4（徽章装饰） | `lg` |
| `ErrorCard` | AlertTriangle h-5 w-5 | X / RotateCw h-4 w-4（按钮内） | `lg` |
| `QuickActions` | 动态 action.icon h-5 w-5 | — | `lg` |
| `HeaderSection` | Menu h-5 w-5 | — | `lg` |
| `AuthCard` | Mail / Lock / 密码切换 h-4 w-4 | Google / Github 品牌 SVG h-4 w-4（按钮内） | `default` |
| `BlogListPage` | Search h-4 w-4 | — | `default` |
| `CookieConsent` | Cookie h-6 w-6 | — | `xl` |
| `FileCard` | FileIcon h-6 w-6 | Download h-4 w-4（按钮内） | `xl` |
| `FeedbackForm` | Send h-4 w-4 | — | `default` |
| `NotFoundPage` | ArrowLeft h-4 w-4 | — | `default` |
| `StepperSection` | ChevronLeft / ChevronRight h-4 w-4 | — | `default` |
| `WaitlistPage` | Sparkles / Users h-4 w-4 | Star h-3 w-3（装饰评分，固定 sm） | `default` |
| `DashboardStats` | stat.icon h-4 w-4 | 趋势图标 h-4 w-4（固定 default） | `default` |
| `SuccessCard` | Check h-8 w-8 | — | `2xl` |
| `TestimonialCard` | Quote h-8 w-8 | — | `2xl` |
| `DataTableSection` | 操作图标 h-4 w-4 | — | `default` |

> **`EmptyState` 从模式 C 移除**：其主图标（`FolderOpen`/自定义 `icon`）实际为 `h-10 w-10`，不在 `iconSizeVariants` 阶梯上（最大档 `2xl=h-8 w-8`），属装饰性 hero 图标（置于 `h-20 w-20` 容器内）；`Plus` 是按钮内铬图标（`h-4 w-4`）。无既符合阶梯又应跟随 prop 的主内容图标，套用会造成视觉回归，故从模式 C 移除，保留原硬编码。

> **`SubmitButton` 从模式 C 移除**：该组件本身模板内无任何 `h-N w-N` 图标硬编码，亦无图标导入——它只是 `Button` 的封装，透传 `size`/`loading` props。`Loader2` 图标位于 `Button.vue` 内部，已在批次 4 迁移至 `iconSizeVariants` 并按 `size` 联动。故 `SubmitButton` 无既存硬编码可消除，也无主图标可暴露 `iconSize` prop，套用会引入无意义 prop，故从模式 C 移除。

> **子批 3a 已完成**（8 个）：`FileCard`、`SuccessCard`、`TestimonialCard`、`CookieConsent`、`ErrorCard`、`NotFoundPage`、`AuthCard`、`FeedbackForm`。其中 `AuthCard` 的 Google/Github 品牌 SVG 作为铬图标固定 `default` 内部消费；`ErrorCard` 的 X/RotateCw、`FileCard` 的 Download 同为按钮内铬图标固定 `default`。

> **子批 3b 已完成**（8 个）：`BrutalistHero`、`QuickActions`、`HeaderSection`、`BlogListPage`、`StepperSection`、`WaitlistPage`、`DashboardStats`、`DataTableSection`。其中 `BrutalistHero` 的 Sparkles（徽章装饰）作为铬图标固定 `default` 内部消费；`WaitlistPage` 的 Star 评分作为装饰图标固定 `sm` 内部消费（不跟随 prop，避免回归）；`DashboardStats` 的趋势图标（ArrowUpRight/ArrowDownRight/Minus）作为状态指示器固定 `default` 内部消费。

### 7.4 模式 D（仅含铬图标，内部消费 CVA，不暴露 prop）

这些组件模板内唯一的图标是关闭按钮 `X`（铬元素），按 §5.3 不随 `iconSize` 变化，故不新增 prop；但裸 `h-4 w-4` 改为内部 `iconSizeVariants({ size: 'default' })` 消除硬编码。

| 组件 | 当前硬编码 | 处理 |
|------|-----------|------|
| `DialogContent` | h-4 w-4（关闭 X） | 内部 `iconSizeVariants({ size: 'default' })`，不暴露 prop |
| `DialogEnhanced` | h-4 w-4（关闭 X） | 同上 |
| `SheetContent` | h-4 w-4（关闭 X） | 同上 |

## 8. 落地批次

按依赖关系分 4 批，每批独立可验证：

| 批次 | 内容 | 组件数 | 验证 |
|------|------|--------|------|
| **批次 1** | 新建 `icon-size-variants.ts` + 从 `index.ts` 导出 + 模式 A 中 `SelectTrigger`/`Pagination`/`GlitchButton`（`Button`/`Checkbox` 留待批次 4 迁移） | 3 + 共享 CVA | typecheck + lint + 该批组件 test + SelectTrigger/Pagination 视觉检查 |
| **批次 2** | 模式 B 全部可复用原语 + 模式 D 全部组件 | 20（17 模式 B + 3 模式 D） | typecheck + lint + test |
| **批次 3a** | 模式 C 卡片/页面级组件（FileCard、SuccessCard、TestimonialCard、CookieConsent、ErrorCard、NotFoundPage、AuthCard、FeedbackForm） | 8 | typecheck + lint + test ✅ |
| **批次 3b** | 模式 C 区段/布局组件（BrutalistHero、QuickActions、HeaderSection、BlogListPage、StepperSection、WaitlistPage、DashboardStats、DataTableSection） | 8 | typecheck + lint + test ✅ |
| **批次 4** | 迁移 Checkbox / Button 到共享 CVA，删除 `LOADER_SIZE_MAP` 与 `checkboxIndicatorVariants` size 变体 | 2 | typecheck + lint + test ✅ |

> **`EmptyState` 排除**：原列于模式 C，实际主图标 `h-10 w-10` 不在阶梯，从批次 3a 移除（详见 §7.3 排除说明）。
>
> **`SubmitButton` 排除**：原列于模式 C 批次 3b，实际组件本身无图标硬编码（`Loader2` 在 `Button.vue` 内部，批次 4 已迁移），从批次 3b 移除（详见 §7.3 排除说明）。故模式 C 实际为 16 个组件（8 + 8），非原估 ~18。

全部完成后执行 `pnpm release:check` 完整门禁。

## 9. 测试策略

* **零回归基线**：现有测试全部通过，不修改既有断言（唯一例外：`SelectTrigger` 原有 "applies default icon classes to chevron" 断言了 default 档 `h-5 w-5`，恰是本次 intentional fix 的目标值，需同步改为 `h-4 w-4` 并补充 sm/lg 联动断言，详见下方"模式 A 联动前/后断言"）

* **新增单元测试**（每模式各取 1 个代表组件）：
  * 模式 A：`SelectTrigger` —— 切换 `size` prop 验证图标 class 含对应尺寸
  * 模式 B：`NumberInput` —— 传 `iconSize="lg"` 验证 4 个图标 class 含 `h-5 w-5`
  * 模式 C：`SuccessCard` —— 传 `iconSize="xl"` 验证图标 class 含 `h-6 w-6`
  * 模式 D：`DialogContent` —— 验证关闭按钮 class 含 `h-4 w-4`（来自 `iconSizeVariants`，不暴露 prop）
  * 共享 CVA：`iconSizeVariants({ size: '2xl' })` 返回 `h-8 w-8`，`({ size: 'sm' })` 返回 `h-3 w-3`

* **默认值快照断言（关键，防回归主保障）**：模式 B/C 每个组件不传 `iconSize` 时，图标 class 与改造前完全一致（快照断言）。由于现有测试大多未断言图标 class，零回归保障主要来自这组新增断言，而非既有测试

* **模式 A 联动前/后断言**：`SelectTrigger`、`Pagination` 显式断言联动后各 `size` 档的图标 class（承认是 intentional fix，非零回归）：如 `SelectTrigger` default 档含 `h-4 w-4`、lg 档含 `h-5 w-5`

* **覆盖测试**：`iconClass` prop 仍可覆盖尺寸（`cn` merge 生效，测试用例显式覆盖 `iconClass='h-10 w-10'` 验证生效）

## 10. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 默认值映射错误导致视觉回归 | 每处默认值严格对照原硬编码值；批次 1/2/3 各跑一次视觉检查 |
| `cn` merge 顺序导致 `iconClass` 无法覆盖 | 测试用例显式覆盖 `iconClass='h-10 w-10'` 验证生效 |
| 模式 B/C 组件 prop 数膨胀 | 单一 `iconSize` prop，不引入多个图标各自 prop；多图标组件按主图标统一 |
| Checkbox/Button 迁移引入隐性变化 | 批次 4 单独提交，尺寸值逐位对照原 `LOADER_SIZE_MAP` / `checkboxIndicatorVariants` |
| 部分组件图标带装饰类（如 AccordionTrigger 的边框背景） | 仅替换尺寸段，保留 `border-3 rounded-brutal bg-brutal-bg p-0.5` 等装饰类 |
| SelectTrigger/Pagination 联动改变默认档视觉 | 已识别为 intentional fix，非回归；补前/后断言并在批次 1 做视觉检查 |

## 11. 验收标准

* `pnpm typecheck` / `pnpm lint` / `pnpm test` 全绿

* `pnpm release:check` 完整门禁通过

* 全库 grep `h-[0-9.]+ w-[0-9.]+` 在 `packages/ui/src/components/**/*.vue` 模板内的图标元素上不再出现裸尺寸硬编码；允许的豁免：变体定义文件 `*-variants.ts`、容器/布局类元素（非图标）。模式 D 组件的关闭按钮经 `iconSizeVariants` 消费后同样不再含裸硬编码

* 模式 A/B/C 各抽样 1 个组件传 `iconSize` 切换尺寸生效；模式 D 组件关闭按钮尺寸固定为 `h-4 w-4`

* 不传任何新 prop 时，模式 B/C/D 组件及 Button/Checkbox 文档站与 demo 视觉与改造前一致；`SelectTrigger`/`Pagination` 的视觉变化与 §7.1 注明的一致

## 12. 后续工作（不在本设计范围）

* 文档站补充 `iconSize` prop 说明
* registry JSON 同步更新（新增 prop 会反映在生成的 registry 中）
* 考虑是否将 `IconSize` 推广到 CLI 模板与示例代码
