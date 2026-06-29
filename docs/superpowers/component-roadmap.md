# 组件扩展路线图

本文档详细规划了 BrutxUI 组件库的扩展方向，基于现有组件基础、技术可行性和社区需求进行分析。

## 📊 现状概览

截至 v0.7.3 版本，BrutxUI 已实现 **94** 个组件目录（含页面模板和辅助组件），覆盖以下类别：

| 类别 | 组件数量 | 代表组件 |
| --- | --- | --- |
| 基础交互 | 25+ | Button, Input, Select, Checkbox |
| 数据展示 | 15+ | Table, Card, Timeline, Badge |
| 反馈提示 | 10+ | Toast, Dialog, Alert, Progress |
| 导航布局 | 10+ | Tabs, Breadcrumb, Pagination |
| 表单控件 | 15+ | DatePicker, ColorPicker, Slider |
| 页面模板 | 10+ | Dashboard, Auth, Settings |
| 特色组件 | 10+ | GlitchText, Card3D, ScratchCard |

---

## 🎯 扩展方向分析

### 第一优先级：高价值低成本组件

这些组件与 BrutxUI 定位高度契合，且可复用现有基础，开发成本低。

#### 1. TreeSelect 树形选择器

**可行性**：✅ 高 | **工作量**：1-2 天 | **需求度**：高

**现状基础**：
- 已有 `TreeView` 组件，支持完整的树形结构渲染
- 已有 `Combobox` 组件，基于 reka-ui `Popover` + `Command` 实现搜索选择
- 已有 `ComboboxMulti` 组件，支持多选模式

**目标功能**：
```typescript
interface TreeSelectProps {
  /** 树形数据 */
  nodes: TreeNode[]
  /** 选中值（单选为 string，多选为 string[]） */
  modelValue?: string | string[]
  /** 是否支持多选 */
  multiple?: boolean
  /** 是否可搜索 */
  searchable?: boolean
  /** 占位文本 */
  placeholder?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义节点渲染 */
  renderNode?: (node: TreeNode) => VNode
}
```

**实现方案**：
1. 参考 `Combobox` 的 reka-ui `Popover` + `Command` 架构（而非直接组合 TreeView）
2. 实现递归搜索过滤逻辑：深度优先遍历节点树，匹配时保留祖先路径
3. 支持单选/多选模式，多选时展示 Tag 列表
4. 复用 `TreeView` 的展开/折叠逻辑和键盘导航
5. 复用现有样式变体系统

**技术要点**：
- 扩展 `TreeNode` 接口：需新增 `disabled?: boolean` 字段（当前 TreeView 的 TreeNode 无此字段，修改时需向后兼容）
- 使用 `useLocale` 支持国际化
- 遵循无障碍最佳实践（ARIA `tree`/`treeitem` 角色、`aria-expanded`、`aria-selected`）
- 搜索过滤算法示例：

```typescript
function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const result: TreeNode[] = []
  for (const node of nodes) {
    const filteredChildren = node.children ? filterTree(node.children, query) : []
    const selfMatches = node.label.toLowerCase().includes(query.toLowerCase())
    if (selfMatches || filteredChildren.length > 0) {
      result.push({ ...node, children: filteredChildren.length > 0 ? filteredChildren : node.children })
    }
  }
  return result
}
```

---

#### 2. TypewriterText 打字机效果文本

**可行性**：✅ 高 | **工作量**：1 天 | **需求度**：中

**目标功能**：
```typescript
interface TypewriterTextProps {
  /** 要显示的文本 */
  text: string
  /** 打字速度（毫秒/字符） */
  speed?: number
  /** 开始延迟（毫秒） */
  delay?: number
  /** 是否循环播放 */
  loop?: boolean
  /** 是否显示光标 */
  cursor?: boolean
  /** 打字完成回调 */
  onComplete?: () => void
}
```

**实现方案**：
```typescript
// 核心逻辑
const displayedText = ref('')
const currentIndex = ref(0)

function typeNextChar() {
  if (currentIndex.value < props.text.length) {
    displayedText.value += props.text[currentIndex.value]
    currentIndex.value++
    typeTimer = setTimeout(typeNextChar, props.speed)
  } else {
    emit('complete')
    if (props.loop) {
      typeTimer = setTimeout(resetAndType, props.delay)
    }
  }
}
```

**技术要点**：
- 使用 `setTimeout` 逐字符打印（人眼对打字节奏的感知不需要 60fps 精度，`setTimeout` 已足够）
- 组件卸载时需清除定时器（`onUnmounted` 中调用 `clearTimeout`）
- 光标闪烁动画使用 CSS `@keyframes blink`
- 支持 `prefers-reduced-motion` 无障碍：检测到时直接显示完整文本，跳过动画

---

#### 3. NoiseBackground 噪点纹理背景

**可行性**：✅ 高 | **工作量**：1 天 | **需求度**：中

**目标功能**：
```typescript
interface NoiseBackgroundProps {
  /** 噪点类型 */
  type?: 'fractal' | 'turbulence'
  /** 噪点频率 */
  frequency?: number
  /** 噪点层数 */
  octaves?: number
  /** 不透明度 */
  opacity?: number
  /** 是否启用动画 */
  animated?: boolean
}
```

**实现方案**：
```vue
<template>
  <div class="relative">
    <svg class="absolute inset-0 w-full h-full" aria-hidden="true">
      <filter :id="filterId">
        <feTurbulence
          :type="type"
          :baseFrequency="frequency"
          :numOctaves="octaves"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" :filter="`url(#${filterId})`" :opacity="opacity" />
    </svg>
    <slot />
  </div>
</template>
```

**技术要点**：

- 使用 SVG `<feTurbulence>` 滤镜（性能最佳）
- 动画效果需通过 JavaScript 定时修改 `baseFrequency` 属性（`feTurbulence` 是 SVG 滤镜属性，不支持 CSS 动画），或使用 SVG `<animate>` 元素
- 可作为背景叠加层使用（`position: absolute` + `pointer-events: none`）
- 注意：SVG 滤镜在部分低端设备上可能有性能问题，需提供降级方案（纯色背景）

---

### 第二优先级：实用组件

这些组件实用性高，但需要更多开发工作。

#### 4. GlitchButton 故障效果按钮

**可行性**：✅ 高 | **工作量**：0.5-1 天 | **需求度**：中

**现状基础**：

- 已有 `GlitchText` 组件，包含完整的故障动画系统
- 已有 `Button` 组件，支持多种变体

**目标功能**：
```typescript
interface GlitchButtonProps extends ButtonProps {
  /** 故障触发方式 */
  trigger?: 'hover' | 'click' | 'autoplay' | 'none'
  /** 动画速度 */
  speed?: 'slow' | 'medium' | 'fast'
  /** 自动播放间隔（毫秒） */
  interval?: number
}
```

**实现方案**：

1. 将 GlitchText 的 CSS 动画应用到 Button
2. 保持 Button 的所有变体和尺寸
3. 复用 `useReducedMotion` 无障碍支持

**样式示例**：
```css
.glitch-button.is-glitching {
  animation: glitch-skew 0.5s infinite linear alternate-reverse;
}

.glitch-button.is-glitching::before {
  content: attr(data-text);
  position: absolute;
  left: 2px;
  text-shadow: -2px 0 var(--brutal-destructive);
  animation: glitch-anim-1 0.3s infinite linear alternate-reverse;
}
```

> 优先级说明：降至此优先级是因为属于装饰性组件，实际项目使用频率较低，且用户可通过组合 `GlitchText` + `Button` 自行实现。

---

#### 5. Masonry 瀑布流布局

**可行性**：✅ 高 | **工作量**：1-2 天 | **需求度**：中

**目标功能**：
```typescript
interface MasonryProps {
  /** 列数（数字或 'auto' 自动计算） */
  columns?: number | 'auto'
  /** 列间距 */
  gap?: number
  /** 数据项 */
  items: unknown[]
  /** 最小列宽（auto 模式使用） */
  columnWidth?: number
}
```

**实现方案**：
- 使用 CSS `columns` 属性实现基础布局（纵向排列：先填满第一列再第二列）
- 响应式断点支持（`auto` 模式通过 `ResizeObserver` 监测容器宽度）
- 动态插入动画（使用 `TransitionGroup`）

**CSS 方案**：
```css
.masonry {
  columns: var(--masonry-columns, 3);
  column-gap: var(--masonry-gap, 1rem);
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: var(--masonry-gap, 1rem);
}
```

**局限性说明**：

- CSS `columns` 的排序是纵向的（先填满第一列），如需横向交错排列（Pinterest 风格），需改用 JavaScript 计算每列高度并绝对定位，或使用 CSS Grid + `grid-row: span N`
- 对于大多数 BrutxUI 使用场景（展示卡片、图片），纵向排列已足够

---

#### 6. FileUpload 文件上传

**可行性**：✅ 高 | **工作量**：2-3 天 | **需求度**：高

**现状基础**：

- 已有 `UploadCard` 组件，已具备：拖拽上传、文件选择、上传进度显示、国际化支持

**在 UploadCard 基础上扩展的功能**：

```typescript
interface FileUploadProps extends UploadCardProps {
  /** 是否支持多文件 */
  multiple?: boolean
  /** 最大文件大小（字节） */
  maxSize?: number
  /** 最大文件数量 */
  maxCount?: number
  /** 自定义上传处理函数 */
  onUpload?: (file: File) => Promise<UploadResult>
  /** 文件列表（受控模式） */
  fileList?: FileItem[]
  /** 是否显示文件列表 */
  showFileList?: boolean
}
```

**技术要点**：

- 文件验证（类型、大小、数量）——UploadCard 当前缺少此功能
- 文件列表管理（上传中/成功/失败状态）
- 预览功能（图片缩略图、PDF 图标）
- 上传进度使用 `XMLHttpRequest` 或 `fetch` + `ReadableStream`

---

#### 8. VirtualScroll 虚拟滚动

**可行性**：⚠️ 中 | **工作量**：3-4 天 | **需求度**：中

**建议方案**：

- 封装 `@tanstack/vue-virtual` 为 BrutxUI 风格组件
- 或在文档中提供集成示例

> 优先级说明：提升至此是因为大数据列表是常见需求，且现有 `Table` 组件需要虚拟滚动支持长列表。

---

### 第三优先级：不推荐组件

这些组件因复杂度或定位不符，不建议纳入组件库。

#### 9. RichTextEditor 富文本编辑器

**可行性**：❌ 低 | **工作量**：高 | **需求度**：中

**不推荐原因**：
- 体积庞大（> 100KB）
- 与轻量级定位不符
- 维护成本高

**替代方案**：推荐使用 Tiptap、Quill 等成熟方案

---

#### 10. GanttChart 甘特图

**可行性**：❌ 低 | **工作量**：高 | **需求度**：低

**不推荐原因**：
- 复杂度极高
- 与定位不符（偏向项目管理工具）
- 现有方案（dhtmlx-gantt、frappe-gantt）已成熟

---

## 📅 开发计划

### Phase 1：核心扩展（2 周）

| 组件 | 预计工时 | 负责人 | 状态 |
| --- | --- | --- | --- |
| TreeSelect | 2 天 | - | ✅ 已完成 |
| TypewriterText | 1 天 | - | ✅ 已完成 |
| NoiseBackground | 1 天 | - | ✅ 已完成 |
| Masonry | 2 天 | - | 待开发 |
| FileUpload | 3 天 | - | 待开发 |

**里程碑**：完成 5 个新组件，提升组件库覆盖度

### Phase 2：功能增强（2 周）

| 任务 | 预计工时 | 说明 | 状态 |
| --- | --- | --- | --- |
| GlitchButton | 1 天 | 装饰性组件，优先级较低 | ✅ 已完成 |
| VirtualScroll | 4 天 | 封装 `@tanstack/vue-virtual`，支持 Table 长列表 | ✅ 已完成 |
| 现有组件无障碍审计 | 3 天 | 检查 ARIA 属性、键盘导航 | ✅ 已完成 |
| 国际化完善 | 2 天 | 补充缺失的翻译键 | ✅ 已完成 |
| 文档示例增强 | 3 天 | 为每个组件添加更多示例 | ✅ 已完成 |
| 性能优化 | 2 天 | Tree shaking、懒加载 | ✅ 已完成 |

### Phase 3：生态建设（持续）

| 任务 | 说明 |
| --- | --- |
| Nuxt 模块 | 提供 Nuxt 3 集成模块 |
| VSCode 插件 | 组件片段、自动补全 |
| Figma 资源 | 设计师资源库 |
| 主题编辑器 | 可视化主题定制工具 |

---

## 🛠️ 开发规范

### 组件结构

```
component-name/
├── index.ts                 # 导出入口
├── ComponentName.vue        # 主组件
├── component-name-variants.ts  # CVA 变体
├── types.ts                 # TypeScript 类型定义
└── component-name.test.ts   # 单元测试
```

### 命名规范

- **组件文件**：PascalCase（如 `TreeSelect.vue`）
- **目录名**：kebab-case（如 `tree-select/`）
- **变体文件**：kebab-case + `-variants`（如 `tree-select-variants.ts`）
- **测试文件**：kebab-case + `.test.ts`

### 必需功能

每个新组件必须包含：

1. **TypeScript 严格类型** - 所有 props 和 emits 必须有明确类型
2. **国际化支持** - 使用 `useLocale` composable
3. **无障碍支持** - 正确的 ARIA 属性、键盘导航
4. **单元测试** - 覆盖核心功能
5. **文档示例** - 至少 3 个使用示例
6. **变体系统** - 使用 CVA 定义样式变体

### 代码示例

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { treeSelectVariants } from './tree-select-variants'
import { type TreeSelectProps, type TreeSelectEmits } from './types'

type TreeSelectVariantProps = VariantProps<typeof treeSelectVariants>

interface Props extends TreeSelectProps {
  size?: NonNullable<TreeSelectVariantProps['size']>
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  searchable: false,
  clearable: false,
  disabled: false,
  size: 'default',
})

const emit = defineEmits<TreeSelectEmits>()

const { t } = useLocale()

const classes = computed(() =>
  cn(treeSelectVariants({ size: props.size }), props.class)
)
</script>

<template>
  <div :class="classes" role="combobox" :aria-expanded="isOpen">
    <!-- 组件内容 -->
  </div>
</template>
```

---

## 📦 依赖分析

新组件开发前需评估是否引入新依赖，以下为各组件的依赖评估：

| 组件 | 新增依赖 | 说明 |
| --- | --- | --- |
| TreeSelect | 无 | 复用现有 reka-ui `Popover` + `Command` 架构 |
| TypewriterText | 无 | 纯 Vue 实现 |
| NoiseBackground | 无 | 原生 SVG `<feTurbulence>` |
| GlitchButton | 无 | 复用 GlitchText 的 CSS 动画 |
| Masonry | 无 | CSS `columns` + `ResizeObserver` |
| FileUpload | 无 | 原生 `File API` + `Drag and Drop API` |
| VirtualScroll | `@tanstack/vue-virtual` | 需新增依赖，约 5KB gzipped |

**破坏性变更评估**：

- TreeSelect 需扩展 `TreeNode` 接口（新增 `disabled` 字段），需确保向后兼容（字段为可选）
- 新组件均采用独立目录，不影响现有组件的 tree-shaking

---

## 📚 相关资源

- 贡献指南：参见项目 README
- 设计规范：参见 `packages/ui/src/styles/`
- GitHub Issues：https://github.com/lidaixingchen/brutxui-vue3/issues

---

## 📝 更新日志

| 日期 | 版本 | 说明 |
| --- | --- | --- |
| 2026-06-27 | v1.3 | 完成 Phase 2：GlitchButton、VirtualScroll、无障碍审计、国际化完善、性能优化 |
| 2026-06-27 | v1.2 | 完成 Phase 1 三个组件（TreeSelect/TypewriterText/NoiseBackground），通过 OCR 代码审查并修复全部问题 |
| 2026-06-27 | v1.1 | 修正技术方案（NoiseBackground/TypewriterText），调整优先级，补充依赖分析，移除 ParallaxSection |
| 2026-06-27 | v1.0 | 初始版本，规划 10 个组件扩展方向 |
