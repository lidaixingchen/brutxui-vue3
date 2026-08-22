---
title: 粗野主义图表设计范式
description: Neobrutalism Chart 数据可视化的色彩映射、视觉法则与 ECharts 主题接入
---

# 粗野主义图表设计范式

BrutxUI 的图表能力采用「**令牌映射 + 文档范式**」交付：库内不引入 echarts 依赖、不封装图表组件，而是提供与设计令牌单一信源一致的 **ECharts 主题 JSON** 与本页视觉法则。消费方自行安装 echarts 后注册主题即可获得粗野主义观感。

## 色彩映射（零新增令牌）

图表序列直接复用现有语义色五族，主题预设与暗色切换自动生效：

| 序列 | 语义令牌 | 默认预设值 |
| :--- | :--- | :--- |
| Series 1 | `--brutal-primary` | `#FF6B6B` |
| Series 2 | `--brutal-secondary` | `#4ECDC4` |
| Series 3 | `--brutal-accent` | `#FFE66D` |
| Series 4 | `--brutal-status-success` | `#22c55e` |
| Series 5 | `--brutal-info` | `#4A90D9` |

## 视觉三法则

### 法则一：网格背景

网格线为纯黑粗实线或高对比点阵，禁止柔和灰网格。坐标轴线宽 `3px`。

### 法则二：Tooltip 实体卡片

悬浮卡片必须是不透明底 + `3px` 硬边框 + 硬投影（`box-shadow: 4px 4px 0 0 var(--brutal-border-color)`），禁止模糊阴影与圆角。

### 法则三：柱体强边框与同心圆数据点

柱体带 `2px` 黑边框、零圆角；折线数据关键点使用黑白实心同心圆（外黑内彩），取消柔和渐变与模糊。

## 反模式

| ❌ 禁止 | 原因 |
| :--- | :--- |
| 渐变填充柱体 / 面积图柔和透明渐变 | 违背硬朗实体语言 |
| 模糊投影（`shadowBlur`） | 破坏硬阴影体系 |
| 圆角柱体（`borderRadius > 0`） | 粗野主义几何为零圆角 |
| 引入语义色之外的随机配色 | 破坏 R6 单一信源 |

## ECharts 主题接入

主题 JSON 由构建期脚本从 `design-tokens.ts` 派生生成（单一信源校验通过），下载后一行注册：

```ts
import * as echarts from 'echarts'
// 从 https://<docs-domain>/echarts/brutxui-theme.json 获取主题文件
import brutxuiTheme from './brutxui-theme.json'

echarts.registerTheme('brutxui', brutxuiTheme)
const chart = echarts.init(el, 'brutxui')
```

## 主题 JSON 再生成

调整语义色后重新生成主题 JSON 并保持单一信源一致：

```bash
pnpm --filter brutx-ui-vue generate:echarts-theme
# 校验磁盘产物与 design-tokens 派生结果一致：
pnpm --filter brutx-ui-vue exec tsx scripts/generate-echarts-theme.ts --check
```
