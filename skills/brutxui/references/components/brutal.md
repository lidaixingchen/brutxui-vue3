# 新粗野主义特色组件

## ColorModeSwitcher

颜色模式切换组件，支持三种显示模式。

```vue
<ColorModeSwitcher />
<ColorModeSwitcher display="button" />
<ColorModeSwitcher display="select" />
<ColorModeSwitcher :show-system="false" />
```

### ColorModeSwitcher Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `display` | `'icon' \| 'button' \| 'select'` | `'icon'` | 显示模式 |
| `showSystem` | `boolean` | `true` | 是否显示 "system" 选项 |
| `class` | `string` | — | 自定义样式类 |

## Card3D

3D 悬浮卡片，鼠标移动时产生 3D 倾斜效果。

```vue
<Card3D :max-rotation="15" :perspective="1000" :scale="1.02" variant="primary" clickable>
  <div class="p-6">3D 悬浮效果</div>
</Card3D>
```

### Card3D Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxRotation` | `number` | `15` | 最大偏转角度（度） |
| `perspective` | `number` | `1000` | 3D 透视深度 (px) |
| `scale` | `number` | `1.02` | Hover 时的缩放比例 |
| `shadowOffset` | `number` | `10` | 阴影最大物理位移像素量 |
| `shadow` | `'default' \| 'lg' \| 'xl'` | `'default'` | 阴影大小变体 |
| `variant` | `'default' \| 'primary' \| 'accent' \| 'muted'` | `'default'` | 卡片背景色变体 |
| `disabled` | `boolean` | `false` | 禁用 3D 效果 |
| `clickable` | `boolean` | `false` | 是否启用点击 |
| `class` | `string` | — | 自定义样式类 |

### Card3D 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `click` | `MouseEvent` | 仅当 `clickable` 为 `true` 且 `disabled` 为 `false` 时触发 |

## GlitchText

故障风格文字，支持横向/纵向/双向撕裂。

```vue
<GlitchText text="GLITCH" trigger="hover" speed="medium" direction="horizontal" />
```

### GlitchText Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | `string` | `''` | 要显示的文本内容 |
| `trigger` | `'hover' \| 'click' \| 'autoplay' \| 'none'` | `'hover'` | 动画触发时机 |
| `interval` | `number` | `3000` | 自动播放时的周期时间 (ms) |
| `speed` | `'slow' \| 'medium' \| 'fast'` | `'medium'` | 撕裂抖动的频率和速度 |
| `direction` | `'horizontal' \| 'vertical' \| 'both'` | `'horizontal'` | 撕裂方向 |
| `class` | `string` | — | 自定义样式类 |

### GlitchText 暴露的 API

| 方法 | 说明 |
|------|------|
| `play()` | 开始故障动画 |
| `stop()` | 停止故障动画 |

> **动效降级**：自动尊重 `prefers-reduced-motion` 系统设置，当用户偏好减少动画时禁用所有故障效果。

## TypewriterText

打字机效果文本，逐字符显示。

```vue
<TypewriterText
  text="欢迎使用 BrutxUI！"
  :speed="80"
  cursor
  loop
/>
```

### TypewriterText Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | `string` | —（必填） | 要显示的文本 |
| `speed` | `number` | `50` | 打字速度（毫秒/字符） |
| `delay` | `number` | `0` | 开始延迟（毫秒），循环模式下也用作重启间隔 |
| `loop` | `boolean` | `false` | 是否循环播放 |
| `cursor` | `boolean` | `true` | 是否显示光标 |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 文本尺寸 |
| `weight` | `'normal' \| 'medium' \| 'bold' \| 'black'` | `'normal'` | 文本粗细 |
| `class` | `string` | — | 自定义样式类 |

### TypewriterText 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `start` | — | 打字开始时触发 |
| `complete` | — | 打字完成时触发 |

> **动效降级**：自动尊重 `prefers-reduced-motion` 系统设置，当用户偏好减少动画时直接显示完整文本。

## NoiseBackground

噪点纹理背景，基于 SVG feTurbulence 滤镜。

```vue
<NoiseBackground :opacity="0.3" animated>
  <div class="p-8">带噪点背景的内容</div>
</NoiseBackground>
```

### NoiseBackground Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'fractalNoise' \| 'turbulence'` | `'fractalNoise'` | 噪点类型 |
| `frequency` | `number` | `0.65` | 噪点频率（0-1） |
| `octaves` | `number` | `3` | 噪点层数 |
| `opacity` | `number` | `0.5` | 噪点不透明度（0-1） |
| `animated` | `boolean` | `false` | 是否启用动画效果 |
| `animationDuration` | `number` | `8` | 动画周期（秒） |
| `animationRange` | `number` | `0.1` | 动画频率变化范围 |
| `rounded` | `'none' \| 'default' \| 'lg' \| 'full'` | `'none'` | 圆角变体 |
| `class` | `string` | — | 自定义样式类 |

## ScratchCard

刮刮卡，Canvas 覆盖层擦除。

```vue
<ScratchCard :percentage="50" :brush-radius="20" :fade-duration="300">
  <div>恭喜中奖！</div>
</ScratchCard>
```

### ScratchCard Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `percentage` | `number` | `50` | 自动刮除全部的面积百分比阈值 (0-100) |
| `brushRadius` | `number` | `20` | 刮除画笔擦头半径 (px) |
| `overlayColor` | `string` | — | 覆盖层底色，不设则默认双色条纹 |
| `fadeDuration` | `number` | `300` | 达到阈值后 Canvas 淡出动画时长 (ms) |
| `class` | `string` | — | 自定义样式类 |

### ScratchCard 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `progress` | `number` | 刮除进度改变回调（已节流） |
| `completed` | — | 刮开完成触发 |

### ScratchCard 暴露的 API

| 方法/属性 | 类型 | 说明 |
|-----------|------|------|
| `isRevealed` | `boolean` | 是否已揭开 |
| `revealAll()` | `() => void` | 立即揭开全部内容 |

## SketchyChart

手绘风格图表，支持折线图、柱状图和饼图。

```vue
<SketchyChart
  type="line"
  :data="[{ label: '1月', value: 40 }, { label: '2月', value: 60 }]"
  :sketchiness="2"
  :grid="true"
/>
```

### SketchyChart Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'line' \| 'bar' \| 'pie'` | `'line'` | 图表类型 |
| `data` | `Array<{ label: string, value: number }>` | `[]` | 图表数据源 |
| `sketchiness` | `number` | `2` | 手绘抖动幅度 (0-10) |
| `grid` | `boolean` | `true` | 是否绘制背景网格（饼图无效） |
| `width` | `number` | `600` | 图表宽度 (px) |
| `height` | `number` | `400` | 图表高度 (px) |
| `class` | `string` | — | 自定义样式类 |

## CopyToClipboard

复制到剪贴板按钮。

```vue
<CopyToClipboard text="要复制的文本" :duration="2000" variant="primary" size="lg" />
```

### CopyToClipboard Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | `string` | —（必填） | 需要拷贝到剪贴板的文本 |
| `duration` | `number` | `2000` | 复制成功反馈的保持毫秒数 |
| `variant` | `'default' \| 'primary' \| 'outline'` | `'default'` | 按钮颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 按钮尺寸 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 图标尺寸 |
| `class` | `string` | — | 自定义样式类 |

### CopyToClipboard 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ copied: boolean }` | 自定义按钮内容 |

## KanbanBoard

看板组件，基于原生 HTML5 拖拽 API，支持键盘拖拽。

```vue
<KanbanBoard
  v-model="columns"
  @card-move="(id, from, to) => console.log(id, from, to)"
  @column-move="(id, fromIdx, toIdx) => console.log(id, fromIdx, toIdx)"
  @add-card="(colId) => handleAddCard(colId)"
/>
```

### KanbanColumn 类型

```typescript
interface KanbanColumn {
  id: string
  title: string
  color?: string
  cards: KanbanCard[]
}

interface KanbanCard {
  id: string
  title: string
  description?: string
  tags?: string[]
  color?: string
}
```

### KanbanBoard Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `KanbanColumn[]` | —（必填） | 看板数据（v-model） |
| `class` | `string` | — | 自定义样式类 |

### KanbanBoard 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `KanbanColumn[]` | 列数据更新 |
| `card-move` | `(cardId: string, fromColumn: string, toColumn: string)` | 卡片跨列移动完成时触发 |
| `card-click` | `(card: KanbanCard, columnId: string)` | 点击卡片时触发 |
| `column-move` | `(columnId: string, fromIndex: number, toIndex: number)` | 拖拽列标题完成排序时触发 |
| `add-card` | `columnId: string` | 点击默认「添加卡片」按钮时触发 |

### KanbanBoard 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `add-{columnId}` | `columnId: string` | 在指定列底部自定义「添加卡片」入口 |

### 键盘拖拽

卡片支持键盘拖拽操作：
- `Space`：抓取/放下卡片
- `↑/↓`：在当前列内上下移动
- `←/→`：将卡片移动到相邻列
- `Escape`：取消抓取

抓取状态下卡片添加 `aria-grabbed="true"`，移动结果通过 `aria-live="polite"` 自动播报。

### KanbanBoard 暴露的 API

| 方法 | 参数 | 说明 |
|------|------|------|
| `moveCard` | `(cardId, columnId, direction)` | 移动卡片到相邻列 |
| `moveColumn` | `(fromId, toId)` | 交换两列位置 |
| `addCard` | `(columnId)` | 触发添加卡片事件 |
| `getColumn` | `(columnId)` | 获取指定列数据 |
| `getAllColumns` | — | 获取所有列数据（计算属性） |

### KanbanBoard 业务集成与防错示例

在业务系统中使用 `KanbanBoard` 时，通常需要与后端接口同步，为了保障拖拽的顺畅以及失败时的回滚体验，可参考以下最佳实践模板。

#### 1. 拖拽与键盘移动的业务同步及失败回滚
当用户通过鼠标拖拽或键盘（`Space` + 方向键）移动卡片或列时，组件会触发 `v-model` 的更新并抛出事件。为了防止网络延迟导致页面卡顿，推荐使用**乐观更新（Optimistic Update）**：先应用本地数据，失败时再回滚。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { KanbanBoard, type KanbanColumn } from 'brutx-ui-vue'

// 本地状态
const columns = ref<KanbanColumn[]>([
  {
    id: 'todo',
    title: '待办',
    cards: [{ id: 'card-1', title: '完成项目初始化' }]
  },
  {
    id: 'doing',
    title: '进行中',
    cards: []
  }
])

// 备份状态，用于失败回滚
let backupColumns: KanbanColumn[] = []

function saveBackup() {
  backupColumns = JSON.parse(JSON.stringify(columns.value))
}

// 卡片跨列移动事件
async function handleCardMove(cardId: string, fromColumnId: string, toColumnId: string) {
  saveBackup()
  console.log(`卡片 ${cardId} 从 ${fromColumnId} 移动到 ${toColumnId}`)
  
  try {
    const response = await fetch('/api/kanban/card-move', {
      method: 'POST',
      body: JSON.stringify({ cardId, fromColumnId, toColumnId })
    })
    
    if (!response.ok) throw new Error('同步失败')
  } catch (error) {
    // 乐观更新失败，回滚到移动前的状态
    alert('移动同步失败，已回滚')
    columns.value = backupColumns
  }
}

// 列位置排序变化事件
async function handleColumnMove(columnId: string, fromIndex: number, toIndex: number) {
  saveBackup()
  
  try {
    const response = await fetch('/api/kanban/column-move', {
      method: 'POST',
      body: JSON.stringify({ columnId, fromIndex, toIndex })
    })
    
    if (!response.ok) throw new Error('同步失败')
  } catch (error) {
    alert('排序同步失败，已回滚')
    columns.value = backupColumns
  }
}
</script>

<template>
  <KanbanBoard
    v-model="columns"
    @card-move="handleCardMove"
    @column-move="handleColumnMove"
  />
</template>
```

