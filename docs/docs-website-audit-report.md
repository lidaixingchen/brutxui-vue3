# apps/docs 文档网站全面审查报告

> **审查日期**: 2026-06-28
> **审查范围**: apps/docs 目录下的 VitePress 文档网站
> **审查维度**: 配置、SEO、可访问性、样式、代码质量、依赖管理

---

## 📊 问题统计总览

| 类别 | 🔴 高 | 🟡 中 | 🟢 低 | 合计 |
|------|--------|--------|--------|------|
| SEO | 2 | 3 | 1 | 6 |
| 配置 | 4 | 2 | 3 | 9 |
| 文档内容 | 3 | 2 | 2 | 7 |
| 样式/CSS | 5 | 6 | 1 | 12 |
| 代码质量 | 0 | 4 | 3 | 7 |
| 依赖/构建 | 2 | 4 | 0 | 6 |
| 可访问性 | 2 | 1 | 0 | 3 |
| **合计** | **18** | **22** | **10** | **50** |

---

## 🔴 高优先级问题（需立即修复）

### SEO 问题

#### 1. `og:image` 使用 SVG 格式
- **文件**: [config.ts:16](../apps/docs/.vitepress/config.ts#L16)
- **问题**: `og:image` 引用 SVG 文件，但 Facebook、Twitter、LinkedIn 等社交平台不支持 SVG 格式的 Open Graph 图片
- **影响**: 社交媒体分享预览无法显示图片
- **修复**: 将 `og-image.svg` 转换为 PNG 格式（推荐 1200x630px）

#### 2. `twitter:image` 缺失
- **文件**: [config.ts:17](../apps/docs/.vitepress/config.ts#L17)
- **问题**: `twitter:card` 设置为 `summary_large_image` 但未设置 `twitter:image`
- **影响**: Twitter 卡片无法显示大图预览
- **修复**: 添加 `twitter:image` meta 标签，指向 PNG 格式的图片

---

### 配置问题

#### 3. `theme_color` 不一致
- **文件**: [config.ts:12](../apps/docs/.vitepress/config.ts#L12) vs [manifest.json](../apps/docs/public/manifest.json)
- **问题**: 
  - config.ts: `#FFE66D`（黄色）
  - manifest.json: `#FF6B6B`（珊瑚红）
- **影响**: PWA 主题颜色在不同平台显示不一致
- **修复**: 统一为同一个颜色值

#### 4. `@` 别名在 Windows 上不可靠
- **文件**: [config.ts:266](../apps/docs/.vitepress/config.ts#L266)
- **问题**: 使用 `new URL('./.vitepress', import.meta.url).pathname` 在 Windows 上会产生带前导斜杠的 URL 编码路径
- **影响**: 某些工具链可能无法正确解析路径
- **修复**: 使用 `import.meta.dirname`：
  ```ts
  import { resolve } from 'node:path'
  '@': resolve(import.meta.dirname, '.vitepress'),
  ```

#### 5. 扁平侧边栏结构
- **文件**: [config.ts:58-247](../apps/docs/.vitepress/config.ts#L58-L247)
- **问题**: 侧边栏使用扁平数组，100+ 条目全部显示在每个页面
- **影响**: 用户在阅读指南时看到所有组件和区块，UX 极差
- **修复**: 改为按路由分组的侧边栏：
  ```ts
  sidebar: {
    '/guide/': [ /* 指南条目 */ ],
    '/components/': [ /* 组件条目 */ ],
    '/blocks/': [ /* 区块条目 */ ],
  }
  ```

#### 6. 两个区块在侧边栏中路径分类不一致
- **文件**: 
  - `blocks/saas-pricing.md` — 侧边栏链接为 `/components/saas-pricing`（config.ts:192），非 `/blocks/saas-pricing`
  - `blocks/dashboard-stats.md` — 侧边栏链接为 `/components/dashboard-stats`（config.ts:150），非 `/blocks/dashboard-stats`
- **补充**: `components/` 目录下也存在同名文件，侧边栏链接指向的是组件版本而非区块版本
- **影响**: 区块页面可通过侧边栏访问，但路径归类为"组件"而非"区块"，语义不一致
- **修复**: 将侧边栏条目移至区块分组，或统一路径指向

---

### 文档内容问题

#### 7. `blocks/index.md` 缺少两个条目
- **文件**: [blocks/index.md](../apps/docs/blocks/index.md)
- **问题**: 索引页列出 31 个区块，但文件系统有 33 个
- **缺失**: `dashboard-stats` 和 `saas-pricing`
- **修复**: 在索引页添加这两个区块的链接

#### 8. 主题数量描述错误
- **文件**: 
  - [index.md:21](../apps/docs/index.md#L21): "支持 Classic / Pastel / Mono 三套主题预设"
  - [getting-started.md:76](../apps/docs/guide/getting-started.md#L76): "BrutxUI 内置三套主题预设"
- **问题**: 实际有 4 套主题（Classic、Pastel、Mono、Warm）
- **修复**: 更新为"四套"并添加 Warm 主题

#### 9. `not-found-page.md` 代码示例风格不一致
- **文件**: [not-found-page.md:55](../apps/docs/blocks/not-found-page.md#L55)
- **问题**: 使用 `@back="() => $router.push('/')"` 通过模板全局属性访问路由，虽然在 Vue 3 模板中可正常运行，但与项目其他示例统一使用 Composition API 的风格不一致
- **影响**: 无功能问题，但代码风格不统一
- **修复**: 统一使用 Composition API：
  ```vue
  <script setup>
  import { useRouter } from 'vue-router'
  const router = useRouter()
  </script>
  <template>
    <NotFound @back="() => router.push('/')" />
  </template>
  ```

---

### 样式/CSS 问题

#### 10. 暗黑模式下 VPButton 文字颜色未覆盖
- **文件**: [style.css:356,376](../apps/docs/.vitepress/theme/style.css#L356)
- **问题**: `.VPButton.brand` 和 `.VPButton.alt` 的 `color: #000000` 在暗黑模式下无覆盖（[style.css:391-395](../apps/docs/.vitepress/theme/style.css#L391-L395) 仅覆盖了边框和阴影）
- **影响**: 对 Classic/Pastel/Warm 主题影响较小（亮色背景 + 黑字仍可读），但对 Mono 主题（`--brutal-primary: #000000`）会出现黑字黑底不可见的问题
- **修复**: 为 Mono 主题等暗色按钮背景添加 `.dark .VPButton` 文字颜色覆盖

#### 11. 移动端暗黑模式颜色问题
- **文件**: [style.css:925-941](../apps/docs/.vitepress/theme/style.css#L925-L941)
- **问题**: 移动端响应式使用硬编码 `#000000`，未包裹在 `.dark` 选择器中
- **影响**: 暗黑模式下移动端元素边框/阴影不可见
- **修复**: 为移动端添加 `.dark` 媒体查询覆盖

#### 12. VPBadge 暗黑模式缺失
- **文件**: [style.css:705-741](../apps/docs/.vitepress/theme/style.css#L705-L741)
- **问题**: `.VPBadge` 变体使用硬编码 `#000000`，无 `.dark` 覆盖
- **影响**: 徽章在暗黑模式下文字不可读
- **修复**: 添加 `.dark .VPBadge` 规则

#### 13. `.vp-raw` 和 reka-ui 区块 120 行重复代码
- **文件**: [style.css:988-1104](../apps/docs/.vitepress/theme/style.css#L988-L1104)
- **问题**: 两个选择器组的样式完全相同，可合并
- **影响**: 代码维护困难，文件体积增大
- **修复**: 合并为共享选择器列表：
  ```css
  .vp-raw,
  body > [id^="reka-"],
  body > [data-reka-popper-content-wrapper] {
    & button { ... }
    & a { ... }
    /* ... */
  }
  ```

#### 14. `revert-layer` 和 CSS 嵌套兼容性
- **文件**: [style.css:988-1104](../apps/docs/.vitepress/theme/style.css#L988-L1104)
- **问题**: 
  - `revert-layer` 在 Safari < 17.2 中不支持
  - CSS 原生嵌套 (`&`) 在 Safari < 17.2 中不支持
- **影响**: 旧版浏览器中组件预览样式完全失效
- **修复**: 添加回退样式或使用 PostCSS 插件转换

---

### 可访问性问题

#### 15. 指南页面缺少 frontmatter
- **文件**: 7 个指南页面
  - `guide/getting-started.md`
  - `guide/cli.md`
  - `guide/ai.md`
  - `guide/locale.md`
  - `guide/installation-vite.md`
  - `guide/installation-manual.md`
  - `guide/theme.md`
- **问题**: 缺少 `title` 和 `description` frontmatter
- **影响**: SEO 元描述重复，搜索引擎无法区分页面
- **修复**: 为每个页面添加：
  ```yaml
  ---
  title: 快速开始
  description: 了解如何开始使用 BrutxUI 组件库
  ---
  ```

#### 16. 表单演示组件缺少 `<label>`
- **文件**: 9+ 个演示组件
  - `InputDemo.vue`
  - `TextareaDemo.vue`
  - `SelectDemo.vue`
  - `ComboboxDemo.vue`
  - `SliderDemo.vue`
  - `DatePickerDemo.vue`
  - `ColorPickerDemo.vue`
  - `HardcoreInputDemo.vue`
  - `TagsInputDemo.vue`
- **问题**: 仅使用 placeholder，无 `<label>` 或 `aria-label`
- **影响**: 违反 WCAG 2.1 SC 1.3.1，屏幕阅读器无法正确识别表单元素
- **修复**: 添加 `<label>` 元素或 `aria-label` 属性

#### 17. Checkbox/Radio/Switch 演示缺少标签
- **文件**: 
  - `CheckboxDemo.vue`
  - `RadioGroupDemo.vue`
  - `SwitchDemo.vue`
- **问题**: 无 `aria-label`，相邻 `<span>` 未与控件关联
- **影响**: 辅助技术无法理解控件用途
- **修复**: 添加 `aria-label` 或使用 `<label>` 关联

---

### 依赖/构建问题

#### 18. VitePress 与 Vite 版本不兼容
- **文件**: [package.json](../apps/docs/package.json)
- **问题**: VitePress 1.6.x 通常基于 Vite 5.x/6.x，但项目使用 Vite 8.x
- **影响**: 可能导致构建失败或运行时错误
- **修复**: 检查 VitePress 1.6.x 的 peerDependencies，降级 Vite 版本

#### 19. 缺少 UI 包预构建步骤
- **文件**: [package.json](../apps/docs/package.json)
- **问题**: docs 的 build 脚本直接运行 `vitepress build`，但依赖 `brutx-ui-vue` 的构建产物
- **影响**: 未先构建 UI 包时 CSS import 会失败
- **修复**: 添加 prebuild 脚本：
  ```json
  "prebuild": "pnpm --filter brutx-ui-vue build"
  ```

---

## 🟡 中优先级问题（建议修复）

### 配置问题

#### 20. `components/index.md` 无导航链接
- **文件**: [components/index.md](../apps/docs/components/index.md)
- **问题**: 组件总览页面存在但侧边栏和导航栏无链接指向
- **修复**: 在侧边栏顶部添加"组件总览"条目

#### 21. `transformHead` canonical URL 逻辑脆弱
- **文件**: [config.ts:25-28](../apps/docs/.vitepress/config.ts#L25-L28)
- **问题**: 仅处理根 `index.md`，未处理子目录 index 页
- **修复**: 使用更健壮的逻辑：
  ```ts
  pageUrl = pageUrl.replace(/\/index$/, '')
  ```

---

### SEO 问题

#### 22. `og:url` 未设置
- **文件**: [config.ts](../apps/docs/.vitepress/config.ts)
- **问题**: Open Graph 协议要求 `og:url` 用于正确分享
- **修复**: 在 `transformHead` 中动态注入 `og:url`

#### 23. JSON-LD 结构化数据是静态的
- **文件**: [config.ts:34-45](../apps/docs/.vitepress/config.ts#L34-L45)
- **问题**: `url`、`name`、`description` 对所有页面相同
- **修复**: 使用页面特定的 frontmatter 数据

#### 24. `og:image` 使用相对路径
- **文件**: [config.ts:16](../apps/docs/.vitepress/config.ts#L16)
- **问题**: 社交媒体爬虫可能无法解析相对路径
- **修复**: 使用绝对 URL：`https://lidaixingchen.github.io/brutxui-vue3/og-image.png`

---

### 文档内容问题

#### 25. 章节标题中英文不一致
- **问题**: 
  - Props 章节：约一半用 `## Props`，一半用 `## 属性`
  - Events 章节：2 个文件用 `## Events`，其余用 `## 事件`
  - Slots 章节：2 个文件用 `## Slots`，其余用 `## 插槽`
- **受影响文件**: 
  - `command.md:215` - `## Events`
  - `virtual-scroll.md:88` - `## Events`
  - `data-table.md:340` - `## Slots`
  - `loading-page.md:63` - `## Slots`
- **修复**: 统一使用中文标题 `## 属性`、`## 事件`、`## 插槽`

#### 26. Warm 主题 `*-foreground` 变量未文档化
- **文件**: [theme.md](../apps/docs/guide/theme.md)
- **问题**: Warm 主题引入 6 个 `*-foreground` 变量，但令牌参考表中未列出
- **缺失变量**:
  - `--brutal-primary-foreground`
  - `--brutal-secondary-foreground`
  - `--brutal-accent-foreground`
  - `--brutal-destructive-foreground`
  - `--brutal-success-foreground`
  - `--brutal-info-foreground`
- **修复**: 在主题文档的 CSS 变量表中添加这些变量

---

### 样式/CSS 问题

#### 27. `.codeblock-wrapper::before` 引用不存在的类
- **文件**: [style.css:591-601](../apps/docs/.vitepress/theme/style.css#L591-L601)
- **问题**: 项目中无任何文件使用 `codeblock-wrapper` 类
- **修复**: 删除这段死代码

#### 28. 侧边栏悬停暗黑模式规则冗余
- **文件**: [style.css:300-306](../apps/docs/.vitepress/theme/style.css#L300-L306)
- **问题**: `.dark .VPSidebarItem` 规则与亮色模式完全相同（使用 CSS 变量自动解析）
- **修复**: 删除冗余的暗黑模式覆盖

#### 29. 字体定义重复 3 次
- **文件**: [style.css:38,150,509](../apps/docs/.vitepress/theme/style.css#L38)
- **问题**: `Space Grotesk` 字体在 `--vp-font-family-base`、`body`、`h1-h4` 三处定义
- **修复**: 仅保留 `--vp-font-family-base` 定义

#### 30. 暗黑模式缺少多个 VitePress 变量
- **文件**: [style.css:103-143](../apps/docs/.vitepress/theme/style.css#L103-L143)
- **问题**: `.dark` 块缺少以下变量覆盖：
  - `--vp-code-bg` / `--vp-code-color`
  - `--vp-home-hero-name-color` / `--vp-home-hero-name-background`
  - `--vp-c-tip-text` / `--vp-c-warning-text` / `--vp-c-danger-text`
  - `--vp-button-brand-hover-bg` / `--vp-button-alt-bg`
- **修复**: 在 `.dark` 选择器中添加这些变量

#### 31. 缺少 `prefers-reduced-motion` 支持
- **文件**: style.css 全局
- **问题**: 所有 `transition` 和 `transform` 动画对请求减少动画的用户仍然播放
- **修复**: 添加：
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

#### 32. 表格在窄屏幕上溢出
- **文件**: [style.css:663](../apps/docs/.vitepress/theme/style.css#L663)
- **问题**: 表格设置 `min-width: 600px` 但无 `overflow-x: auto` 包装
- **修复**: 为表格容器添加水平滚动

---

### 代码质量问题

#### 33. 未使用的 `ref` 导入
- **文件**: [CarouselDemo.vue:2](../apps/docs/.vitepress/theme/components/demos/CarouselDemo.vue#L2)
- **问题**: 导入 `ref` 但从未使用
- **修复**: 移除未使用的导入

#### 34. 未使用的变量
- **文件**:
  - [HardcoreInputDemo.vue:8](../apps/docs/.vitepress/theme/components/demos/HardcoreInputDemo.vue#L8): `value4` 未使用
  - [ToggleDemo.vue:9-10](../apps/docs/.vitepress/theme/components/demos/ToggleDemo.vue#L9-L10): `outlineSmPressed` 和 `outlineLgPressed` 未使用
- **修复**: 删除未使用的变量

#### 35. 残留的 `console.log`
- **文件**:
  - [CommandDemo.vue:18](../apps/docs/.vitepress/theme/components/demos/CommandDemo.vue#L18)
  - [DashboardShellDemo.vue:16](../apps/docs/.vitepress/theme/components/demos/DashboardShellDemo.vue#L16)
- **修复**: 删除调试输出

#### 36. 弱 TypeScript 类型
- **文件**:
  - [DataTableDemo.vue:6](../apps/docs/.vitepress/theme/components/demos/DataTableDemo.vue#L6): `[key: string]: unknown` 索引签名
  - [DataTableSectionDemo.vue:12](../apps/docs/.vitepress/theme/components/demos/DataTableSectionDemo.vue#L12): `Record<string, unknown>[]`
- **修复**: 定义具体的接口类型

---

### 依赖/构建问题

#### 37. TypeScript 版本过于激进
- **文件**: [package.json:27](../apps/docs/package.json#L27)
- **问题**: TypeScript ^6.0.3 与 vue-tsc ^3.3.3 兼容性存疑
- **修复**: 验证兼容性或降级到 `^5.x`

#### 38. vue 作为独立依赖可能导致重复
- **文件**: [package.json:19](../apps/docs/package.json#L19)
- **问题**: VitePress 自带 Vue 运行时，显式声明可能导致多份拷贝
- **修复**: 考虑移除或移到 peerDependencies

#### 39. 重复的依赖声明
- **文件**: [package.json:15-16](../apps/docs/package.json#L15-L16)
- **问题**: `clsx` 和 `tailwind-merge` 在 docs 和 ui 包中重复声明
- **修复**: 复用 `brutx-ui-vue` 的导出

#### 40. v-calendar 仅通过间接方式使用
- **文件**: [package.json:18](../apps/docs/package.json#L18)
- **问题**: docs 中无 Vue 组件直接 import v-calendar，但 [style.css:20](../apps/docs/.vitepress/theme/style.css#L20) 导入了其 CSS 样式，[InstallationTabs.vue:43](../apps/docs/.vitepress/theme/components/InstallationTabs.vue#L43) 的安装提示中也引用了该包
- **修复**: 评估是否可将 v-calendar 移至可选依赖或仅保留 CSS 引用

#### 41. InstallationTabs 缺少 ARIA 角色
- **文件**: [InstallationTabs.vue:200-227](../apps/docs/.vitepress/theme/components/InstallationTabs.vue#L200-L227)
- **问题**: 标签页按钮缺少 `role="tablist"`/`role="tab"`/`aria-selected` 和键盘导航
- **修复**: 添加 ARIA 角色和键盘事件处理

---

## 🟢 低优先级问题（可选优化）

### 配置问题

#### 42. 搜索 UI 未本地化
- **文件**: [config.ts:248-250](../apps/docs/.vitepress/config.ts#L248-L250)
- **问题**: 本地搜索界面默认英文标签
- **修复**: 添加中文翻译配置

#### 43. 缺少 `lastUpdated` 配置
- **文件**: [config.ts](../apps/docs/.vitepress/config.ts)
- **问题**: 未显示页面最后修改时间
- **修复**: 启用 `lastUpdated: true`

#### 44. 空的 `vite.plugins` 数组
- **文件**: [config.ts:269](../apps/docs/.vitepress/config.ts#L269)
- **修复**: 删除空数组或添加插件

---

### SEO 问题

#### 45. JSON-LD 缺少 `author` 属性
- **文件**: [config.ts:34-45](../apps/docs/.vitepress/config.ts#L34-L45)
- **修复**: 添加 `author` 字段

---

### 文档内容问题

#### 46. 区块 frontmatter 标题格式不统一
- **问题**: 组件使用双语标题（如 `title: Button 按钮`），区块仅使用英文
- **修复**: 统一为双语格式

#### 47. `installation-vite.md` 第 5 步冗余
- **文件**: [installation-vite.md:82-92](../apps/docs/guide/installation-vite.md#L82-L92)
- **问题**: "导入样式"步骤与第 2 步重复
- **修复**: 移除或合并到前面的步骤

---

### 样式/CSS 问题

#### 48. 缺少 `prefers-color-scheme` 媒体查询
- **问题**: OS 设置为暗色模式但 VitePress 未应用 `.dark` 类时会闪烁
- **修复**: 添加 `prefers-color-scheme` 媒体查询作为回退

---

### 代码质量问题

#### 49. 魔法数字重复
- **文件**: [CounterDemo.vue](../apps/docs/.vitepress/theme/components/demos/CounterDemo.vue)
- **问题**: `2000` 作为 `:duration` 重复 13 次
- **修复**: 提取为命名常量

#### 50. 外部图片 URL 依赖
- **文件**: `AvatarDemo.vue`, `GallerySectionDemo.vue`
- **问题**: 使用 `pravatar.cc` 和 `picsum.photos` 等外部服务
- **影响**: 服务不可用时演示会损坏
- **修复**: 使用本地占位图片

#### 51. 演示组件中英文标签混用
- **问题**: 部分文件使用中文标签（如"基础用法"），部分使用英文（如"Basic"）
- **修复**: 统一使用中文标签

---

### 依赖/构建问题

#### 52. tailwind.config.cjs 跨包引用源码
- **文件**: [tailwind.config.cjs:10,46](../apps/docs/tailwind.config.cjs#L10)
- **问题**: 直接引用 `packages/ui/src/` 下的源码文件，破坏包封装
- **修复**: 通过包的导出路径引用

---

## 🎯 推荐修复路线图

### 第一批（立即 - 1-2 天）
1. ✅ 将 `og-image.svg` 转换为 PNG 格式
2. ✅ 添加 `twitter:image` 和 `og:url` meta 标签
3. ✅ 修复 `theme_color` 不一致
4. ✅ 为 7 个指南页面添加 frontmatter
5. ✅ 更新主题数量为 4 套
6. ✅ 修复 `not-found-page.md` 代码示例
7. ✅ 在 `blocks/index.md` 添加缺失条目

### 第二批（短期 - 3-5 天）
1. ✅ 将侧边栏改为按路由分组
2. ✅ 修复暗黑模式硬编码颜色
3. ✅ 为表单演示添加 `<label>` 元素
4. ✅ 清理未使用的导入和变量
5. ✅ 添加 prebuild 脚本
6. ✅ 统一文档章节标题语言

### 第三批（中期 - 1-2 周）
1. ✅ 重构 style.css 减少重复代码
2. ✅ 优化响应式设计
3. ✅ 改进可访问性（ARIA 角色、键盘导航）
4. ✅ 清理重复依赖
5. ✅ 添加 `prefers-reduced-motion` 支持
6. ✅ 完善 SEO 配置（JSON-LD、per-page meta）

---

## 📝 审查方法

本次审查使用 5 个并行 Agent 进行：

1. **配置和构建审查** - 检查 VitePress 配置、构建脚本、依赖版本
2. **文档内容质量审查** - 检查文档结构一致性、链接有效性、内容准确性
3. **组件演示代码审查** - 检查 98 个 Demo 组件的代码质量
4. **样式和主题审查** - 检查 1107 行 CSS 代码、暗黑模式、响应式设计
5. **SEO 和可访问性审查** - 检查 meta 标签、ARIA 属性、WCAG 合规性

---

*报告生成时间: 2026-06-28*
*审查工具: Claude Code Agent 并行审查*

---

## ✅ 修正记录

> **修正日期**: 2026-06-28
> **修正方式**: 逐一核实报告中每个问题的实际代码，修正错误和不准确描述

| 编号 | 原描述 | 修正内容 |
| --- | --- | --- |
| #6 | "两个区块页面未在侧边栏列出" | 侧边栏实际有链接，但路径指向 `/components/` 而非 `/blocks/`，属于分类不一致而非缺失 |
| #9 | "`$router.push('/')` 在 `<script setup>` 中无效" | Vue 3 模板中 `$router` 作为全局属性可正常访问，代码可运行；修正为"风格不一致" |
| #10 | "暗黑模式下 VPButton 文字不可读" | 黑字在 Classic/Pastel/Warm 的亮色按钮背景上可读，主要影响 Mono 主题；修正措辞为"未覆盖" |
| #40 | "v-calendar 未直接使用" | style.css 导入了其 CSS，InstallationTabs.vue 引用了该包；修正为"仅通过间接方式使用" |
| #52 | "缺少 .gitignore" | 根目录 `.gitignore` 已包含 `dist` 和 `**/.vitepress/cache`，构建产物已被排除；**删除此条** |
| #54 | ".vitepress/dist 可能被提交" | 同 #52，根 `.gitignore` 的 `dist` 模式已覆盖；**删除此条** |
