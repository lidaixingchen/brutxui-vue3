# BrutxUI

极致的复制粘贴式 Neo-Brutalist Vue 3 & Tailwind CSS 组件库。大胆、原始、无障碍，100% 兼容 shadcn/ui 理念。

## 理念
BrutxUI 通过 JSON 注册表 CLI 按需分发组件，而非作为单体 node 依赖。你复制、粘贴、拥有代码。

## 视觉样式规则
- **边框：** 使用 `border-3 border-brutal` 的粗边框（使用 CSS 变量 `--brutal-border-color`，暗色模式自动切换）。
- **阴影：** 使用 `shadow-brutal`（4px 偏移）或 `shadow-brutal-lg`（6px 偏移）的硬偏移阴影。避免标准模糊阴影。
- **圆角：** 通过 `rounded-none` 实现锐利 0px 圆角，或使用全局令牌参数化类如 `rounded-brutal`。
- **过渡 / 按压：** 激活状态的物理按压位移效果：`active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all`。
- **对比度 / 强调色：** 霓虹饱和色：珊瑚红（`#FF6B6B`）、薄荷青（`#4ECDC4`）、饱和黄（`#FFE66D`）。

## 目录结构
- `apps/docs/`：VitePress 文档网站
- `packages/ui/`：核心 Vue 3 源代码模块（`brutx-ui-vue`）
  - `src/components/`：组件文件（如 `Button.vue`、`Card.vue`）
  - `src/composables/`：Vue 组合式函数（如 `useToast.ts`）
- `packages/cli/`：CLI 包命令（`brutx`），用于 `init` 和 `add`
- `packages/registry/`：动态 JSON 组件注册表构建器

## 核心命令
```bash
# 初始化 BrutxUI
npx brutx@latest init

# 添加原子组件
npx brutx@latest add button card dialog

# 添加所有组件
npx brutx@latest add --all
```

## 创建自定义组件
1. 将 Vue SFC 标记保存在 `packages/ui/src/components/MyComponent.vue`
2. 在同目录的 `my-component-variants.ts` 文件中扩展类变体权限（CVA）。
3. 根据嵌套深度从 `@/lib/utils` 或 `../lib/utils` 导入共享类合并工具 `cn`。
4. 使用 `<script setup lang="ts">` 配合 `defineProps<T>()` + `withDefaults()`。
5. 始终使用 `computed()` 进行动态类合并——切勿在模板中调用 `cn()`。
6. 保持 props 可预测、类型完善，并通过 reka-ui 原语实现无障碍访问。
