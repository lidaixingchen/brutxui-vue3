# brutx-shared-vue

> BrutxUI Vue 3 全 Monorepo 跨包共享核心库：统一虚拟文件系统、设计令牌单一事实来源与元数据工具。

---

## 📦 核心职责与导出子路径

`brutx-shared-vue` 为 `brutx-ui-vue`、`brutx-vue`（CLI）、`brutx-registry-vue`（注册表编译器）与 `apps/docs` 提供单一事实来源的共享抽象：

| 导出子路径 | 模块说明 | 核心契约与功能 |
| --- | --- | --- |
| `brutx-shared-vue/fs` | 跨包统一虚拟文件系统 Seam | `FileSystemAdapter` 接口、`DiskFileSystemAdapter`（Node 22+ 原生 zero-dep）与 `MemoryFileSystemAdapter`（零 IO 纯内存测试树） |
| `brutx-shared-vue/design-tokens` | 全局设计令牌单一事实来源 | `DESIGN_TOKENS`、`THEME_TOKENS`、字体栈与主题对比度计算常量 |
| `brutx-shared-vue/scan` | 组件与依赖扫描工具 | 自动扫描 `packages/ui` 组件目录、生成依赖闭包与元数据 manifest |
| `brutx-shared-vue` | 共享类型与注册表契约 | `ComponentItem`、`ComponentCategory`、`DependencyGraph` 等领域类型 |

---

## 🏗 架构分层

```
packages/shared/
├── src/
│   ├── fs/                     # 跨平台虚拟文件系统 Seam
│   │   ├── types.ts                 # FileSystemAdapter 核心契约与选项
│   │   ├── disk-fs.ts               # 基于 node:fs/promises 的原生磁盘适配器
│   │   ├── memory-fs.ts             # 具备深拷贝隔离与原子子树迁移的纯内存适配器
│   │   └── index.ts                 # fs 模块统一出口
│   │
│   ├── design-tokens.ts        # 全工程设计令牌单一信源（禁止手动硬编码）
│   ├── scan.ts                 # 组件目录静态扫描器
│   ├── component-registry.ts   # 组件注册表契约与分类定义
│   └── index.ts                # 顶层公共类型导出
│
└── tests/                      # VFS 与共享工具单元测试
    ├── fs/
    │   ├── disk-fs.test.ts          # 物理磁盘适配器契约测试
    │   └── memory-fs.test.ts        # 内存适配器严格契约与异常测试
    └── extract-module-specifiers.test.ts
```

---

## 🛠 开发与测试

在 Monorepo 根目录下运行：

```bash
# 运行 shared 包测试
pnpm --filter brutx-shared-vue test

# 类型检查
pnpm --filter brutx-shared-vue typecheck

# 代码规范检查
pnpm --filter brutx-shared-vue lint
```
