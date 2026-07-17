# 组件开发指南

## 组件约定

- `<script setup lang="ts">` 配合 `defineProps<T>()` + `withDefaults()`
- 变体在独立的 `*-variants.ts` 文件中使用 CVA 定义，与组件同目录
- 始终通过 `cn()` 合并类——切勿拼接字符串
- 始终使用 `computed()` 进行动态类合并——切勿在模板中调用 `cn()`
- 始终使用 `reka-ui` 实现无障碍无头原语
- 始终从 `src/index.ts` 导出新组件
- 文本 props 默认值设为 `undefined`，通过 `useLocale()` 的 `t()` 函数提供默认文本；优先级链为 `props > t() > zh-CN 回退`
- 可翻译文本使用 `t('componentName.key')` 访问，含插值的使用 `t('key', { param: value })`
- `PricingSection` 是定价区主实现，支持一次性价格与订阅切换；`SaaSPricing` 仅作为基于它的 SaaS 兼容封装，避免新增或维护第二套定价逻辑
- 创建或修改组件时，优先复用现有 BrutxUI 组件，禁止用 native HTML 元素替代已有组件（如用 `Button` 而非 `<button>`、`Select` 系列而非 `<select>`/`<option>`、`Badge` 而非手写 badge `<div>`、`Input` 而非 `<input>`），防止重复造轮子；仅在特殊 ARIA 角色、内联图标切换等无对应组件的场景下方可使用 native 元素

## Neo-Brutalist 视觉系统

详见 [VISUAL_SYSTEM.md](VISUAL_SYSTEM.md)，包含设计令牌、视觉规则、Tailwind 工具类、主题预设和反模式。

## 注册表模式

注册表是**生成式**的：`packages/ui/scripts/prebuild-scan.ts` 通过 AST 扫描 `packages/ui/src/components/` 自动生成 `packages/ui/registry-manifest.json`（组件文件清单）；`packages/registry/scripts/build-registry.ts` 读取该清单与 `packages/shared/src/component-metadata.ts` 中的人工元数据，合并后从源码读取、重写导入路径、提取依赖，自动生成 `packages/registry/registry/*.json` 和 `index.json`。**不要手动编写 registry JSON**——未在 `COMPONENTS` 中登记的组件不会进入 `index.json`，CLI 也无法安装。

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
