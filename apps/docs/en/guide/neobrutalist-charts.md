---
title: Neobrutalist Chart Design Paradigm
description: Color mapping, visual laws and ECharts theme integration for Neobrutalist data visualization
---

# Neobrutalist Chart Design Paradigm

BrutxUI delivers chart capability through a "token mapping + documentation paradigm" approach: the library introduces no echarts dependency and wraps no chart components. Instead, it ships an **ECharts theme JSON** derived from the single source of design tokens, plus the visual laws on this page. Consumers install echarts themselves and register the theme to get the neobrutalist look.

## Color Mapping (Zero New Tokens)

Chart series reuse the existing five semantic color families directly; theme presets and dark mode switching apply automatically:

| Series | Semantic Token | Default Preset |
| :--- | :--- | :--- |
| Series 1 | `--brutal-primary` | `#FF6B6B` |
| Series 2 | `--brutal-secondary` | `#4ECDC4` |
| Series 3 | `--brutal-accent` | `#FFE66D` |
| Series 4 | `--brutal-status-success` | `#22c55e` |
| Series 5 | `--brutal-info` | `#4A90D9` |

## Three Visual Laws

### Law 1: Grid Background

Grid lines are pure black solid strokes or high-contrast dot matrices; soft gray grids are forbidden. Axis line width is `3px`.

### Law 2: Tooltip as Solid Card

Hover cards must have an opaque background + `3px` hard border + hard shadow (`box-shadow: 4px 4px 0 0 var(--brutal-border-color)`); blurred shadows and rounded corners are forbidden.

### Law 3: Strong Bar Borders & Concentric Data Points

Bars carry a `2px` black border with zero radius; line chart key points use black-and-white solid concentric circles (black outer, colored inner), eliminating soft gradients and blur.

## Anti-Patterns

| ❌ Forbidden | Reason |
| :--- | :--- |
| Gradient-filled bars / soft transparent area gradients | Violates the hard, solid visual language |
| Blurred shadows (`shadowBlur`) | Breaks the hard shadow system |
| Rounded bars (`borderRadius > 0`) | Neo-brutalist geometry has zero radius |
| Random colors beyond semantic families | Breaks the R6 single-source rule |

## ECharts Theme Integration

The theme JSON is generated at build time from `design-tokens.ts` (single-source verified). Register it with one line after downloading:

```ts
import * as echarts from 'echarts'
// Get the theme file from https://<docs-domain>/echarts/brutxui-theme.json
import brutxuiTheme from './brutxui-theme.json'

echarts.registerTheme('brutxui', brutxuiTheme)
const chart = echarts.init(el, 'brutxui')
```

## Regenerating the Theme JSON

After adjusting semantic colors, regenerate the theme JSON to keep it consistent with the single source:

```bash
pnpm --filter brutx-ui-vue generate:echarts-theme
# Verify the on-disk output matches the design-tokens derivation:
pnpm --filter brutx-ui-vue exec tsx scripts/generate-echarts-theme.ts --check
```
