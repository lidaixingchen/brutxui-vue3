# 仪表盘与数据区块

## DashboardStats

```vue
<DashboardStats
  title="Overview Performance"
  subtitle="Key metrics for this month"
  :stats="[
    { title: 'Revenue', value: '$45,231', description: 'Total revenue this month', change: '+20.1%', trend: 'up', icon: DollarSign, accentColor: 'primary', progress: 75 },
    { title: 'Users', value: '+2,350', description: 'New users this month', change: '+12.5%', trend: 'up', icon: Users, accentColor: 'secondary', progress: 60 },
  ]"
  @stat-click="handleStatClick"
/>
```

- `title`/`subtitle`: `string`
- `stats`: `StatItem[]`

```typescript
interface StatItem {
  title: string; value: string; description: string; change: string
  trend: 'up' | 'down' | 'neutral'
  icon: Component
  accentColor?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'success' | 'info'
  progress?: number
}
```

- Events: `statClick(index)`

## OverviewPage

```vue
<OverviewPage
  title="总览"
  :stats="[{ title: '收入', value: '¥125,000', change: '+12.5%', trend: 'up' }]"
  @stat-click="handleStatClick"
/>
```

- `title`: `string`
- `stats`: `OverviewStat[]` — `{ title: string; value: string; change: string; trend: 'up' | 'down' | 'neutral' }[]`
- Events: `statClick(index)`
- Slots: `header`, `default` (Recent Activity 内容), `footer`

## DataTableSection

带搜索和分页的数据表格。

```vue
<DataTableSection
  title="用户列表"
  :columns="[{ key: 'name', label: '姓名', sortable: true }, { key: 'email', label: '邮箱' }]"
  :rows="[{ name: '张三', email: 'zhang@example.com' }]"
  :searchable="true" :page-size="10"
  @row-click="handleRowClick" @sort="handleSort"
/>
```

- `title`: `string`
- `columns`: `ColumnDef[]` — `{ key: string; label: string; sortable?: boolean }[]`
- `rows`: `Record<string, unknown>[]`
- `searchable`: `boolean` — 默认 `true`
- `pageSize`: `number` — 默认 `10`
- Events: `rowClick(row)`, `sort({ key, direction })`
- Slots: `header`, `default`, `footer`

## ChartSection

图表区块，内置柱状图/折线图/饼图标签切换（基于 SketchyChart）。

```vue
<ChartSection
  title="月度收入" subtitle="过去12个月"
  chart-type="bar"
  :data="[{ label: '1月', value: 4000 }, { label: '2月', value: 3000 }, { label: '3月', value: 5000 }]"
/>
```

- `title`/`subtitle`: `string`
- `chartType`: `'bar' | 'line' | 'pie'` — 默认 `'bar'`，决定初始选中的标签
- `data`: `ChartDataPoint[]` — `{ label: string; value: number }[]`
- Slots: `header`, `default`, `footer`

## ActivityLogPage

```vue
<ActivityLogPage
  title="活动日志"
  :activities="[
    { id: '1', action: '创建了项目', user: '张三', timestamp: '2024-01-15 10:30', type: 'success' },
    { id: '2', action: '删除了文件', user: '李四', timestamp: '2024-01-15 11:00', details: 'report.pdf', type: 'warning' },
  ]"
  @entry-click="handleEntryClick"
/>
```

- `title`: `string`
- `activities`: `ActivityEntry[]`

```typescript
interface ActivityEntry {
  id: string; action: string; user: string; timestamp: string
  details?: string; type: 'info' | 'warning' | 'error' | 'success'
}
```

- Events: `entryClick(id)`
- Slots: `header`, `default`, `footer`

## StepperSection

```vue
<StepperSection
  title="如何开始"
  :steps="[{ title: '注册', description: '创建账号' }, { title: '选择方案' }]"
  v-model="currentStep"
  @step-click="handleStepClick"
/>
```

- `title`: `string`
- `steps`: `StepperStepItem[]` — `{ title: string; description?: string }[]`
- `modelValue`: `number` — v-model，当前激活步骤索引，默认 `0`
- Events: `stepClick(index)`
- Slots: `header`, `default` (步骤内容区域), `footer`
