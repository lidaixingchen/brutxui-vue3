# 组件分类方案

## 背景与目标

当前项目存在两套并行的组件分类体系：

- **`shared` 的 `category` 字段**：12 个语义值（`action / form / data-display / navigation / feedback / overlay / layout / media / visual-effect / utility / marketing / page`），服务于 CLI、registry、依赖分析等程序化消费场景。
- **docs sidebar 的手工分组**：8 个组（`Basic / Layout / Form / Data Display / Navigation / Feedback / Date & Time / Other`），服务于人类导航发现。

两者服务对象不同、分类哲学不同、且存在语义分歧。强行统一会牺牲一方。本方案采用「双字段分离」策略——`category` 保留为机器可消费的语义真相，新增 `sidebarGroup` 作为 docs 展示分组，并修掉 sidebar 现有的两个语义硬伤。

## 现状分歧

| Sidebar 分组 | 混入的 shared category | 问题 |
| --- | --- | --- |
| **Basic** | action + feedback + form + layout + media + utility | shared 无对应；是把高频原语从各自语义类中抽出 |
| **Layout** | layout + navigation + media | accordion/breadcrumb/menu 在 shared 是 navigation，sidebar 当 layout |
| **Feedback** | overlay + feedback | **语义错误**：Dialog/Popover/Tooltip 是 overlay（层叠），不是 feedback（状态沟通） |
| **Date & Time** | data-display + form | 跨语义领域分组；shared 按「做什么」拆开，sidebar 按「用户找什么」聚合 |
| **Other** | visual-effect + utility + navigation + media + data-display | **垃圾桶**：掩盖了 shared 已有的 `visual-effect`/`utility` 精确分类 |

## 决策：双字段分离（路线 3）

### 设计原则

1. **`category` 是语义真相**——给 CLI/registry/依赖分析用，保留现有 12 值不变。
2. **`sidebarGroup` 是展示分组**——给 docs sidebar 用，允许与 `category` 分歧，但分歧必须显式声明、可审计。
3. **默认派生 + 显式覆盖**——大多数组件的 `sidebarGroup` 从 `category` 默认派生；少数需要不同归类的组件显式设置 `sidebarGroup` 覆盖默认。
4. **修掉两个语义硬伤**——无论是否自动化 sidebar，都必须拆「Other」、拆「Feedback/Overlay」。

## 字段设计

### `category`（拆分 `media`，破坏性变更）

位于 [packages/shared/src/types.ts](../packages/shared/src/types.ts)。**移除 `media` 值**，原 media 类组件重新分配 category：

```typescript
export type ComponentCategory =
    | 'action' | 'data-display' | 'feedback' | 'form' | 'layout'
    | 'navigation' | 'overlay' | 'page' | 'utility' | 'visual-effect' | 'marketing';
```

**`media` 拆分映射**：

| 组件 | 原 category | 新 category | 理由 |
| --- | --- | --- | --- |
| `avatar` | `media` | `data-display` | 用户头像是只读展示 |
| `carousel` | `media` | `data-display` | 轮播是内容展示容器 |
| `image` | `media` | `data-display` | 图片是只读展示 |
| `before-after` | `media` | `visual-effect` | 可拖拽对比是交互式视觉演示 |

归属规则随之更新：`CATEGORY_OVERRIDES` 移除上述 4 项的 `media` 映射（改为新 category）；`inferCategory` 无需改动（原本不产出 `media`）。此为破坏性变更——registry JSON 的 `category` 字段值会变化，需在 CHANGELOG 记录。

### `sidebarGroup`（新增，docs 展示分组）

在 `RegistryComponentMeta` 增加可选字段：

```typescript
export type SidebarGroup =
    | 'action' | 'layout' | 'form' | 'data-display' | 'navigation'
    | 'feedback' | 'overlay' | 'date-time' | 'visual-effect' | 'utility'
    | 'blocks-cards' | 'blocks-sections' | 'blocks-pages';

export interface RegistryComponentMeta {
    // ... 现有字段
    sidebarGroup?: SidebarGroup;
}
```

**取值说明（components 区）**：

| 值 | 含义 | 对应 sidebar 现状 |
| --- | --- | --- |
| `action` | 触发型原语（button/toggle/toggle-group） | 由现「Basic」组拆出，action 类组件独立成组 |
| `layout` | 结构性容器 | 保留现「Layout」组 |
| `form` | 输入控件 | 保留现「Form」组 |
| `data-display` | 只读数据展示（含原 media 类：avatar/carousel/image） | 保留现「Data Display」组，吸收原 media 组件 |
| `navigation` | 上下文切换 | 保留现「Navigation」组 |
| `feedback` | 状态沟通（toast/alert/result/message/loading） | 从现「Feedback」**拆出** overlay 后剩余 |
| `overlay` | 视口层叠（dialog/sheet/popover/tooltip/popconfirm/alert-dialog） | **新组**，从现「Feedback」拆出 |
| `date-time` | 日期时间领域 | 保留现「Date & Time」组 |
| `visual-effect` | 装饰性效果（glitch/noise/scratch-card/marquee/typewriter/before-after） | **新组**，从现「Other」拆出 |
| `utility` | 工具类（kbd/copy-to-clipboard/color-mode-switcher/watermark/infinite-scroll/backtop/kanban-board） | **新组**，从现「Other」拆出 |

**取值说明（blocks 区）**：

| 值 | 含义 |
| --- | --- |
| `blocks-cards` | 卡片类区块（auth-card/testimonial-card/blog-card 等） |
| `blocks-sections` | 区段（brutalist-hero/pricing-section/header-section 等） |
| `blocks-pages` | 完整页面（settings-page/not-found-page 等） |

### `kind`（新增，component/block 路由）

替代 [component-catalog.ts](../apps/docs/.vitepress/theme/lib/component-catalog.ts) 中手工维护的 `blockEntries` Set：

```typescript
export interface RegistryComponentMeta {
    // ... 现有字段
    kind?: 'component' | 'block';  // 默认 'component'
}
```

docs 根据 `kind` 决定路由前缀（`/components/` vs `/blocks/`）。

### `docsHidden` / `docsSlug`（可选，替代 docs 本地配置）

```typescript
export interface RegistryComponentMeta {
    // ... 现有字段
    docsHidden?: boolean;  // 替代 hiddenDocsEntries Set
    docsSlug?: string;     // 替代 slugAliases（如 kanban → 'kanban-board'）
}
```

落地后，[component-catalog.ts](../apps/docs/.vitepress/theme/lib/component-catalog.ts) 的 `hiddenDocsEntries`、`slugAliases`、`blockEntries` 三个本地结构全部移除，改为从 shared 元数据派生。

## Sidebar 语义硬伤修复

无论是否落地 `sidebarGroup` 字段，以下两个修复应立即执行（纯 sidebar 配置改动，不涉及 shared）：

### 修复 1：拆「Other」→「Visual Effect」+「Utility」

**现状**「Other」混装 11 个组件：

- visual-effect 类：glitch-text、glitch-button、typewriter-text、noise-background、scratch-card
- utility 类：color-mode-switcher、infinite-scroll、watermark、backtop
- 其他：before-after（media）、kanban-board（data-display）

**修复后**：

- 「Visual Effect」：glitch-text、glitch-button、typewriter-text、noise-background、scratch-card、before-after
- 「Utility」：color-mode-switcher、infinite-scroll、watermark、backtop、kanban-board
- before-after 归 visual-effect（它是交互式视觉演示，与 scratch-card 同类）
- kanban-board 归 utility（它是工具型组件，且与 infinite-scroll 同属「交互工具」）

### 修复 2：拆「Feedback」→「Feedback」+「Overlay」

**现状**「Feedback」混装 11 个组件，其中 6 个实际是 overlay：

- overlay 类：dialog、alert-dialog、sheet、popover、popconfirm、tooltip
- feedback 类：toast、alert、loading、result、message

**修复后**：

- 「Feedback」：toast、alert、loading、result、message
- 「Overlay」：dialog、alert-dialog、sheet、popover、popconfirm、tooltip

### 修复后 sidebar 分组结构（components 区）

砍掉「Basic」组后，原 Basic 成员回归各自语义组；新增「Action」「Overlay」「Visual Effect」「Utility」四组，「Other」清零。最终 10 个 components 分组：

```
Action         ← 新组（原 Basic 的 action 类：button/toggle/toggle-group）
Layout         ← 保留（card/scroll-area/separator 等 category=layout 组件）
Form           ← 保留（category=form 组件，原 Basic 的 label 回归此组）
Data Display   ← 保留并扩充（吸收原 media 组件：avatar/carousel/image）
Navigation     ← 保留并扩充（原 Layout 的 accordion/breadcrumb/menu 回归此组）
Feedback       ← 拆出 overlay 后（toast/alert/loading/result/message + 原 Basic 的 badge/spinner/skeleton）
Overlay        ← 新组（dialog/alert-dialog/sheet/popover/popconfirm/tooltip）
Date & Time    ← 保留（calendar/date-picker，显式覆盖）
Visual Effect  ← 新组，从 Other 拆出（glitch-*/typewriter/noise/scratch-card/before-after）
Utility        ← 新组，从 Other 拆出（kbd/copy-to-clipboard/color-mode-switcher/infinite-scroll/watermark/backtop/kanban-board）
```

**关键迁移**（与 sidebar 现状的差异）：

| 组件 | sidebar 现状 | 修复后 | 原因 |
| --- | --- | --- | --- |
| Button / Toggle / Toggle Group | Basic | Action | category=action，砍 Basic 后独立成组 |
| Badge / Spinner / Skeleton | Basic | Feedback | category=feedback，回归语义组 |
| Label | Basic | Form | category=form |
| Kbd / CopyToClipboard | Basic | Utility | category=utility |
| Separator | Basic | Layout | category=layout |
| Avatar | Basic | Data Display | 拆 media 后 category=data-display |
| Accordion / Breadcrumb / Menu | Layout | Navigation | category=navigation |
| Carousel | Layout | Data Display | 拆 media 后 category=data-display |
| Toggle / Toggle Group | Form | Action | category=action（sidebar 误归 Form） |
| Dialog / Sheet / Popover / Tooltip / Popconfirm / AlertDialog | Feedback | Overlay | category=overlay，拆出 overlay 组 |
| Glitch* / Typewriter / Noise / ScratchCard / BeforeAfter | Other | Visual Effect | category=visual-effect |
| Kbd / CopyToClipboard / ColorModeSwitcher / InfiniteScroll / Watermark / Backtop / KanbanBoard | Other | Utility | category=utility |

> **实施说明**：完整逐组件分配在实施阶段通过「默认派生表 + 4 个显式覆盖」计算得出，不由方案文档手工穷举。实施时需交叉核对 [CATEGORY_OVERRIDES](../packages/shared/src/component-registry.ts) 全表，确认无遗漏。

## 默认映射与覆盖规则

### `category` → `sidebarGroup` 默认派生表

docs 侧维护此映射（不放入 shared，因这是展示决策）：

| `category` | `sidebarGroup` 默认 | 说明 |
| --- | --- | --- |
| `action` | `action` | 一致 |
| `form` | `form` | 一致 |
| `data-display` | `data-display` | 一致 |
| `navigation` | `navigation` | 一致 |
| `feedback` | `feedback` | 一致 |
| `overlay` | `overlay` | 一致 |
| `layout` | `layout` | 一致 |
| `visual-effect` | `visual-effect` | 一致 |
| `utility` | `utility` | 一致 |
| `marketing` | `blocks-sections` | kind=block 时生效 |
| `page` | `blocks-pages` | kind=block 时生效 |

`media` category 已拆分并入其他 category，故无 `media → sidebarGroup` 派生行。

### 需显式覆盖 `sidebarGroup` 的组件

砍掉「Basic」组、拆分 `media` category 后，绝大多数组件走默认派生即可。仅以下组件需要显式 `sidebarGroup` 覆盖：

| 组件 | `category` | 默认派生 | 应设 `sidebarGroup` | 理由 |
| --- | --- | --- | --- | --- |
| `calendar` | `data-display` | `data-display` | `date-time` | 领域分组 |
| `date-picker` | `form` | `form` | `date-time` | 领域分组 |
| `backtop` | `navigation` | `navigation` | `utility` | sidebar 现归 Other → 修复后归 Utility；它是工具型回到顶部按钮，非上下文切换 |
| `kanban-board` | `data-display` | `data-display` | `utility` | 工具型交互组件（与 infinite-scroll 同属交互工具） |

原「Basic」组成员的处理（无需覆盖，走默认派生）：

| 组件 | `category` | 默认 `sidebarGroup` | 落点 |
| --- | --- | --- | --- |
| `button` / `toggle` / `toggle-group` | `action` | `action` | Action 组 |
| `badge` / `spinner` / `skeleton` | `feedback` | `feedback` | Feedback 组 |
| `label` | `form` | `form` | Form 组 |
| `separator` | `layout` | `layout` | Layout 组 |
| `avatar` | `data-display`（原 media 已拆） | `data-display` | Data Display 组 |
| `kbd` / `copy-to-clipboard` | `utility` | `utility` | Utility 组 |

> **注**：Badge/Spinner/Skeleton 落入 Feedback 组（与 Toast/Alert/Result 同组）。这是它们语义上的正确归属——Badge 是状态标签、Spinner/Skeleton 是加载反馈。原 sidebar 把它们放「Basic」是发现性妥协，砍 Basic 后回归语义组。

## 迁移路径

### 阶段 1：Sidebar 语义硬伤修复 + 砍 Basic + 拆 media（手工 + shared 同步）

**范围**：同时改 sidebar 配置和 shared category（因拆 media 是破坏性变更，sidebar 与 category 需同步）。

sidebar 侧（`apps/docs/.vitepress/config.ts`，中/en 两份）：
- 砍「Basic」组，原成员回归各自语义组
- 拆「Other」→「Visual Effect」+「Utility」
- 拆「Feedback」→「Feedback」+「Overlay」
- 新增「Action」组

shared 侧：
- `packages/shared/src/types.ts` 的 `ComponentCategory` 移除 `media`
- `packages/shared/src/component-registry.ts` 的 `CATEGORY_OVERRIDES` 更新：avatar/carousel/image → `data-display`、before-after → `visual-effect`、kanban-board → `utility`

**验证**：docs dev 启动目视检查 sidebar 分组；`pnpm typecheck` 通过；`pnpm --filter brutx-shared-vue build` + `pnpm --filter brutx-registry-vue build` 通过。

### 阶段 2：shared 增加 `sidebarGroup` / `kind` / `docsHidden` / `docsSlug` 字段

**范围**：

1. `packages/shared/src/types.ts` 增加 `SidebarGroup` 类型 + 4 个可选字段。
2. `packages/shared/src/components.ts` 为需显式覆盖的组件（calendar/date-picker/backtop/kanban-board，见上表）设置 `sidebarGroup`；为 block 类设置 `kind: 'block'`；为 `input-adornment` 设置 `docsHidden: true`；为 `kanban` 设置 `docsSlug: 'kanban-board'`。
3. `packages/shared/src/component-registry.ts` 的 `ComponentRegistryEntry` 透传新字段。

**验证**：`pnpm typecheck` 通过；`pnpm --filter brutx-shared-vue build` 通过。

### 阶段 3：docs sidebar 从元数据生成

**范围**：

1. 新增 `apps/docs/.vitepress/theme/lib/sidebar-generator.ts`，从 `COMPONENT_REGISTRY` + 默认派生表生成 sidebar 结构。
2. `config.ts` 的 sidebar 改为调用生成器，保留对分组顺序、显示标签的本地化 override。
3. 移除 `component-catalog.ts` 的 `hiddenDocsEntries`/`slugAliases`/`blockEntries` 三个本地结构。

**验证**：生成的 sidebar 与阶段 1 手工版逐组件对比一致；新增组件后 sidebar 自动出现条目。

### 阶段 4：扩展 registry validate 校验 sidebar 覆盖

**范围**：扩展 `packages/registry/scripts/validate-utils.ts`，新增 `validateSidebarCoverage`：

- 每个 `kind: 'component'` 且非 `docsHidden` 的注册表条目，在 sidebar 生成结果中必有对应条目。
- sidebar 生成结果中无「孤儿」条目（映射不到注册表）。

**验证**：`pnpm --filter brutx-registry-vue validate` 通过。

## 验收标准

- [ ] sidebar 无「Basic」组、无「Other」组，无组件归入此二者。
- [ ] sidebar 「Feedback」组不含 overlay 类组件（dialog/sheet/popover/tooltip/popconfirm/alert-dialog）。
- [ ] sidebar 新增「Action」「Overlay」「Visual Effect」「Utility」四组。
- [ ] `ComponentCategory` 不含 `media`，原 media 组件（avatar/carousel/image/before-after）已重新分配。
- [ ] registry JSON 的 `category` 字段值变更已记入 CHANGELOG（破坏性变更）。
- [ ] 新增组件只需在 `components.ts` 添加元数据（含 `category` + 可选 `sidebarGroup`/`kind`），sidebar 自动出现条目。
- [ ] `validateDocsCoverage` 仍通过；新增 `validateSidebarCoverage` 通过。
- [ ] 中/en 两份 sidebar 结构一致（仅显示标签本地化）。

## 风险与取舍

- **拆 `media` 是破坏性变更**：registry JSON 的 `category` 字段值变化，任何消费 `category === 'media'` 的外部代码会断。需在 CHANGELOG 标注。项目内已确认无 CLI/registry 逻辑依赖 `media` 值（依赖分析用 `registryDependencies`，不用 `category`）。
- **砍「Basic」降低发现性**：Button 不再在「Basic」首屏出现，用户需到「Action」组找。代价是语义正确性提升、sidebar 分组与 category 一致。若用户调研反馈「高频入口」必要，可后续在 docs 顶部加「常用组件」快捷入口（非 sidebar 分组）。
- **不强行统一 sidebar 分组顺序与 category**：分组顺序由 docs 本地 override 控制（`categoryOrder` 已存在于 [component-catalog.ts](../apps/docs/.vitepress/theme/lib/component-catalog.ts)），不放入 shared。

## 已决策记录

1. **「Basic」组**：不保留。原成员回归各自语义默认组。
2. **`media` category**：拆分。avatar/carousel/image → `data-display`；before-after → `visual-effect`。
3. **`kanban-board` 归属**：归 `utility`（category 与 sidebarGroup 均为 utility）。
