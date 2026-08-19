# brutx-registry-vue

> BrutxUI Vue 3 注册表编译管道与静态 AST 转换引擎。

`brutx-registry-vue` 负责将 `packages/ui` 中的 Vue SFC 与 TypeScript 源码进行 AST 分析、规范化切片替换、传递依赖闭包计算与哈希缓存，生成符合 shadcn 规范的单组件 JSON 产物、`index.json` 索引、`registry-manifest.json` 清单以及 CycloneDX 1.5 SBOM 与 Ed25519 数字签名。

---

## 🏗 架构分层设计

包内源码严格遵循深模块（Deep Module）设计与零 IO 虚拟文件系统抽象：

```
packages/registry/
├── src/
├── compiler/               # 纯内存注册表编译核心管道（依赖 @/fs -> brutx-shared-vue/fs）
│   ├── types.ts                 # 编译器、SBOM、Manifest 数据结构定义
│   ├── ast-rewriter.ts          # 基于 TypeScript AST 的倒序切片替换与依赖提取
│   ├── dependency-resolver.ts   # 递归传递依赖闭包解析与 index.ts 派生生成
│   ├── cache-manager.ts         # 确定性 SHA-256 增量哈希计算与缓存持久化
│   └── registry-compiler.ts     # 纯计算流水线主编排控制器
│   │
│   ├── emitters/               # 产物发射与数据持久化
│   │   ├── sbom-generator.ts        # CycloneDX 1.5 确定性 SBOM 生成与校验
│   │   ├── manifest-signer.ts       # Ed25519 数字签名与验签服务
│   │   └── disk-emitter.ts          # 原子落盘发射器与过期孤儿文件扫描清理
│   │
│   ├── runner/                 # 运行时调度与命令行运行器
│   │   ├── benchmark-tracker.ts     # 性能基准指标追踪与指标文件记录
│   │   ├── watcher.ts               # 文件变更防抖监听与增量热重编调度器
│   │   └── build-runner.ts          # CLI 运行时入口（runBuild / runWatch）
│   │
│   └── index.ts                # 顶层公共模块导出
│
├── scripts/                    # 兼容层薄入口与校验脚本
│   ├── build-registry.ts       # CLI 构建薄入口（转发至 build-runner）
│   └── validate-registry.ts    # 产物结构与依赖图完整性校验器
│
└── tests/                      # 单元测试与端到端回归套件
```

---

## 🛠 开发与构建命令

在仓库根目录或本包目录下运行：

```bash
# 全量构建注册表产物
pnpm --filter brutx-registry-vue build

# 监听模式热重编（防抖增量构建）
pnpm --filter brutx-registry-vue build:watch

# 产物完整性与依赖图校验（88 items, 664 files）
pnpm --filter brutx-registry-vue validate

# 运行性能基准测试并输出 bench.json
pnpm --filter brutx-registry-vue bench

# 运行单元测试套件（125 个测试，100% 通过）
pnpm --filter brutx-registry-vue test

# 严格类型检查
pnpm --filter brutx-registry-vue typecheck

# 代码规范 Lint
pnpm --filter brutx-registry-vue lint
```

---

## 💡 核心设计特性

1. **零格式破坏的外科手术式 AST 切片重写**：
   - 提取 Vue SFC `<script>` 区间，基于 `ts.createSourceFile` 解析提取 `StringLiteral` 节点区间；
   - 采用降序字符切片替换算法，避免前序替换破坏后序位置偏移，100% 保留模板、样式、换行与注释。
2. **纯内存零 IO 编译器 Seam**：
   - 编译计算管道 `RegistryCompiler` 完全与物理磁盘解耦，通过依赖注入 `FileSystemAdapter` 驱动，支持使用 `MemoryFileSystemAdapter` 进行毫秒级全链路无副作用测试。
3. **确定性 CycloneDX 1.5 SBOM 与 Ed25519 签名**：
   - 遵循稳定的 UTF-16 码元排序与规范化序列化口径，确保在跨操作系统（Linux / macOS / Windows）环境下产物哈希与序列号 100% 确定性可验证。
4. **传递依赖闭包自动发现**：
   - 自动递归探测组件引用的子组件、`composables`、`locales`、`lib` 与 `directives`，并在产物中生成派生 barrel 文件。
