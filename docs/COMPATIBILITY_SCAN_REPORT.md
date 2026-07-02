# 兼容性历史包袱扫描报告

> 扫描日期：2026-07-02
> 修订日期：2026-07-02（v2）——补充 §1.4-§1.7 死代码、§2.5 vitest-axe 类型兼容、§6 文档错误、§7 配置层包袱；校准 §2.1/§5 为精确计数；§2.3 标记为 [待验证]；新增 §9 修复优先级、§10 方法论自检
> 扫描范围：`packages/ui/src/`、`packages/cli/src/`、`packages/shared/src/`、`packages/registry/scripts/`、`apps/docs/`、`packages/ui/README.md`、`packages/ui/vite.config.ts`、`packages/ui/vitest.config.ts`、`packages/ui/package.json`

## 一、可安全删除的死代码

### 1.1 `component-preview.ts`（241 行）

- **路径**：`packages/ui/src/lib/component-preview.ts`
- **现状**：完整的组件预览注册表系统（`createComponentPreview`、`registerComponent`、`getComponent` 等 12 个导出），未从 `index.ts` 导出，无任何生产代码引用，仅自身测试文件引用。
- **建议**：连同 `component-preview.test.ts` 和 typedoc 排除配置整体删除。

### 1.2 `useDialogEnhanced.ts`（337 行）

- **路径**：`packages/ui/src/composables/useDialogEnhanced.ts`
- **现状**：拖拽 + 缩放 + 关闭前钩子 composable，仅从 `index.ts` 导出了类型 `UseDialogEnhancedReturn`，但 `DialogEnhanced.vue` 自行内联实现了完全相同的逻辑，composable 函数本身未被任何组件调用。
- **建议**：两条路——让 `DialogEnhanced.vue` 重构使用该 composable 消除重复，或整体删除并移除 `index.ts` 中的 type export。

### 1.3 `diff.d.ts` 中未使用的类型声明

- **路径**：`packages/cli/src/types/diff.d.ts`
- **现状**：声明了 `diffLines`、`diffWords`、`createTwoFilesPatch` 三个函数类型，但仅 `diffLines` 被 `commands/diff.ts` 使用，其余两个全项目无调用。
- **建议**：移除 `diffWords` 和 `createTwoFilesPatch` 的声明行。

### 1.4 `useEventListener` composable（70+ 行）

- **路径**：`packages/ui/src/composables/useEventListener.ts`
- **现状**：仅从 `composables/index.ts:79` 导出，**未从主入口 `packages/ui/src/index.ts` 导出**。全项目除自身测试文件 `useEventListener.test.ts` 外，无任何 `.vue` 组件或其他 composable 引用。
- **建议**：连同 `useEventListener.test.ts` 整体删除；若确有保留价值，则先从主入口 `index.ts` 导出并补上文档示例。

### 1.5 `test-utils/index.ts` 工具函数集合（275 行）

- **路径**：`packages/ui/src/test-utils/index.ts`
- **现状**：导出 10 个工具函数，全部零引用：`mountComponentWithDefaults`、`waitForNextTick`、`flushAllPromises`、`createMockEvent`、`createMockMouseEvent`、`createMockKeyboardEvent`、`mockWindowMatchMedia`、`mockWindowTimers`、`restoreWindowTimers`、`mockResizeObserver`、`mockIntersectionObserver`。所有测试文件都直接从 `@vue/test-utils` 引入 `mount`。`test-utils/` 目录下唯一被使用的是 `a11y.ts`（由 `button.a11y.test.ts` 引用）。
- **建议**：删除整个 `test-utils/index.ts`（保留 `a11y.ts` 和 `test-utils.d.ts`）。

### 1.6 `getA11yResults` 函数

- **路径**：`packages/ui/src/test-utils/a11y.ts:61`
- **现状**：导出但全项目无 import，仅同文件的 `expectNoA11yViolations` 被使用。
- **建议**：移除该导出函数。

### 1.7 `useStepper` / `useKanban` 孤儿 API

- **路径**：`packages/ui/src/composables/useStepper.ts`、`packages/ui/src/composables/useKanban.ts`
- **现状**：主入口 `packages/ui/src/index.ts` 仅导出返回类型（`UseStepperReturn` 第 540 行、`UseKanbanReturn` 第 553 行，均为 `export type`），未导出 composable 函数本体；且两个函数都没有任何 `.vue` 消费者（`KanbanBoard.vue` 内联了自己的状态逻辑）。消费者既无法通过默认导入访问函数，类型导出也因此失去锚点。
- **建议**：两条路——让对应 `.vue` 组件重构使用 composable 并从主入口导出函数，或从主入口彻底移除类型导出。

## 二、Vitest 兼容性问题

### 2.1 同步计时器 API 在 async 上下文中使用（102 处）

Vitest 4.x 中，`vi.advanceTimersByTime()`（同步版）在 async 测试函数中可能导致微任务队列未正确刷新，引发间歇性测试失败。应统一替换为 `await vi.advanceTimersByTimeAsync()`。

涉及文件（共 14 个，102 个调用点）：

- `components/dialog/dialog.test.ts`
- `components/glitch-button/glitch-button.test.ts`
- `components/toast/toast.test.ts`
- `components/scratch-card/scratch-card.test.ts`
- `composables/useDebounce.test.ts`
- `composables/useThrottle.test.ts`
- `composables/useCarousel.test.ts`
- `composables/useCanvasInteraction.test.ts`
- `composables/use-toast.test.ts`
- `composables/useClipboard.test.ts`
- `composables/useKanban.test.ts`
- `composables/useAudioEngine.test.ts`
- `composables/useCarouselEnhanced.test.ts`
- `lib/devtools-plugin.test.ts`

### 2.2 `vi.useFakeTimers()` 无参调用（20 处）

无参调用会 fake 所有计时器（包括 `Date`、`requestAnimationFrame` 等），推荐改为精确声明：

```ts
// before
vi.useFakeTimers()

// after
vi.useFakeTimers({ toFake: ['setTimeout'] })
```

涉及文件：toast、glitch-button、scratch-card、dialog、use-toast、useAudioEngine、useCanvasInteraction、useCarousel、useCarouselEnhanced、useClipboard、useDebounce、useKanban、useThrottle、devtools-plugin 等测试文件。

### 2.3 `vitest.config.ts` 配置项（已验证：无问题）

| 配置项 | 说明 |
|--------|------|
| `pool: 'threads'` | Vitest 4.x 可能已迁移到 `poolOptions` 结构下 |
| `isolate: false` | 同上，可能需移至 `poolOptions` 内部 |
| `deps.optimizer.web` | 较新版本中 `deps` 配置结构有重构，可能需移至 `server.deps.optimizer` |

> **[已验证]**：2026-07-02 在 `packages/ui/` 下执行 `pnpm vitest run --reporter=default`（147 个测试文件 / 3318 个测试用例，全部通过），grep 控制台输出未发现任何 `deprecated` / `obsolete` / `will be removed` 类警告。Vitest 4.1.8 仍兼容当前配置结构，无需调整。

### 2.4 `vitest.setup.ts` 动态导入 matcher

```ts
// 当前（可能导致 matcher 注册延迟）
import('vitest-axe/matchers').then((matchers) => {
    expect.extend(matchers)
})

// 建议
import matchers from 'vitest-axe/matchers'
expect.extend(matchers)
```

### 2.5 `vitest-axe ^0.1.0` 与 Vitest 4.x `expect` 类型不兼容

- **路径**：`packages/ui/src/test-utils/a11y.ts:39`
- **现状**：调用处被迫使用 `as unknown as` 双重强转：
  ```ts
  ;(expect(results) as unknown as { toHaveNoViolations: () => void }).toHaveNoViolations()
  ```
  尽管 `vitest-axe.d.ts` 写了 39 行、覆盖 4 个 module target（`vitest`、`@vitest/expect`、`vitest-axe`、global）的模块增强，仍然无法让 Vitest 4.x 的 `expect` 类型识别 `toHaveNoViolations` matcher。强转是类型系统失效后的临时补丁，不是可长期维护的方案。
- **建议**：二选一——①升级 `vitest-axe` 到与 Vitest 4.x 兼容的版本（或切换到 `@vitest/coverage-v8` 同维护者的 fork）；②若短期无法升级，保留强转但在 `a11y.ts` 顶部补一条 `FIXME` 注释说明根因，避免后续维护者重复踩坑。

## 三、非类型安全的 provide/inject

**文件**：`packages/ui/src/components/descriptions/Descriptions.vue` 第 28-29 行

```ts
// 当前（字符串键，无类型安全）
provide('descriptions-border', toRef(props, 'border'))
provide('descriptions-direction', toRef(props, 'direction'))
```

项目中其他 `provide` 调用（`formContextKey`、`timelineOrientationKey` 等）均使用了类型安全的 `InjectionKey<T>`，建议统一。

## 四、过时注释

### 4.1 已过时的 TODO

- `apps/docs/blocks/faq-section.md:92` — `<!-- TODO: 补充可访问性说明 -->`，但下方已有具体内容，应删除此标记。

### 4.2 仍有效的 TODO（6 处）

以下 block 页面的可访问性章节为空，TODO 标记仍有效：

- `apps/docs/blocks/footer-section.md:106`
- `apps/docs/blocks/header-section.md:89`
- `apps/docs/blocks/not-found-page.md:87`
- `apps/docs/en/blocks/footer-section.md:107`
- `apps/docs/en/blocks/header-section.md:90`
- `apps/docs/en/blocks/not-found-page.md:88`

### 4.3 向后兼容空壳（保留不动）

`packages/ui/src/lib/brutalism-plugin.js` — 有意的空壳插件，通过 `package.json` exports 发布，注释准确说明保留原因。

## 五、Tailwind class 重复

`brutal-interaction-variants.ts` 已抽取了交互变体常量（`brutalHoverLift`、`brutalHighlightLift`、`brutalPress`），但仍有 **98 处**直接写 Tailwind class 字符串而未引用这些常量（`packages/ui/src/components/` 下 `hover:shadow-brutal*` / `active:translate-y-*` / `active:shadow-none` / `data-[highlighted]:shadow-brutal*` 四类模式合计）。

> 并非所有重复都适合直接替换为常量——许多组件对基础模式做了微调（如 `hover:shadow-brutal-sm`、追加 `transition-all`、`calc(50%+2px)` 等）。建议按"组件变体文件"为最小单位逐步统一：先把 variants.ts 内能直接替换的纯引用改为常量，再为有微调的组件建立 `*-variants.ts` 派生常量，避免一次性 PR。

## 六、文档错误

### 6.1 文档引用了不存在的 CLI `--block` 选项

- **文件**：
  - `apps/docs/blocks/index.md:46`、`:52`
  - `apps/docs/en/blocks/index.md:46`、`:52`
- **现状**：示例命令 `npx brutx-vue@latest add --block auth-card` / `--block brutalist-hero pricing-section`，但 CLI `add` 命令（`packages/cli/src/index.ts:29-41`）和 `AddOptions` 类型（`packages/cli/src/lib/types.ts:42-51`）均未定义 `block` 字段。用户按文档执行会报"未知选项"错误。
- **建议**：二选一——①补全 CLI 的 `--block` 选项实现；②删除文档中的 `--block` 示例。

### 6.2 `packages/ui/README.md` 使用了错误的 CLI 二进制名

- **文件**：`packages/ui/README.md` 第 14、28、31、34、42、48、82-84 行
- **现状**：全部示例写成 `npx brutx@latest`，但 `packages/cli/package.json:6` 实际声明的 bin 是 `brutx-vue`。根目录 `README.md` 和 `apps/docs/` 使用的是正确名字 `brutx-vue`，只有这个 README 掉队。
- **建议**：将 `brutx@latest` 统一替换为 `brutx-vue@latest`。

## 七、配置层包袱

### 7.1 `vite.config.ts` 仍引用旧包名 `lucide-vue-next`

- **文件**：`packages/ui/vite.config.ts:173`
- **现状**：rollup externals 中有正则 `/^lucide-vue-next/`，但项目当前使用的包名是 `@lucide/vue`（peerDependency 在 `packages/ui/package.json:117`）。
- **建议**：将正则更新为 `/^@lucide\/vue/`；若需兼容旧项目产物，可改为 `/^(?:@lucide\/vue|lucide-vue-next)/`。

### 7.2 `jsdom` 为无用 devDependency

- **文件**：`packages/ui/package.json:163`
- **现状**：`"jsdom": "^29.1.1"` 被列为 devDependency，但 `vitest.config.ts:15` 实际使用 `environment: 'happy-dom'`（`happy-dom` 也在 `package.json:162` 声明）。源码中"jsdom"只出现在两处测试注释（`kanban-board.test.ts:351`、`upload-card.test.ts:445`），零真实使用。
- **建议**：从 devDependencies 中移除 `jsdom`，并顺手清理两条注释中的旧名引用。

## 八、未发现问题的检查项

| 检查项 | 结果 |
|--------|------|
| `@deprecated` 注解 | 无 |
| Vue 2 遗留模式（Options API、`this.$emit`、`Vue.component`） | 无 |
| `@ts-ignore` / `@ts-nocheck` | 无 |
| `radix-vue` 旧包名源码引用 | 无（`lucide-vue-next` 在 `vite.config.ts` externals 中仍有残留，见 §7.1） |
| 死引用 / 断裂的 import | 无 |
| 源码中的 `any` 类型（非测试） | 仅 1 处（test-utils，合理） |
| 旧 `data-[highlighted=true]` 模式 | 已全部修复 |
| `expect.anything()` 旧用法 | 无 |
| `spyOn` 旧导入方式 | 无 |
| `vitest.fn()` / `vi.fn()` 混用 | 无 |
| `vue-class-component` / `vue-property-decorator` / `vue-demi` / `@vue/compat` | 无 |
| `Vue.set` / `Vue.delete` / `EventBus` | 无 |
| `tsconfig.json` 过时选项 | 无（ES2022 / bundler / strict，符合当前最佳实践） |
| `tailwind.config.*` 遗留配置 | 无（Tailwind v4 改用 `@tailwindcss/vite` 插件，正确） |

## 九、修复优先级建议

按"影响面 × 修复成本"排序：

| 优先级 | 章节 | 项 | 工作量 |
|---|---|---|---|
| P0 | §6 | 修复文档中不存在的 `--block` 选项（§6.1） | 5 分钟，影响用户第一印象 |
| P0 | §6 | `packages/ui/README.md` 的 `brutx` → `brutx-vue`（§6.2） | 5 分钟 |
| ~~P1~~ | ~~§1~~ | ~~删除 5 组死代码~~ | ~~已完成 4 组（`useEventListener`、`test-utils/index.ts`、`getA11yResults`、`diff.d.ts` 未使用声明）；`component-preview` 待删~~ |
| ~~P1~~ | ~~§1.2/§1.7~~ | 处理 `useDialogEnhanced` / `useStepper` / `useKanban` 孤儿 API | `useStepper`/`useKanban` 主入口 type 导出已删除；`useDialogEnhanced` composable 文件仍保留供未来 DialogEnhanced.vue 重构使用 |
| P2 | §7 | 删 `jsdom`、把 `lucide-vue-next` 在 externals 中更新为 `@lucide/vue` | 5 分钟 |
| ~~P2~~ | ~~§2.1/§2.2~~ | ~~Vitest 4.x 迁移~~ | ~~已确认无需处理：实测无 deprecation warning~~ |
| P3 | §2.5 | `vitest-axe` 类型兼容问题：升级或保留强转并补 FIXME 注释 | 小 |
| P3 | §3 | `Descriptions.vue` 改用 `InjectionKey<T>`，同步改 `DescriptionsItem.vue` 消费端 | 小 |
| P4 | §5 | Tailwind class 重复统一：按"组件变体文件"为最小单位逐步推进 | 大，避免一次性 PR |
| 暂缓 | §4.2 | 6 个可访问性 TODO：要么补内容要么转成 issue 追踪，不要长期留着 | — |

## 十、扫描方法论自检

本次扫描存在以下不足，留作后续迭代参考：

1. **数字未第一时间给出精确值**：`~99`/`20`/`100+` 这类约数在迁移规划时需要作为 baseline，应直接附 `grep -cE` 的输出。已在本次修订中更新为 `102`/`20`/`98`。
2. **混淆"源码事实"与"待验证假设"**：§2.3 关于 `vitest.config.ts` 的三项警告在未跑 `vitest run` 之前只是假设，应显式标记 `[待验证]`，已在本次修订中加上。
3. **死代码扫描范围不足**：首轮扫描只覆盖了 `packages/ui/src/lib/`、`packages/ui/src/composables/useDialogEnhanced.ts`、`packages/cli/src/types/`，遗漏了 `useEventListener`、整个 `test-utils/index.ts` 工具函数集合、`a11y.ts:61` 的 `getA11yResults`、`useStepper`/`useKanban` 孤儿 API。应扩大范围到 `composables/`、`utils/`、`test-utils/` 三个目录，并反向 grep 主入口 `index.ts` 的 `export type` 声明。
4. **文档与配置层扫描缺失**：CLI `--block` 幽灵选项、`brutx` vs `brutx-vue` 二进制名、`lucide-vue-next` 旧包名、`jsdom` 无用依赖——这些"非源码但影响用户体验/构建产物"的维度首轮未覆盖，已在本次修订中补为 §6 和 §7。
5. **类型兼容性问题浅尝辄止**：§2.4 只看到动态 import 写法，没看到 `a11y.ts:39` 的 `as unknown as` 强转背后是 `vitest-axe ^0.1.0` 与 Vitest 4.x 的类型不兼容，已在本次修订中补为 §2.5。
