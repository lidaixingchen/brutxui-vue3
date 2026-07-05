# AGENTS.md — BrutxUI Vue 3

面向 Vue 3 + Tailwind CSS 的 Neo-Brutalist UI 组件库。独立维护的 Vue 3 版本。

## 单体仓库

| 包名                   | 路径                   | 说明                      |
| -------------------- | -------------------- | ----------------------- |
| `brutx-ui-vue`       | `packages/ui/`       | 核心 Vue 3 组件库            |
| `brutx-vue`          | `packages/cli/`      | 用于 `init` 和 `add` 的 CLI |
| `brutx-registry-vue` | `packages/registry/` | 编译后的 JSON 注册表           |
| `brutx-shared-vue`   | `packages/shared/`   | 共享类型和元数据                |
| `docs`               | `apps/docs/`         | VitePress 文档站点          |

## 命令

```bash
pnpm build          # 构建 UI 包
pnpm lint           # 对所有包执行 lint
pnpm typecheck      # 对所有包执行类型检查
pnpm test           # 运行 UI 测试
pnpm test:watch     # 监视模式运行测试
pnpm release:check  # 执行发布前完整门禁
```

## 技术栈

Vue 3.5+（`<script setup>`）· TypeScript 6.0+（strict）· Tailwind CSS 4.3+ · reka-ui 2.9+（无头原语）· CVA 0.7+（变体）· clsx + tailwind-merge 通过 `cn()` · Vite 8+ · Vitest 4+ · pnpm 11+ · Node.js 22.5+

## 导入

- `@/` → `src/`
- 内部：相对路径（`../lib/utils`）
- 无头原语：`import { Primitive } from 'reka-ui'`
- 图标：`import { Loader2 } from '@lucide/vue'`
- 国际化：`import { useLocale } from '@/composables/useLocale'`

## 代码风格

- 除非要求否则不写注释 · 无魔法数字 · 无硬编码值
- 4 空格缩进 · 单引号 · PascalCase 组件（`Button.vue`）· kebab-case 变体（`button-variants.ts`）· camelCase 组合式函数（`useToast.ts`）

## Shell git注意事项

详见 [提交信息规范 - Shell 注意事项](docs/COMMIT_CONVENTION.md#shell-注意事项)。

## 目录结构

- **文档网站：** `apps/docs/`（VitePress）
- **核心包：** `packages/ui/`
  - 组件文件：`packages/ui/src/components/`
  - 组合式函数：`packages/ui/src/composables/`
  - 语言包：`packages/ui/src/locales/`
  - 工具函数：`packages/ui/src/lib/utils.ts`、`packages/ui/src/lib/data-table-utils.ts`
  - 测试文件：`packages/ui/src/components/*.test.ts`
  - 构建产物：`packages/ui/dist/`
- **CLI 工具：** `packages/cli/`
  - CLI 操作：`packages/cli/src/commands/`
  - 核心逻辑：`packages/cli/src/lib/`
- **注册表构建器：** `packages/registry/`
  - 组件映射表：`packages/registry/scripts/component-files.ts`（`COMPONENT_FILES`，新增组件在此登记）
  - 构建脚本：`packages/registry/scripts/build-registry.ts`、`validate-registry.ts`
  - 生成的组件 JSON：`packages/registry/registry/`（由 build 自动生成，勿手动编辑）
- **共享类型：** `packages/shared/`
- **为此UI库创建的Skills：** `skills/`
  - BrutxUI Skill：`skills/brutxui/`
  - 参考文档：`skills/brutxui/references/`
- **方案文档：** `docs/`

## 新建组件后同步清单

新增组件（或为已有组件新增 composable）后，必须同步以下文件，否则 CI 会失败：

| 顺序 | 文件 | 操作 | 验证 |
| --- | --- | --- | --- |
| 1 | `packages/registry/scripts/component-files.ts` | 在 `COMPONENT_FILES` 中登记组件文件名和 composables 映射 | — |
| 2 | `packages/shared/src/components.ts` | 在 `COMPONENTS` 中添加条目（先 grep 确认 key 不存在，防止 TS1117 重复键） | `pnpm --filter brutx-registry-vue validate` |
| 3 | `packages/registry/` | 运行 `pnpm --filter brutx-registry-vue build` 生成注册表 JSON | 同上 |
| 4 | `apps/docs/components/{name}.md` + `apps/docs/en/components/{name}.md` | 按 `docs/COMPONENT_DOC_TEMPLATE.md` 模板编写中英文文档和demo组件演示 | `pnpm --filter docs build` |
| 5 | `apps/docs/.vitepress/config.ts` | 在中文和英文 sidebar 各添加条目 | 同上 |
| 6 | `skills/brutxui/SKILL.md` | 更新组件列表和组合式函数表 | — |

## 详细文档

- [提交信息规范](docs/COMMIT_CONVENTION.md)
- [发布流程与 Changelog](docs/RELEASE.md)
- [组件开发指南](docs/COMPONENT_GUIDE.md)

## AGENTS.md 维护约定

- 编写或修改本文件时，如果对项目约定、发布流程、命令用途、包职责或用户偏好有不确定之处，先询问用户，不要自行补全。
- 只记录已确认的事实和约定；从历史提交、tag 或现有文件推断出的内容，应先向用户确认后再写入。
- 不要把一次性的操作经验写成本项目长期规则，除非用户明确确认。