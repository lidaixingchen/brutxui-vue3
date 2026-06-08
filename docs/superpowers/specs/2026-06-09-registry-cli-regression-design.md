# BrutxUI Registry and CLI Regression Design

## 背景

BrutxUI Vue 3 的 CLI 和 registry 已经有一批单元测试，覆盖了 alias 解析、项目识别、Tailwind 版本识别、本地 registry 读取、递归依赖解析、循环依赖检测、版本固定 registry 名称、`init` 部分样式升级，以及 `isSafePath` 等安全函数。

当前缺口是端到端安装链路。现有测试可以证明若干内部函数独立工作，但不能证明构建后的 `brutx-vue` CLI 能在一个临时 Vue 项目中完成真实的 `init` 和 `add` 流程，也不能证明生成后的 JSON registry 能被 CLI 完整消费并写入正确路径。

本设计只覆盖 C：Registry/CLI 回归。D：发布可靠性会在后续单独设计和实现。

## 目标

- 为 registry 到 CLI 安装链路增加黑盒回归测试。
- 证明构建后的 CLI 能在临时项目中执行 `init` 和 `add`。
- 使用本地 `packages/registry/registry` 作为测试 registry，避免依赖网络。
- 覆盖 JSON registry、路径安全、安装覆盖、依赖解析和依赖注入失败等高风险面。
- 将测试接入 CI，并提供本地可复用脚本。

## 非目标

- 不重写 CLI 架构。
- 不引入真实包管理器联网安装依赖作为默认测试路径。
- 不在第一阶段测试远程 hosted registry。
- 不把所有组件都编译进临时项目并执行 Vite build。
- 不在本设计中处理版本 bump、npm publish、GitHub Release 或 docs 发布可靠性。

## 推荐方案

采用“黑盒 CLI 烟测 + 精准单元补洞”的混合方案。

黑盒测试负责验证用户真实路径：构建 CLI 后，在临时项目中运行 `init` 和 `add`，并检查文件、配置和写入行为。单元测试负责覆盖不适合通过 CLI 子进程制造的错误分支，例如 registry JSON 结构错误、路径穿越、覆盖策略和依赖解析异常。

这个方案比纯单元测试更能发现真实安装链路断裂，也比完整创建项目并联网安装依赖更稳定、成本更低。

## 测试入口

在 `packages/cli` 增加一个集成测试脚本：

- `test:integration`: 运行 CLI 黑盒集成测试。
- `test`: 继续运行现有 Vitest 单元测试。

集成测试可以继续使用 Vitest，但测试文件和辅助函数应与现有单元测试隔离，例如：

- `packages/cli/tests/integration/cli-smoke.test.ts`
- `packages/cli/tests/integration/helpers.ts`

测试通过 Node 子进程执行 `packages/cli/dist/index.js`，而不是直接 import command 函数。这样可以覆盖 commander 参数解析、构建产物、bin 入口和 CLI 真实退出行为。

## 临时项目夹具

每个集成测试创建独立临时目录，并写入最小 Vue/Vite 项目结构：

- `package.json`
- `tsconfig.json`
- `src/main.ts`
- `src/index.css`

`tsconfig.json` 使用 `@/* -> src/*` 路径别名，确保 CLI 的 alias 解析走真实项目配置。`package.json` 使用 Vue、Tailwind CSS 和 Vite 的声明依赖，但测试默认不执行联网安装。

临时目录必须在测试结束后清理。若测试失败，Vitest 输出临时目录路径，方便本地排查。

## CLI 命令覆盖

第一阶段覆盖以下命令路径：

- `brutx-vue init --yes --force --cwd <tmp>`
- `brutx-vue add button card --cwd <tmp> --registry <local-registry> --overwrite`
- `brutx-vue add button --cwd <tmp> --registry <local-registry>`，验证未开启覆盖时跳过已有文件。
- `brutx-vue add --all --cwd <tmp> --registry <local-registry> --dry-run`，验证完整 registry 可解析且不会写盘。

`init` 的自动依赖安装不应成为集成测试稳定性的前提。如果 CLI 当前会尝试调用包管理器，测试项目应通过可控方式让该步骤快速失败并走现有 warning 分支，或者后续在 CLI 内增加可测试的跳过安装选项。第一阶段不要求联网安装成功。

## 断言范围

`init` 后断言：

- `components.json` 已创建。
- `components.json` 中的 `tailwind.css`、`aliases.components`、`aliases.utils`、`aliases.composables` 符合临时项目配置。
- `src/lib/utils.ts` 已创建。
- `src/components/ui/` 目录已创建。
- `src/index.css` 包含 BrutxUI 设计 token，并且重复执行 `init --yes --force` 不重复注入完整样式块。

`add` 后断言：

- `button` 和 `card` 的组件文件写入 `src/components/ui/<name>/`。
- registry dependency 相关文件按 alias 写入，例如 `src/composables/` 或 `src/locales/`。
- 写入文件中的 `@/` import 被替换成项目配置 alias。
- 已存在文件在无 `--overwrite` 时不会被覆盖。
- 开启 `--overwrite` 时文件会被覆盖。
- `--dry-run` 不创建或修改组件文件。

## Registry 单元补洞

继续保留现有 `packages/cli/tests/registry.test.ts`，并补充以下 focused cases：

- 本地 registry item 的 `files` 不是数组时报错。
- registry file 缺少 `path` 或 `content` 时报错。
- component 名称包含路径穿越时被拒绝。
- registry dependency 递归解析失败时错误向上传递。
- 依赖去重后只进入安装计划一次。

这些测试直接 import `resolveDeps()` 或相关可导出函数，保持快速、可定位。

## 路径安全策略

集成测试和单元测试都必须覆盖路径安全，但职责不同：

- 单元测试覆盖 `isSafePath()` 和本地 registry component name 的路径穿越。
- 集成测试覆盖 `add --path ..` 或等价逃逸路径会失败，并且不会在临时项目外写文件。

测试只在临时目录内创建哨兵文件，不触碰真实仓库外路径。

## CI 集成

在 CI 的 CLI 阶段增加：

- `pnpm --filter brutx-vue build`
- `pnpm --filter brutx-registry-vue validate`
- `pnpm --filter brutx-vue test`
- `pnpm --filter brutx-vue test:integration`

集成测试依赖 CLI build 产物，因此必须在 `brutx-vue build` 后执行。registry validate 继续保留，负责静态 JSON 质量；CLI integration 负责证明 CLI 可以消费这些 JSON。

根目录可以后续增加 `test:cli` 或 `test:registry-cli` 便捷脚本，但第一阶段只要求包内脚本和 CI 明确可执行。

## 错误处理期望

测试不要求精确匹配全部日志，但应断言关键错误语义：

- 路径穿越失败包含 `Security Error` 或 `Path traversal`。
- registry item 不存在时包含组件名和本地 registry 路径。
- registry JSON shape 错误时包含 item 名称和字段名。

这样既能防止错误被吞掉，也避免日志文案微调造成脆弱测试。

## 实施顺序

1. 增加 CLI 集成测试辅助函数，用于创建临时项目、运行构建后的 CLI、读取 JSON/CSS、检查文件状态。
2. 增加 `init` 黑盒测试。
3. 增加 `add button card` 黑盒测试。
4. 增加覆盖/跳过和 `--dry-run` 黑盒测试。
5. 补充 registry 和路径安全单元测试。
6. 增加 `test:integration` 脚本。
7. 更新 CI，确保 CLI build 后运行集成测试。
8. 运行 CLI 单元测试、CLI 集成测试、registry validate，以及必要的 typecheck/lint。

## 验收标准

- `pnpm --filter brutx-vue build` 通过。
- `pnpm --filter brutx-vue test` 通过。
- `pnpm --filter brutx-vue test:integration` 通过。
- `pnpm --filter brutx-registry-vue validate` 通过。
- CI 中 CLI/registry 回归测试路径明确执行。
- 测试不访问网络，不依赖用户全局 pnpm/npm 状态。
- 所有临时文件写入都限制在测试临时目录内。

## 风险与缓解

- 风险：当前 `init` 会尝试自动安装依赖，可能拖慢或污染测试。
  缓解：第一阶段让该步骤进入已有 warning 分支，或增加一个明确的测试/CI 可控跳过选项，并用单元测试覆盖该选项。

- 风险：`add --all` 写入所有组件会让测试慢且难维护。
  缓解：第一阶段用 `--dry-run` 验证完整 registry 可解析，真实写盘只覆盖少量代表组件。

- 风险：跨平台路径分隔符导致断言不稳定。
  缓解：测试中用 `path.join()`、`path.relative()` 和 JSON 结构断言，避免硬编码 Windows 或 POSIX 路径。

- 风险：日志文案变化导致测试误报。
  缓解：只匹配关键错误语义，不匹配完整输出。

## 后续工作

C 完成后，再单独进入 D：发布可靠性。D 应覆盖版本一致性、构建产物、类型导出、包内容、docs 构建和发布流程，不与本设计混在同一个实现计划中。
