# 分发与公开 API 契约

本文档详述 BrutxUI 的双轨分发模型（npm 依赖 vs. CLI 源码安装）、公开 API 契约设计原理、内部 Helper 边界划分与版本升级时的用户修改保护机制。

---

## 一、 职责与边界：双轨交付物对比

BrutxUI 针对不同使用场景提供两种互补的分发与交付形态：

| 维度 | 通道 A：npm 预构建依赖包 (`brutx-ui-vue`) | 通道 B：CLI 源码交付模式 (`brutx-vue`) |
| --- | --- | --- |
| **交付形态** | 编译后的 ESM Bundle (`dist/index.js`)、120+ 独立子路径模块、TypeScript 声明文件 (`dist/**/*.d.ts`)、全局聚合样式表 (`dist/style.css`) | 原始 Vue 单文件组件 (`*.vue`)、TypeScript 变体文件 (`*-variants.ts`)、本地共享类型 (`types/*.ts`)、本地样式令牌与工具函数 |
| **安装方式** | `pnpm add brutx-ui-vue` | `npx brutx-vue add <component>` |
| **代码归属** | 位于 `node_modules`，属于外部第三方依赖 | 位于用户项目 `src/components/ui/`，属于项目自有源码 |
| **定制自由度** | 通过 Props、Slots、CSS 变量及变体 Class 进行配置 | 可直接修改组件模板结构、内部状态逻辑与 CVA 变体配置 |
| **升级维护模型** | 修改 `package.json` 版本号，包管理器统一锁版本 | 运行 `brutx-vue update` / `brutx-vue diff`，结合 AST 三方合并保护本地定制 |
| **依赖与包体积** | 引入 `node_modules` 依赖树，通过 Tree-shaking 消除未引用的组件 | 仅在用户项目中引入实际使用的依赖，零冗余组件包 |

---

## 二、 公开 API 契约架构

### 1. 单一事实来源：`api-contract.ts`

在 `packages/ui` 中，所有公共模块、具名导出与类型导出均由 [`packages/ui/api-contract.ts`](../../packages/ui/api-contract.ts) 显式声明，而非分散在各个源码文件中隐式导出。

- **模块层级划分**：
  - `foundation`：基础原子组件（`button`, `input`, `card`, `badge`, `dialog` 等）；
  - `composite`：复合交互组件（`combobox`, `tree-select`, `cascader`, `data-table` 等）；
  - `block`：预制区块模板（`brutalist-hero`, `pricing-section`, `auth-card` 等）；
  - `effect`：动效与视觉装饰（`glitch-text`, `card-3d`, `marquee` 等）；
  - `runtime/helper`：核心运行时工具与组合式函数（`useTheme`, `useReducedMotion`, `useLocale` 等）。
- **生成投影**：
  - 根入口 `packages/ui/src/index.ts`；
  - 各组件级入口 `packages/ui/src/components/<name>/index.ts`；
  - `package.json` 的 `exports` 映射清单；
  - 注册表构建元数据 `registry-manifest.json`。

### 2. 导出收敛与内部 Helper 隔离

在组件演进过程中，部分专用逻辑被抽离为辅助函数：
- **公共 Composable**（如 `useReducedMotion`、`useTheme`、`useDialogGeometry`）：在 `api-contract.ts` 中显式登记，享有长期的语义化版本兼容性承诺。
- **内部专用 Helper**（如 `useClearableSelection`、`useSelectableTrigger`、`useSelectionDisplayText`、`useTransferPanelSelection`）：从 npm 公共导出中彻底隔离，不作为公共 API 暴露，避免库内部实现演进导致下游破坏性断裂。

---

## 三、 CLI 源码交付与内部 Helper 处理

当用户通过 CLI 源码方式安装复合组件时（如 `Combobox`）：
1. **源码扫描与闭包计算**：`brutx-registry-vue` 在编译时递归扫描 AST，识别组件依赖的内部辅助函数（如 `useClearableSelection`）。
2. **随源码交付**：该内部 helper 的源码会被一并打包进对应组件的注册表 JSON 中，并落地到用户项目的组件子目录中。
3. **隔离的组件 index**：虽然源码文件被拷贝至本地，但组件的 `index.ts` 仅暴露契约规定的公共符号与类型，保证用户项目导入时依然遵循干净的接口契约。
4. **共享类型落位**：树型数据、通用选项等跨组件类型落位于 `src/types/` 或用户配置的 `sharedBase/types/`，避免重复定义。

---

## 四、 升级流程与用户修改保护

当上游组件库发布新版本且注册表更新时，源码安装模式下的升级策略如下：

1. **差异对比 (`brutx-vue diff`)**：
   - 用户运行 `npx brutx-vue diff <component>`；
   - CLI 获取上游最新注册表代码，与本地已存在的组件源码进行三向比较（Base / Upstream / Local）。
2. **冲突保护与合并 (`brutx-vue update`)**：
   - 默认采用防御性合并策略：若用户对本地组件的模板或变体样式做了修改，CLI 会保留用户修改，仅合并上游新增的 bugfix 或新 Props/Emits。
   - 若存在语义冲突，CLI 生成标记或创建备份文件，绝不直接静默覆盖用户修改。

---

## 五、 源码入口与核对检查点

### 1. 源码入口
- 契约定义：[`packages/ui/api-contract.ts`](../../packages/ui/api-contract.ts)
- 导出生成脚本：[`packages/ui/scripts/generate-exports.ts`](../../packages/ui/scripts/generate-exports.ts)
- 注册表编译核心：[`packages/registry/src/compiler/`](../../packages/registry/src/compiler)
- CLI 安装与升级逻辑：[`packages/cli/src/commands/add.ts`](../../packages/cli/src/commands) 与 `update.ts`
- 真实消费者集成测试：[`packages/cli/scripts/test-consumers.mjs`](../../packages/cli/scripts/test-consumers.mjs)

### 2. 修改检查点
- 修改组件公开导出时，运行 `pnpm check:exports` 验证契约一致性。
- 调整依赖或子路径时，运行 `pnpm test:consumers` 验证真实消费者打包与安装。
- 确保内部 helper 不泄漏至 `api-contract.ts` 的 public 列表。
