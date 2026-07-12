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

## 新建组件后同步清单

新增组件（或为已有组件新增 composable）后，必须同步以下文件，否则 CI 会失败：

| 顺序 | 文件 | 操作 | 验证 |
| --- | --- | --- | --- |
| 1 | `packages/shared/src/components.ts` | 在 `COMPONENTS` 中添加条目（先 grep 确认 key 不存在，防止 TS1117 重复键），声明 `dependencies`/`category`/`kind` 等元数据 | — |
| 2 | `packages/ui/` | 运行 `pnpm --filter brutx-ui-vue prebuild:scan` 生成 `registry-manifest.json`（AST 自动发现 files/composables/directives/lib） | — |
| 3 | `packages/registry/` | 运行 `pnpm --filter brutx-registry-vue build` 生成注册表 JSON | `pnpm --filter brutx-registry-vue validate` |
| 4 | `apps/docs/components/{name}.md` + `apps/docs/en/components/{name}.md` | 按 `docs/COMPONENT_DOC_TEMPLATE.md` 模板编写中英文文档和demo组件演示 | `pnpm --filter docs build` |
| 5 | `apps/docs/.vitepress/config.ts` | 在中文和英文 sidebar 各添加条目 | 同上 |
| 6 | `skills/brutxui/SKILL.md` | 更新组件列表和组合式函数表 | — |
