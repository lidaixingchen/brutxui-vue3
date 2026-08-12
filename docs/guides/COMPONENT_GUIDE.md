# 组件开发指南

## 组件约定

- `<script setup lang="ts">` 配合 `defineProps<T>()` + `withDefaults()`
- 变体在独立的 `*-variants.ts` 文件中使用 CVA 定义，与组件同目录
- 始终通过 `cn()` 合并类——禁止把运行时值插值进类名（每个完整类名必须是可被 `@source` 扫描的源码字面量，由 `check:class-literals` 门禁强制，测试文件不得成为产物 CSS 的字面量来源）；从封闭常量表选取完整字面量再与静态片段组合（如 shared-input-variants 的 `validationBorderColors[variant]`）属合法例外，不算拼接
- 动态类合并默认在 `computed()` 中完成（条件三目/多分支/动态对象键留在 JS 侧）；模板内 `cn()` 仅限「计算值或静态字面量 + 单个尾巴」的轻量二参数合并（如 `:class="cn('flex flex-col gap-1', props.class)"`，库内 40+ 处既有内联均为此形态，属合法用法）
- 始终使用 `reka-ui` 实现无障碍无头原语
- 始终从 `src/index.ts` 导出新组件
- 文本 props 默认值设为 `undefined`，通过 `useLocale()` 的 `t()` 函数提供默认文本；优先级链为 `props > t() > zh-CN 回退`
- 可翻译文本使用 `t('componentName.key')` 访问，含插值的使用 `t('key', { param: value })`
- `PricingSection` 是定价区唯一主实现，支持一次性价格与订阅切换；定价能力一律扩展 `PricingSection`，禁止新增或维护第二套定价逻辑
- 创建或修改组件时，优先复用现有 BrutxUI 组件，禁止用 native HTML 元素替代已有组件（如用 `Button` 而非 `<button>`、`Select` 系列而非 `<select>`/`<option>`、`Badge` 而非手写 badge `<div>`、`Input` 而非 `<input>`），防止重复造轮子；仅在特殊 ARIA 角色、内联图标切换等无对应组件的场景下方可使用 native 元素
- 变体键 `danger` 是统一惯例（alert/badge/button/checkbox/counter/progress/radio-group/switch/tags-input/timeline）：语义键 `danger` 映射 `brutal-destructive` token，勿重命名
- 焦点指示统一用 outline，规则以 VISUAL_SYSTEM R7 为单一权威，本规则只补充组件应用要点：统一引用 `@/lib/utils` 的 `FOCUS_OUTLINE_CLASSES`；focus-within 容器（input/number-input/TagsInput）用同款 `focus-within:` 变体；紧凑控件（data-table ColumnFilter）保留 `outline-1`。禁止在承载焦点 outline 的同一元素上保留任何 `outline-none`；合法例外仅一种：focus-within 容器包裹的内层 input 可抑制 UA 环（机制与例外见 [tailwind-v4-mechanisms.md](tailwind-v4-mechanisms.md) §1）；ring 系新增类由 CI 门禁 `check:deprecated:check` 拦截
- 过渡规则（全库单一权威，VISUAL_SYSTEM R4 引用本节）：只声明实际变化的属性——① 交互反馈默认 `transition-all`（位移+阴影+颜色统一过渡，全库多数派惯例而非强制）；② 仅位移/阴影时用共享变体 `transition-[transform,box-shadow]`（`brutalPressWithTransition`/`brutalHoverLiftWithTransition`）；③ 位移/阴影+颜色时显式列出全部变化属性（breadcrumb 的 `transition-[transform,box-shadow,color]`；含背景变化场景需 `background-color`）；④ opacity 变化用 `transition-opacity`（`transition-colors` 不过渡 opacity）。⚠️ twMerge 同组陷阱：`transition-all` 与 `transition-[...]` 属同一组，`cn()` 拼接时先写者被**静默移除**、以后写者为准（机制见 [tailwind-v4-mechanisms.md](tailwind-v4-mechanisms.md) §2）——同一交互元素只声明一份 transition；组件侧声明与共享变体（WithTransition）拼接冲突时，删组件侧死类或用完整属性列表的任意值过渡覆盖
- 共享 variants 波及：`input`/`textarea`/`number-input`/`hardcore-input` 共享 `shared-input-variants`；`checkbox`/`switch` 共享 `formToggleVariantColors`（改选中态前景色在组件侧拼接，不动共享）；`dialog`/`alert-dialog` 是镜像组件，行为改动需同步
- 多输入构成一个过滤条件（DataTable 模式）：子组件 emit 增量（空值传 null）、父级按列函数式合并；勿用本地 draft 常驻（违反单向数据流，外部程序化设置会与 draft 冲突）

## 共享交互变体机制契约

`packages/ui/src/lib/brutal-interaction-variants.ts` 顶部注释为**权威说明**，此处为镜像，两处需同步：

- **① 完整类名字面量**（@source 契约）：styles.css 的 `@source` 指令让 Tailwind 静态扫描源码，每个完整类名必须是可扫描源码中的字面量；禁止类名内部 `${...}` 插值；允许「完整字面量常量 + `${}` 组合」（该文件即样板）。机制见 [tailwind-v4-mechanisms.md](tailwind-v4-mechanisms.md) §4。
- **② data-* 复合变体字节序**（竞态）：产物字节序 `hover:*` < `focus:*` < `active:*` < `data-[highlighted]:*` < `data-[state=on]:*` 等，同特异度 `(0,2,0)` 恒后者胜 → `data-*` 恒压过 `brutalPress` 的 `active:*`；需在持久 data-* 态下保留瞬态按压反馈时写 `data-*:active:...` 复合变体（特异度 `0,3,0`，含 `translate-x-0` 重置）；持久态下取消按压反馈则删引用并注释，严禁保留永不生效的导入。
- **③ 管辖分界**：`brutalPress`（瞬态 active）vs `brutalPressedState`（持久 data-* 态）；持久「保持按下」态必须复用 `brutalPressedState`/`brutalPressedStateOn` 语义，严禁内联手抄 fallback 字面量；`switch`/`checkbox` 的 checked 位移驱动独立 thumb 元素属合法边界。

## Neo-Brutalist 视觉系统

详见 [VISUAL_SYSTEM.md](VISUAL_SYSTEM.md)，包含设计令牌、视觉规则、Tailwind 工具类、主题预设和反模式。

## 注册表模式

注册表是**生成式**的：`packages/ui/scripts/prebuild-scan.ts` 通过 AST 扫描 `packages/ui/src/components/` 自动生成 `packages/ui/registry-manifest.json`（组件文件清单）；`packages/registry/scripts/build-registry.ts` 读取该清单与 `packages/shared/src/component-metadata.ts` 中的人工元数据，合并后从源码读取、重写导入路径、提取依赖，自动生成 `packages/registry/registry/*.json` 和 `index.json`（**这些产物不入库**，git 不跟踪，发布时由 CI 基于最新源码构建并上传为 GitHub Release 资产）。**不要手动编写 registry JSON**——未在 `COMPONENTS` 中登记的组件不会进入 `index.json`，CLI 也无法安装。

- 新增组件时，只需在 `packages/shared/src/components.ts` 的 `COMPONENTS` 中添加元数据条目，然后运行 `pnpm --filter brutx-ui-vue prebuild:scan`（或直接 `pnpm build`）生成清单，再运行 `pnpm --filter brutx-registry-vue build` 生成 JSON。文件映射由 AST 扫描器自动发现，无需手动登记。
- `pnpm --filter brutx-registry-vue validate` 会执行三道一致性校验：① 源码目录 ↔ `registry-manifest.json`（防止清单与源码不同步）；② `{name}.json` ↔ `index.json`（防止手写孤儿 JSON）；③ 字段完整性。
- ⚠️ **CI 会强制检查**：`validate` 脚本会扫描 `packages/ui/src/components/` 下所有目录，与 `COMPONENT_METADATA` 比对。未登记的组件会导致 CI 失败，必须先登记再提交。

## 组件开发与同步生命周期 (Workflow Checklist)

当新增组件、为已有组件新增 composable、或者对公共依赖进行修改时，在 `git commit` 本地提交前，必须按照以下顺序同步并校验（**严禁全局重型自检**，以节省开发机资源）：

| 顺序 | 阶段 | 操作 / 运行命令 | 说明 / 验证方式 |
| --- | --- | --- | --- |
| 1 | **元数据登记** | 在 `packages/shared/src/components.ts` 的 `COMPONENTS` 中登记元数据（先 grep 确认 key 未被占用） | 声明 `dependencies`、`category`、`kind` 等元数据 |
| 2 | **生成清单** | 在根目录下运行 `pnpm --filter brutx-ui-vue prebuild:scan` | 自动发现新组件文件，更新 `registry-manifest.json` |
| 3 | **编译注册表** | 在根目录下运行 `pnpm --filter brutx-registry-vue build` | 编译组件 JSON，可用 `pnpm --filter brutx-registry-vue validate` 验证 |
| 4 | **国际化检查** | 运行 `pnpm check:i18n:strict` | 严格校验中英文国际化 key 的镜像对称性 |
| 5 | **本地局部自检** | ① 对修改文件运行 `npx eslint <changed-files> --fix`<br>② 对修改的子包运行类型检查（如 `pnpm --filter brutx-ui-vue typecheck`） | **核心**：仅自检被修改的文件或子包，严禁全局重型自检以节省资源 |
| 6 | **编写演示组件** | 在 `apps/docs/.vitepress/theme/components/demos/` 目录下创建或更新 `{ComponentName}Demo.vue` | 遵循 `PascalCaseDemo.vue` 命名规范，用作文档预览 |
| 7 | **编写文档** | 在 `apps/docs/components/` 和 `apps/docs/en/components/` 创建或更新 `{name}.md` 文档，并通过 `<{ComponentName}Demo />` 引入演示 | 必须符合 [COMPONENT_DOC_TEMPLATE.md](COMPONENT_DOC_TEMPLATE.md) 模板 |
| 8 | **文档侧边栏** | 在 `apps/docs/.vitepress/config.ts` 中配置中文/英文 sidebar | 可通过 `pnpm --filter docs build` 验证文档构建 |
| 9 | **更新 AI 技能** | 在 `skills/brutxui/SKILL.md` 中同步新组件和函数 | 便于后续 AI Agent 能够识别并合理复用 |
| 10 | **约定引用校验** | 运行 `pnpm check:guide-refs` | 校验 guide/skills 无已删除符号引用，登记组件均有中英文文档 |
