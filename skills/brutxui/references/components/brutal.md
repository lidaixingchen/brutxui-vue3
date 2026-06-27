# 新粗野主义特色组件

## ColorModeSwitcher

颜色模式切换组件，支持三种显示模式。

```vue
<script setup>
import { ColorModeSwitcher } from 'brutx-ui-vue'
</script>

<template>
    <!-- 图标模式（默认） -->
    <ColorModeSwitcher />

    <!-- 按钮模式 -->
    <ColorModeSwitcher display="button" />

    <!-- 下拉选择模式 -->
    <ColorModeSwitcher display="select" />

    <!-- 不显示 system 选项 -->
    <ColorModeSwitcher :show-system="false" />
</template>
```

- `display`: `'icon' | 'button' | 'select'` — 默认 `'icon'`
- `showSystem`: `boolean` — 默认 `true`

## CSS 动画预设

13 个粗野主义风格动画工具类：

| 类名 | 效果 |
| --- | --- |
| `animate-brutal-shake` | 左右抖动 |
| `animate-brutal-bounce` | 弹跳 |
| `animate-brutal-pulse` | 脉冲缩放 |
| `animate-brutal-flip` | 水平翻转 |
| `animate-brutal-slide-up/down/left/right` | 滑入 |
| `animate-brutal-pop` | 弹出放大 |
| `animate-brutal-rotate` | 旋转 360° |
| `animate-brutal-swing` | 钟摆摆动 |
| `animate-brutal-jello` | 果冻抖动 |
| `animate-brutal-heartbeat` | 心跳 |

延迟：`animation-delay-100/200/300/500`
重复：`animation-once` / `animation-infinite`

## Card3D

3D 悬浮卡片，鼠标移动时产生 3D 倾斜效果。

```vue
<Card3D :max-rotation="15" :perspective="1000" :scale="1.02">
  <Card><CardContent>3D 悬浮效果</CardContent></Card>
</Card3D>
```

- `maxRotation`: `number` — 默认 `15`
- `perspective`: `number` — 默认 `1000`
- `scale`: `number` — 默认 `1.02`
- `shadowOffset`: `number` — 默认 `10`
- `shadow`: `'default' | 'sm' | 'lg'`
- `disabled`: `boolean`

## GlitchText

故障风格文字。

```vue
<GlitchText text="GLITCH" trigger="hover" speed="medium" />
```

- `text`: `string`
- `trigger`: `'hover' | 'click' | 'autoplay' | 'none'` — 默认 `'hover'`
- `interval`: `number` — 默认 `3000`
- `speed`: `'slow' | 'medium' | 'fast'` — 默认 `'medium'`

## GlitchButton

故障效果按钮，继承 Button 的所有变体和尺寸，支持故障动画效果。

```vue
<GlitchButton variant="primary" trigger="hover" speed="medium">
  点击我
</GlitchButton>

<!-- 自动播放模式 -->
<GlitchButton trigger="autoplay" :interval="5000" speed="slow">
  自动故障
</GlitchButton>

<!-- 加载状态 -->
<GlitchButton :loading="true">提交中...</GlitchButton>
```

- `variant`: `'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'` — 默认 `'default'`
- `size`: `'sm' | 'default' | 'lg' | 'xl' | 'icon'` — 默认 `'default'`
- `speed`: `'slow' | 'medium' | 'fast'` — 默认 `'medium'`
- `trigger`: `'hover' | 'click' | 'autoplay' | 'none'` — 默认 `'hover'`
- `interval`: `number` — 自动播放间隔（毫秒），最小 100，默认 `3000`
- `asChild`: `boolean` — 默认 `false`
- `loading`: `boolean` — 默认 `false`
- `disabled`: `boolean` — 默认 `false`
- 方法: `play()`, `stop()`

> 注意：当用户启用 prefers-reduced-motion 时，动画会自动禁用以支持无障碍。

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

- `text`: `string` — 必填
- `speed`: `number` — 打字速度（毫秒/字符），默认 `50`
- `delay`: `number` — 开始延迟（毫秒），默认 `0`
- `loop`: `boolean` — 是否循环，默认 `false`
- `cursor`: `boolean` — 是否显示光标，默认 `true`
- `size`: `'sm' | 'default' | 'lg' | 'xl' | '2xl'` — 默认 `'default'`
- `weight`: `'normal' | 'medium' | 'bold' | 'black'` — 默认 `'normal'`
- Events: `start`, `complete`

## NoiseBackground

噪点纹理背景，基于 SVG feTurbulence 滤镜。

```vue
<NoiseBackground :opacity="0.3" animated>
  <div class="p-8">带噪点背景的内容</div>
</NoiseBackground>
```

- `type`: `'fractalNoise' | 'turbulence'` — 默认 `'fractalNoise'`
- `frequency`: `number` — 噪点频率，默认 `0.65`
- `octaves`: `number` — 噪点层数，默认 `3`
- `opacity`: `number` — 不透明度，默认 `0.5`
- `animated`: `boolean` — 是否启用动画，默认 `false`
- `animationDuration`: `number` — 动画周期（秒），默认 `8`
- `rounded`: `'none' | 'default' | 'lg' | 'full'` — 默认 `'none'`

## ScratchCard

刮刮卡，Canvas 覆盖层擦除。

```vue
<ScratchCard :percentage="50" :brush-radius="20" :fade-duration="300">
  <div>🎉 恭喜中奖！</div>
</ScratchCard>
```

- `percentage`: `number` — 默认 `50`，刮开多少比例自动显示全部
- `brushRadius`: `number` — 默认 `20`
- `overlayColor`: `string` — 设置纯色覆盖层，不设则默认双色条纹
- `fadeDuration`: `number` — 默认 `300`
- Events: `@progress(percent: number)`, `@completed`
- 暴露: `isRevealed` (Ref<boolean>), `revealAll()` (方法)

## SketchyChart

手绘风格图表，支持折线图、柱状图和饼图。

### 折线图

```vue
<SketchyChart
  type="line"
  :data="[{ label: '1月', value: 40 }, { label: '2月', value: 60 }, { label: '3月', value: 35 }]"
  :sketchiness="2" :grid="true"
/>
```

### 柱状图

```vue
<SketchyChart
  type="bar"
  :data="[{ label: 'A', value: 30 }, { label: 'B', value: 50 }, { label: 'C', value: 20 }]"
  :sketchiness="2"
/>
```

### 饼图

```vue
<SketchyChart
  type="pie"
  :data="[
    { label: 'Vue', value: 45 },
    { label: 'React', value: 30 },
    { label: 'Angular', value: 15 },
    { label: 'Svelte', value: 10 },
  ]"
  :width="400" :height="400"
/>
```

饼图颜色自动循环使用设计令牌：`--brutal-primary` → `--brutal-secondary` → `--brutal-accent` → `--brutal-info` → `--brutal-success` → `--brutal-destructive`。扇区从顶部（12 点钟方向）开始，顺时针排列，按数据值比例计算角度。

### Props

- `type`: `'line' | 'bar' | 'pie'` — 默认 `'line'`
- `data`: `ChartDataItem[]` — `{ label: string; value: number }[]`
- `sketchiness`: `number` — 默认 `2`，手绘抖动程度
- `grid`: `boolean` — 默认 `true`（仅折线图/柱状图有效）
- `width`: `number` — 默认 `600`
- `height`: `number` — 默认 `400`

## CopyToClipboard

```vue
<CopyToClipboard text="要复制的文本" :duration="2000" />
```

- `text`: `string` — 必填
- `duration`: `number` — 默认 `2000`

## KanbanBoard

```vue
<KanbanBoard
  v-model="columns"
  @card-move="(id, from, to) => console.log(id, from, to)"
/>
```

- `modelValue`: `KanbanColumn[]` — 必填
- Events: `update:modelValue`, `card-move(cardId, fromColumn, toColumn)`
- 插槽: `add-{columnId}` 在列底部插入自定义内容

```typescript
interface KanbanColumn {
  id: string; title: string; color?: string; cards: KanbanCard[]
}
interface KanbanCard {
  id: string; title: string; description?: string; tags?: string[]; color?: string
}
```
