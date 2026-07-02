# Shared & Registry 包改进建议

> 基于 `packages/shared/` 和 `packages/registry/` 源码全面审查，按优先级分为 **高 / 中 / 低** 三档。

---

## 一、数据一致性（高）

### 1. 9 个组件缺失于 `COMPONENTS`（高）

`COMPONENTS` 只有 91 条，但 `COMPONENT_FILES` 有 97 条。缺失的 9 个组件在 registry JSON 中 `dependencies` 永远为空数组，CLI 安装后可能导致依赖缺失。

**缺失组件：**

| 组件 | 影响 |
|------|------|
| `glitch-button` | 无依赖，影响较小 |
| `virtual-scroll` | 可能需要 `@tanstack/vue-virtual` |
| `input-adornment` | 无依赖 |
| `upload` | 可能需要 `axios` 或其他上传库 |
| `popconfirm` | 无依赖 |
| `descriptions` | 无依赖 |
| `infinite-scroll` | 可能需要 `@tanstack/vue-virtual` |
| `color-mode-switcher` | 无依赖 |
| `data-table` | 可能需要 `@tanstack/vue-table` |

**建议：**
- 立即补全 `COMPONENTS` 记录，确保每个组件都有准确的 `dependencies`
- 添加自动化校验脚本，防止未来再次不同步

### 2. `COMPONENTS` 与 `COMPONENT_FILES` 无交叉校验（高）

`validate-registry.ts` 只校验 `COMPONENT_FILES` 与 UI 源码目录的一致性，从不检查 `COMPONENTS` 是否同步。这是上述 9 个组件丢失的根因。

**现状：**
```ts
// packages/registry/scripts/validate-registry.ts
validateSourceConsistency(uiComponentsDir, componentFiles, registryDir);
// ❌ 缺少: validateComponentsSync(componentFiles, COMPONENTS)
```

**建议：**
- 在 `validate-registry.ts` 中新增 `validateComponentsSync()` 函数
- 检查 `COMPONENT_FILES` 的每个 key 都存在于 `COMPONENTS` 中
- 检查 `COMPONENTS` 的每个 key 都存在于 `COMPONENT_FILES` 中
- CI 管道中强制执行 `pnpm validate`

### 3. `FormConditional.vue` 未登记（高）

`packages/ui/src/index.ts` 导出了 `FormConditional`，但 `COMPONENT_FILES` 的 `form` 条目未列出此文件，registry build 会静默丢弃。

**建议：**
- 在 `COMPONENT_FILES['form'].files` 中添加 `'FormConditional.vue'`
- 添加自动化检查：扫描 UI 包的 `index.ts` 导出，确保所有导出的组件都在 registry 中

---

## 二、Locale 膨胀问题（高）

### 4. Locale 整体嵌入导致体积膨胀（高）

每个依赖 `useLocale` 的组件都内嵌完整的 `zh-CN.ts`（含 70+ 组件的翻译）和完整的 `locales/types.ts`（70+ 个接口定义）。这导致 registry JSON 文件严重膨胀。

**现状：**
- `button.json` 包含约 150 行 locale 代码，但 `button` 只用到了 `button.loading` 一个翻译键
- `index.json` 达到 482 KB，大量是重复的 locale 内容
- 每个组件 JSON 中 `zh-CN.ts` 和 `types.ts` 几乎完全相同

**建议：**

**方案 A：抽离 locale 为独立 registry item**
```json
{
    "name": "locale-zh-cn",
    "type": "registry:lib",
    "files": [
        { "path": "locales/zh-CN.ts", "content": "...", "type": "registry:lib" },
        { "path": "locales/types.ts", "content": "...", "type": "registry:lib" }
    ]
}
```

组件通过 `registryDependencies` 引用：
```json
{
    "name": "button",
    "registryDependencies": ["locale-zh-cn"],
    "files": [ ... ]
}
```

**方案 B：按需提取 locale 键**
- 静态分析每个组件实际使用的 locale 键（如 `button.loading`、`dialog.close`）
- 只提取这些键到组件的 locale 片段中
- CLI 安装时合并所有已安装组件的 locale 片段

**推荐方案 A**，因为更符合 shadcn registry 的设计哲学，且实现更简单。

---

## 三、类型与接口设计（中）

### 5. `ComponentMeta` 类型名冲突（中）

shared 的 `ComponentMeta`（注册表元数据）与 `packages/ui/src/lib/devtools-plugin.ts` 的 `ComponentMeta`（devtools 元数据）同名，IDE 自动导入容易引错。

**现状：**
```ts
// packages/shared/src/types.ts
export interface ComponentMeta {
    name: string;
    dependencies: string[];
    // ... registry metadata
}

// packages/ui/src/lib/devtools-plugin.ts
export interface ComponentMeta {
    name: string;
    version: string;
    registeredAt: number;
    // ... devtools metadata
}
```

**建议：**
- 将 shared 的 `ComponentMeta` 重命名为 `RegistryComponentMeta` 或 `ComponentRegistryEntry`
- 或将 devtools 的 `ComponentMeta` 重命名为 `DevtoolsComponentMeta`
- 更新所有引用

### 6. `ComponentMeta` 死字段过多（中）

`ComponentMeta` 上 5 个字段从未被任何条目填充、也从未被任何消费者读取：

| 字段 | 定义位置 | 填充情况 | 消费情况 |
|------|----------|----------|----------|
| `title` | `types.ts` | 从未填充 | 从未读取 |
| `description` | `types.ts` | 从未填充 | 从未读取 |
| `tailwind` | `types.ts` | 从未填充 | 从未读取 |
| `cssVars` | `types.ts` | 从未填充 | 从未读取 |
| `optionalDependencies` | `types.ts` | 仅 `form` 填充 | 从未读取 |

此外，`name` 字段与对象 key 完全重复，也是死字段。

**建议：**
- 如果计划未来使用这些字段，添加注释说明意图
- 否则删除这些字段，保持类型精简
- 删除 `name` 字段，改用 `Record<string, Omit<ComponentMeta, 'name'>>`

### 7. `ComponentFileMapping.locales` 字段从未使用（中）

接口定义了 `locales?: string[]` 但 `COMPONENT_FILES` 无任何条目填充，locale 依赖完全靠动态提取。

**现状：**
```ts
// packages/registry/scripts/component-files.ts
export interface ComponentFileMapping {
    files: string[];
    composables?: string[];
    locales?: string[]; // ❌ 从未使用
}
```

**建议：**
- 删除 `locales` 字段，因为 locale 依赖总是通过 `extractLocaleDeps()` 动态发现
- 或明确其用途并在文档中说明

---

## 四、构建脚本质量（中）

### 8. `extract*Deps` 函数存在死代码（中）

`extractComposableDeps`、`extractLibDeps`、`extractLocaleDeps` 三个函数的 `../../` 和 `../` 正则模式永远不会匹配——因为 `rewriteImports` 已经先把所有路径重写成了 `@/` 前缀。

**现状：**
```ts
// packages/registry/scripts/build-registry.ts
function extractComposableDeps(content: string): string[] {
    const patterns = [
        /@\/composables\/([a-zA-Z0-9-_]+)/g,        // ✅ 会匹配
        /\.\.\/\.\.\/composables\/([a-zA-Z0-9-_]+)/g, // ❌ 永不匹配
        /\.\.\/composables\/([a-zA-Z0-9-_]+)/g,       // ❌ 永不匹配
    ];
    // ...
}
```

**建议：**
- 删除死模式，只保留 `@/` 前缀的匹配
- 简化函数签名，三个函数可合并为一个通用函数

### 9. description 模板化，无区分度（中）

所有 100 个组件共用同一句模板，`ComponentMeta.description` 虽然可选但从未被使用。

**现状：**
```ts
// packages/registry/scripts/build-registry.ts
const description = `A highly customizable neo-brutalist ${title} component built with Brutx design tokens for Vue 3.`;
```

**建议：**
- 在 `COMPONENTS` 中为每个组件填写有意义的 `description`
- 修改 `build-registry.ts` 优先使用 `COMPONENTS[name].description`，fallback 到模板
- 示例：
  ```ts
  'date-picker': {
      name: 'date-picker',
      dependencies: ['@vueuse/core'],
      description: 'A date picker with range selection, time input, and locale-aware formatting.',
  }
  ```

### 10. 文件 `type` 全部硬写 `registry:ui`（中）

variants、composable、locale、lib 文件都标记为 `registry:ui`，shadcn schema 支持更细粒度的类型。

**现状：**
```ts
// packages/registry/scripts/build-registry.ts
files.push({
    path: `composables/${composable}`,
    content: composableContent,
    type: 'registry:ui', // ❌ 应该是 registry:hook
});
```

**建议：**
- 根据文件类型动态设置 `type`：
  - `.vue` 组件 → `registry:ui`
  - `*-variants.ts` → `registry:lib`
  - composables → `registry:hook`
  - locales → `registry:lib`
  - lib 工具函数 → `registry:lib`

### 11. `integrity` 哈希未被校验（中）

`build-registry.ts` 生成了 SHA-256 hash，但 `validate-registry.ts` 从不检查它。

**建议：**
- 在 `validate-registry.ts` 中添加 `integrity` 校验
- 重新计算所有文件内容的 hash，与 JSON 中的 `integrity` 字段比对
- 不匹配则报错，防止篡改或构建错误

---

## 五、配置与工具链（低）

### 12. shared 包 tsconfig 死配置（低）

`outDir: ./dist`、`declaration: true`、`declarationMap: true` 从未生效——没有 build 脚本，`package.json` 直接指向 `./src/index.ts`。

**现状：**
```json
// packages/shared/tsconfig.json
{
    "compilerOptions": {
        "declaration": true,
        "declarationMap": true,
        "outDir": "./dist"
    }
}
```

```json
// packages/shared/package.json
{
    "main": "./src/index.ts",
    "types": "./src/index.ts"
}
```

**建议：**
- 删除无用的 tsconfig 选项
- 或添加 build 脚本生成 `.js` 和 `.d.ts` 到 `dist/`，并更新 `package.json` 指向

### 13. `index.json` 缺少 `$schema`（低）

单个组件 JSON 有 `$schema`，但 `index.json` 本身及其条目都没有。

**建议：**
- 在 `index.json` 顶部添加 `$schema` 字段
- 为每个条目添加 `$schema` 字段，保持一致性

### 14. `LIB_FILE_EXCLUDE` 隐式契约（低）

排除了 `utils.ts`，假设消费者自带 `cn()` 工具函数，但无任何提示或文档告知。

**现状：**
```ts
// packages/registry/scripts/build-registry.ts
const LIB_FILE_EXCLUDE = new Set<string>(['utils.ts']);
```

**建议：**
- 在 registry JSON 中添加 `setupInstructions` 字段，说明需要手动创建 `lib/utils.ts`
- 或在 CLI 的 `init` 命令中自动创建 `lib/utils.ts` 文件
- 文档中明确说明此约定

### 15. 无增量构建能力（低）

构建脚本每次从头处理所有 97 个组件，无缓存或增量模式。CI/CD 场景下效率低下。

**建议：**
- 引入文件 hash 缓存（如 `.registry-cache.json`）
- 只重建内容变化的组件
- `index.json` 仍然全量生成，但单个组件 JSON 可跳过

### 16. 构建错误处理为全有或全无（低）

如果任一组件构建失败，`index.json` 不会被写入，导致整个 registry 不可用。

**现状：**
```ts
// packages/registry/scripts/build-registry.ts
if (errorCount > 0) {
    throw new Error(`Registry build completed with ${errorCount} error(s)`);
}
```

**建议：**
- 即使有错误也写入 `index.json`（排除失败的组件）
- 在 `index.json` 中标记失败组件为 `"status": "error"`
- CLI 在安装失败组件时给出明确提示

---

## 六、优先级排序建议

| 优先级 | 编号 | 改进项 | 包 | 工作量 |
|--------|------|--------|----|--------|
| P0 | #1 | 补全 9 个缺失组件 | shared | 0.5d |
| P0 | #2 | 添加交叉校验脚本 | registry | 0.5d |
| P0 | #3 | 登记 `FormConditional.vue` | registry | 0.5h |
| P0 | #4 | Locale 抽离为独立 registry item | registry | 2d |
| P1 | #5 | 重命名 `ComponentMeta` 避免冲突 | shared | 0.5d |
| P1 | #6 | 删除 `ComponentMeta` 死字段 | shared | 0.5h |
| P1 | #7 | 删除 `ComponentFileMapping.locales` | registry | 0.5h |
| P1 | #8 | 删除 `extract*Deps` 死代码 | registry | 0.5h |
| P1 | #9 | 填充有意义的 description | shared | 1d |
| P1 | #10 | 使用细粒度文件 `type` | registry | 0.5d |
| P1 | #11 | 添加 `integrity` 校验 | registry | 0.5d |
| P2 | #12 | 清理 shared tsconfig 死配置 | shared | 0.5h |
| P2 | #13 | 为 `index.json` 添加 `$schema` | registry | 0.5h |
| P2 | #14 | 文档化 `utils.ts` 约定 | registry | 0.5h |
| P2 | #15 | 增量构建能力 | registry | 2d |
| P2 | #16 | 改进构建错误处理 | registry | 0.5d |

---

## 七、实施建议

### 第一阶段：数据修复（1 天）

1. 补全 `COMPONENTS` 中缺失的 9 个组件
2. 在 `COMPONENT_FILES['form']` 中添加 `FormConditional.vue`
3. 在 `validate-registry.ts` 中添加 `validateComponentsSync()`
4. 运行 `pnpm build && pnpm validate` 确保通过

### 第二阶段：Locale 优化（2-3 天）

1. 创建 `locale-zh-cn` 独立 registry item
2. 修改 `build-registry.ts` 不再内嵌 locale
3. 为每个组件添加 `registryDependencies: ['locale-zh-cn']`
4. 更新 CLI 的 `add` 命令处理 locale 依赖
5. 验证安装流程正常

### 第三阶段：类型清理（1 天）

1. 重命名 `ComponentMeta` 为 `RegistryComponentMeta`
2. 删除死字段（`title`、`description`、`tailwind`、`cssVars`、`optionalDependencies`、`name`）
3. 删除 `ComponentFileMapping.locales`
4. 删除 `extract*Deps` 中的死模式
5. 运行 typecheck 确保无错误

### 第四阶段：质量提升（2 天）

1. 为每个组件填写有意义的 `description`
2. 实现细粒度文件 `type`（`registry:ui` / `registry:lib` / `registry:hook`）
3. 添加 `integrity` 校验
4. 文档化 `utils.ts` 约定
5. 更新所有测试用例
