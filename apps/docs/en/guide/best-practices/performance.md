# Performance Optimization Guide

This guide introduces strategies to optimize application performance when building with BrutxUI.

## 1. Tree-shaking & Imports

### 1.1 Entry Point Imports (Recommended)

BrutxUI supports tree-shaking natively, allowing bundlers to automatically strip unused components during compilation:

```typescript
// Recommended: Tree-shaking is handled automatically by bundlers
import { Button, Input, Card } from 'brutx-ui-vue'
import 'brutx-ui-vue/style.css'
```

### 1.2 Sub-path Imports & Cost Breakdown

The `exports` field in `package.json` is projected automatically from the public API Contract (`packages/ui/api-contract.ts`), providing subpaths for public components, composables, and style assets (e.g. `button`, `dialog`, `combobox`, `tree-select`, `useReducedMotion`).

Tradeoffs of subpath imports:
- **Smaller JavaScript Dependency Closure**: Subpath imports narrow the dependency tree traversed by bundlers, reducing JavaScript bundle size for initial page loads or isolated entry points.
- **Independent CSS Cost**: Whether importing from the root entry or via subpaths, Tailwind CSS v4 Neo-Brutalist utility classes are distributed via a single consolidated stylesheet (`brutx-ui-vue/style.css`). Measure CSS asset sizes independently from JavaScript tree-shaking gains.

```typescript
// Import components and variants from dedicated subpaths
import { Button, buttonVariants } from 'brutx-ui-vue/button'
import { DialogContent } from 'brutx-ui-vue/dialog'

// Import consolidated stylesheet globally once
import 'brutx-ui-vue/style.css'
```

### 1.3 Bundler Optimization Configurations

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
          // Separate UI library assets from main bundle chunks
          'brutx-ui': ['brutx-ui-vue'],
        },
      },
    },
  },
})
```

---

## 2. Component Lazy Loading

### 2.1 Async Components

Load heavy or off-screen components lazily using Vue's `defineAsyncComponent`:

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// Lazy load dialog content panel
const HeavyDialog = defineAsyncComponent(() =>
  import('brutx-ui-vue').then(m => m.DialogContent)
)

// Lazy load data table components
const DataTable = defineAsyncComponent(() =>
  import('brutx-ui-vue').then(m => m.DataTable)
)
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button>Open</Button>
    </DialogTrigger>
    <HeavyDialog>
      <!-- Heavy components -->
    </HeavyDialog>
  </Dialog>
</template>
```

### 2.2 Route Level Code Splitting

```typescript
// router/index.ts
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/DashboardView.vue'),
  },
  {
    path: '/settings',
    // Dynamic route bundle resolution
    component: () => import('@/views/SettingsView.vue'),
  },
]
```

### 2.3 Conditional Initialization

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue'

const showHeavyComponent = ref(false)
const heavyData = shallowRef(null)

// Load data datasets only when required
async function loadHeavyData() {
  if (!heavyData.value) {
    heavyData.value = await fetchLargeDataset()
  }
  showHeavyComponent.value = true
}
</script>

<template>
  <Button @click="loadHeavyData">Load Data</Button>
  <DataTable v-if="showHeavyComponent" :data="heavyData" />
</template>
```

---

## 3. Large Datasets (shallowRef)

### 3.1 Non-reactive Scopes via shallowRef

For large datasets, use `shallowRef` to prevent Vue from performing deep reactivity traversals across thousands of nested properties:

```vue
<script setup lang="ts">
import { shallowRef, triggerRef } from 'vue'

// Avoid deep reactive tracking on large lists
const tableData = shallowRef<DataRow[]>([])

async function loadData() {
  const response = await fetch('/api/data')
  tableData.value = await response.json()
}

// Trigger manual view updates after inline updates
function updateRow(index: number, newData: Partial<DataRow>) {
  tableData.value[index] = { ...tableData.value[index], ...newData }
  triggerRef(tableData)
}
</script>

<template>
  <DataTable :data="tableData" />
</template>
```

### 3.2 Virtualizing Massive Lists

Use `VirtualScroll` to keep DOM footprints lightweight when rendering datasets over 1000 items:

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
      <div class="px-4 py-2 border-b border-brutal">
        {{ item.name }}
      </div>
    </template>
  </VirtualScroll>
</template>
```

### 3.3 Server Side & Local Pagination

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataTablePagination } from 'brutx-ui-vue'

interface Item {
  id: number
  name: string
}

const allData = ref<Item[]>([])
const pageSize = ref(20)

const { currentPage, totalPages, paginatedData } = useDataTablePagination({
  paginated: true,
  pageSize,
  totalItems: () => allData.value.length,
})

const tableData = computed(() => paginatedData(allData.value))
</script>

<template>
  <DataTable :data="tableData" />
  <Pagination
    v-model:page="currentPage"
    :total="totalPages"
    class="mt-4"
  />
</template>
```

---

## 4. Debounce & Throttle

### 4.1 Input Search Debouncing

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDebounce } from 'brutx-ui-vue'

const searchQuery = ref('')
const { debounced: debouncedSearch } = useDebounce(async (query: string) => {
  if (!query.trim()) return
  const results = await searchApi(query)
  // Handle results
}, 300)

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  searchQuery.value = value
  debouncedSearch(value)
}
</script>

<template>
  <Input
    :model-value="searchQuery"
    placeholder="Search..."
    @input="handleInput"
  />
</template>
```

### 4.2 Button Click Throttling

```vue
<script setup lang="ts">
import { useThrottle } from 'brutx-ui-vue'

const { throttled: throttledSubmit } = useThrottle(async () => {
  await submitForm()
}, 1000)
</script>

<template>
  <Button @click="throttledSubmit">Submit (Throttle 1s)</Button>
</template>
```

### 4.3 High Frequency Scroll Listeners

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useThrottle } from 'brutx-ui-vue'

const { throttled: throttledScrollHandler } = useThrottle((event: Event) => {
  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  // Process scroll values
}, 100)

onMounted(() => {
  window.addEventListener('scroll', throttledScrollHandler)
})
onUnmounted(() => {
  window.removeEventListener('scroll', throttledScrollHandler)
})
</script>
```

---

## 5. Virtual Scroll Configurations

### 5.1 Basic Usage

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

### 5.2 Infinite Loading

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

### 5.3 Dynamic Heights (Estimated Height)

For layouts with variable row heights, use the `estimated-item-height` property:

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
        <!-- Variable content height -->
        <p>{{ item.content }}</p>
        <p v-if="item.expanded">{{ item.detail }}</p>
      </div>
    </template>
  </VirtualScroll>
</template>
```

---

## 6. Performance Audit Checklist

### 6.1 Using Vue Devtools

During development, monitor rendering cycles and compute timings:

1. Open Vue Devtools in browser.
2. Navigate to the Performance Tab.
3. Record rendering trace segments.
4. Track down and optimize component redraw bottlenecks.

### 6.2 Render Optimization Best Practices
- [ ] Large list datasets use `shallowRef` configurations.
- [ ] Large lists are wrapped inside `VirtualScroll` components.
- [ ] Live input searches use debounce thresholds (minimum 300ms).
- [ ] Layout scroll events use throttle rates (minimum 100ms).
- [ ] Offscreen modals and dialog triggers use lazy resolution bundles.
- [ ] Complex computations in template bindings are computed values.
- [ ] Static components are marked with `v-once`.
- [ ] Repetitive lists utilize `v-memo` caches.

```vue
<template>
  <!-- Cache list node updates with v-memo -->
  <div
    v-for="item in list"
    :key="item.id"
    v-memo="[item.id, item.selected]"
  >
    {{ item.name }}
  </div>
</template>
```

---

## 7. Advanced Render Optimization (v-memo & markRaw)

### 7.1 When to Use v-memo

`v-memo` is a Vue 3 directive for memorizing template subtrees: when its dependency array remains unchanged, re-rendering of that subtree is skipped. It is best suited for **large `v-for` lists where each row has independent state**.

**Recommended: Independent row state with enumerable properties**

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

**Anti-pattern: Omitted reactive dependencies**

```vue
<!-- Anti-pattern: Missing item.expanded causes toggle updates to be missed -->
<div
  v-for="item in list"
  :key="item.id"
  v-memo="[item.id, item.selected]"
>
  <span v-if="item.expanded">{{ item.detail }}</span>
</div>
```

**Usage Rules**:
1. The dependency array must cover all reactive state that affects the subtree's rendering (data, selection, expansion, etc.).
2. Omitting a dependency causes stale views—this is the most frequent pitfall with `v-memo`.
3. Small lists (< 100 items) do not need `v-memo`; the tracking overhead may outweigh any performance benefit.
4. `v-memo` cannot be used where rows depend on global layout state (e.g. cell merging or fixed column offsets).

### 7.2 When to Use markRaw

`markRaw` permanently marks an object so that it will never be converted into a reactive proxy. It is ideal for **third-party instances that do not require reactivity** (e.g., map/chart instances or custom renderers).

```typescript
import { markRaw } from 'vue'

// Third-party instances do not need reactive tracking
const chartInstance = markRaw(echarts.init(domEl))

// Using an object as a custom component renderer
const CellRenderer = markRaw({
  props: { cellFn: Function, row: Object, value: null },
  render(props) { return props.cellFn({ row: props.row, value: props.value }) },
})
```

**Anti-pattern: Marking data that needs two-way reactivity**

```typescript
// Anti-pattern: Mutating markRaw data will not trigger view updates
const tableData = markRaw(largeDataSet)
tableData[0].name = 'updated' // View will NOT update!
```

### 7.3 Choosing Between shallowRef and ref

| Scenario | Recommendation | Rationale |
| --- | --- | --- |
| Large list datasets (> 1000 items) | `shallowRef` | Avoids deep recursive reactive proxy creation for each element |
| Set / Map collections | `shallowRef` | Deep reactivity overhead on Set/Map is significant |
| Third-party instances (charts, editors) | `shallowRef` + `markRaw` | Instance internals do not need reactive tracking |
| Form objects requiring two-way binding | `ref` | Requires deep reactive tracking on individual fields |
| Primitive values (string / number / boolean) | `ref` | `shallowRef` provides no performance benefit |

---

## 8. Performance Benchmarks (bench)

### 8.1 Current Baseline Metrics

> Baseline environment: Local development machine (Node.js 22), `--time=200` fast sampling.
> Official CI baseline runs on `ubuntu-latest` with `--time=1000`.

| Component | Scenario | Hz | Note |
| --- | --- | --- | --- |
| DataTable | 100 rows | ~30 | Small list baseline |
| DataTable | 1000 rows | ~3 | Large list observation point |
| TreeView | 100 nodes | ~9 | Small tree baseline |
| TreeView | 1000 nodes | ~1 | Large tree observation point |

### 8.2 Reproduction Commands

```bash
# Run benchmarks locally (Markdown table output)
pnpm --filter brutx-ui-vue bench

# Output JSON format (consumed by benchmark comparison scripts)
pnpm --filter brutx-ui-vue bench:json

# Compare two benchmark JSON results
node scripts/bench-diff.mjs bench-main.json bench-pr.json
```

### 8.3 Regression Decision Criteria

CI automatically reports benchmark comparisons in PR comments:

- `|delta| < 5%`: Within standard runner noise threshold.
- `delta < -5%`: Potential performance regression.
- `delta > 5%`: Performance improvement.
- If more than 2 scenarios show suspected regressions, manual maintainer review is required before merging.
