---
title: 版本历史
description: BrutxUI 版本更新记录。
---

# 版本历史

本项目所有重要变更均记录于此。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。

完整变更日志请查看 GitHub 上的 [CHANGELOG.md](https://github.com/lidaixingchen/brutxui-vue3/blob/main/CHANGELOG.md)。

---

## 最新版本

### [0.8.1] - 2026-06-30

#### ♻️ 代码重构

- **兼容性审查修复**：执行 5 大类约 30 处修复
  - defaultValue/defaultXxx 双模式修复（8 处）
  - 命名不一致修复（6 处）
  - 死代码清理（10 处）
  - 类型与 TS 副作用修复（8 处）
  - CVA 空变体值清理（3 处）
- **全组件兼容性清理**：清除 12 类约 96 处兼容性包袱
- **组件深化拓展**：8 批全量改动
  - 无障碍合规与动效降级
  - 变体实现与 API 一致性
  - 组件功能增强
  - 程序化控制暴露
  - Composable 抽取

#### 📝 文档

- 更新全组件文档，补充完整 props、事件、插槽说明

#### 🐛 Bug 修复

- 修复 5 个组件的 CI 测试失败问题
- 修复多个组件 demo 溢出及容器比例问题
- 修复 Slider、KanbanBoard、ChatBubble 等组件具体问题

---

## 历史版本摘要

| 版本 | 日期 | 主要变更 |
| --- | --- | --- |
| 0.8.0 | 2026-06-29 | 图标尺寸系统、多组件增强、CLI 安全加固 |
| 0.7.8 | 2026-06-28 | DataTable 组合式函数、GlitchButton/GlitchText 方向控制 |
| 0.7.5 | 2026-06-27 | GlitchButton、VirtualScroll 组件 |
| 0.7.4 | 2026-06-27 | TreeSelect、TypewriterText、NoiseBackground 组件 |
| 0.7.2 | 2026-06-26 | ColorPicker、DatePicker 组件 |
| 0.7.0 | 2026-06-26 | Warm 主题、DataTable、主题实验室、CLI 增强 |

---

::: tip
完整变更日志请查看 [CHANGELOG.md](https://github.com/lidaixingchen/brutxui-vue3/blob/main/CHANGELOG.md)
:::
