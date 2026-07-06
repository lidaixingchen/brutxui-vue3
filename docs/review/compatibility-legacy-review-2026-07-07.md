# 兼容性与历史包袱审查报告

审查日期：2026-07-07

审查范围：`packages/ui`、`packages/cli`、`packages/registry`、`packages/shared` 的公开 API、构建发布、运行时环境兼容、浏览器能力降级、组件重复层与注册表治理。

## 结论概览

当前代码整体已经有明确的现代化方向：Vue 3.5、Tailwind CSS 4、Node 22、ES2022、复制粘贴式 registry 工作流。但兼容性债务也集中在几个高影响面：

| 优先级 | 发现 | 影响面 | 建议 |
| --- | --- | --- | --- |
| P0 | 发布产物依赖手写 flatten 和路径重写 | npm 包安装、子路径导入、CJS/ESM 产物 | 优先用构建验证和产物快照锁住，再考虑移除手写重写 |
| P0 | 浏览器能力缺少统一降级策略 | SSR、老浏览器、WebView、测试环境 | 为 Observer、Audio、imperative DOM 建统一 env helper |
| P1 | npm `exports` 子路径只覆盖少数组件 | 用户按组件子路径导入时行为不一致 | 明确策略：只支持聚合入口，或生成所有组件子路径 |
| P1 | legacy wrapper 和重复区块曾在 registry 中作为一等组件 | 文档推荐、CLI add、维护成本 | 已按“清除历史包袱”方案 A 移出公开分发面 |
| P1 | Date 字符串解析依赖原生 `new Date(string)` | Safari、跨时区、筛选边界 | 统一使用 `parseFormattedDate` 或显式 ISO/本地日期解析 |
| P2 | singleton fallback 提供易用性但形成全局状态 | 多应用同页、测试隔离、SSR 心智成本 | 文档化边界，逐步鼓励 root provide |

## P0：发布产物路径重写过重

证据：

- `packages/ui/vite.config.ts:24` 标注 `flattenPreserveModulesPlugin` 用于把 `dist/packages/ui/src/...` 拍平成 `dist/`。
- `packages/ui/vite.config.ts:60`、`:66`、`:70`、`:99`、`:104` 通过正则重写 JS/CJS/MJS import 路径。
- `packages/ui/vite.config.ts:88` 在构建后删除 `dist/packages`。
- `packages/ui/vite.config.ts:185`、`:194` 同时对 ES 和 CJS 开启 `preserveModules`。
- `packages/ui/package.json:114` 的 `build` 额外执行 `build:preflight`，但 `packages/ui/package.json:115` 的 `prepack` 只执行 `vite build`，不会生成 `dist/preflight.css`。

风险：

1. 这是发布兼容性的最高风险点。路径重写覆盖了 Vue export helper、`_virtual`、`node_modules` 和 nested source prefix，一旦 Vite/Rollup/Vue 插件输出结构变化，包可能构建成功但运行时导入失败。
2. `prepack` 与 `build` 行为不一致，可能导致本地 `pnpm build` 有 `preflight.css`，发布前自动构建却缺失该文件。`package.json` 已导出 `./preflight.css`，缺失时会变成用户安装后的直接破坏。
3. `copyStylesPlugin` 从 `dist/brutx-ui-vue.css` 复制到 `dist/styles.css`，失败只 `console.warn`。对样式入口而言，这更接近发布阻断问题。

建议：

- 短期：增加发布产物冒烟测试，至少验证 `brutx-ui-vue`、`brutx-ui-vue/button`、`brutx-ui-vue/style.css`、`brutx-ui-vue/preflight.css` 在临时项目中可被解析。
- 短期：让 `prepack` 与 `build` 使用同一命令，避免 `preflight.css` 漏出。
- 中期：将手写 flatten 插件收敛为可测试脚本，输入输出用 fixture 固化。
- 长期：评估是否改用显式多入口加生成式 `exports`，减少构建后字符串重写。

## P0：浏览器能力降级不统一

证据：

- `packages/ui/src/lib/env.ts:7`、`:10`、`:13` 已提供 `isClient`、`hasDocument`、`hasLocalStorage`，但使用并不统一。
- `packages/ui/src/components/infinite-scroll/InfiniteScroll.vue:64` 和 `packages/ui/src/components/infinite-scroll/useInfiniteScroll.ts:54` 直接 `new IntersectionObserver(...)`，没有能力检测。
- `packages/ui/src/components/image/Image.vue:67` 的 `srcToShow` 在 `loading="lazy"` 且未进入视口前返回空字符串，`:268` 又直接创建 `IntersectionObserver`。如果环境没有 Observer，图片可能永远不加载。
- `packages/ui/src/composables/useAudioEngine.ts:34` 直接 `new AudioContext()`，未处理 `webkitAudioContext`、构造失败、用户手势限制或异常。
- `packages/ui/src/lib/render-imperative.ts:21` 已用 `isClient` 返回 no-op，但 `packages/ui/src/components/dialog/functional.ts:110`、`:111`、`:221`、`:222` 仍直接访问 `document` / `document.body`。

风险：

1. SSR 构建多数情况下不会触发 `onMounted`，但命令式 API、composable 或用户测试环境可能直接调用这些函数。
2. 老版本 Safari、内嵌 WebView、隐私环境、测试环境对 `IntersectionObserver`、`AudioContext`、`localStorage` 支持差异明显。
3. 同一类能力有的地方有 guard，有的地方没有，后续新增组件容易继续复制分叉模式。

建议：

- 在 `env.ts` 增加 `hasIntersectionObserver`、`hasResizeObserver`、`getAudioContextCtor`、`canUseDocumentBody` 等能力 helper。
- InfiniteScroll 无 Observer 时应有保守降级：立即触发一次、或退化为 scroll listener、或至少渲染 sentinel 并不阻塞内容。
- Image lazy 无 Observer 时应默认加载原图，不能保持空 `src`。
- `showDialog`、`showMessageBox` 改用 `renderImperative` 或复用同一 DOM guard。
- Audio 构造和 `resume()` 应 catch，失败时静默禁用本次音效，不影响输入组件。

## P1：公开导出策略不一致

证据：

- `packages/ui/src/index.ts` 聚合导出大量组件，例如 `Image` 在 `packages/ui/src/index.ts:503`，`Tour` 在 `:501`，`Backtop` 在 `:500`，`Cascader` 在 `:531`，`Menu` 在 `:535`。
- `packages/ui/package.json:9` 开始声明 `exports`，但组件子路径只覆盖 `button/input/dialog/toast/form/select/dropdown-menu/table/card/tabs` 等少量入口。
- 当前 `packages/ui/src/components` 下有 112 个组件目录，而 `package.json` 的 `./*` 子路径导出为 21 个，其中还包含 CSS、hooks、locales、插件入口。

风险：

1. 用户可以从主入口导入全部组件，但按组件子路径导入只有少数组件可用，体验不一致。
2. 未来新增组件需要同时维护 `src/index.ts`、入口文件、Vite `lib.entry`、`package.json exports`，漏任一处都会形成发布层兼容 bug。
3. 手动维护子路径也会放大构建 flatten 插件的风险。

建议：

- 明确公开契约：如果推荐只从 `brutx-ui-vue` 主入口导入，就在文档中说明子路径仅限稳定白名单。
- 如果推荐按组件子路径导入，改为从组件元数据生成入口、Vite entry 和 `exports`，并在 CI 中校验同步。
- 对已有未导出的组件，避免临时手动补几个，应一次性定策略。

## P1：legacy wrapper 与重复组件已从公开面移除

证据：

- `docs/UI_COMPONENT_MERGE_REPORT.md:13`、`:14` 已将 `UploadCard + Upload`、`DataTableSection + DataTable` 标为 P0 合并目标。
- `docs/UI_COMPONENT_MERGE_REPORT.md:46` 建议把 `UploadCard` 标记为 `legacy/deprecated block`。
- `docs/UI_COMPONENT_MERGE_REPORT.md:64` 建议 `DataTableSection` 改成 `DataTable` 的兼容 wrapper。
- `docs/UI_COMPONENT_MERGE_REPORT.md:156` 建议保留 `Statistic` 作为 `Counter` 的兼容 wrapper。
- `docs/UI_COMPONENT_MERGE_REPORT.md:218` 明确提出为 registry 元数据增加 `legacy`、`deprecated` 或 `replacement` 字段。
- 但 `packages/shared/src/components.ts:89`、`:96`、`:118` 仍将 `data-table-section`、`upload-card`、`statistic` 作为普通可用组件列出。

执行结论：

1. 选择方案 A：`brutx-ui-vue` 主入口作为完整稳定导入面，子路径只保留少量稳定白名单，不生成全量组件子路径。
2. 不再建立 legacy 兼容窗口；`LoadingPage`、`ErrorCard`、`SuccessCard`、`StepperSection`、`DataTableSection`、`UploadCard`、`Statistic` 已从源码、主入口导出、registry 元数据、registry JSON 和文档推荐入口移除。
3. 对应稳定替代入口为 `Loading`、`Result`、`Stepper`、`DataTable`、`Upload`、`Counter`。
4. `FeedbackForm` 的成功态已改用 `Result`，并将默认成功文案迁到 `feedbackForm.success*`，不再依赖 `SuccessCard` 或 `successCard.*` locale。
5. registry 构建脚本已增加过期 JSON 清理，避免被移除组件继续残留在静态 registry 目录。

## P1：日期解析语义不稳定

证据：

- `packages/ui/src/composables/useDataTableFilter.ts:61`、`:70`、`:71`、`:74`、`:75` 用 `new Date(...)` 解析单元格和区间值。
- `packages/ui/src/components/calendar/Calendar.vue:154` 对字符串日期也直接 `new Date(date1)`。
- `packages/ui/src/lib/date.ts:49` 已有格式化解析能力 `parseFormattedDate`，且内部在 `:88` 通过本地日期构造日期对象，但筛选逻辑没有复用。

风险：

1. `new Date('YYYY-MM-DD')` 和非 ISO 字符串在浏览器之间、时区之间容易出现边界偏移。
2. DataTable 的日期筛选通常用于业务数据，一旦跨时区或 Safari 用户出现边界错误，问题会很隐蔽。
3. 同库内已有日期工具却未统一使用，后续修复需要多处补丁。

建议：

- DataTable date filter 接受 `Date | number | ISO string` 时显式定义语义。
- 对 `YYYY-MM-DD` 按本地日期构造，或强制要求完整 ISO datetime。
- 增加 Safari 语义等价的单元测试：日期区间起止、无效字符串、纯日期跨时区。

## P2：全局 singleton fallback 是便利性也是状态债

证据：

- `packages/ui/src/composables/useTheme.ts:188` 在没有 `provideTheme()` 时 warning 并回退共享单例。
- `packages/ui/src/composables/useTheme.ts:204` 给 `window` 注册 `beforeunload` 清理。
- `packages/ui/src/composables/useToast.ts:233` 在没有 `provideToast()` 时也回退共享单例。
- `packages/ui/src/composables/useToast.ts:220` 同样注册 `beforeunload` 清理。

风险：

1. 多 Vue app 同页、微前端、文档 demo、测试并发时，全局单例会跨树共享状态。
2. fallback 降低上手门槛，但弱化了“根组件 provide 是推荐用法”的契约。
3. beforeunload 清理不能覆盖测试隔离、SPA app unmount、热更新等场景。

建议：

- 文档中明确：fallback 是兼容兜底，生产推荐 `provideTheme/provideToast`。
- 测试工具或 public API 暴露统一 `destroyBrutxFallbacks()`，集中清理 theme/toast/message 等 singleton。
- 长期考虑在 dev 模式 warning 中加入组件树上下文建议，减少无意使用 fallback。

## P2：空壳兼容插件已移除

证据：

- `packages/ui/src/lib/brutalism-plugin.js:11` 明确说明插件保留为空壳是为了 backward compatibility。
- `packages/ui/package.json:35` 仍导出 `./brutalism-plugin`。

执行结论：

1. `./brutalism-plugin` 已从 `packages/ui/package.json` 的 exports 和 `packages/ui/vite.config.ts` 的 lib entry 中移除。
2. `packages/ui/src/styles.css` 已删除内部 `@plugin "./lib/brutalism-plugin.js"` 引用。
3. `packages/ui/src/lib/brutalism-plugin.js` 空壳文件已删除。
4. 样式接入统一回到 `styles.css` / `preflight.css`。

## P2：Node/pnpm 目标较新，用户项目兼容需明确

证据：

- 根包 `package.json:28` 要求 Node `>=22.5.0`，`package.json:29` 要求 pnpm `>=11.0.0`。
- CLI 包 `packages/cli/package.json:57` 要求 Node `>=22.0.0`，`packages/cli/package.json:58` 要求 pnpm `>=9.0.0`。
- CLI 构建 `packages/cli/tsup.config.ts:11` target 为 `node22`，且 `packages/cli/tsup.config.ts:9` 不生成 dts。

风险：

1. 仓库开发环境和 CLI 用户环境要求不一致，排查 issue 时容易混淆。
2. Node 22 目标对新项目没问题，但对仍在 Node 20 LTS 的 Vue 用户会形成安装门槛。
3. 如果坚持 Node 22，应在 README、CLI error、doctor 中明确，不要让用户在运行时才遇到语法或 API 错误。

建议：

- 明确 CLI 是否支持 Node 20。如果不支持，将文档、`engines` 和错误提示统一成 Node 22。
- 如果希望扩大 CLI 覆盖面，评估把 CLI target 降到 Node 20，并增加最低 Node 版本测试。
- 根包 pnpm 11 和 CLI pnpm 9 可以共存，但 docs 需要说明：开发本仓库和使用 CLI 的要求不同。

## 正向观察

- 已有 `env.ts`，说明项目已经意识到 SSR 和浏览器差异，不需要从零建立模式。
- `renderImperative` 已经解决了 imperative render 的 appContext 和 SSR no-op 问题，可以作为函数式弹窗/消息的统一底座。
- `docs/UI_COMPONENT_MERGE_REPORT.md` 对重复组件已有清晰排序，真正缺的是把状态字段落到 registry/CLI。
- `useLocale` 已支持自定义 fallback，兼容旧签名的同时保留默认中文回退，国际化债务比早期方案小。

## 建议清债顺序

1. 发布产物冒烟测试：先防止 `exports`、CSS、CJS/ESM 产物破坏用户安装。
2. 统一 env/browser capability helper：先修 `IntersectionObserver` 和 imperative DOM。
3. registry 清理已落地：legacy 已从公开分发面移除，后续新增组件必须直接进入稳定替代入口。
4. 日期解析统一：从 DataTable filter 开始，建立可复用 parse helper。
5. 导出策略生成化：把 `index.ts`、Vite entry、package exports、registry 元数据的同步变成脚本校验。
6. singleton fallback 治理：保留兼容，但提供集中销毁和文档边界。

## 本次执行验证

- `packages/registry`：`npm.cmd run build`、`npm.cmd run validate`、`vitest run tests/build-registry.test.ts`。
- `packages/shared`：`npm.cmd run typecheck`。
- `packages/ui`：`npm.cmd run check:exports`、`vitest run src/components/feedback-form/feedback-form.test.ts`、`npm.cmd run typecheck`、`npm.cmd run build`。
- 未运行 `pnpm release:check` 或全量测试，符合项目“避免重型测试”的约定。
