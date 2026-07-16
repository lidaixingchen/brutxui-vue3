# 性能优化建议

本指南介绍如何在使用 BrutxUI 时获得最佳性能表现。

## 1. Tree-shaking 按需导入

### 1.1 从主入口导入（推荐）

BrutxUI 支持 Tree-shaking，构建工具会自动移除未使用的组件：

```typescript
// 推荐：从主入口导入，构建工具自动 Tree-shaking
import { Button, Input, Card } from 'brutx-ui-vue'
import 'brutx-ui-vue/styles.css'
```

### 1.2 子路径导入（稳定白名单）

主入口是 BrutxUI 的稳定组件导入面。子路径导入只对 `package.json` `exports` 中声明的稳定白名单开放，当前包括 `button`、`input`、`dialog`、`toast`、`form`、`select`、`dropdown-menu`、`table`、`card`、`tabs`、`calendar`、`carousel`、`code-block`、`hooks`、`locales`、`devtools-plugin` 以及样式入口。未列出的组件请从主入口导入。

```typescript
// 仅对白名单子路径使用直接导入
import { Button, buttonVariants } from 'brutx-ui-vue/button'
import { DialogRoot as Dialog } from 'reka-ui'
import { DialogContent } from 'brutx-ui-vue/dialog'
```

### 1.3 Vite 配置优化

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 UI 库单独打包
          'brutx-ui': ['brutx-ui-vue'],
        },
      },
    },
  },
})
```

## 2. 组件懒加载

### 2.1 异步组件

对于非首屏组件，使用 Vue 的 `defineAsyncComponent` 进行懒加载：

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// 对话框组件懒加载
const HeavyDialog = defineAsyncComponent(() =>
  import('brutx-ui-vue').then(m => m.DialogContent)
)

// 数据表格懒加载
const DataTable = defineAsyncComponent(() =>
  import('brutx-ui-vue').then(m => m.DataTable)
)
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button>打开</Button>
    </DialogTrigger>
    <HeavyDialog>
      <!-- 复杂内容 -->
    </HeavyDialog>
  </Dialog>
</template>
```

### 2.2 路由级别懒加载

```typescript
// router/index.ts
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/DashboardView.vue'),
  },
  {
    path: '/settings',
    // 带加载状态的懒加载
    component: () => import('@/views/SettingsView.vue'),
  },
]
```

### 2.3 条件渲染优化

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue'

const showHeavyComponent = ref(false)
const heavyData = shallowRef(null)

// 仅在需要时加载数据
async function loadHeavyData() {
  if (!heavyData.value) {
    heavyData.value = await fetchLargeDataset()
  }
  showHeavyComponent.value = true
}
</script>

<template>
  <Button @click="loadHeavyData">加载数据</Button>
  <DataTable v-if="showHeavyComponent" :data="heavyData" />
</template>
```

## 3. 大数据处理（shallowRef）

### 3.1 使用 shallowRef 避免深层响应式

对于大型数据集，使用 `shallowRef` 避免 Vue 对每个属性进行深度响应式追踪：

```vue
<script setup lang="ts">
import { shallowRef, triggerRef } from 'vue'

// 大型列表数据使用 shallowRef
const tableData = shallowRef<DataRow[]>([])

async function loadData() {
  const response = await fetch('/api/data')
  tableData.value = await response.json()
}

// 修改数据后需要手动触发更新
function updateRow(index: number, newData: Partial<DataRow>) {
  tableData.value[index] = { ...tableData.value[index], ...newData }
  triggerRef(tableData)
}
</script>

<template>
  <DataTable :data="tableData" />
</template>
```

### 3.2 虚拟滚动处理大数据

对于超过 1000 条数据的列表，使用虚拟滚动：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VirtualScroll } from 'brutx-ui-vue'

const items = ref(Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
})))
</script>

<template>
  <VirtualScroll
    :items="items"
    :item-height="48"
    :buffer="5"
    class="h-[600px] border-3 border-brutal"
  >
    <template #default="{ item }">
      <div class="px-4 py-2 border-b border-brutal-border">
        {{ item.name }}
      </div>
    </template>
  </VirtualScroll>
</template>
```

### 3.3 数据分页

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataTablePagination } from 'brutx-ui-vue'

const allData = ref<Item[]>([])
const pageSize = ref(20)

const { currentPage, totalPages, paginatedData } = useDataTablePagination({
  data: allData,
  pageSize,
})
</script>

<template>
  <DataTable :data="paginatedData" />
  <Pagination
    v-model:page="currentPage"
    :total="totalPages"
    class="mt-4"
  />
</template>
```

## 4. 防抖节流

### 4.1 搜索防抖

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDebounce } from 'brutx-ui-vue'

const searchQuery = ref('')
const [debouncedSearch, isDebouncing] = useDebounce(async (query: string) => {
  if (!query.trim()) return
  const results = await searchApi(query)
  // 处理结果
}, 300)

// 监听输入变化
function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  searchQuery.value = value
  debouncedSearch(value)
}
</script>

<template>
  <Input
    :model-value="searchQuery"
    placeholder="搜索..."
    :loading="isDebouncing"
    @input="handleInput"
  />
</template>
```

### 4.2 按钮点击节流

```vue
<script setup lang="ts">
import { useThrottle } from 'brutx-ui-vue'

const [throttledSubmit] = useThrottle(async () => {
  await submitForm()
}, 1000)
</script>

<template>
  <Button @click="throttledSubmit">提交（1秒内只触发一次）</Button>
</template>
```

### 4.3 滚动事件优化

```vue
<script setup lang="ts">
import { useThrottle, useEventListener } from 'brutx-ui-vue'

const [throttledScrollHandler] = useThrottle((event: Event) => {
  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  // 处理滚动逻辑
}, 100)

useEventListener(window, 'scroll', throttledScrollHandler)
</script>
```

## 5. 虚拟滚动

### 5.1 基本用法

```vue
<template>
  <VirtualScroll
    :items="largeList"
    :item-height="64"
    :buffer="10"
    class="h-[500px] overflow-auto"
  >
    <template #default="{ item, index }">
      <div class="flex items-center gap-3 px-4 py-3 border-b border-brutal-border">
        <Avatar>
          <AvatarImage :src="item.avatar" />
          <AvatarFallback>{{ item.name[0] }}</AvatarFallback>
        </Avatar>
        <div>
          <p class="font-medium">{{ item.name }}</p>
          <p class="text-sm text-brutal-muted-foreground">{{ item.email }}</p>
        </div>
      </div>
    </template>
  </VirtualScroll>
</template>
```

### 5.2 无限滚动结合

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VirtualScroll, InfiniteScroll } from 'brutx-ui-vue'

const items = ref<Item[]>([])
const hasMore = ref(true)
const isLoading = ref(false)

async function loadMore() {
  if (isLoading.value || !hasMore.value) return
  isLoading.value = true
  const newItems = await fetchItems(items.value.length)
  items.value = [...items.value, ...newItems]
  hasMore.value = newItems.length > 0
  isLoading.value = false
}
</script>

<template>
  <VirtualScroll
    :items="items"
    :item-height="48"
    class="h-[600px]"
  >
    <template #default="{ item }">
      <div class="px-4 py-2">{{ item.name }}</div>
    </template>
  </VirtualScroll>
  <InfiniteScroll
    :loading="isLoading"
    :has-more="hasMore"
    @load-more="loadMore"
  />
</template>
```

### 5.3 动态高度虚拟滚动

对于高度不固定的列表项，使用预估高度：

```vue
<template>
  <VirtualScroll
    :items="items"
    :estimated-item-height="80"
    :buffer="5"
    class="h-[600px]"
  >
    <template #default="{ item }">
      <div class="px-4 py-3">
        <!-- 内容高度不固定 -->
        <p>{{ item.content }}</p>
        <p v-if="item.expanded">{{ item.detail }}</p>
      </div>
    </template>
  </VirtualScroll>
</template>
```

## 6. 性能监控

### 6.1 使用 Vue Devtools

在开发环境中使用 Vue Devtools 监控组件渲染性能：

1. 打开 Vue Devtools
2. 切换到 Performance 面板
3. 记录组件渲染时间
4. 识别渲染瓶颈

### 6.2 组件渲染优化清单

- [ ] 大型列表使用 `shallowRef` + 虚拟滚动
- [ ] 搜索输入使用防抖（300ms）
- [ ] 滚动事件使用节流（100ms）
- [ ] 非首屏组件使用懒加载
- [ ] 避免在模板中使用复杂计算
- [ ] 使用 `v-once` 处理静态内容
- [ ] 使用 `v-memo` 缓存列表项渲染

```vue
<template>
  <!-- 使用 v-memo 优化列表渲染 -->
  <div
    v-for="item in list"
    :key="item.id"
    v-memo="[item.id, item.selected]"
  >
    {{ item.name }}
  </div>
</template>
```

## 7. 渲染优化进阶（v-memo 与 markRaw）

### 7.1 何时使用 v-memo

`v-memo` 是 Vue 3 的渲染缓存指令：当依赖数组未变化时，跳过该子树的 re-render。适用于**大列表 `v-for` 且行数据独立**的场景。

**正例：行数据独立、状态可枚举**

```vue
<template>
  <div
    v-for="item in list"
    :key="item.id"
    v-memo="[item.id, item.selected, item.expanded]"
  >
    {{ item.name }}
  </div>
</template>
```

**反例：行内联动状态**

```vue
<!-- 反例：依赖数组遗漏 isExpanded 会导致展开态不更新 -->
<div
  v-for="item in list"
  :key="item.id"
  v-memo="[item.id, item.selected]"
>
  <span v-if="item.expanded">{{ item.detail }}</span>
</div>
```

**使用规则**：
1. 依赖数组必须覆盖所有影响该子树渲染的响应式状态（数据、选中态、展开态等）
2. 依赖数组遗漏会导致渲染不更新——这是 `v-memo` 最常见的陷阱
3. 小列表（< 100 项）无需 `v-memo`——依赖追踪的开销可能抵消收益
4. `v-memo` 不能用于依赖全局布局状态的场景（如单元格合并、固定列偏移）

> BrutxUI 内部组件（DataTable、TreeView）未使用 `v-memo`——行渲染状态依赖复杂（选中态 + 展开态 + 拖拽态 + 单元格合并），盲目添加会导致渲染错误。详见仓库内 `docs/audit/perf-audit.md` 性能审计报告。

### 7.2 何时使用 markRaw

`markRaw` 标记对象为永不响应式，适用于**不需要响应式的第三方实例**（如地图实例、图表实例、组件渲染器）。

```typescript
import { markRaw } from 'vue'

// 第三方实例无需响应式追踪
const chartInstance = markRaw(echarts.init(domEl))

// 组件对象作为渲染器时
const CellRenderer = markRaw({
  props: { cellFn: Function, row: Object, value: null },
  render(props) { return props.cellFn({ row: props.row, value: props.value }) },
})
```

**反例：需要响应式更新的数据对象**

```typescript
// 反例：markRaw 后数据变更不会触发视图更新
const tableData = markRaw(largeDataSet)
tableData[0].name = 'updated' // 视图不会更新！
```

> BrutxUI 内部使用 `markRaw` 的场景：DataTable 的 `CellRenderer` 渲染器对象（避免组件对象被响应式代理）。

### 7.3 shallowRef 与 ref 的取舍

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| 大型列表数据（> 1000 项） | `shallowRef` | 避免对每个元素深层响应式追踪 |
| Set/Map 状态集合 | `shallowRef` | Set/Map 的深层响应式开销大 |
| 第三方实例（图表、编辑器） | `shallowRef` + `markRaw` | 实例无需响应式 |
| 需要表单双向绑定的对象 | `ref` | 需要深层响应式追踪属性变更 |
| 简单值（string/number/boolean） | `ref` | `shallowRef` 无收益 |

## 8. 性能基准（bench）

### 8.1 当前基线数据

> 基线环境：本地开发机（Windows 11），Node.js 22，`--time=200` 快速采样
> 正式基线以 CI（`ubuntu-latest`，`--time=1000`）为准，每次发版后同步

| 组件 | 场景 | hz | 说明 |
| --- | --- | --- | --- |
| DataTable | 100 rows | ~30 | 小列表基线 |
| DataTable | 1000 rows | ~3 | 大列表观测点 |
| TreeView | 100 nodes | ~9 | 小列表基线 |
| TreeView | 1000 nodes | ~1 | 大列表观测点 |

### 8.2 复现方法

```bash
# 本地运行 bench（markdown 表格输出）
pnpm --filter brutx-ui-vue bench

# 输出 JSON（供 CI 对比脚本消费）
pnpm --filter brutx-ui-vue bench:json

# CI 对比两份 bench JSON
node scripts/bench-diff.mjs bench-main.json bench-pr.json
```

### 8.3 回归判定标准

CI 会自动在 PR 评论中发布 bench 对比报告（非门禁，仅信息性）：

- `|delta| < 5%`：噪声范围内（GitHub-hosted runner 典型噪声带）
- `delta < -5%`：疑似回归
- `delta > 5%`：改善
- 疑似回归超过 2 个时，维护者需人工复核后再合并

详见仓库内 `docs/audit/perf-audit.md` 性能审计报告和 `docs/ARCHITECTURE_OPTIMIZATION_PLAN_V2.md` §4.1 架构优化方案。
