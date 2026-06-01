# 组件注册表系统

Brutx 通过**基于注册表的架构**分发 Vue 3 组件。用户无需安装一个包含所有样式和布局的大型 npm 包，而是直接将所需组件拉取到本地代码库中。

---

## 工作原理

每个组件定义为存储在 `packages/registry/registry/[name].json` 中的静态 JSON 文件。

当用户运行 `npx brutx add [component]` 时，CLI 会：
1. 使用 DFS 拓扑排序递归解析所有依赖和子组件（`registryDependencies`）。
2. 从 GitHub 远程注册表获取 JSON 文件（或在离线模式下从本地读取）。
3. 解析导入别名（例如 `@/lib/utils` 和 `@/components`），使其匹配用户自定义的工作区配置。
4. 将文件写入本地磁盘，并触发项目的包管理器安装 npm 依赖。

---

## 注册表 JSON Schema

每个注册表项遵循以下 TypeScript Schema 结构：

```json
{
  "name": "combobox",
  "type": "registry:ui",
  "dependencies": [
    "cmdk"
  ],
  "registryDependencies": [
    "button",
    "popover",
    "command"
  ],
  "files": [
    {
      "path": "components/ui/Combobox.vue",
      "content": "<script setup lang=\"ts\">\nimport { computed } from 'vue'\n..."
    }
  ]
}
```

### 字段说明
- **`name`** *(string)*：组件的唯一标识符。
- **`type`** *(string)*：注册表项的类型（通常为 `"registry:ui"`）。
- **`dependencies`** *(string[])*：此组件所需的第三方 npm 包（例如 `lucide-vue-next`、`reka-ui`）。
- **`registryDependencies`** *(string[])*：此组件所需的其他 Brutx 组件。
- **`files`** *(Array)*：要写入用户项目的文件列表，包含相对于组件别名的路径和原始文件字符串内容。

---

## 向注册表添加新组件

要动态添加新组件：

1. 在 `packages/ui/src/components/[name].vue` 或 `packages/ui/src/components/ui/[name].vue` 中创建 Vue 3 组件。
2. 在 `packages/cli/src/lib/constants.ts` 的 CLI `COMPONENTS` 元数据常量中声明它：
   ```typescript
   export const COMPONENTS = {
     // ...
     "new-component": {
       name: "new-component",
       dependencies: ["some-npm-package"]
     }
   }
   ```
3. 运行自动化注册表打包脚本：
   ```bash
   pnpm --filter brutx-registry build
   ```
   此脚本将：
   - 读取模板代码。
   - 使用正则表达式检测文件中导入的其他 Brutx 组件，并将它们添加为 `registryDependencies`。
   - 将所有内容打包为 `packages/registry/registry/` 中的静态 `.json` Schema 文件。
4. 提交更改并推送到 GitHub。注册表发布后，该组件即可从远程注册表获取。
