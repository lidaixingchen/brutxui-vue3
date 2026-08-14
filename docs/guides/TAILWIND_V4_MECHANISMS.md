# Tailwind v4 机制说明

> 版本基线：Tailwind CSS ^4.3（packages/ui/package.json）、tailwind-merge ^3.6.0、`cn()` = `twMerge(clsx(...))`。
> 凡规则文本引用本文件的机制，解释一律以本文件为准，其它 guide 只引用、不重复抄写。
> 新增/修改 Tailwind v4 相关规则措辞前，先核验本文件的机制事实（含各节「实证」），再据此落笔。

## §1 `--tw-outline-style` 是元素级变量（@property inherits:false）与焦点体系演进

```css
@property --tw-outline-style { syntax: "*"; inherits: false; initial-value: solid; }
```

`inherits: false` 两个后果：

1. **变量不跨元素继承**——只作用于设置它的元素，子元素读取的是自己的 initial-value；
2. **未显式设置的元素读取得到 initial-value: solid**。

outline 工具类拆写（产物实证）：

- `outline-none` 写 `--tw-outline-style: none` + `outline-style: var(--tw-outline-style)`（重置该变量）；
- `outline-<n>` 只写 `outline-style: var(--tw-outline-style)` + `outline-width: <n>`（不重置该变量）；
- 颜色类只写 `outline-color`。

**旧陷阱**：若使用 outline 表达焦点，同一元素上 `outline-none` 与 `outline-<n>` 并存时，`outline-<n>` 读到被置为 `none` 的变量 → 焦点环静默不渲染；`focus-visible:outline-2` 不把 style 恢复为 solid。twMerge 不帮忙（不同类组，两个都保留，实证见 §2）。

**现状与方案**：
随着阴影全面迁移至 `@theme` 组装通道，box-shadow 与 ring（`--tw-ring-shadow`）分层共存、互不顶替。全库焦点体系统一为 `FOCUS_RING_CLASSES`（ring 五件套），焦点指示不再受 `--tw-outline-style` 陷阱影响。
配套的 `outline-hidden` 工具类在常规模式下抑制 UA 焦点环（`outline-style: none`），同时在 `@media (forced-colors: active)` 下自带 2px solid 恢复块，满足 WCAG 2.4.7 可访问性契约。

**推论规则**：

- 承载焦点指示的元素统一使用 `FOCUS_RING_CLASSES`（或其 focus-within 容器变体）；
- 禁止在承载焦点指示的元素上误加 `outline-none`（避免丢失 forced-colors 恢复）；
- focus-within 容器方案内层的 input/textarea 可保留 `outline-none` 抑制自身 UA 焦点环。

## §2 twMerge 同组静默移除

transition 族（`transition`、`transition-none`、`transition-all`、`transition-colors`、`transition-opacity`、`transition-shadow`、`transition-transform`、`transition-[...]`）同属一组：**后写者胜、先写者被静默移除**。

**实证**：

```text
node --input-type=module -e "import { twMerge } from 'tailwind-merge'; console.log(twMerge('transition-all duration-150','transition-[transform,box-shadow]'))"
→ "duration-150 transition-[transform,box-shadow]"   # transition-all 被静默移除
```

**推论规则**：

- 同一交互元素只声明一份 transition；
- 组件 base 声明 `transition-all` 又被 WithTransition 变体经 `cn()` 拼接时，源码里的 `transition-all` 是死类；
- 需要更多属性过渡时，用完整属性列表的任意值覆盖（如 `transition-[transform,box-shadow,color]`），而非 `transition-all`。

## §3 @utility vs 普通 @layer utilities 的变体支持

只有被工具引擎注册的类才支持变体写法（`hover:*`、`data-[...]:*` 等），注册途径仅两种：

- **@theme 令牌派生**（`--color-*` / `--shadow-*` 等）；
- **@utility 指令**。

普通 `@layer utilities` 手写类**不进工具引擎**，带变体写法（`hover:border-brutal`、`data-[highlighted]:border-brutal`）会被**静默丢弃**。

**实证**：`grep -c 'hover:border-brutal' packages/ui/dist/styles.css` = 0；`data-[highlighted]:border-brutal` 在 dist 中 0 命中，而 `.border-brutal` 基础类存在——正是普通 @layer utilities 手写类不带变体支持的证据。全库 6+ 处引用因此失效。

**规则**：需要变体支持的自定义工具类必须用 `@utility` 或 `@theme` 派生；禁止写带变体的手写 `@layer utilities` 类。

**现状**：`shadow-brutal*` 经 `@theme` 派生（单变量复合投影），进入 Tailwind v4 阴影组装通道（分层支持 `--tw-ring-shadow` 共存），变体按需生成；`.border-3`、`.border-brutal` 为手写 `@layer utilities` 类，不带变体支持。

## §4 @source 静态扫描字面量要求

`styles.css` 声明 `@source "../**/*.vue"` 与 `@source "../**/*.ts"`，Tailwind 按**源码字面量**逐个匹配，无法从 `${expr}` 动态拼接推断。

**规则**：

- 每个类名必须是**完整字面量**；
- 允许「完整字面量常量 + `${}` 组合」，但每个片段本身须为完整字面量；
- 禁止字面量缺一截的拼接（如 `h-[var(--sep-thickness,${DEFAULT_THICKNESS})]` 把变量值嵌入任意值内部）——`${}` 内的值不会进入 Tailwind 扫描结果，产物缺失该类。

**验证**：`grep -rnE '\$\{' packages/ui/src` 逐一核验（排除非类名上下文，如对象键、console 文案），并由 `check:class-literals` 门禁以类名上下文为界自动拦截（见 COMPONENT_GUIDE cn() 规则）。

## §5 设计令牌单一信源（SSOT）与多端自动化派生机制

全库设计令牌（颜色、阴影、动效缓动、字体栈、预设值）唯一事实来源为 `packages/shared/src/design-tokens.ts`（严格保持 0 外部依赖）。

**自动化派生流向**：
- `packages/ui/src/styles.css`：自动生成 `@theme`、`:root/.dark` 基础运行时变量与主题预设（`.theme-*`）；
- `packages/ui/src/preflight.css`：自动生成 body 字体栈回退；
- `packages/cli/src/styles/brutalist.css`：通过注释标记（Marker Injection）自动同步注入 `@theme` 与 `:root/.dark` 令牌及主题预设，并保护后方 650+ 行面向非 Tailwind v4 项目的静态工具类。

**开发期规则**：
- 严禁手动修改 `styles.css` 或 `brutalist.css` 中的令牌声明；
- 修改令牌只需更新 `packages/shared/src/design-tokens.ts`，运行 `pnpm prebuild:tokens` 即可完成多端同步；
- CI 门禁通过 `pnpm prebuild:tokens -- --check` 拦截任何未重新生成的样式文件漂移。

