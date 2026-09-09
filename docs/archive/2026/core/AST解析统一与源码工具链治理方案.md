---
方案类型: 重构 / 工程治理
状态: done
日期: 2026-09-08
---

# AST 解析统一与源码工具链治理方案

## 一、目标与范围

将单文件源码解析收敛到 `brutx-shared-vue/ast`，使清单扫描、Registry 构建、CLI 路径转换对同一源码采用一致的语言识别、模块分类、偏移定位及错误处理规则；API 文档生成直接接入成熟的组件元数据语义引擎（vue-component-meta），与 shared/ast 的单文件轻量语法操作解耦。

本方案覆盖共享语法解析基础设施、现有消费端适配、主入口导出检查以及 API 文档语义工具链升级。目录枚举、JSON 清单映射、设计令牌计算继续按其数据模型处理。全仓持久化 AST、常驻分析服务与 CodeGraph 索引实现不属于本轮交付。

交付以正确性与单一解析契约为首要标准。速度、内存和分发体积通过测量评价，不预设提升比例。当前文档为待评审方案，以下接口及新增文件均为拟议设计。

## 二、现状与改造依据

| 位置 | 当前事实 | 改造方向 |
| --- | --- | --- |
| [sfc-ast-engine.ts](../../../../packages/shared/src/ast/sfc-ast-engine.ts) | 已组合 compiler-sfc、TypeScript 与 MagicString；提取和重写各自遍历模块节点 | 保留成熟解析器，统一节点定位与分类 |
| [extract-module-specifiers.ts](../../../../packages/shared/src/extract-module-specifiers.ts) | 独立实现脚本提取、AST 遍历和模块分类 | 消费端统一迁移后逐一清理重复实现 |
| [scan.ts](../../../../packages/shared/src/scan.ts) | 对外导出另一套模块提取能力 | 扫描子路径只承载目录与清单能力，源码解析从 ast 子路径导入 |
| [scan-component-files.ts](../../../../packages/shared/src/scan-component-files.ts) | 扫描时调用只接收内容的模块提取函数 | 传递真实文件名并处理解析结果完整性 |
| [Registry AST 重写器](../../../../packages/registry/src/compiler/ast-rewriter.ts) | 已委托 SfcAstEngine，叠加 Registry 路径及依赖规则 | 保留领域规则，使用统一结果与诊断 |
| [CLI 项目工具](../../../../packages/cli/src/lib/project.ts)、[项目上下文](../../../../packages/cli/src/lib/project-context.ts) | 存在 AST 引擎消费入口 | 显式传递语言上下文并在持久化前检查结果 |
| [API 文档生成器](../../../../packages/ui/scripts/generate-api-docs.ts) | 使用正则提取 script setup、props、emits 和 slots | 接入 vue-component-meta，由文档层建立属性过滤与动态默认值映射 |
| [导出生成器](../../../../packages/ui/scripts/generate-exports.ts) | JSON 映射之外，源码覆盖检查采用正则 | 对源码声明使用 AST，保留 JSON 映射 |

两套模块提取器对默认导入与内联 type 绑定的判断条件不同；共享引擎固定使用 TSX 模式，SFC 错误也未向调用方传递。API 文档生成器使用正则匹配无法正确处理 CVA 变体泛型与复杂类型计算。这些是需要测试固化的具体边界，实施前按现行代码复现，不将静态阅读当作全部缺陷已确认。

本方案在既有 AST 能力上继续治理，不替代关联方案中的工作区拓扑、文件事务或 Registry 编译器职责。关联方案保留原状态。

## 三、设计决策

### 3.1 解析器与模块边界

复用当前 TypeScript、compiler-sfc 和 MagicString 依赖，保持其轻量单文件语法解析定位。源码解析归属 shared，文件读取与写入由现有调用方和文件系统抽象负责。API 文档语义分析独立于 shared/ast，避免在单文件语法引擎中混入复杂的全局类型检查。

| 拟议模块 | 职责 | 对外边界 |
| --- | --- | --- |
| `packages/shared/src/ast/types.ts` | 输入、诊断、位置、模块引用和结果类型 | 类型与只读数据 |
| `packages/shared/src/ast/source-parser.ts` | SFC 分块、脚本模式选择、语法诊断与位置映射 | 包内解析会话 |
| `packages/shared/src/ast/module-references.ts` | 遍历并定位模块引用、聚合依赖事实 | 包内共享算法 |
| `packages/shared/src/ast/import-transformer.ts` | 生成编辑、转义替换字面量、验证转换结果 | 包内转换算法 |
| `packages/shared/src/ast/sfc-ast-engine.ts` | 组合解析、模块分析和转换入口 | 唯一源码解析门面 |
| `packages/shared/src/ast/index.ts` | 导出公共门面和稳定结果类型 | `brutx-shared-vue/ast` |

TypeScript 节点由解析会话持有。公共扫描与转换结果不暴露可变 AST，避免调用方写入节点或依赖编译器内部结构。

不按每个语法节点建立类或插件。模块拆分以职责、独立测试和真实复用为依据。

### 3.2 输入与语言识别

每次解析必须提供源码和文件名；内存源码使用带真实语言扩展名的虚拟文件名。调用方可以显式指定语言覆盖，覆盖优先于扩展名。取消通过源码包含 `<script` 等子串推断文件类型的行为。

语言映射集中定义：`.js/.mjs/.cjs` 使用 JS，`.jsx` 使用 JSX，`.ts/.mts/.cts` 使用 TS，`.tsx` 使用 TSX；`.vue` 先通过 compiler-sfc 解析。SFC 脚本缺省为 JS，`lang` 决定 TS/JS/TSX/JSX 模式；未知脚本语言返回诊断。

普通 script 与 script setup 均处理。`script src` 作为外部块引用返回，由具备文件解析能力的消费端解析其目标；引擎不隐式读取磁盘。模板预处理语言和自定义块保留元信息。

CSS 文件不会送入脚本解析器；扫描器仍收集样式文件，其 CSS 依赖关系由样式工具负责。所有调用方在进入 AST 门面前按文件类型分派。

### 3.3 统一结果模型

| 拟议类型 | 必备信息 | 契约 |
| --- | --- | --- |
| `SourceInput` | source、filename、可选语言覆盖 | 文件身份与语言明确 |
| `SourceDiagnostic` | code、severity、message、filename、可选 range | 诊断可排序，支持终端与结构化报告 |
| `SourceRange` | startOffset、endOffset、起止行列 | UTF-16 偏移，左闭右开；行列从 1 开始 |
| `ModuleReference` | kind、specifier 或表达式范围、isTypeOnly、range | 每次引用保留位置，不提前按路径去重 |
| `ModuleAnalysisResult` | references、dependencies、diagnostics、completeness | 聚合事实与逐次引用分别提供 |
| `TransformResult` | code、changed、diagnostics | 验证成功才返回可提交的新源码 |

完整性状态区分 `complete`、`partial`、`invalid`。`complete` 仅表示约定支持范围内的模块引用已处理，不表示拥有完整运行时调用图；无法静态确定的依赖标为 `partial`，语法错误标为 `invalid`。

诊断代码统一定义并导出类型；具体消息携带位置与原因。解析器告警转换为统一结构，禁止以空数组代表解析失败。

### 3.4 模块依赖口径与编译边界

采用保守的源码依赖口径，不以文件名（如 `*.types.ts`）等非确定性特征推测模块属性，任何普通 import 导入均确认为模块依赖事实：

- **顶层类型声明**：顶层 `import type` 与 `export type` 声明归类为纯类型依赖。
- **内联类型修饰与编译配置边界**：在 `verbatimModuleSyntax: true` 或保留空导入的编译配置下，`import { type Foo } from 'pkg'` 在编译产物中会保留为 `import {} from 'pkg'`，触发模块加载副作用。单文件 AST 解析无法预知最终用户的编译选项，因此内联 `type` 绑定默认保留运行时依赖事实，避免 Registry 遗漏依赖。
- **值引用与副作用**：默认导入、命名空间导入、混合值绑定、副作用导入与空导入声明均保留运行时依赖事实。
- **聚合规则**：同一路径聚合时，存在任一运行时引用即视为运行时依赖；存在任一动态引用即记录动态事实。遍历顺序不影响分类。
- **动态引用与候选**：`import(variable)`、带插值模板导入返回未解析引用与诊断，标为 `partial`；CommonJS `require` 调用标记为需要额外语义判断的候选引用，标为 `partial`，严格消费端直接拒绝。
- **源码一致性辅助**：可通过工具链规范（如 `@typescript-eslint/consistent-type-imports`）提升源码显式声明纯度，但解析器自身不以代码风格假设作为正确性依赖。

路径归一化、别名解析、组件归属及文件存在性仍由消费端负责。路径改写阶段保留查询参数和片段；文件解析阶段按现有规则处理，二者不共用会丢失源码信息的归一化结果。

### 3.5 错误与完整性策略

| 消费场景 | invalid | partial |
| --- | --- | --- |
| 交互式只读诊断 | 展示错误与可信的部分结果 | 展示已识别结果和未解析引用 |
| manifest / Registry 构建 | 当前批次失败，保留上次产物 | 当前批次失败，明确未解析来源 |
| CLI 源码转换 | 提交前失败，保持原文件 | 本轮转换失败，提示未覆盖引用 |
| API 文档生成 | 失败并定位组件 | 严格模式失败；预览模式明确标注未解析字段 |

API 文档严格模式为默认，预览模式必须显式启用。诊断展示入口可以容错，产生可分发产物的入口要求完整结果。错误策略由任务决定，引擎不自行打印日志或吞掉异常。

多文件任务先完成解析与输出计算，再进入现有事务或暂存发布流程。解析失败发生在提交之前；持久化阶段的回滚由原文件事务负责，AST 层不新增另一套事务设施。

## 四、源码转换契约

导入提取与导入改写共同消费 `ModuleReference`，重写不再维护另一套节点识别条件。

转换按原始源码坐标生成编辑，检查范围有效且互不重叠；通过 MagicString 应用。替换文本按原字面量定界符转义，覆盖引号、反斜杠、换行、反引号和模板插值起始符，不能直接拼接未转义路径。

提交结果前重新解析转换后的源码，并验证目标模块路径等于期望值。原字面量之外的内容保持原样，包括 CRLF、注释、模板、样式和自定义块。无实际替换时原样返回；相同目标策略重复执行保持幂等。

同一次分析内，每个脚本块只解析一次，依赖提取与编辑计算复用该结果。转换后解析属于正确性验证，不计为待消除的重复解析。

## 五、消费端迁移

### 5.1 shared、Registry 与 CLI

先建立统一引擎测试，再在同一批改动中更新 scan、Registry、CLI 的全部调用方，显式传递文件身份并消费诊断。最终解析导入统一指向 `brutx-shared-vue/ast`；`scan` 子路径保留目录和清单 API。

重复模块提取实现及其导出在调用方完成迁移后逐一删除，不保留兼容包装。既有测试中的有效设计契约迁入统一测试；若断言固化缺陷，则记录判断依据并修正断言，不能只以旧结果相同作为验收依据。

构建前后逐项对比 manifest 与 Registry 输出：变化必须能对应具体分类修正或诊断规则。自动生成文件只通过既有生成命令更新，Registry 的 Turbo 缓存配置保持项目约定。

### 5.2 主入口导出检查

在 UI scripts 下提取可独立测试的导出覆盖检查模块，生成器只负责编排。使用 AST 定位真实 ExportDeclaration，保留当前覆盖含义：组件 Vue 文件重导出或组件目录 barrel 导出有效；仅导出 variants 不算组件覆盖。

类型导出与运行时组件导出分开识别；支持换行、注释、引号差异、命名及星号重导出。字符串或注释中的伪 export 不计入结果。本轮检查直接重导出覆盖，不递归推断任意中间模块的传递导出。

### 5.3 API 文档语义提取

将生成器升级为基于成熟语义引擎的提取管线，与单文件语法解析解耦：

- **语义引擎集成**：接入官方维护的 `vue-component-meta`，基于项目真实 `tsconfig.json` 初始化 TypeScript 语言服务上下文，完整提取 props、emits、slots、exposed 元数据以及展开后的类型定义与 JSDoc 注释。原生支持 CVA 变体泛型计算（如 `VariantProps<typeof buttonVariants>`）、外部导入类型与原语继承。
- **领域模型与业务适配**：
  - **原生属性过滤**：针对继承自底层 HTML 属性或无头原语的丰富事件与属性，建立文档级白名单与黑名单过滤机制，确保组件文档聚焦核心业务参数。
  - **动态默认值映射**：针对组件逻辑中通过 `useLocale().t()` 等运行时 Composable 计算的多语言默认值，由文档模型维护专属映射规则与说明，弥补静态类型提取无法获取运行时状态的局限。
- **基准验证与渐进切换**：
  - 以当前包含复杂类型与变体索引的基准组件（如 `Button.vue`）及多语言复合组件为基线样本集，验证提取字段完整度、类型展开与 JSDoc 呈现。
  - 新生成器先输出到临时目录，与当前产物做结构比较，完成差异归因后切换正式输出入口。生成命令统一调用 pnpm。

## 六、依赖边界、构建门禁与性能治理

### 6.1 依赖定位与构建门禁

- **环境角色区分**：TypeScript、compiler-sfc 等解析依赖对 `packages/ui` 纯属构建期开发设施；对 `packages/cli` 则属于执行终端命令时的功能依赖。
- **产物隔离门禁**：
  - 源码边界：ESLint 配置架构规则，禁止 `packages/ui/src/` 运行时源码导入 `brutx-shared-vue/ast` 及任何编译器包。
  - 构建门禁：在 UI 包的 postbuild 校验与 CI 流程中，增加针对 `packages/ui/dist` 产物的静态依赖检查，自动化断言组件运行时产物中零编译器依赖残留。

### 6.2 性能与加载优化

- **命令级按需加载**：CLI 入口对 AST 转换模块采用动态 `import()`，仅在实际执行文件写入与别名转换的命令路径（如 `brutx add`）加载编译器，避免无编译需求的命令（如 `init` 问答、版本查询）承受冷启动加载开销。
- **会话级解析复用**：单次任务内按源码哈希复用解析结果，记录冷启动耗时、解析次数与峰值内存，同环境重复测量报告中位值。
- **解析器演进储备**：严禁退回脆弱的正则匹配。若未来基准测试证实 TypeScript 单文件语法解析成为 CLI 的关键瓶颈，保留将底层单文件语法解析器替换为高性能原生工具（如 Oxc）的扩展能力，统一结果模型保持不变。

## 七、实施阶段

| 阶段 | 工作项 | 完成条件 |
| --- | --- | --- |
| P0：基线与契约 | 复现语言、分类、诊断边界；梳理调用方并确立基准样本（含 Button 等） | 测试区分设计契约与缺陷，语法与语义边界明确 |
| P1：共享解析 | 结果类型、语言适配、模块引用、源码转换 | 核心测试通过；所有失败路径有位置与原因 |
| P2：消费端收敛 | scan、Registry、CLI 迁移；逐一清理重复实现；确立产物隔离门禁 | 源码解析入口统一，产物无编译器泄露，差异已归因 |
| P3：源码工具迁移 | 导出覆盖检查重构；API 文档接入 vue-component-meta 并完成样本验证 | 导出规则通过；基准组件文档严格生成成功 |
| P4：基准与收尾 | 基准记录、CLI 按需加载验证、生成产物校验、文档更新 | 收益有证据，所有阶段验收完成 |

依赖顺序为 P0 → P1 → P2 → P3 → P4。P3 中导出检查和文档提取可分别推进。提交按能独立验证的功能切分，使用 Conventional Commits；切换同一接口的定义与调用方放在同一提交。

## 八、测试矩阵与验证命令

| 测试组 | 样例 | 预期 |
| --- | --- | --- |
| 文件识别 | TS 字符串含 SFC 标签、JS/TS/JSX/TSX、双 script、script src | 不按字符串误识别，语言及外部引用准确 |
| 分类与编译边界 | 顶层 import type、内联 type（verbatimModuleSyntax 语义）、namespace、空导入 | 源码依赖口径一致，副作用安全 |
| 聚合 | 同路径类型/值/动态引用的不同顺序 | 聚合分类相同，引用位置全部保留 |
| 完整性 | 语法错误、动态表达式、require 候选、未知 lang | invalid/partial 可观察，严格消费端失败 |
| 重写 | CRLF、Unicode、不同引号、转义字符、查询片段 | 未编辑区域一致，结果可解析且路径正确 |
| 事务 | 多文件中途解析失败、转换后验证失败 | 持久化提交未发生 |
| 导出 | 多行 export、伪 export、barrel、variants、type-only | 覆盖规则准确 |
| 文档语义 | CVA 变体泛型展开、嵌套类型、withDefaults、slot、JSDoc | 语义提取结构准确，属性过滤生效 |
| 产物隔离 | 扫描 packages/ui/dist 产物外部引用 | 零编译器依赖残留 |
| 集成 | 同一输入经过 scan 与 Registry；安装后 CLI 转换与惰性加载 | 共用分类契约，分发依赖完备且命令启动迅速 |

已有核心测试可按以下命令执行：

```powershell
pnpm --filter brutx-shared-vue test src/ast/sfc-ast-engine.test.ts
pnpm --filter brutx-shared-vue test tests/extract-module-specifiers.test.ts
pnpm --filter brutx-shared-vue test tests/scan-manifest.test.ts
pnpm --filter brutx-registry-vue test tests/compiler/ast-rewriter.test.ts
```

重复实现清理时，将对应有效测试迁至 AST 模块同目录，并同步更新命令。新增测试使用 kebab-case，与源文件同目录；UI 的 scripts 测试已在当前 Vitest include 范围内。CLI 与新增 UI 工具测试按实际改动文件指定路径执行，不扩大为全局测试。

类型检查仅针对发生变更的 shared、Registry、CLI、UI 包；lint 使用 `pnpm exec eslint <具体改动文件>`。UI typecheck 会前置生成清单及导出，运行后检查生成差异。

P2/P4 需要验证生成产物时执行：

```powershell
pnpm --filter brutx-ui-vue prebuild:scan
pnpm --filter brutx-ui-vue prebuild:component-index
pnpm --filter brutx-ui-vue prebuild:exports
pnpm --filter brutx-registry-vue build
pnpm --filter brutx-registry-vue validate
node scripts/docs/check-doc-links.mjs check
```

这些命令为实施验收步骤，本次方案编写只执行文档链接检查。

## 九、终态验收

- [ ] 所有源码模块提取与路径转换使用同一语言、引用、分类和诊断契约。
- [ ] scan 子路径与源码解析职责清晰，重复实现及过渡导出已逐一清理。
- [ ] 严格消费端无法把解析失败或未解析依赖当作空依赖成功提交。
- [ ] TypeScript 语法模式及 Vue 块位置测试通过，转换结果可解析并满足保真与幂等要求。
- [ ] 模块分类明确 verbatimModuleSyntax 下的副作用边界，不依赖文件名启发式。
- [ ] 主入口检查识别实际导出；API 文档基于 vue-component-meta 严格生成基准组件集合。
- [ ] manifest / Registry 差异有逐项依据，生成产物通过既有校验。
- [ ] packages/ui 构建产物具备隔离门禁断言，CLI 实现命令级按需加载。
- [ ] 基准结果已记录，命令启动与解析收益有数据支撑。
- [ ] 方案、调研报告与文档索引链接有效，状态在实际完成后更新。
