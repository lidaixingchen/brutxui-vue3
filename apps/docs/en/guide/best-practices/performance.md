# Performance Optimization Guide

This guide introduces strategies to optimize application performance when building with BrutxUI.

## 1. Tree-shaking & Imports

### 1.1 Entry Point Imports (Recommended)

BrutxUI supports tree-shaking natively, allowing bundlers to automatically strip unused components during compilation:

```typescript
// Recommended: Tree-shaking is handled automatically by bundlers
import { Button, Input, Card } from 'brutx-ui-vue'
import 'brutx-ui-vue/styles.css'
```

### 1.2 Sub-path Imports (Stable Allowlist)

The root entry is the stable component import surface for BrutxUI. Sub-path imports are supported only for the stable allowlist declared in `package.json` `exports`: `button`, `input`, `dialog`, `toast`, `form`, `select`, `dropdown-menu`, `table`, `card`, `tabs`, `calendar`, `carousel`, `code-block`, `hooks`, `locales`, `devtools-plugin`, and the style entries. Import components that are not listed here from the root entry.

```typescript
// Use direct imports only for allowlisted sub-paths
import { Button, buttonVariants } from 'brutx-ui-vue/button'
import { Dialog, DialogContent } from 'brutx-ui-vue/dialog'
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
      <div class="px-4 py-2 border-b border-brutal-border">
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

---

## 4. Debounce & Throttle

### 4.1 Input Search Debouncing

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDebounce } from 'brutx-ui-vue'

const searchQuery = ref('')
const [debouncedSearch, isDebouncing] = useDebounce(async (query: string) => {
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
    :loading="isDebouncing"
    @input="handleInput"
  />
</template>
```

### 4.2 Button Click Throttling

```vue
<script setup lang="ts">
import { useThrottle } from 'brutx-ui-vue'

const [throttledSubmit] = useThrottle(async () => {
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
import { useThrottle, useEventListener } from 'brutx-ui-vue'

const [throttledScrollHandler] = useThrottle((event: Event) => {
  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  // Process scroll values
}, 100)

useEventListener(window, 'scroll', throttledScrollHandler)
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
