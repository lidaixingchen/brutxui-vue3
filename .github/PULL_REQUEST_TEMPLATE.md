<!-- 感谢贡献！请按以下清单检查 PR，未通过项将在 CI 中被阻塞或标记为需讨论。 -->

## 变更说明

<!-- 简要描述本 PR 做了什么、为什么。若有 breaking change 请显式标记并附迁移指南（见 docs/RELEASE.md）。 -->

## PR 检查清单

- [ ] **Changeset 已声明**（必需）
  - 若本 PR 涉及 `brutx-ui-vue`、`brutx-vue` 或任何可发布包的语义化变更，请在提交前运行 `pnpm changeset` 生成 `.changeset/*.md` 并随 PR 一起提交
  - 纯文档/测试/CI 改动可跳过此项，但请在标题或描述中标注 `chore: no-changeset`
- [ ] **Conventional Commits**：commit 信息符合 `<type>(<scope>): <subject>` 规范
- [ ] **本地验证通过**：`pnpm build && pnpm typecheck && pnpm lint && pnpm test`
- [ ] **SSR 安全**（涉及组件/组合式函数时）：未在模块顶层访问 `window`/`document`/`navigator`
- [ ] **可访问性**（涉及交互组件时）：通过 `vitest-axe` / `@axe-core/playwright` 校验
- [ ] **视觉回归**（涉及 UI 视觉变更时）：已更新 `packages/ui/visual/baselines` 并附说明
- [ ] **包体积**（涉及 `packages/ui` 时）：`pnpm --filter brutx-ui-vue size` 未超 size-limit 阈值
- [ ] **文档同步**：受影响的 API/示例/迁移指南已在 `apps/docs` 与 `docs/RELEASE.md` 中同步

## 关联 Issue / Release

<!-- 例如：Closes #123；将在 v0.7.0 中发布 -->
