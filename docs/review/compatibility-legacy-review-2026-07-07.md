# 兼容性与历史包袱审查报告

审查日期：2026-07-07

审查范围：`packages/ui`、`packages/cli`、`packages/registry`、`packages/shared` 的公开 API、构建发布、运行时环境兼容、浏览器能力降级、组件重复层与注册表治理。

## 结论概览

当前代码整体已经有明确的现代化方向：Vue 3.5、Tailwind CSS 4、Node 22、ES2022、复制粘贴式 registry 工作流。但兼容性债务也集中在几个高影响面：

| 优先级 | 发现 | 影响面 | 建议 |
| --- | --- | --- | --- |
| P0 | 发布产物依赖手写 flatten 和路径重写 | npm 包安装、子路径导入、CJS/ESM 产物 | 优先用构建验证和产物快照锁住，再考虑移除手写重写 |
| P0 | 浏览器能力缺少统一降级策略 | SSR、老浏览器、WebView、测试环境 | Observer、Audio、Canvas、imperative DOM 核心 helper 已落地，后续新增能力沿用该模式 |
| P1 | npm `exports` 子路径只覆盖少数组件 | 用户按组件子路径导入时行为不一致 | 明确策略：只支持聚合入口，或生成所有组件子路径 |
| P1 | legacy wrapper 和重复区块曾在 registry 中作为一等组件 | 文档推荐、CLI add、维护成本 | 已按“清除历史包袱”方案 A 移出公开分发面 |
| P1 | Date 字符串解析语义需统一 | Safari、跨时区、筛选边界 | DataTable 与 Calendar 纯日期解析已收敛，后续补公共 API 语义文档 |
| P2 | singleton fallback 提供易用性但形成全局状态 | 多应用同页、测试隔离、SSR 心智成本 | 文档化边界，逐步鼓励 root provide |

## P0：发布产物路径重写过重

证据：

- `packages/ui/vite.config.ts` 的 `flattenPreserveModulesPlugin` 用于把 `dist/packages/ui/src/...` 拍平成 `dist/`。
- `packages/ui/src/lib/preserve-modules-paths.ts` 已承接 JS/CJS/MJS import 路径重写，覆盖 nested source prefix、`_virtual`、`node_modules` 与 Vue export helper 路径。
- `packages/ui/vite.config.ts:88` 在构建后删除 `dist/packages`。
- `packages/ui/vite.config.ts:185`、`:194` 同时对 ES 和 CJS 开启 `preserveModules`。
- `packages/ui/package.json` 的 `build` 额外执行 `build:preflight`，`prepack` 已改为复用 `npm run build`，避免发布前漏生成 `dist/preflight.css`。
- `packages/ui/scripts/smoke-package.mjs` 已检查 `package.json` 中声明的目标文件存在且非空，并直接加载 ESM/CJS JS 入口。
- `copyStylesPlugin` 复制 `styles.css` 失败时已改为抛出构建错误，避免样式入口缺失但发布构建仍成功。
- `packages/ui/src/lib/preserve-modules-paths.test.ts` 已用 fixture 固化路径重写输入输出，防止后续升级 Vite/Rollup/Vue 插件时静默破坏发布产物路径。

风险：

1. 这是发布兼容性的最高风险点。路径重写覆盖了 Vue export helper、`_virtual`、`node_modules` 和 nested source prefix，一旦 Vite/Rollup/Vue 插件输出结构变化，包可能构建成功但运行时导入失败。
2. `prepack` 与 `build` 行为不一致的问题已修复，但仍需要验证用户项目视角的包名解析，避免直接文件加载通过而 `exports` 子路径解析失败。
3. `copyStylesPlugin` 的样式入口失败已改为发布阻断；后续风险主要在构建输出结构变化导致入口文件位置变化。

建议：

- 已落地：`test:package` 增加临时消费者项目解析检查，覆盖 `brutx-ui-vue`、稳定子路径入口、`style.css`、`preflight.css` 等所有 `exports` specifier 的包名解析，并加载 ESM/CJS JS 入口。
- 已落地：`prepack` 与 `build` 使用同一命令，避免 `preflight.css` 漏出。
- 已落地：`styles.css` 复制失败会阻断构建，避免带缺失样式入口的包进入发布流程。
- 已落地：将手写 flatten 插件的路径重写算法收敛为可测试纯函数，输入输出用 fixture 固化。
- 长期：评估是否改用显式多入口加生成式 `exports`，减少构建后字符串重写。

## P0：浏览器能力核心降级已落地

证据：

- `packages/ui/src/lib/env.ts` 已提供 `isClient`、`hasDocument`、`hasLocalStorage`、`canUseDocumentBody()`、`hasIntersectionObserver`、`getAudioContextCtor()`、`getResizeObserverCtor()`、`getMutationObserverCtor()`、`getDevicePixelRatio()`、`createCanvasElement()`、`getCanvas2DContext()`。
- `packages/ui/src/components/infinite-scroll/InfiniteScroll.vue` 和 `packages/ui/src/components/infinite-scroll/useInfiniteScroll.ts` 已在创建 `IntersectionObserver` 前检测能力；无 Observer 时保守触发一次加载，避免永久卡住。
- `packages/ui/src/components/image/Image.vue` 已在 `loading="lazy"` 且无 `IntersectionObserver` 时默认使用原图 `src`，避免空 `src` 永久不加载。
- `packages/ui/src/composables/useAudioEngine.ts` 已通过 `getAudioContextCtor()` 支持 `webkitAudioContext`，并 catch 构造、`resume()`、节点创建/播放异常，失败时禁用本次音效。
- `packages/ui/src/components/dialog/functional.ts` 和 `packages/ui/src/lib/render-imperative.ts` 已复用 `canUseDocumentBody()`，在 SSR/无 body 环境返回 no-op handle。
- `packages/ui/src/components/counter/Counter.vue` 已通过 `getResizeObserverCtor()` 降级：无 `ResizeObserver` 时仍执行一次尺寸计算，但跳过持续观察。
- `packages/ui/src/composables/useCanvasInteraction.ts` 已通过 env helper 收敛 canvas 创建、2D context 获取、DPR 和 `ResizeObserver` 构造；禁用 canvas 或缺少 observer 的 WebView/测试环境不会抛出运行时错误。
- `packages/ui/src/components/tour/Tour.vue` 已通过 env helper 收敛 canvas 2D context、DPR、`ResizeObserver` 与 selector 查询；无 canvas context 或无 `ResizeObserver` 时仍可挂载并显示导览内容。
- `packages/ui/src/components/scratch-card/ScratchCard.vue` 的 reset overlay 路径已复用 canvas 2D context 与 DPR helper，避免 canvas 能力异常时重置流程抛错。
- `packages/ui/src/components/watermark/Watermark.vue` 已通过 env helper 收敛 canvas 创建、canvas 2D context、DPR 和 `MutationObserver`；无 canvas 时回退 SVG 水印，无 `MutationObserver` 时跳过防篡改观察但保留水印渲染。

剩余风险：

1. Observer、Canvas、Audio 与 imperative DOM 核心路径已收敛；后续新增浏览器 API 应继续补 helper 与缺能力测试。
2. 后续新增组件仍需要遵循统一 helper，避免重新出现散落的 `typeof window/document` 和直接构造。
3. imperative mount 的核心 guard 已统一，后续重点是新增能力不要绕开 helper。

后续建议：

- 后续遇到新的 Observer、media、storage 或其它 imperative DOM 能力时，优先补 helper 和定向测试。
- 保留 Image / InfiniteScroll / Audio / functional dialog 的定向测试，作为 SSR/WebView 兼容回归网。
- 保留 Counter / Tour / Watermark / ScratchCard / useCanvasInteraction 缺失 Observer、canvas 2D 能力的定向测试，作为老 WebView 回归网。

## P1：公开导出策略不一致

证据：

- `packages/ui/src/index.ts` 聚合导出大量组件，例如 `Image` 在 `packages/ui/src/index.ts:503`，`Tour` 在 `:501`，`Backtop` 在 `:500`，`Cascader` 在 `:531`，`Menu` 在 `:535`。
- `packages/ui/package.json:9` 开始声明 `exports`，但组件子路径只覆盖 `button/input/dialog/toast/form/select/dropdown-menu/table/card/tabs` 等少量入口。
- 当前 `packages/ui/src/components` 下有 112 个组件目录，而 `package.json` 的 `./*` 子路径导出为 21 个，其中还包含 CSS、hooks、locales、插件入口。
- `packages/ui/scripts/validate-exports.mjs` 已校验 Vite `build.lib.entry` 与 `package.json exports` 一致；`packages/ui/scripts/smoke-package.mjs` 已从临时消费者项目验证所有已声明 `exports` 可解析。
- `packages/registry/scripts/validate-registry.ts` 已校验 shared metadata、源文件、生成 registry item/index/manifest 的同步，包括 `status` 与 `replacement`。
- `packages/registry/scripts/validate-registry.ts` 已增加中英文组件文档覆盖校验，支持少量明确 alias 与 exemption，避免 registry 中的一等组件缺少对应文档页。
- `apps/docs/guide/best-practices/performance.md` 与英文版已明确：主入口是稳定组件导入面，子路径导入仅限 `package.json exports` 白名单。

风险：

1. 用户可以从主入口导入全部组件，但按组件子路径导入只有少数组件可用，体验不一致。
2. 未来新增组件需要同时维护 `src/index.ts`、入口文件、Vite `lib.entry`、`package.json exports`，漏任一处都会形成发布层兼容 bug。
3. 手动维护子路径也会放大构建 flatten 插件的风险；当前已通过脚本验证“已声明入口”的一致性，并在文档中固定为稳定白名单策略。

执行结论：

1. 选择方案 A：主入口 `brutx-ui-vue` 是完整稳定导入面，子路径入口只作为稳定白名单维护。
2. 已用 `check:exports` 与 `test:package` 校验白名单入口和发布产物解析，不生成全量组件子路径。
3. 后续新增子路径必须同步 Vite entry、`package.json exports` 和验证脚本，不临时补单个未声明组件入口。

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
6. `DashboardStats` 已对数值型统计值复用 `Counter` 静态渲染，非数值内容保留原文本路径，配套 registry 依赖同步到 `counter`。

## P1：日期解析语义已初步收敛

证据：

- `packages/ui/src/composables/useDataTableFilter.ts` 已先用 `parseFormattedDate(text, 'YYYY-MM-DD')` 按本地日期解析纯日期区间，并对结束日期应用当天 `23:59:59.999`。
- `packages/ui/src/components/calendar/Calendar.vue` 的事件字符串日期已先按本地 `YYYY-MM-DD` 解析，再回退原生 `Date` 解析完整 datetime。
- `packages/ui/src/lib/date.ts` 的 `parseFormattedDate` 已校验年月日时分秒回读值，拒绝 `2026-02-31`、`2026-13-01`、`25:00:00` 这类溢出日期。
- `apps/docs/components/data-table.md`、`apps/docs/components/calendar.md` 及英文版已说明纯日期与完整 datetime 的解析边界。

执行结论：

1. `YYYY-MM-DD` 纯日期在 Calendar 事件和 DataTable 日期范围筛选中按本地日期处理。
2. 完整 datetime 字符串继续交给原生 `Date` / ISO datetime 语义，跨时区一致性建议使用 `Date`、时间戳或带时区偏移的 ISO 字符串。
3. 后续新增日期输入点仍应优先复用 `parseFormattedDate` 或明确要求完整 ISO datetime。

后续建议：

- 若后续需要支持更多用户输入格式，新增明确格式参数，不扩大 `new Date(string)` 的隐式兼容面。
- 增加跨时区等价测试时，优先测试纯日期边界和日期区间起止。

## P2：全局 singleton fallback 治理已落地

证据：

- `packages/ui/src/composables/useTheme.ts:188` 在没有 `provideTheme()` 时 warning 并回退共享单例。
- `packages/ui/src/composables/useTheme.ts:204` 给 `window` 注册 `beforeunload` 清理。
- `packages/ui/src/composables/useToast.ts:233` 在没有 `provideToast()` 时也回退共享单例。
- `packages/ui/src/composables/useToast.ts:220` 同样注册 `beforeunload` 清理。
- `packages/ui/src/composables/destroyFallbacks.ts` 已提供 `destroyBrutxFallbacks()`，统一清理 toast、theme、message 的 fallback 状态，并从主入口导出。
- `apps/docs/components/toast.md`、`apps/docs/components/color-mode-switcher.md` 及英文文档已说明生产推荐 root provide，fallback 仅作为兼容兜底。

执行结论：

1. 保留 `useTheme()` / `useToast()` fallback 兼容行为，避免破坏旧用户代码。
2. 公开 `destroyBrutxFallbacks()` 作为测试隔离、多应用同页、热更新边界的集中清理 API。
3. 文档已明确 `provideTheme()` / `provideToast()` 是生产推荐路径，fallback 是兼容兜底。

执行结论：

- dev 模式 warning 已加入更具体的根组件 `provideTheme()` / `provideToast()` 建议，减少无意使用 fallback。
- 后续若新增 singleton fallback，需同步提供集中销毁 API、root provide 推荐文档和 warning 提示。

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
- CLI integration matrix 已覆盖 Vite + Tailwind v4 默认路径，并显式登记 Tailwind v3、Nuxt、monorepo 子包等重型兼容场景；本地 registry 命令参数由测试矩阵生成。
- CLI doctor 已检查当前运行的 Node.js 版本，低于 `brutx-vue` 的 `engines.node >=22.0.0` 时报告 error。
- CLI 的 `init`、`add`、`diff`、`remove` 核心文件写入、registry diff、安装计划和删除计划已抽离到 `packages/cli/src/lib/services/`，命令层保留交互与日志；对应 service 级测试已覆盖事务边界、manifest 元数据、registry source、dry-run/跳过写入等关键路径。

风险：

1. 仓库开发环境和 CLI 用户环境要求不一致，排查 issue 时容易混淆。
2. Node 22 目标对新项目没问题，但对仍在 Node 20 LTS 的 Vue 用户会形成安装门槛。
3. 如果坚持 Node 22，应继续在 README、CLI error、doctor 中保持一致，不要让用户在运行时才遇到语法或 API 错误。

建议：

- 短期维持 Node 22：`engines`、doctor 和 CLI 构建 target 已对齐；README/文档后续继续同步用户环境要求。
- 如果未来希望扩大 CLI 覆盖面，再评估把 CLI target 降到 Node 20，并增加最低 Node 版本测试。
- 根包 pnpm 11 和 CLI pnpm 9 可以共存；文档需持续说明“开发本仓库”和“使用 CLI”的要求不同。

## 正向观察

- 已有 `env.ts`，说明项目已经意识到 SSR 和浏览器差异，不需要从零建立模式。
- `renderImperative` 已经解决了 imperative render 的 appContext 和 SSR no-op 问题，可以作为函数式弹窗/消息的统一底座。
- `docs/UI_COMPONENT_MERGE_REPORT.md` 对重复组件已有清晰排序，真正缺的是把状态字段落到 registry/CLI。
- `useLocale` 已支持自定义 fallback，兼容旧签名的同时保留默认中文回退，国际化债务比早期方案小。

## 建议清债顺序

1. 发布产物冒烟测试已落地：继续保留 `test:package` 与 `check:exports` 作为发布前最小门禁。
2. env/browser capability 核心 helper 已落地：`ResizeObserver`、Canvas、Audio、IntersectionObserver、imperative DOM 已覆盖；后续按需收敛 `MutationObserver` 和其它新增能力。
3. registry 清理与同步校验已落地：legacy 状态会写入 registry item/index，validate 会校验 shared metadata、源文件、manifest 与生成 JSON 一致。
4. 日期解析已初步收敛：DataTable 纯日期区间、Calendar 事件日期、无效格式校验与文档语义已覆盖；后续可补跨时区等价测试。
5. package 子路径策略已定案：主入口为完整稳定导入面，子路径入口保留为 `package.json exports` 白名单并由脚本校验。
6. singleton fallback 治理已落地：保留兼容，同时提供集中销毁和文档边界。

## 本次执行验证

- `packages/registry`：`npm.cmd run build`、`npm.cmd run validate`、`vitest run tests/build-registry.test.ts`。
- `packages/shared`：`npm.cmd run typecheck`。
- `packages/ui`：`npm.cmd run check:exports`、`vitest run src/components/feedback-form/feedback-form.test.ts`、`npm.cmd run typecheck`、`npm.cmd run build`。
- 本轮新增验证：`CI=true pnpm --filter brutx-ui-vue test:package`、`CI=true pnpm --filter brutx-ui-vue check:exports`。
- 本轮兼容验证：`CI=true pnpm --filter brutx-ui-vue test src/components/image/image.test.ts src/components/dialog/functional-dialog.test.ts src/composables/useAudioEngine.test.ts`。
- 本轮日期验证：`CI=true pnpm --filter brutx-ui-vue test src/lib/date.test.ts src/composables/useDataTableFilter.test.ts src/components/calendar/calendar.test.ts`。
- 本轮 registry 同步验证：`CI=true pnpm --filter brutx-registry-vue build`、`CI=true pnpm --filter brutx-registry-vue validate`、`CI=true pnpm --filter brutx-registry-vue test tests/build-registry.test.ts`、`CI=true pnpm --filter brutx-registry-vue test tests/validate-utils.test.ts`、`CI=true pnpm --filter brutx-registry-vue typecheck`。
- 本轮 legacy 替代验证：`CI=true pnpm --filter brutx-ui-vue test src/components/dashboard-stats/dashboard-stats.test.ts`、`CI=true pnpm --filter brutx-ui-vue typecheck`、`CI=true pnpm --filter brutx-registry-vue build`、`CI=true pnpm --filter brutx-registry-vue validate`。
- 本轮 singleton fallback 验证：`CI=true pnpm --filter brutx-ui-vue test src/composables/destroyFallbacks.test.ts src/composables/use-toast.test.ts src/composables/useTheme.test.ts`。
- 本轮 package 子路径策略验证：`CI=true pnpm --filter brutx-ui-vue check:exports`、`CI=true pnpm --filter brutx-ui-vue test:package`。
- 本轮 CLI matrix 验证：`CI=true pnpm --filter brutx-vue build`、`CI=true pnpm --filter brutx-vue typecheck`、`CI=true packages/cli/node_modules/.bin/vitest.CMD run tests/integration/matrix.test.ts`、`CI=true packages/cli/node_modules/.bin/vitest.CMD run tests/integration/cli-smoke.test.ts -t "dry-runs the full local registry"`。
- 本轮浏览器能力验证：`packages/ui/node_modules/.bin/vitest.CMD run src/components/counter/counter.test.ts`、`packages/ui/node_modules/.bin/vitest.CMD run src/composables/useCanvasInteraction.test.ts`、`packages/ui/node_modules/.bin/vue-tsc.CMD --noEmit`、`packages/registry/node_modules/.bin/tsx.CMD scripts/build-registry.ts`、`packages/registry/node_modules/.bin/tsx.CMD scripts/validate-registry.ts`。
- 本轮浏览器能力补强验证：`packages/ui/node_modules/.bin/vitest.CMD run src/components/tour/tour.test.ts src/components/watermark/Watermark.test.ts src/components/scratch-card/scratch-card.test.ts`、`packages/ui/node_modules/.bin/vue-tsc.CMD --noEmit`、`packages/registry/node_modules/.bin/tsx.CMD scripts/build-registry.ts`、`packages/registry/node_modules/.bin/tsx.CMD scripts/validate-registry.ts`。
- 本轮 flatten 路径重写验证：`packages/ui/node_modules/.bin/vitest.CMD run src/lib/preserve-modules-paths.test.ts`、`packages/ui/node_modules/.bin/vue-tsc.CMD --noEmit`、`npm.cmd run build`、`npm.cmd run check:exports`、`npm.cmd run test:package`。
- 本轮 CLI runtime 验证：`packages/cli` 下 `vitest run tests/doctor.test.ts`、`npm.cmd run typecheck`、`npm.cmd run build`。
- 本轮 CLI 服务拆分验证：`packages/cli/node_modules/.bin/vitest.CMD run tests/remove-service.test.ts tests/remove.test.ts`、`packages/cli/node_modules/.bin/vitest.CMD run tests/init-service.test.ts tests/init.test.ts`、`packages/cli/node_modules/.bin/vitest.CMD run tests/diff-service.test.ts tests/diff.test.ts`、`packages/cli` 下 `npm.cmd run typecheck`、`npm.cmd run build`。
- 本轮 registry 文档覆盖验证：`packages/registry/node_modules/.bin/vitest.CMD run tests/validate-utils.test.ts`、`packages/registry` 下 `node_modules/.bin/tsx.CMD scripts/validate-registry.ts`、`npm.cmd run typecheck`。
- 本轮选择复用验证：`packages/ui` 下 `vitest run src/composables/useSelectionDisplayText.test.ts src/composables/useClearableSelection.test.ts`、`vitest run src/composables/useSelectableTrigger.test.ts`，并随 registry build/validate 同步生成 `cascader`、`combobox`、`tree-select` 注册表产物。
- 本轮表单验证分支验证：`packages/ui` 下 `vitest run src/components/feedback-form/feedback-form.test.ts src/components/hardcore-input/hardcore-input.test.ts`、`vue-tsc --noEmit`。
- 未运行 `pnpm release:check` 或全量测试，符合项目“避免重型测试”的约定。
