# DataTable 泛型重构方案

> **问题编号**: 审查报告 #36
> **优先级**: 🟡 中
> **状态**: 待 Breaking Change 版本实施
> **创建日期**: 2026-06-28

---

## 问题描述

`DataTable` 和 `DataTableSection` 组件的泛型约束 `T extends Record<string, unknown>` 强制用户在接口定义中添加 `[key: string]: unknown` 索引签名，破坏了 TypeScript 严格模式下的类型安全性。

```typescript
// 用户被迫写的代码
interface User {
    [key: string]: unknown  // ← 破坏类型安全，user['anything'] 都能编译通过
    id: number
    name: string
    email: string
    role: string
    status: string
}
```

**副作用**：
- `user['不存在的属性']` 编译通过，返回 `unknown`
- 属性类型被索引签名拓宽，需要类型断言
- 与 TypeScript `noUncheckedIndexedAccess` 严格模式冲突

---

## 根因分析

### 第一性原理

问题根源是 **TypeScript 泛型型变（variance）规则**与 `DataTableColumn<T>` 的递归结构冲突。

```typescript
// types.ts 当前定义
export interface DataTableColumn<T> {
    id: string
    header: string | ((column: DataTableColumn<T>) => string)  // ← T 在逆变位置（函数参数）
    accessorKey?: keyof T                                        // ← T 在协变位置
    accessorFn?: (row: T) => unknown                             // ← T 在逆变位置
    cell?: (props: { row: T; value: unknown }) => VNode          // ← T 在逆变位置
}
```

**型变规则**：
- 协变位置（返回值、属性值）：`A extends B` → `F<A> assignable to F<B>`
- 逆变位置（函数参数）：`A extends B` → `F<B> assignable to F<A>`（反向！）

`header` 字段包含 `(column: DataTableColumn<T>) => string`，使 `T` 处于逆变位置。由于 `DataTableColumn<T>` 递归引用自身，形成了**递归逆变链**：

```
DataTableColumn<T>
  └─ header: (column: DataTableColumn<T>) => string
                    └─ header: (column: DataTableColumn<T>) => string
                                    └─ ...（无限递归）
```

### 为什么简单修改约束无效

| 尝试的方案 | 结果 | 原因 |
|-----------|------|------|
| `T extends Record<string, unknown>` → `T extends object` | ❌ 类型错误 | `DataTableColumn<TestRow>` 无法赋值给 `DataTableColumn<object>`，逆变位置要求反向兼容 |
| 使用 `NoInfer<T>` 包裹逆变位置 | ❌ 类型错误 | `NoInfer` 无法解决递归型变，`DataTableColumn<T>` 内部仍有逆变链 |
| 使用 `T extends object = Record<string, unknown>` 默认参数 | ❌ 类型错误 | 默认参数只解决未显式指定类型的情况，不解决型变不兼容 |

---

## 彻底修复方案

### 核心思路

**打破 `DataTableColumn<T>` 的递归逆变链**：将 `header` 回调函数的参数类型从 `DataTableColumn<T>` 改为不含 `T` 的独立类型。

### 1. 重构 `types.ts`

```typescript
import type { VNode } from 'vue'

// ============================================
// 新增：header 回调的上下文类型（不含 T，打破递归逆变）
// ============================================
export interface DataTableColumnHeaderContext {
    /** 当前列的 ID */
    id: string
    /** 当前列是否可排序 */
    sortable?: boolean
    /** 当前列是否正在排序 */
    sortDirection?: 'asc' | 'desc' | null
}

export interface DataTableVirtualScroll {
    enabled?: boolean
    rowHeight?: number
    overscan?: number
    threshold?: number
}

// ============================================
// 修改：DataTableColumn 泛型约束从 Record<string, unknown> 改为 object
// ============================================
export interface DataTableColumn<T extends object> {
    id: string
    // 修改前: header: string | ((column: DataTableColumn<T>) => string)
    // 修改后: 使用 DataTableColumnHeaderContext 替代，打破递归逆变
    header: string | ((ctx: DataTableColumnHeaderContext) => string)
    accessorKey?: keyof T
    accessorFn?: (row: T) => unknown
    cell?: (props: { row: T; value: unknown }) => VNode | string
    sortable?: boolean
    filterable?: boolean
    resizable?: boolean
    hidden?: boolean
    width?: number | 'auto'
    minWidth?: number
    maxWidth?: number
    align?: 'left' | 'center' | 'right'
}

// ============================================
// 修改：移除 Record<string, unknown> 约束
// ============================================
export interface DataTableProps<T extends object> {
    data: T[]
    columns: DataTableColumn<T>[]
    sortable?: boolean
    filterable?: boolean
    selectable?: boolean
    resizable?: boolean
    paginated?: boolean
    pageSize?: number
    pageSizeOptions?: number[]
    loading?: boolean
    emptyMessage?: string
    rowKey: keyof T | ((row: T) => string | number)
    virtualScroll?: DataTableVirtualScroll
    class?: string
}

export interface DataTableSortState {
    column: string
    direction: 'asc' | 'desc' | null
}

export interface DataTableFilterState {
    global?: string
    columns: Record<string, unknown>
}

export interface DataTablePaginationState {
    page: number
    pageSize: number
    total: number
}
```

### 2. 修改 `DataTable.vue`

```typescript
// 修改前
<script setup lang="ts" generic="T extends Record<string, unknown>">

// 修改后
<script setup lang="ts" generic="T extends object">
```

**需要同步修改的模板代码**：

检查所有使用 `column.header` 的地方，如果传入的是整个 `column` 对象，需要改为传入 `DataTableColumnHeaderContext`：

```vue
<!-- 修改前 -->
<template v-if="typeof column.header === 'function'">
    {{ column.header(column) }}
</template>

<!-- 修改后 -->
<template v-if="typeof column.header === 'function'">
    {{ column.header({ id: column.id, sortable: column.sortable, sortDirection: getSortDirection(column.id) }) }}
</template>
```

### 3. 修改 composables

**useDataTableSort.ts**:
```typescript
// 修改前
export interface UseDataTableSortOptions<T extends Record<string, unknown>> { ... }
export function useDataTableSort<T extends Record<string, unknown>>(...) { ... }

// 修改后
export interface UseDataTableSortOptions<T extends object> { ... }
export function useDataTableSort<T extends object>(...) { ... }
```

**useDataTableFilter.ts**:
```typescript
// 修改前
export interface UseDataTableFilterOptions<T extends Record<string, unknown>> { ... }
export function useDataTableFilter<T extends Record<string, unknown>>(...) { ... }

// 修改后
export interface UseDataTableFilterOptions<T extends object> { ... }
export function useDataTableFilter<T extends object>(...) { ... }
```

**useDataTableSelection.ts**:
```typescript
// 修改前
export interface UseDataTableSelectionOptions<T extends Record<string, unknown>> { ... }
export function useDataTableSelection<T extends Record<string, unknown>>(...) { ... }

// 修改后
export interface UseDataTableSelectionOptions<T extends object> { ... }
export function useDataTableSelection<T extends object>(...) { ... }
```

### 4. 重构 `DataTableSection.vue`

```typescript
// 修改前
<script setup lang="ts">

// 修改后
<script setup lang="ts" generic="T extends Record<string, unknown>">

// ColumnDef 泛型化
export interface ColumnDef<T extends Record<string, unknown> = Record<string, unknown>> {
    key: keyof T & string
    label: string
    sortable?: boolean
}

// Props 泛型化
interface DataTableSectionProps {
    title?: string
    columns?: ColumnDef<T>[]
    rows?: T[]
    searchable?: boolean
    pageSize?: number
    class?: string
}

// Emit 类型更新
const emit = defineEmits<{
    'row-click': [row: T]
    'sort': [payload: { key: keyof T & string; direction: 'asc' | 'desc' }]
}>()
```

### 5. 更新导出

在 `packages/ui/src/index.ts` 中添加新类型的导出：

```typescript
export type { DataTableColumnHeaderContext } from './components/data-table/types'
```

### 6. 更新 demo 文件

**DataTableDemo.vue**:
```typescript
// 修改前
interface User {
    [key: string]: unknown  // 删除此行
    id: number
    name: string
    email: string
    role: string
    status: string
}

// 修改后
interface User {
    id: number
    name: string
    email: string
    role: string
    status: string
}
```

**DataTableSectionDemo.vue**:
```typescript
// 修改前
const data: Record<string, unknown>[] = [...]

// 修改后
interface Employee {
    name: string
    email: string
    role: string
    status: string
}

const columns: ColumnDef<Employee>[] = [...]
const data: Employee[] = [...]
```

### 7. 更新测试文件

```typescript
// 修改前
interface TestRow extends Record<string, unknown> { ... }

// 修改后
interface TestRow {
    id: number
    name: string
    email: string
    age: number
}

// 显式类型标注
const testColumns: DataTableColumn<TestRow>[] = [...]
```

---

## 迁移指南

### 对现有用户的影响

| 使用方式 | 影响 | 迁移步骤 |
|---------|------|----------|
| 使用 `accessorKey` 的列 | ✅ 无影响 | — |
| 使用 `accessorFn` 的列 | ✅ 无影响 | — |
| 使用 `header` 字符串的列 | ✅ 无影响 | — |
| 使用 `header` 函数的列 | ⚠️ Breaking | 回调参数类型从 `DataTableColumn<T>` 改为 `DataTableColumnHeaderContext` |
| `Record<string, unknown>` 作为 `T` | ✅ 无影响 | `Record<string, unknown>` 满足 `T extends object` |
| 具体接口作为 `T` | ✅ 改善 | 不再需要 `[key: string]: unknown` 索引签名 |

### 迁移示例

```typescript
// 修改前
const columns: DataTableColumn<User>[] = [
    {
        id: 'name',
        header: (column) => `Sort by ${column.id}`,  // column 类型为 DataTableColumn<User>
        accessorKey: 'name',
    },
]

// 修改后
const columns: DataTableColumn<User>[] = [
    {
        id: 'name',
        header: (ctx) => `Sort by ${ctx.id}`,  // ctx 类型为 DataTableColumnHeaderContext
        accessorKey: 'name',
    },
]
```

---

## 型变分析验证

重构后的 `DataTableColumn<T>` 型变分析：

```typescript
export interface DataTableColumn<T extends object> {
    id: string                                                              // 不含 T
    header: string | ((ctx: DataTableColumnHeaderContext) => string)         // 不含 T ✓
    accessorKey?: keyof T                                                    // T 协变 ✓
    accessorFn?: (row: T) => unknown                                        // T 逆变
    cell?: (props: { row: T; value: unknown }) => VNode | string            // T 逆变
    // ...
}
```

`accessorFn` 和 `cell` 仍包含 `T` 在逆变位置，但由于：
1. 这些字段都是可选的（`?`）
2. `T extends object` 约束下，TypeScript 对于可选字段的型变检查更宽松
3. 实际使用中 `T` 通常由数据数组显式提供，而非由列定义推导

因此在实际使用场景中不会出现型变不兼容问题。如果仍有问题，可以对这两个字段也使用 `NoInfer<T>`：

```typescript
accessorFn?: (row: NoInfer<T>) => unknown
cell?: (props: { row: NoInfer<T>; value: unknown }) => VNode | string
```

---

## 实施计划

| 阶段 | 内容 | 版本 |
|------|------|------|
| 1 | 新增 `DataTableColumnHeaderContext` 类型 | 当前版本（非破坏性） |
| 2 | 弃用 `header: (column: DataTableColumn<T>) => string` 签名，添加 console.warn | 当前版本（非破坏性） |
| 3 | 移除旧签名，切换到 `header: (ctx: DataTableColumnHeaderContext) => string` | 下一个主版本（Breaking Change） |
| 4 | 泛型约束从 `Record<string, unknown>` 改为 `object` | 下一个主版本（Breaking Change） |

---

## 相关文件

| 文件 | 变更类型 |
|------|----------|
| `packages/ui/src/components/data-table/types.ts` | 类型重构 |
| `packages/ui/src/components/data-table/DataTable.vue` | generic 约束 + 模板 |
| `packages/ui/src/composables/useDataTableSort.ts` | generic 约束 |
| `packages/ui/src/composables/useDataTableFilter.ts` | generic 约束 |
| `packages/ui/src/composables/useDataTableSelection.ts` | generic 约束 |
| `packages/ui/src/components/data-table-section/DataTableSection.vue` | 泛型化 |
| `packages/ui/src/index.ts` | 导出新类型 |
| `apps/docs/.vitepress/theme/components/demos/DataTableDemo.vue` | 移除索引签名 |
| `apps/docs/.vitepress/theme/components/demos/DataTableSectionDemo.vue` | 使用具体接口 |
| `packages/ui/src/components/data-table/data-table.test.ts` | 移除索引签名 |
