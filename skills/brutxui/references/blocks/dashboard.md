# 仪表盘与数据区块

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
