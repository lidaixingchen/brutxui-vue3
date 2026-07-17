---
title: 版本历史
description: BrutxUI 版本更新记录入口。
---

# 版本历史

本项目所有重要变更均记录于 [CHANGELOG.md](https://github.com/lidaixingchen/brutxui-vue3/blob/main/CHANGELOG.md)。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。

---

## 查看变更记录

BrutxUI 采用「根 CHANGELOG + 归档目录」的分段策略，避免单一文件无限增长。

### 最新版本

根 [`CHANGELOG.md`](https://github.com/lidaixingchen/brutxui-vue3/blob/main/CHANGELOG.md) 仅保留**最近 3 个版本**的完整变更记录（含 Breaking Changes、Features、Bug Fixes 等分类）。

::: tip 直接查看
- 仓库源文件：[CHANGELOG.md](https://github.com/lidaixingchen/brutxui-vue3/blob/main/CHANGELOG.md)
- 各包独立 CHANGELOG：
  - [`packages/ui/CHANGELOG.md`](https://github.com/lidaixingchen/brutxui-vue3/blob/main/packages/ui/CHANGELOG.md)（`brutx-ui-vue`）
  - [`packages/cli/CHANGELOG.md`](https://github.com/lidaixingchen/brutxui-vue3/blob/main/packages/cli/CHANGELOG.md)（`brutx-vue`）
:::

### 历史归档版本

更早的版本已归档至 [`/changelog/`](../changelog/) 目录，按版本号独立成文，便于回溯。

::: tip 浏览归档
- 文档站点入口：[归档版本索引](../changelog/)
- 归档文件目录：[`apps/docs/changelog/`](https://github.com/lidaixingchen/brutxui-vue3/tree/main/apps/docs/changelog)
:::

---

## 发布与归档机制

- **发布流程**：参见 [发布流程文档](https://github.com/lidaixingchen/brutxui-vue3/blob/main/docs/RELEASE.md)
- **归档策略**：根 CHANGELOG 保留最近 3 个版本完整段落，更早版本移入 `apps/docs/changelog/v<version>.md`
- **自动侧边栏**：文档站点的归档侧边栏由 [config.ts](https://github.com/lidaixingchen/brutxui-vue3/blob/main/apps/docs/.vitepress/config.ts) 中的 `generateChangelogSidebar()` 函数扫描归档目录自动生成，按 major 版本分组
