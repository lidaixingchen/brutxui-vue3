# 新粗野主义特色组件

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

## ScratchCard

刮刮卡。

```vue
<ScratchCard :percentage="50" :brush-radius="20" :fade-duration="300">
  <div>🎉 恭喜中奖！</div>
</ScratchCard>
```

- `percentage`: `number` — 默认 `50`，刮开多少比例自动显示全部
- `brushRadius`: `number` — 默认 `20`
- `overlayColor`: `string`
- `fadeDuration`: `number` — 默认 `300`

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
<KanbanBoard v-model="columns" />
```

- `modelValue`: `KanbanColumn[]` — 必填

```typescript
interface KanbanColumn {
  id: string; title: string; color?: string; cards: KanbanCard[]
}
interface KanbanCard {
  id: string; title: string; description?: string; tags?: string[]; color?: string
}
```
