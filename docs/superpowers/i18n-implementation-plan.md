# 文档网站中文化改造方案

> 目标：消除文档网站中所有非必要的英文残留，统一为简体中文；404 页面使用项目自身的 NotFoundPage 组件，体现组件库特色。

---

## 改动清单

| # | 文件 | 操作 | 改动量 |
|---|------|------|--------|
| 1 | `apps/docs/.vitepress/config.ts` | 修改 | ~30 行 |
| 2 | `apps/docs/.vitepress/theme/Layout.vue` | 新建 | ~20 行 |
| 3 | `apps/docs/.vitepress/theme/index.ts` | 修改 | 2 行 |
| 4 | `apps/docs/.vitepress/theme/components/InstallationTabs.vue` | 修改 | 6 处 |
| 5 | `apps/docs/.vitepress/theme/components/ThemePlayground.vue` | 修改 | ~30 处 |

---

## 1. config.ts — 核心配置改动

**文件**：`apps/docs/.vitepress/config.ts`

### 1.1 添加 `lang` 属性

在 `defineConfig` 顶层添加 `lang: 'zh-CN'`，使构建产物的 `<html lang="zh-CN">`。

```ts
export default defineConfig({
    lang: 'zh-CN',   // ← 新增
    title: 'BrutxUI',
    // ...
})
```

### 1.2 添加 VitePress 主题内置文案的中文覆盖

在 `themeConfig` 中添加 `locales` 配置，覆盖 VitePress 默认主题的所有英文文案：

```ts
themeConfig: {
    // ... 现有配置 ...
    locales: {
        root: {
            label: '简体中文',
            // 页面目录
            outline: {
                label: '本页目录',
                level: [2, 3],
            },
            // 最后更新时间
            lastUpdated: {
                text: '最后更新于',
            },
            // 页脚导航（上一页 / 下一页）
            docFooter: {
                prev: '上一页',
                next: '下一页',
            },
            // 回到顶部
            returnToTop: '回到顶部',
            // 外观切换
            darkModeSwitchLabel: '外观',
            // 侧边栏菜单（移动端）
            sidebarMenuLabel: '菜单',
            // 移动端返回按钮
            returnToTopLabel: '回到顶部',
        },
    },
},
```

### 1.3 修改 footer 英文标语

将 `Built with brute force.` 改为中文：

```ts
footer: {
    message: '蛮力铸就。',   // ← 原为 'Built with brute force.'
    copyright: `© ${new Date().getFullYear()} BrutxUI · MIT License`,
},
```

---

## 2. Layout.vue — 自定义 404 布局

**文件**：`apps/docs/.vitepress/theme/Layout.vue`（新建）

VitePress 的 DefaultTheme 提供了 `not-found` 插槽，用于自定义 404 页面。创建一个 Layout.vue 继承默认主题，用项目自身的 `NotFoundPage` 组件替换默认的英文 404 页面。

```vue
<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useRouter } from 'vitepress'
import { NotFoundPage } from 'brutx-ui-vue'

const { Layout } = DefaultTheme
const router = useRouter()

function handleBack() {
    router.go('/')
}
</script>

<template>
    <Layout>
        <template #not-found>
            <NotFoundPage
                title="页面未找到"
                description="您访问的页面不存在或已被移除。"
                back-text="返回首页"
                @back="handleBack"
            />
        </template>
    </Layout>
</template>
```

**效果**：访问不存在的路径时，展示带有 GlitchText 故障动画的 404 页面，而非 VitePress 默认的英文 404。

---

## 3. index.ts — 注册 Layout 组件

**文件**：`apps/docs/.vitepress/theme/index.ts`

在 theme 的 `Layout` 字段中指定自定义布局：

```ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'   // ← 新增导入
// ... 其他 import ...

export default {
    extends: DefaultTheme,
    Layout,   // ← 新增，覆盖默认 Layout
    enhanceApp({ app }) {
        // ... 现有组件注册 ...
    },
} satisfies Theme
```

---

## 4. InstallationTabs.vue — 安装步骤文案汉化

**文件**：`apps/docs/.vitepress/theme/components/InstallationTabs.vue`

| 定位方式 | 原文 | 改为 |
|----------|------|------|
| 搜索 `Manual` | `Manual` | `手动` |
| 搜索 `1. Install dependencies` | `1. Install dependencies` | `1. 安装依赖` |
| 搜索 `Copy the component source from GitHub` | `Copy the component source from GitHub` | `从 GitHub 复制组件源码` |
| 搜索 `View on GitHub` | `View on GitHub` | `在 GitHub 上查看` |
| 搜索 `Save to your project` | `Save to your project` | `保存到你的项目` |
| 搜索 `Import and use` | `Import and use` | `导入并使用` |

具体改动：

```diff
-                Manual
+                手动

-                        1. Install dependencies
+                        1. 安装依赖

-                        {{ resolvedDeps.length > 0 ? '2' : '1' }}. Copy the component source from GitHub
+                        {{ resolvedDeps.length > 0 ? '2' : '1' }}. 从 GitHub 复制组件源码

-                        View on GitHub
+                        在 GitHub 上查看

-                        {{ resolvedDeps.length > 0 ? '3' : '2' }}. Save to your project
+                        {{ resolvedDeps.length > 0 ? '3' : '2' }}. 保存到你的项目

-                        {{ resolvedDeps.length > 0 ? '4' : '3' }}. Import and use
+                        {{ resolvedDeps.length > 0 ? '4' : '3' }}. 导入并使用
```

---

## 5. ThemePlayground.vue — 主题实验室文案汉化

**文件**：`apps/docs/.vitepress/theme/components/ThemePlayground.vue`

### 5.1 预览区卡片标题与数据

| 定位方式 | 原文 | 改为 |
|----------|------|------|
| 搜索 `Live preview` | `Live preview` | `实时预览` |
| 搜索 `Primary`（Badge variant="primary"） | `Primary` | `主要` |
| 搜索 `Secondary`（Badge variant="secondary"） | `Secondary` | `次要` |
| 搜索 `Accent`（Badge variant="accent"） | `Accent` | `强调` |
| 搜索 `Launch Console` | `Launch Console` | `启动控制台` |
| 搜索 `Live`（Badge variant="success"） | `Live` | `上线` |
| 搜索 `Revenue` | `Revenue` | `收入` |
| 搜索 `+18% this week` | `+18% this week` | `本周 +18%` |
| 搜索 `Active`（统计卡片标题） | `Active` | `活跃` |
| 搜索 `Users online` | `Users online` | `用户在线` |
| 搜索 `Shadow`（统计卡片标题） | `Shadow` | `阴影` |
| 搜索 `Hard offset` | `Hard offset` | `硬偏移` |

### 5.2 表格与操作按钮

| 定位方式 | 原文 | 改为 |
|----------|------|------|
| 搜索 `Filter customers` | `Filter customers` | `筛选客户` |
| 搜索 `Create segment` | `Create segment` | `创建分群` |
| 搜索 `Account`（表头） | `Account` | `账户` |
| 搜索 `Status`（表头） | `Status` | `状态` |
| 搜索 `Risk`（表头） | `Risk` | `风险` |
| 搜索 `Healthy`（Badge） | `Healthy` | `健康` |
| 搜索 `Low`（Badge variant="outline"） | `Low` | `低` |
| 搜索 `Trial`（Badge variant="primary"） | `Trial` | `试用` |
| 搜索 `High`（Badge variant="danger"） | `High` | `高` |
| 搜索 `Ship preset` | `Ship preset` | `发布预设` |
| 搜索 `Pause account` | `Pause account` | `暂停账户` |
| 搜索 `View CSS` | `View CSS` | `查看 CSS` |

### 5.3 组件矩阵与提示

| 定位方式 | 原文 | 改为 |
|----------|------|------|
| 搜索 `Component Matrix` | `Component Matrix` | `组件矩阵` |
| 搜索 `Token-aware input` | `Token-aware input` | `令牌感知输入` |
| 搜索 `Info surface` | `Info surface` | `信息表面` |
| 搜索 `Alerts, cards and badges all inherit the local theme variables.` | `Alerts, cards and badges all inherit the local theme variables.` | `提示、卡片和徽标都继承本地主题变量。` |
| 搜索 `Danger surface` | `Danger surface` | `危险表面` |
| 搜索 `Destructive color contrast is checked below.` | `Destructive color contrast is checked below.` | `破坏性颜色对比度在下方检查。` |
| 搜索 `Swatches` | `Swatches` | `色板` |

### 5.4 质量检查与 CSS 输出

| 定位方式 | 原文 | 改为 |
|----------|------|------|
| 搜索 `Quality checks` | `Quality checks` | `质量检查` |
| 搜索 `Generated CSS` | `Generated CSS` | `生成的 CSS` |

### 5.5 保留英文的项

以下为组件 variant 名称或 CSS 属性标识，属于代码语义，保留英文原文：

- `Default` / `Primary` / `Accent` / `Danger` / `Success`（Button/Badge 的 variant 值展示）
- `BG:` / `FG:`（色板中的 CSS 变量前缀）
- `target X:1`（对比度阈值格式）

---

## 不改动项（有意保留）

| 位置 | 内容 | 原因 |
|------|------|------|
| 侧边栏 | `Button 按钮`、`Badge 徽标` 等 | 组件名 + 中文翻译的双语格式，业界惯例 |
| 代码示例 | CLI 命令、import 语句 | 代码本身应保持英文 |
| 组件文档 Markdown 正文 | 已全部为中文 | 无需改动 |

---

## 验证方式

改造完成后执行以下检查：

```powershell
# 1. 构建文档
pnpm --filter docs build

# 2. 检查 HTML lang 属性
Select-String -Path "apps/docs/.vitepress/dist/index.html" -Pattern 'lang="zh-CN"'
# 预期：有匹配

# 3. 检查 404 页面不再包含英文
Select-String -Path "apps/docs/.vitepress/dist/404.html" -Pattern "page not found|go to the home page" -CaseSensitive:$false
# 预期：无匹配

# 4. 本地预览
pnpm --filter docs dev
# 访问 http://localhost:5173/brutxui-vue3/任意不存在路径
# 预期：看到带 GlitchText 故障动画的中文 404 页面
```
