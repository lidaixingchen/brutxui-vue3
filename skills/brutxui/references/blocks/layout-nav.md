# 布局与导航区块

## HeaderSection

```vue
<HeaderSection
  :nav-items="[{ label: '首页', href: '/' }, { label: '文档', href: '/docs' }]"
  logo-text="BrutxUI" cta-text="注册"
  @cta-click="handleCta" @nav-click="handleNav"
/>
```

- `navItems`: `NavItem[]` — `{ label: string; href?: string }[]`
- `logoText`: `string`
- `ctaText`: `string`
- Events: `ctaClick()`, `navClick(index)`
- Slots: `header`, `default`, `footer`

## FooterSection

```vue
<FooterSection
  logo-text="BrutxUI" description="构建大胆的界面"
  :link-groups="[{ title: '产品', links: [{ label: '组件', href: '/components' }] }]"
  copyright="© 2024 BrutxUI"
  @link-click="handleLinkClick"
/>
```

- `logoText`/`description`/`copyright`: `string`
- `linkGroups`: `FooterLinkGroup[]` — `{ title: string; links: FooterLink[] }[]`
- `FooterLink`: `{ label: string; href?: string }`
- Events: `linkClick({ groupIndex, linkIndex })`
- Slots: `header`, `default`, `footer`

## DashboardShell

仪表盘外壳，含侧边栏和顶栏。

```vue
<DashboardShell user-email="user@example.com" @sign-out="handleSignOut">
  <template #sidebar><nav>侧边栏</nav></template>
  <template #header><span>标题</span></template>
  <template #default><h1>内容</h1></template>
</DashboardShell>
```

- `userEmail`: `string`
- Events: `signOut`
- Slots: `sidebar`, `header`, `default`

## Tabs (tabs prop 数据驱动模式)

```vue
<Tabs
  :tabs="[{ label: '概览', value: 'overview' }, { label: '设置', value: 'settings' }]"
  model-value="overview"
/>
```

- `tabs`: `TabItem[]` — `{ label: string; value: string }[]`，传入时自动渲染 TabsList/TabsTrigger/TabsContent
- `modelValue`: `string` — v-model，当前激活标签（未传时回退到首个 tab）
- Slots: `header`, `default`（替代默认 Card 内容）, `footer`
- 未传入 `tabs` 属性时，支持通过子组件插槽进行灵活的组合式自定义渲染

## 复合区块状态协同设计指引

在构建中大型业务系统（如管理后台或控制台仪表盘）时，往往需要将导航外壳、顶部状态栏、全局搜索框及弹窗命令面板有机整合。推荐使用以下**单向数据流与状态协同模板**。

### 多区块联动控制（三栏协同 Dashboard）
此示例展示了如何实现：
1. 监听全局快捷键 `Ctrl + K` 唤起 **Command** 命令面板。
2. **HeaderSection** 顶部搜索框与 **Command** 的搜索词双向协同。
3. **DashboardShell** 折叠状态及多层级导航激活项传递。


```vue
<script setup lang="ts">
import { ref, provide, readonly, onMounted, onUnmounted } from 'vue'
import { 
  DashboardShell, 
  HeaderSection, 
  Command, 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandGroup, 
  CommandItem, 
  Button 
} from 'brutx-ui-vue'

// 1. 全局搜索协同状态
const searchKeywords = ref('')
const isCommandOpen = ref(false)

function handleGlobalSearch(query: string) {
  searchKeywords.value = query
  // 此处可触发主表格区域数据的过滤请求
  console.log('执行全局搜索过滤：', query)
}

// 2. 快捷键监听：Ctrl + K 唤起全局命令面板
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    isCommandOpen.value = !isCommandOpen.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// 3. 侧边栏折叠状态共享（使用 Provide / Inject 避免深层 Prop 传递）
const isSidebarCollapsed = ref(false)
provide('collapsed-state', readonly(isSidebarCollapsed))

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 4. 用户登出
function handleSignOut() {
  console.log('用户退出登录')
}
</script>

<template>
  <div class="min-h-screen bg-brutal-muted">
    <!-- 外壳 -->
    <DashboardShell
      user-email="admin@company.com"
      :collapsed="isSidebarCollapsed"
      @sign-out="handleSignOut"
    >
      <!-- 1. 侧边栏内容 -->
      <template #sidebar>
        <div class="p-4 space-y-2">
          <div class="font-black text-lg" v-show="!isSidebarCollapsed">控制台</div>
          <nav class="flex flex-col space-y-1">
            <a href="#" class="px-3 py-2 border-3 border-brutal bg-brutal-primary font-bold shadow-brutal-sm">
              概览
            </a>
            <a href="#" class="px-3 py-2 border-3 border-transparent hover:border-brutal hover:bg-white transition-all font-bold">
              系统设置
            </a>
          </nav>
        </div>
      </template>

      <!-- 2. 顶部 Header -->
      <template #header>
        <div class="flex flex-1 items-center justify-between px-4">
          <!-- 切换侧边栏折叠的按钮 -->
          <Button size="sm" variant="outline" @click="toggleSidebar">
            {{ isSidebarCollapsed ? '展开' : '折叠' }}
          </Button>

          <!-- 顶部导航和输入框 -->
          <HeaderSection class="border-none py-0 shadow-none">
            <template #search>
              <div class="relative max-w-sm">
                <!-- 点击直接唤起全局搜索面板，并提示快捷键 Ctrl+K -->
                <input
                  type="text"
                  placeholder="搜索文档或操作 (Ctrl+K)..."
                  readonly
                  class="w-64 cursor-pointer rounded-brutal border-3 border-brutal px-3 py-1 text-sm bg-white shadow-brutal-sm focus:outline-none"
                  @click="isCommandOpen = true"
                />
              </div>
            </template>
          </HeaderSection>
        </div>
      </template>

      <!-- 3. 主展示区 -->
      <template #default>
        <div class="p-6 space-y-6">
          <div class="border-3 border-brutal bg-white p-6 shadow-brutal">
            <h2 class="text-2xl font-black mb-4">主面板内容</h2>
            <p v-if="searchKeywords" class="font-bold text-brutal-primary mb-4">
              当前搜索关键词：{{ searchKeywords }}
            </p>
            <p class="text-brutal-muted-foreground">
              这是主数据展示区。请尝试使用 Ctrl+K 唤起命令面板，或使用顶部搜索框更新这里的过滤状态。
            </p>
          </div>
        </div>
      </template>
    </DashboardShell>

    <!-- 4. 全局浮动命令面板 -->
    <CommandDialog v-model:open="isCommandOpen">
      <CommandInput 
        placeholder="搜索操作或资源..." 
        @update:model-value="handleGlobalSearch"
      />
      <CommandList>
        <CommandGroup heading="快捷跳转">
          <CommandItem value="overview" @select="isCommandOpen = false">
            跳转至概览页
          </CommandItem>
          <CommandItem value="settings" @select="isCommandOpen = false">
            跳转至系统设置
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="快捷操作">
          <CommandItem value="signout" @select="handleSignOut(); isCommandOpen = false">
            安全退出
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  </div>
</template>
```

