# NumberInput 视觉优化设计

> 方案类型：功能设计
> 状态：**active**
> 日期：2026-09-02
> 关联文档：[VISUAL_SYSTEM](../guides/VISUAL_SYSTEM.md)、[COMPONENT_GUIDE](../guides/COMPONENT_GUIDE.md)、[NumberInput 组件](../../packages/ui/src/components/number-input/NumberInput.vue)、[NumberInput 变体](../../packages/ui/src/components/number-input/number-input-variants.ts)
> 修订记录：2026-09-02 初版创建

## 背景与目标

`NumberInput`（数字输入框）作为表单数值录入组件，内部集成了步进加减按钮。当前步进按钮的交互视觉存在以下问题：
1. **容器内构件位移割裂**：按钮声明了 `hover:-translate-y-0.5`、`border-b-4` 与 `active:translate-y-1`。由于 `NumberInput` 外层容器具有 `overflow-hidden` 与固定边框，子按钮在 hover 时的上移破坏了输入框内部的平整性，导致上部溢出裁剪、底部产生空隙。
2. **悬浮色彩失活变暗**：按钮 hover 时使用了 `hover:bg-brutal-muted`，导致减号（黄色）和加号（红色）在悬浮时退色为暗淡的浅灰色，削弱了新粗野主义高对比度和视觉引导力。

本次设计目标：
- 消除内嵌按钮在 hover 时的物理位移，确保组件内部严密平整。
- 采用高反差反色策略（`hover:bg-brutal-fg hover:text-brutal-bg`），增强新粗野主义视觉张力与交互反馈。
- 同步适配亮色与暗色模式，完善测试契约。

## 现状与根因分析

在 `packages/ui/src/components/number-input/number-input-variants.ts` 中，`numberInputButtonVariants` 原实现如下：

```ts
export const numberInputButtonVariants = cva(
    [
        'flex items-center justify-center',
        'transition-all duration-150',
        'disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer',
        brutalPress,
        'hover:shadow-brutal-sm hover:-translate-y-0.5',
        'border-b-4',
        'active:border-b-0 active:translate-y-1 active:translate-x-0',
    ],
    {
        variants: {
            position: {
                decrement: 'bg-brutal-accent hover:bg-brutal-muted',
                increment: 'bg-brutal-primary hover:bg-brutal-muted',
            },
            layout: {
                split: 'px-4 border-brutal',
                stacked: 'flex-1 border-brutal',
            },
        },
        // ...
    }
)
```

根因归纳：
1. **复合组件与独立按键物理隐喻冲突**：`brutalPress` 与 `border-b-4` 适用于独立的物理键帽（如 `Kbd` 或独立按钮），但在被整体外边框包裹的复合输入框内，子元素单边浮动必然造成接缝断裂。
2. **Muted 色彩误用**：`muted` 属于次要/弱化语义，用作悬浮反馈使得激活状态反而弱于默认状态。

## 技术方案

### 1. 变体与样式重构 (`number-input-variants.ts`)

- **移除浮动与位移类**：
  - 移除 `brutalPress`、`hover:shadow-brutal-sm`、`hover:-translate-y-0.5`；
  - 移除 `border-b-4`、`active:border-b-0`、`active:translate-y-1`、`active:translate-x-0`。
- **引入高反差反色与平面交互**：
  - 添加基础过渡与状态类：`hover:bg-brutal-fg hover:text-brutal-bg`；
  - 添加轻量平整的按压反馈：`active:scale-95 transition-transform`（在自身边界内微压，不影响外层布局）；
  - `position` 变体仅负责默认底色：
    - `decrement`: `bg-brutal-accent text-brutal-fg`
    - `increment`: `bg-brutal-primary text-brutal-fg`
- **图标渲染适配**：
  - Lucide 图标的 stroke 默认使用 `currentColor`，在 `hover:text-brutal-bg` 作用下自动完成黑白反色切换，无需对图标单设样式。

### 2. 双模式与设计令牌语义化

统一采用系统设计令牌（`design-tokens.ts`），不引入硬编码色值：
- **亮色模式**：
  - 默认态：减号背景 `bg-brutal-accent`（黄色），加号背景 `bg-brutal-primary`（珊瑚粉红），文字/图标为前景色 `text-brutal-fg`（黑色）。
  - Hover 态：反色为 `bg-brutal-fg`（黑底）+ `text-brutal-bg`（白图标）。
- **暗色模式**：
  - 默认态：减号与加号保持对应语义色，边框与前景色自适应暗色配置。
  - Hover 态：反色为 `bg-brutal-fg`（白底）+ `text-brutal-bg`（深黑图标）。

### 3. 布局覆盖面

- **双侧分立式 (`split`)**：左右两端加减按钮悬浮时整齐反色。
- **右侧堆叠式 (`stacked`)**：右侧上下两个小步进按钮同样平整反色，消除堆叠按钮间的垂直挤压形变。

## 测试与质量保障

### 测试断言更新 (`number-input.test.ts`)

更新固化了旧缺陷样式的测试用例：
1. 移除对 `border-b-4`、`active:border-b-0`、`active:translate-y-1` 的断言。
2. 增加断言验证按钮不再包含 `-translate-y` 与 `border-b-4`。
3. 验证悬浮反色类 `hover:bg-brutal-fg` 和 `hover:text-brutal-bg` 正确应用。

### 校验命令

```bash
# 单测验证
pnpm --filter brutx-ui-vue test src/components/number-input/number-input.test.ts

# 类型检查
pnpm --filter brutx-ui-vue typecheck

# 规范检查
npx eslint packages/ui/src/components/number-input/ --fix
```
