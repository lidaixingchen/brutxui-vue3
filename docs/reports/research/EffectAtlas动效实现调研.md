# Effect Atlas 动效调研与 BrutxUI 改进建议

## 2026-11-18 增量调研

上游 `main` 从 `c0f2b5a` 更新到 `c246cc6`，净增 4 个提交、7 个效果，目录总数由 43 增至 50。原 43 个效果目录均有 JS 或 CSS 变更，未移除效果。两份快照中的 `LICENSE` 原文一致。[提交差异](https://github.com/effect-atlas/effect-atlas/compare/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84...c246cc6f92b4db4634151bbb650dad175a0acce7)、[当前目录](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/README.zh-CN.md)

| 提交 | 变化 |
| --- | --- |
| [`49223fb`](https://github.com/effect-atlas/effect-atlas/commit/49223fbd01964f37b7d92217f601a3346ac01c5a) | 从既有效果移除脚本化演示输入及相应样式。 |
| [`d8f7201`](https://github.com/effect-atlas/effect-atlas/commit/d8f72019ff279516baa0556f2cc921afd1fe3f02) | 同步 46 个效果，加入边缘折射色散、逐词阅读点亮和旋转标签手风琴。增加机器可读目录、接入指南和目录检查。 |
| [`d80bcf5`](https://github.com/effect-atlas/effect-atlas/commit/d80bcf5c3978fa2696b705f02b817342a225651b) | 新增弹性展开菜单、波浪画廊、叠卡轮播和弹跳文字入场，修正旋转标签手风琴首次布局。 |
| [`c246cc6`](https://github.com/effect-atlas/effect-atlas/commit/c246cc6f92b4db4634151bbb650dad175a0acce7) | 弹跳文字入场移除下划线 SVG 的初始 `viewBox`，以本地 CSS 像素绘制线条，修复 iOS Safari 初次测得的换行高度偏大时下划线缩小的问题。 |

### 七个新效果及对 BrutxUI 的影响

| 效果 | 源码机制 | BrutxUI 建议 |
| --- | --- | --- |
| 旋转标签手风琴 | 展开内容保持固定宽度，列的可见区域随位移和裁切变化。根据容器和最长收起标题决定横向或纵向布局。首轮完成尺寸测量后才启用过渡。收起同步 `inert`、`aria-expanded` 和焦点。[布局与焦点](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/rotating-tab-accordion/effect.js#L261-L332)、[首轮过渡规则](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/rotating-tab-accordion/effect.css#L5-L8) | **最值得迁移的是测量顺序。** 如果后续做横向手风琴或服务目录，先稳定首帧和文字宽度，再随用户操作移动外层裁切面。基于现有 Accordion 的 Reka 状态、键盘和纵向内容过渡独立实现。 |
| 弹性展开菜单 | 测量容器剩余空间和按钮宽度，再动画展开动作组。中线先收拢，外侧两线随后旋成关闭图标。减弱模式直接结算，关闭的内容组同步 `inert`。[布局与可达性](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/expanding-dock/effect.js#L93-L160)、[图标和面板时间线](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/expanding-dock/effect.js#L161-L285) | 优先借鉴导航或 Sheet 的开关图标时序。横向扩展适用于独立筛选工具条。默认 DropdownMenu、Select、Command 项目维持稳定位置并在打开时即可使用。 |
| 逐词阅读点亮 | 用 `Intl.Segmenter` 拆词，按段落位置计算滚动进度，逐词提高不透明度并为 `mark` 铺开底色。滚动监听是被动的，计算仍会测量段落并遍历词节点。减少动态效果时直接完成视觉状态。[进度与拆词](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/reading-word-highlight/effect.js#L283-L377)、[事件与清理](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/reading-word-highlight/effect.js#L396-L450) | 适合文档专题的短段落或少量关键词。优先让 Vue 保有文章节点，在标记词上绘制背景层，并维持正文对比度。按中文分词、链接、选择复制和长文滚动检验。 |
| 弹跳文字入场 | 按字素生成视觉层，可由入视口、滚动或外部进度驱动。减少动态效果或标题内有交互节点时恢复原始标题。下划线按渲染行绘制。[驱动](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/scroll-story/effect.js#L59-L100)、[静态回退](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/scroll-story/effect.js#L520-L545)、[下划线坐标](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/scroll-story/effect.js#L210-L245) | 适合文档首页或专题标题。若迭代现有链接动效，多行下划线优先使用与文本共用布局的 CSS，确需额外 SVG 层时让测量与绘制使用同一坐标空间，并覆盖 Safari 下的字体加载和多行换行。 |
| 叠卡轮播 | 按距当前项的位置计算位移、缩放、旋转与层级，通过 GSAP 切换。首击侧卡将它移到中央，当前卡保留链接行为。循环模式可复制卡片。[位置与循环](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/focus-cascade/effect.js#L186-L283)、[输入](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/focus-cascade/effect.js#L580-L646) | 可验证独立的叠卡展示模式。先明确点击侧卡是选中还是打开链接，同时核对卡片副本、键盘焦点和减少动态效果。通用 Carousel 继续用现有 Embla 管理拖动和选中位置。 |
| 边缘折射色散 | 在宿主提供的视口与其直接内容子元素上增强边缘，通过 SVG 位移滤镜与 RGB 通道分离绘制。尺寸和参数不变时复用位移贴图，失败时保留原图。滚动和手势由宿主管理。[挂载结构](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/edge-refraction-dispersion/effect.js#L4-L29)、[贴图与回退实现](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/edge-refraction-dispersion/effect.js#L415-L497) | 适合作为媒体轮播的可选装饰层。先用硬边遮罩或边缘标记验证浏览方向提示是否有效，再比较折射的绘制成本和 Safari 表现。 |
| 波浪画廊 | 用 WebGL 着色器处理图片色彩、色散和光晕，叠加卡片波浪、倾斜与拖动惯性。纹理不可用时保留 DOM 图片，减少动态效果时抑制波浪和惯性。[着色器](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/exploration-gallery/effect.js#L17-L26)、[纹理回退](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/exploration-gallery/effect.js#L301-L391)、[减少动态效果](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/exploration-gallery/effect.js#L581-L626) | 适合独立展示型画廊，需有图片纹理、回退与帧耗时预算。它的交互和渲染成本对通用 Image 或 Carousel 默认路径收益有限。 |

### 旧效果的接入变化

- **脚本化演示输入与 DOM 所有权是两回事。** 两个快照对比显示，Dock Menu、Link Hover Set、Redrawn Arrow、Pixel Wipe 与共享元素过渡都移除了脚本化演示输入，抽查的 `index.html` 保持不变。Dock Menu 和共享元素过渡的挂载仍通过 `innerHTML` 构造内容。新效果则有不同的边界，边缘折射增强已有视口，逐词点亮包装现有文本，弹性菜单创建自己的子树。Vue 应逐个核对节点由谁持有、状态从何处驱动、卸载复原哪些节点。[删除演示输入的提交](https://github.com/effect-atlas/effect-atlas/commit/49223fbd01964f37b7d92217f601a3346ac01c5a)、[Dock 当前挂载](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/dock-menu-dropdown/effect.js#L511-L555)、[共享元素当前挂载](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/shared-element-transition/effect.js#L639-L690)、[接入指南](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/docs/ai-integration.zh-CN.md#L41-L54)
- **重型效果增加可选的首帧准备路径。** 宿主提供 `card.startup` 时，共享运行逻辑暴露 `ready`，支持取消。尺寸或参数在异步准备期间变化时，重新测量并完成最新版本的首帧。圆盘轮播使用这条路径准备图片或纹理，可为以后独立展示模块的加载和销毁提供参考。[准备状态与首帧](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/dock-menu-dropdown/effect.js#L269-L309)、[取消与销毁](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/dock-menu-dropdown/effect.js#L380-L423)、[圆盘轮播调用](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/disc-carousel/effect.js#L1899-L1929)
- **目录记录的是示例单独加载的脚本。** 三个新增效果的 `dependencies` 为空，但弹性展开菜单、叠卡轮播和弹跳文字入场各自在 `effect.js` 内嵌 GSAP 3.12.5，并附 GSAP 许可声明。评估引入成本时要读源文件；复制或派生仍需检查适用的上游和第三方许可。[目录定义及校验](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/scripts/catalog.mjs#L42-L59)、[弹性菜单内嵌依赖](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/expanding-dock/effect.js#L514-L525)、[叠卡轮播内嵌依赖](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/focus-cascade/effect.js#L662-L673)、[弹跳文字内嵌依赖](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/effects/scroll-story/effect.js#L802-L813)
- **效果查找更容易。** `catalog.json` 索引双语名称、分类、预览、入口、挂载函数和文件清单。新增 CI 校验元数据、生成目录、本地链接、依赖文件和 JS 语法。其覆盖范围可以从工作流与贡献指南确认。[目录说明](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/docs/ai-integration.zh-CN.md#L5-L11)、[检查工作流](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/.github/workflows/check.yml#L10-L18)、[贡献指南](https://github.com/effect-atlas/effect-atlas/blob/c246cc6f92b4db4634151bbb650dad175a0acce7/CONTRIBUTING.md#L9-L20)

### 建议调整

11 月 6 日建议的首批工作仍优先推进链接反馈、Counter 续接和通知动效时序。新增效果给了两个更具体的验收约束：**布局测量完成后才开启几何过渡，文字装饰与文字本身共用坐标空间**。建议把这两项分别放进 Image 共享过渡和链接动效的验收场景，覆盖首屏及隐藏容器出现、容器宽度变化、长标题、字体加载和双语换行。此处是基于上游修复推导的验证项，尚无本地缺陷复现。BrutxUI 的 Accordion 已使用 Reka 内容状态控制高度过渡，Tabs 当前也已处理水平溢出的滚动可达性。横向手风琴有明确的服务目录场景时再验证，继续复用这些能力。[Accordion 内容](../../../packages/ui/src/components/accordion/AccordionContent.vue#L20)、[Tabs 变体](../../../packages/ui/src/components/tabs/tabs-variants.ts#L17)、[Carousel](../../../packages/ui/src/composables/useCarousel.ts#L38)

本轮比对了两个固定源码快照，并核对七个新增效果的实现和示例。Safari 修复的因果描述来自上游提交与源码，本轮尚未做浏览器、实机性能和辅助技术验证。

## 2026-11-06 基线调研

源码快照为 `effect-atlas/effect-atlas` 提交 `c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84`。当时的范围包括 README、许可证与 43 个效果目录概览，重点核验按钮、链接和菜单微交互、共享元素过渡、惯性拖拽、滚动卡片及受控时间线，并检查重型展示效果的实现成本。以下章节保留该快照下的分析。

## 主要判断与当前基础

最值得借鉴的是动效的状态连续性：从当前画面接受下一次操作，并让反馈对应明确的交互状态。BrutxUI 已有实体按压、方向性浮层和展示动效，改进应围绕这些基础展开。

- **实体反馈已有统一入口。** `brutalPress` 使位移与阴影偏移同源，并在按下时去影；Button、Card 和表单控件已复用这一机制。[共享交互变体](../../../packages/ui/src/lib/brutal-interaction-variants.ts#L25)、[按钮变体](../../../packages/ui/src/components/button/button-variants.ts#L12)、[卡片变体](../../../packages/ui/src/components/card/card-variants.ts#L17)
- **集合行已有稳定几何规范。** Select、Command、Tree 等通过颜色、选择标记和行内焦点表达状态；Switch 则由内部滑钮运动表达开关，外框保持固定。新增动效应继续服从这些运动主体。[集合行变体](../../../packages/ui/src/lib/collection-item-variants.ts#L7)、[Switch 变体](../../../packages/ui/src/components/switch/switch-variants.ts#L9)、[视觉规范 R4/R5](../../guides/VISUAL_SYSTEM.md#r4-按压反馈-press-feedback)
- **浮层与减少动态效果已有基础能力。** 锚定浮层有共享方向动画；Dialog、Sheet 有各自进出场；`useReducedMotion` 提供偏好及生命周期管理，Carousel 已据此关闭自动播放。[浮层动画片段](../../../packages/ui/src/lib/floating-animation-classes.ts#L8)、[Dialog 变体](../../../packages/ui/src/components/dialog/dialog-variants.ts#L21)、[Sheet 变体](../../../packages/ui/src/components/sheet/sheet-variants.ts#L8)、[useReducedMotion](../../../packages/ui/src/composables/useReducedMotion.ts#L8)、[Carousel](../../../packages/ui/src/composables/useCarousel.ts#L175)

| 优先级 | 组件或模块 | 建议及预期收益 | 验收重点 |
| --- | --- | --- | --- |
| 第一批 | 共享动效令牌、Toast、Message | 按按压、状态切换、浮层进入和浮层退出提炼语义时序；先协调视觉结束与卸载时机，使同类组件的节奏可预测 | 关闭中重开、运行时减少动态效果、主题覆盖、列表重排 |
| 第一批 | BreadcrumbLink、Button 的 link 变体、带方向图标的链接 | 借鉴追逐下划线与箭头重绘；反馈只发生在装饰线和图标上，文字和命中区域稳定 | 键盘焦点与 hover 等效、快速反复进入、可访问名称和布局稳定 |
| 第一批 | Counter | 保留显式 `play()` 的重播语义，目标值更新时从当前显示值续接 | 连续增减、负值、小数、显式重播、减少动态效果下立即结算 |
| 第二批 | Image 的现有预览 | 增加缩略图与预览图之间的共享元素过渡，帮助用户保持空间定位 | 打开中关闭、切图后关闭、源图离屏或卸载、页面滚动与 resize、焦点归还 |
| 第二批 | 菜单触发器、导航面板、Sheet | 由原语的 `open` 状态驱动图标变形；面板与内容分阶段出现，操作从打开时立即可用 | 不引入第二份 open 状态，快速开关不重置到错误起点，Escape 与焦点契约保持一致 |
| 展示层按需启用 | 主 CTA、定价区、首页卡片 | 像素扫色、手绘圈、滚动叠卡用于少量明确的视觉重点 | 主题令牌、内容始终可读、自然页面滚动、离屏停帧及真实设备性能 |

第一批中的时序治理有具体来源：Toast 关闭后等待固定 300ms 卸载，样式默认时长同为 300ms；全局减少动态效果规则缩短 CSS 动画后，JS 等待仍使用原值。Message 列表进入、离开和重排使用 `transition: all`。建议把“何时可交互”“何时完成视觉过渡”“何时卸载”明确为同一状态契约，并按组件指定需要过渡的属性。[Toast 关闭逻辑](../../../packages/ui/src/components/toast/Toast.vue#L14)、[Toast 样式](../../../packages/ui/src/components/toast/toast-variants.ts#L8)、[全局减少动态效果](../../../packages/ui/src/styles.css#L974)、[Message 过渡](../../../packages/ui/src/components/message/MessageContainer.vue#L98)

Counter 的改进有更直接的场景：默认 `autoStart=true` 时，`to` 或 `from` 变化会调用 `play()`，将 `current` 设回 `from`，随后重新插值。因此，持续更新的指标会反复从起点计数。Effect Atlas 的 `Track.go()` 从当前插值位置续接，可作为设计参考；Counter 应独立实现其 Vue 状态逻辑。[Counter 插值和播放](../../../packages/ui/src/components/counter/Counter.vue#L95-L126)、[目标变化监听](../../../packages/ui/src/components/counter/Counter.vue#L186)、[Track.go](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/link-hover-set/effect.js#L539-L607)

时序的手写数据源应位于现有设计令牌模块，按生成流程同步 UI 和 CLI；组件引用语义令牌，避免新增散落的时长与位移常量。具体时长需要与当前交互进行视觉标定，本文不把估计值作为实现参数。[令牌单一数据源与生成流程](../../architecture/生成与构建机制.md#二-令牌编译与设计系统分工)

## 仓库概况

README 将仓库划分为 8 个效果组及 Other；每个效果目录通常含 `effect.js`、`effect.css` 和可直接打开的 `index.html`。本次所读的 10 个效果没有额外库目录；README 所列 three.js 附件属于另外三个效果。[英文 README](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/README.md#L7-L20)、[中文 README](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/README.zh-CN.md#L7-L20)

| 分组 | 效果目录 |
| --- | --- |
| Cursor | `orbit-cursor`、`magnetic-symbol-field`、`torn-cursor-ink` |
| Hover | `film-jitter-hover`、`stacked-frame-index`、`scribble-ring`、`fractured-word-hover`、`redrawn-arrow-hover`、`link-hover-set`、`tear-off-pricing-ticket`、`pixel-wipe-button` |
| Text | `scroll-speed-scramble`、`masked-word-flip`、`mask-decode-reveal`、`prismatic-fluid-headline` |
| Menus | `dock-menu-dropdown`、`curtain-menu`、`hairline-burger`、`local-clock-pill`、`annotated-menu`、`scroll-minimap` |
| Scroll | `scroll-card-stack`、`crosshair-image-reveal`、`fullscreen-chapter-reveal`、`noise-dissolve-reveal`、`smear-in-grid`、`scroll-card-deal`、`scroll-warp-zoom` |
| Hero | `fluid-mask-hero`、`poster-masthead-collapse`、`card-fan-intro` |
| Transitions | `line-by-line-handoff`、`shared-element-transition`、`torn-sheet-transition`、`cut-line-preloader`、`smear-trail-preloader`、`crop-line-page-transition` |
| Galleries | `inertia-drag`、`horizontal-wheel-strip`、`curved-gallery`、`hanging-card-carousel`、`disc-carousel` |
| Other | `hold-to-burst` |

[README 效果目录总览](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/README.md#L47-L155)

## 六项可迁移机制

以下判断基于运行实现和 CSS，不以文件头注释作为实现证据。

### 1. Pixel Wipe Button：把快速进出变成有序状态，而不是倒放

按钮高度决定像素格尺寸，宽度决定列数；进入、离开分别向 `sweeps` 队列追加颜色扫过，渲染按固定离散帧推进。多次快速进出时，新旧扫色可叠画，完成的扫色更新底色后再移出队列，所以退出不是将入口动画简单倒播。焦点也会触发效果；触屏点击可固定状态，再次点击或点到外部清除。reduced-motion 下直接结算静态状态。[网格与扫色状态](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/pixel-wipe-button/effect.js#L600-L623)、[并发扫色及帧推进](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/pixel-wipe-button/effect.js#L675-L765)、[输入和 motion 切换](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/pixel-wipe-button/effect.js#L778-L865)

**BrutxUI 判断：** 作为少数主 CTA 的可选强调可以研究；不适合作为默认 Button 状态。canvas 分格绘制、逐格透明度和事件状态都比普通 CSS 过渡重。只迁移“离开时有方向性的第二次扫色”这个构想，不要直接复用画布和示例按钮 DOM。

### 2. Redrawn Arrow：用双份图标重叠，避免同一路径擦完再画的空档

箭头由两组 SVG path 构成：旧箭头向前移并擦除，新箭头在旧箭头尚未完全消失时开始描线，箭头杆与箭头尖再错开。JS 只切换状态类及写入时序变量；鼠标离开会撤掉状态类并回到静止图形，重新进入从头播放，属于明确的重播型反馈。焦点可见和原生按钮键盘激活沿用按钮语义；reduced-motion 隐藏新箭头并停掉描线动画。[真实状态切换](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/redrawn-arrow-hover/effect.js#L563-L622)、[旧、新路径的重叠时序](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/redrawn-arrow-hover/effect.css#L268-L310)、[reduced-motion 样式](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/redrawn-arrow-hover/effect.css#L486-L503)

**BrutxUI 判断：** 适用于 IconButton、外链角标等单个方向提示。保留现有按钮标签、图标槽和焦点环，只动画装饰 SVG；更换或重绘现有原语的内容结构没有必要。

### 3. Link Hover Set：动画轨迹从当前值续接，短暂反复悬停不跳变

`Track.go()` 先读取当前插值位置，再以它作为新动画起点。Chase Line 的强调下划线先伸出、前景线延迟追上；离开时前后顺序反转。Letter Roll 为每个字符创建隐藏的装饰副本，并将完整可读文本留在屏幕阅读器节点中。一个按需唤醒的帧循环负责插值，悬停、键盘焦点和触屏固定均可改变状态；reduced-motion 下将状态直接结算，不继续滚动。[Track 与两种效果状态](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/link-hover-set/effect.js#L539-L709)、[输入和 motion 状态](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/link-hover-set/effect.js#L756-L883)、[装饰文字与可访问文本分层](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/link-hover-set/effect.css#L269-L310)

**BrutxUI 判断：** 这是最适合迁移到 BreadcrumbLink、文档链接或导航项的方案。优先尝试“强调线追逐静态底线”，其状态和语义边界清楚；采用 BrutxUI 的主题色与硬边线宽，不复制示例卡片、字距或软阴影。

### 4. Scribble Ring：绘制、保持、退场由小状态机管理

实现把笔迹分成 `idle`、`drawing`、`boiling`、`lifting` 阶段；按参数帧率逐级画出或反向退场，笔迹目标变化时先跟踪目标矩形并平滑修正位置。SVG 路径由随机草图重新生成。指针悬停、键盘焦点、触屏点击都可设为当前目标；reduced-motion 时直接画完整静态圈，不运行退场帧序列。[SVG 笔迹和阶段状态机](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/scribble-ring/effect.js#L648-L782)、[目标输入及 reduced-motion 分支](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/scribble-ring/effect.js#L807-L933)

**BrutxUI 判断：** 可作为卡片或标注控件上的可选手绘装饰；持续重绘随机 SVG 和逐帧读取布局的成本较高。不要把它当作唯一键盘焦点提示，焦点仍应由现有 Ring 规范表达。

### 5. Hairline Burger：悬停预反馈与菜单打开状态分开

悬停只让两条线轻微靠拢；点击才进入持久打开状态，线段旋成叉号，同时更新 `aria-expanded`、`aria-label` 和 live region。打开时再次悬停可播放额外旋转，重新开关前先取消上一段旋转动画和延迟计时器。通用 runtime 在 reduced-motion 下立即完成 WAAPI 动画，并关闭 CSS transition。[按钮状态和交互](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/hairline-burger/effect.js#L549-L603)、[WAAPI 与 reduced-motion 生命周期](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/hairline-burger/effect.js#L243-L303)、[图标状态 CSS](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/hairline-burger/effect.css#L279-L341)

**BrutxUI 判断：** 适用于现有菜单触发器图标；要由菜单公开的 `open` 状态驱动，不能与组件内部再造一份开关状态。线宽、焦点指示与按钮表面仍使用 BrutxUI 令牌。

### 6. Dock Menu Dropdown：把打开阶段、行级反馈和键盘退出串成一条状态流

打开状态由同一个 `setOpen` 更新 CSS 类和 ARIA；面板尺寸、透明度、可见性及列表项错峰出现组成展开节奏。指针进入项目时，实色底板从指针到达的半边展开。方向键在行间移动，Escape 关闭并把焦点还给触发器，点击外部也关闭；reduced-motion 时去除 CSS transition 和 animation，并立即采用静态打开状态。[打开状态、行高亮和键盘处理](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/dock-menu-dropdown/effect.js#L683-L820)、[展开与行错峰样式](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/dock-menu-dropdown/effect.css#L397-L430)、[列表项过渡](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/dock-menu-dropdown/effect.css#L630-L646)、[reduced-motion 样式](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/dock-menu-dropdown/effect.css#L794-L800)

**BrutxUI 判断：** 可以借鉴面板与内容之间的阶段关系，并保持已有 `open`、焦点管理和键盘契约作为状态来源。常规 DropdownMenu、Select、Command 的项目应立即可操作，行的位置、尺寸和阴影保持稳定；错峰揭示更适合低频整页导航或 Sheet 中的装饰内容，不延迟业务选项的出现和命中。[DropdownMenuContent](../../../packages/ui/src/components/dropdown-menu/DropdownMenuContent.vue#L3-L11)、[DropdownMenu 变体](../../../packages/ui/src/components/dropdown-menu/dropdown-menu-variants.ts#L6-L20)、[视觉系统](../../guides/VISUAL_SYSTEM.md#r5-悬停反馈-hover-feedback)

## 其余四项的适用边界

| 效果 | 源码事实 | 对 BrutxUI 的判断 |
| --- | --- | --- |
| Curtain Menu | 点击后面板整体下滑，项目逐项入场；键盘 Escape 可关闭并恢复触发器焦点。reduced-motion 分支清除所有受管理的 WAAPI 动画。[源码](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/curtain-menu/effect.js#L708-L827) | 面向整页导航展示，包含演示页面、预览图片和定制排版；不是通用下拉组件的合适移植底稿。 |
| Film Jitter Hover | hover 时 CSS 以 `step-end` 无限抖动横线和文字，按下态缩小；reduced-motion 时停动画和过渡。[CSS](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/film-jitter-hover/effect.css#L415-L456)、[motion 样式](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/film-jitter-hover/effect.css#L526-L535) | 抖动是效果核心，视觉干扰强，不建议加到默认按钮。Button 已有可选 glitch 效果和 `brutalPress`，优先沿现有入口治理效果叠加。[Button.vue](../../../packages/ui/src/components/button/Button.vue#L19-L50)、[按钮变体](../../../packages/ui/src/components/button/button-variants.ts#L6-L16) |
| Masked Word Flip | 两行词组按停留间隔轮换，正在翻转时用户触发会排队；reduced-motion 下用户操作立即切换，自动演示不继续。[状态与触发](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/masked-word-flip/effect.js#L572-L629)、[排队和无动画分支](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/masked-word-flip/effect.js#L642-L715) | 适合非关键标题或轮播副标题；按钮标签、菜单名等交互文案不宜自动换词，以免可见语义与辅助技术命名不一致。 |
| Local Clock Pill | 通过 `Intl.DateTimeFormat` 更新时区、时间和工作时段，定时器对齐下一整分钟；悬停、焦点显示联系面，点击固定。[时间与计时器](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/local-clock-pill/effect.js#L586-L713)、[输入与清理](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/local-clock-pill/effect.js#L724-L766) | 这是带真实时间逻辑的专用联系组件，不是通用微动效；可借鉴“数据更新计时器不依赖每帧循环”。reduced-motion 关闭翻面和闪烁，但仍更新分钟。[样式](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/local-clock-pill/effect.css#L399-L404) |

## 页面与媒体效果的可迁移部分

### 共享元素过渡：优先接入已有图片预览

`shared-element-transition` 让缩略图与详情使用同一视觉对象，通过插值位置和尺寸在两种布局间移动；中途操作可以重定向当前进度，切换目标时先处理当前图片的收回。[状态推进和目标切换](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/shared-element-transition/effect.js#L537-L624)

本地 Image 已有预览打开、关闭、切图、缩放、拖动和焦点归还。建议在现有预览状态边界上扩展几何过渡，保持实际语义和输入控制由组件持有。关闭时应根据当前可用的缩略图重新计算目标；源节点失效时使用不依赖其坐标的退场。图片自身的缩放/旋转/拖动与预览进入/退出应由不同的视觉层承担，避免争用同一 transform。[打开与焦点管理](../../../packages/ui/src/components/image/Image.vue#L178-L215)、[切图](../../../packages/ui/src/components/image/Image.vue#L224-L242)、[现有图像变换](../../../packages/ui/src/components/image/Image.vue#L245-L294)

这是第二批中最值得验证的效果：它提供明确的空间定位收益；但需要覆盖滚动、不同宽高比、连续切图及源节点消失等边界，工作量高于链接装饰。

### 惯性拖拽：适用于明确的可移动内容

`inertia-drag` 在指针释放后根据采样速度做指数衰减，触及边界时停止对应轴，还提供键盘移动与归位路径。其 `pointercancel` 与普通释放共用路径，迁移时应单独定义取消手势的结算规则。[速度与边界](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/inertia-drag/effect.js#L635-L710)、[逐帧更新](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/inertia-drag/effect.js#L996-L1071)

Card 当前拥有激活语义，拖动与点击需要明确区分，因此惯性应由可拖动内容按需启用。Carousel 已有 Embla 的拖拽及动画路径，扩展轮播时继续沿用该能力，避免并行运行两套位置与速度计算。[Card](../../../packages/ui/src/components/card/Card.vue#L11)、[Carousel](../../../packages/ui/src/composables/useCarousel.ts#L74)

### 滚动卡片：用于展示段落，保留自然滚动

`scroll-card-stack` 把内部滚动位置映射到卡片状态，用阻尼追赶目标，并以 `inert` 控制尚未到达卡片的可交互性；另一种模式包含滚轮捕获与拖动交接。[滚动映射](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/scroll-card-stack/effect.js#L581-L623)、[交互可达性](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/scroll-card-stack/effect.js#L869-L897)、[滚轮路径](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/scroll-card-stack/effect.js#L777-L852)

适合在首页功能卡、案例展示和定价区验证“卡片随阅读推进依次成为视觉重点”。装饰变换不应截断正文的自然阅读、页面滚动或键盘导航；数据表格、树和虚拟列表继续以信息稳定性为主。

### 受控时间线：可借鉴控制语义，进度必须来自真实任务

`cut-line-preloader` 提供 `play(direction)`、`seek(ms)` 和 `restore()`；其滚轮选择播放方向，展示数字属于时间线画面。[时间线绘制](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/cut-line-preloader/effect.js#L563-L641)、[控制 API](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/cut-line-preloader/effect.js#L669-L776)

Progress、Upload 的视觉完成态应由真实任务状态驱动；Counter 的数字揭示可以沿用自身播放控制。剪切、遮罩及数字滚轮属于可选展示层，不应把演示时间线作为任务进度来源。[Progress](../../../packages/ui/src/components/progress/Progress.vue#L44)、[上传条目](../../../packages/ui/src/components/upload/UploadFileItem.vue#L68)

### 重型效果：独立展示模块评估运行成本

| 效果 | 实现成本来源 | 适用范围 |
| --- | --- | --- |
| Fluid Mask Hero | 径向 CSS mask 与弹簧更新；依赖浏览器的遮罩绘制成本，并非 Three.js 效果 | 文档首页或独立 Hero 的单一视觉重点 |
| Noise Dissolve Reveal | 网格遍历、轮廓追踪及每帧写入 `clip-path:path()`，成本随舞台与网格密度增加 | 有明确性能预算的页面切换展示 |
| Hold to Burst | Three.js/WebGL 的 InstancedMesh 粒子与扁平回退 | 用户主动触发的独立展示 |
| Curved Gallery、Disc Carousel | WebGL context、纹理/材质与 CSS 3D 回退 | 专门的媒体画廊 |

[Fluid Mask Hero 源码](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/fluid-mask-hero/effect.js)、[噪声网格](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/noise-dissolve-reveal/effect.js#L727-L797)、[噪声路径绘制](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/noise-dissolve-reveal/effect.js#L932-L1152)、[Burst 渲染](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/hold-to-burst/effect.js#L603-L629)、[画廊初始化](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/curved-gallery/effect.js#L632-L666)、[Disc Carousel 源码](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/disc-carousel/effect.js)

这些效果的成本来自持续计算、绘制或 GPU 资源，不能仅凭“没有安装依赖”判断轻量。对核心控件的第一批改进，CSS/SVG 与现有 Vue 状态已能承担目标；展示模块另行测量设备帧耗时和资源释放。

## Demo 边界、生命周期与统一建议

这些 `effect.js` 虽然可独立挂载，但并非 Vue 组件源文件：挂载函数会保存宿主原 HTML/属性，再注入自己的示例 DOM；其中含固定文案、占位 `href="#"`、尺寸布局和自动播放的假光标。`destroy()` 会撤销所追踪的 rAF、timer、observer、WAAPI 动画与监听器，并恢复原宿主内容。Vue 集成应抽出状态机/过渡次序，改由模板槽位和组件 props 控制 DOM，不能直接在 Vue 渲染节点上调用会替换 `innerHTML` 的挂载函数。[共享 runtime 的按需 rAF、reduced-motion、事件与 observer 清理](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/pixel-wipe-button/effect.js#L104-L182)、[runtime 销毁](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/pixel-wipe-button/effect.js#L277-L338)、[挂载资源快照和复原](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/pixel-wipe-button/effect.js#L946-L1022)、[另一类菜单挂载](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/dock-menu-dropdown/effect.js#L1100-L1196)

10 个目标 runtime 都监听 `prefers-reduced-motion` 的变化，并让帧循环在文档隐藏、元素离屏、暂停或 reduced-motion 时停止；各效果的静态回退略有不同，移植时需逐项保留可读状态。CSS 示例大量使用软阴影、圆角与细发丝线，例如 [Dock 面板](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/dock-menu-dropdown/effect.css#L410-L429) 和 [Link 卡片](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/effects/link-hover-set/effect.css#L349-L359)，与 BrutxUI 的硬边框、硬阴影、焦点 Ring 和共享按压反馈不一致。适配应保留交互时序和打断策略，重新使用项目颜色、边框、阴影、焦点与状态原语。[视觉系统](../../guides/VISUAL_SYSTEM.md)、[组件开发指南](../../guides/COMPONENT_GUIDE.md)

## 许可证边界

Effect Atlas License 1.0 明确说明其并非 MIT 或开源许可证；允许免费复制、修改和商用，但许可对象是效果作为更大项目一部分的使用。它禁止单独出售效果、删除版权及许可声明，并禁止镜像仓库或网站。[许可证性质与许可范围](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/LICENSE#L1-L24)、[分发限制](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/LICENSE#L26-L52)、[保留声明要求](https://github.com/effect-atlas/effect-atlas/blob/c0f2b5a148a2803d40ca1bc3c1f44e4db7f95b84/LICENSE#L54-L59)

许可证第 3 节也允许保留声明后在教程、模板或开源项目中分享效果，同时把发布 fork 为网站或 npm 包认定为镜像。选择性派生为 BrutxUI 组件的具体分发方式，不能仅凭“免费商用”认定已获授权。建议基于交互机制独立设计实现；需要直接复制或派生源码时，先确认所选分发方式的许可范围，并保留要求的版权及许可证引用。

## 调研限制

上游快照为本次调研时通过 GitHub API 获取的主分支提交；43 项是目录概览，详细结论来自上文所列代表实现，并非全部效果的完整审计。未运行快照中的 JS、HTML 或仓库脚本，也未作浏览器性能、跨浏览器或真实辅助技术验证。结论反映源码实现和 CSS 声明，不代表运行时体验测试结果。
