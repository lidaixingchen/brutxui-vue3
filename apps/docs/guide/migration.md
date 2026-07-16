# 迁移指南

本页记录 BrutxUI Vue 3 的 BREAKING 变更与迁移方法。

## reka-ui 原语不再从 brutx-ui-vue 导出

### 影响版本

`brutx-ui-vue` 0.10.0（架构优化方案 v2 §2.2）

### 变更内容

`brutx-ui-vue` 主入口 `src/index.ts` 不再 re-export `reka-ui` 的原语组件与类型。此前的 `export { DialogRoot as Dialog, DialogTrigger, DialogPortal, DialogClose } from 'reka-ui'` 等行已全部移除。

**原因**：组件库的职责是提供自己的组件实现，不应充当第三方原语的代理入口。re-export 会增加维护成本与 tree-shaking 风险。

### 迁移步骤

#### 1. 安装 reka-ui（若尚未安装）

```bash
pnpm add reka-ui
```

#### 2. 替换从 brutx-ui-vue 导入 reka-ui 原语的代码

```typescript
// ❌ 迁移前：从 brutx-ui-vue 导入 reka-ui 原语
import { DialogRoot, DialogTrigger } from 'brutx-ui-vue'

// ✅ 迁移后：直接从 reka-ui 导入
import { DialogRoot, DialogTrigger } from 'reka-ui'
```

#### 3. 替换 reka-ui 类型导入

```typescript
// ❌ 迁移前
import type { DialogRootProps } from 'brutx-ui-vue'

// ✅ 迁移后
import type { DialogRootProps } from 'reka-ui'
```

### 不受影响的场景

- 从 `brutx-ui-vue` 导入 BrutxUI 自有组件（如 `Button`、`DialogContent`、`SelectTrigger`）不受影响
- BrutxUI 组件内部已直接 `import from 'reka-ui'`，内部导入不受影响
- 仅移除「对外 re-export」，不影响组件功能

### 常见 reka-ui 原语清单

以下原语需直接从 `reka-ui` 导入：

| 原语 | 用途 |
| --- | --- |
| `DialogRoot` / `DialogTrigger` / `DialogPortal` / `DialogClose` | Dialog 容器 |
| `AlertDialogRoot` / `AlertDialogTrigger` | AlertDialog 容器 |
| `PopoverRoot` / `PopoverTrigger` / `PopoverAnchor` | Popover 容器 |
| `TooltipRoot` / `TooltipTrigger` | Tooltip 容器 |
| `SelectRoot` | Select 容器 |
| `DropdownMenuRoot` / `DropdownMenuTrigger` | DropdownMenu 容器 |
| `TabsRoot` | Tabs 容器 |
| `AccordionRoot` | Accordion 容器 |
| `AvatarRoot` | Avatar 容器 |
| `RadioGroupRoot` | RadioGroup 容器 |
| `ToastProvider` | Toast Provider |

### 子路径导入

`brutx-ui-vue` 的 `exports` 字段为每个组件目录自动生成子路径（如 `brutx-ui-vue/button`、`brutx-ui-vue/dialog`），但这些子路径仅导出 BrutxUI 自有组件，不包含 reka-ui 原语。
